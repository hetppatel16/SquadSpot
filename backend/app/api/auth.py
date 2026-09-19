from typing import Optional
import re
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from app.data_layer.repository import supabase
from app.api.schemas import SignUpRequest, LoginRequest

router = APIRouter()

def validate_password_strength(password: str):
    errors = []
    if len(password) < 8:
        errors.append("At least 8 characters long")
    if not re.search(r"[A-Z]", password):
        errors.append("One uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("One lowercase letter")
    if not re.search(r"[0-9]", password):
        errors.append("One number")
    if not re.search(r"[^A-Za-z0-9]", password):
        errors.append("One special character (@, #, $, %, etc.)")
    return errors

@router.post("/auth/signup")
async def signup(payload: SignUpRequest):
    # 1. Validate phone length and format
    phone_clean = payload.phone.strip()
    if len(phone_clean) != 10 or not phone_clean.isdigit():
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit phone number.")

    # 2. Validate password strength
    password_errors = validate_password_strength(payload.password)
    if password_errors:
        error_msg = "Password must include:\n" + "\n".join(f"• {e}" for e in password_errors)
        raise HTTPException(status_code=400, detail=error_msg)

    email_clean = payload.email.strip().lower()

    # 3. Call Supabase sign_up
    try:
        auth_response = supabase.auth.sign_up({
            "email": email_clean,
            "password": payload.password,
            "options": {
                "data": {
                    "full_name": payload.name,
                    "phone": phone_clean
                }
            }
        })
        if not auth_response or not auth_response.user:
            raise HTTPException(status_code=400, detail="User registration failed.")

        user_id = auth_response.user.id
        email = auth_response.user.email

        # Sync profile data to internal users table
        profile_row = {
            "id": user_id,
            "full_name": payload.name,
            "email": email
        }
        supabase.table("users").upsert(profile_row).execute()

        return {
            "status": "success",
            "user": {
                "id": user_id,
                "email": email,
                "full_name": payload.name
            }
        }
    except Exception as error:
        print("SignUp Exception:", str(error))
        error_msg = str(error)
        if "User already registered" in error_msg:
            error_msg = "An account with this email already exists."
        raise HTTPException(status_code=400, detail=error_msg)

@router.post("/auth/login")
async def login(payload: LoginRequest):
    email_clean = payload.email.strip().lower()
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": email_clean,
            "password": payload.password
        })
        if not auth_response or not auth_response.user:
            raise HTTPException(status_code=400, detail="Invalid credentials.")

        user_id = auth_response.user.id
        email = auth_response.user.email

        # Extract name from user metadata or fallback to email prefix
        user_metadata = getattr(auth_response.user, "user_metadata", {}) or {}
        full_name = user_metadata.get("full_name", email.split("@")[0] if email else "User")

        # Sync user profile safely without duplicate key violations
        profile_data = sync_user_profile(user_id, email, full_name)

        return {
            "status": "success",
            "user": profile_data
        }
    except Exception as error:
        print("Login Exception:", str(error))
        error_msg = str(error)
        if "Invalid login credentials" in error_msg:
            error_msg = "Invalid email or password."
        raise HTTPException(status_code=400, detail=error_msg)


def sync_user_profile(user_id: str, email: str, full_name: str) -> dict:
    """
    Safely synchronizes user profile into the relational 'users' table,
    handling existing email records gracefully to prevent duplicate key constraint violations.
    """
    email_clean = email.strip().lower() if email else ""
    try:
        existing = supabase.table("users").select("*").eq("email", email_clean).execute()
        if existing.data and len(existing.data) > 0:
            target_id = existing.data[0]["id"]
            final_name = full_name or existing.data[0].get("full_name") or (email_clean.split("@")[0] if email_clean else "User")
            try:
                supabase.table("users").update({"full_name": final_name}).eq("id", target_id).execute()
            except Exception as update_err:
                print("Notice updating existing user profile:", update_err)
            return {"id": str(target_id), "email": email_clean, "full_name": final_name}
        else:
            profile = {"id": str(user_id), "email": email_clean, "full_name": full_name}
            supabase.table("users").insert(profile).execute()
            return profile
    except Exception as e:
        print("User profile sync notice:", e)
        return {"id": str(user_id), "email": email_clean, "full_name": full_name}


# Schema for checking incoming cross-platform payload shapes
class OAuthLoginRequest(BaseModel):
    provider: str  # "google" or "apple"
    id_token: Optional[str] = None
    access_token: Optional[str] = None

@router.post("/auth/oauth")
async def oauth_login(payload: OAuthLoginRequest):
    """
    Receives secure validation tokens from frontend native runtime environments,
    validates the session against Supabase Auth or provider userinfo endpoints,
    and upserts user data rows into the database safely.
    """
    try:
        # 1. Development / Offline bypass mode support
        if payload.id_token and (payload.id_token.startswith("mock_") or payload.id_token.startswith("dev_")):
            email = payload.access_token or "dhairyasoni997@gmail.com"
            full_name = email.split("@")[0].replace(".", " ").title()
            import uuid
            user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, email))
            profile_data = sync_user_profile(user_id, email, full_name)
            return {
                "status": "success",
                "user": profile_data
            }

        # 2. Try Supabase sign_in_with_id_token if id_token is provided
        if payload.id_token:
            try:
                auth_response = supabase.auth.sign_in_with_id_token({
                    "provider": payload.provider,
                    "id_token": payload.id_token,
                    "access_token": payload.access_token
                })
                if auth_response and auth_response.user:
                    user_id = auth_response.user.id
                    email = auth_response.user.email
                    user_metadata = getattr(auth_response.user, "user_metadata", {}) or {}
                    full_name = user_metadata.get("full_name", email.split("@")[0] if email else "Google User")
                    profile_data = sync_user_profile(user_id, email, full_name)
                    return {
                        "status": "success",
                        "user": profile_data
                    }
            except Exception as e:
                print("Supabase ID token verification notice:", e)

        # 3. Fallback: Verify with Google Userinfo API via access_token
        if payload.provider == "google" and payload.access_token:
            import httpx
            async with httpx.AsyncClient() as client:
                google_res = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {payload.access_token}"}
                )
            if google_res.status_code == 200:
                google_user = google_res.json()
                email = google_user.get("email")
                full_name = google_user.get("name") or (email.split("@")[0] if email else "Google User")
                import uuid
                user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, email or google_user.get("sub", "")))
                profile_data = sync_user_profile(user_id, email, full_name)
                return {
                    "status": "success",
                    "user": profile_data
                }
            else:
                raise HTTPException(status_code=400, detail="Failed to fetch user profile from Google.")

        raise HTTPException(status_code=400, detail="Authentication signature rejected. Please try again.")

    except HTTPException:
        raise
    except Exception as error:
        print("OAuth Security Interceptor Exception:", str(error))
        raise HTTPException(status_code=400, detail=f"Handshake failed: {str(error)}")


# In-memory store for active password reset OTP codes (for MVP development)
ACTIVE_OTPS = {}

class ResetPasswordPayload(BaseModel):
    email: str

class VerifyOtpPayload(BaseModel):
    email: str
    token: str
    new_password: str

@router.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordPayload):
    email_clean = payload.email.strip().lower()
    
    # 1. Verify if user is registered in users table
    res = supabase.table("users").select("id").eq("email", email_clean).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="No account registered with this email address.")

    # 2. Generate random 4-digit OTP code
    import random
    otp = f"{random.randint(1000, 9999)}"
    ACTIVE_OTPS[email_clean] = otp

    # Log to terminal console so that developers can easily copy-paste the code
    print(f"\n============================================\n[RESET PASSWORD OTP] Generated code for {email_clean}: {otp}\n============================================\n")

    return {"status": "success", "detail": "OTP code generated successfully."}


@router.post("/auth/verify-otp")
async def verify_otp(payload: VerifyOtpPayload):
    email_clean = payload.email.strip().lower()
    otp_clean = payload.token.strip()

    # 1. Validate OTP presence & correctness
    if email_clean not in ACTIVE_OTPS or ACTIVE_OTPS[email_clean] != otp_clean:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP token.")

    # 2. Validate password strength
    password_errors = validate_password_strength(payload.new_password)
    if password_errors:
        error_msg = "Password must include:\n" + "\n".join(f"• {e}" for e in password_errors)
        raise HTTPException(status_code=400, detail=error_msg)

    # 3. Retrieve user id mapping from email
    res = supabase.table("users").select("id").eq("email", email_clean).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="User profile mismatch. User not found.")
    
    user_id = res.data[0]["id"]

    # 4. Trigger password reset via Supabase Admin SDK attributes manager
    try:
        import os
        SUPABASE_URL = os.getenv("SUPABASE_URL")
        SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        from supabase import create_client
        supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        supabase_admin.auth.admin.update_user_by_id(
            user_id,
            attributes={"password": payload.new_password}
        )

        # Clear OTP from active memory store
        del ACTIVE_OTPS[email_clean]

        return {"status": "success", "detail": "Password updated successfully."}
    except Exception as error:
        print("Admin Password Update Exception:", str(error))
        raise HTTPException(status_code=400, detail=f"Failed to reset password: {str(error)}")