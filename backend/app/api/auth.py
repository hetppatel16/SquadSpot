"""Authentication and user-profile endpoints backed by Supabase Auth."""
import logging

logger = logging.getLogger(__name__)
import re
from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from supabase import create_client

from app.api.schemas import LoginRequest, SignUpRequest
from app.core.security import bearer_scheme, get_current_user
from app.data_layer.repository import SUPABASE_ANON_KEY, SUPABASE_URL, supabase

router = APIRouter()


def create_auth_client():
    """Create an isolated Supabase Auth client for a single request."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=503,
            detail="Authentication service is not configured on the server.",
        )
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def validate_password_strength(password: str) -> list[str]:
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


def _password_error(password: str) -> Optional[str]:
    errors = validate_password_strength(password)
    if not errors:
        return None
    return "Password must include:\n" + "\n".join(f"• {item}" for item in errors)


def sync_user_profile(user_id: str, email: str, full_name: str, avatar_url: Optional[str] = None) -> dict:
    """Upsert a profile using the verified Supabase Auth user ID."""
    clean_email = (email or "").strip().lower()
    profile = {
        "id": str(user_id),
        "email": clean_email,
        "full_name": full_name or (clean_email.split("@")[0] if clean_email else "User"),
    }
    if avatar_url:
        profile["avatar_url"] = avatar_url

    try:
        existing = supabase.table("users").select(
            "id,full_name,avatar_url,home_city_id"
        ).eq("id", str(user_id)).limit(1).execute()
        if existing.data:
            stored_profile = existing.data[0]
            # Keep profile edits made by the user; auth metadata is only a fallback.
            profile["full_name"] = stored_profile.get("full_name") or profile["full_name"]
            supabase.table("users").update({"email": clean_email}).eq("id", str(user_id)).execute()
            profile.update({key: stored_profile.get(key) for key in ("avatar_url", "home_city_id")})
        else:
            # The migration's auth.users trigger normally creates this row.
            supabase.table("users").upsert(profile).execute()
    except Exception:
        # Authentication remains authoritative; GET /auth/me can fall back to
        # verified Auth metadata if profile storage is temporarily unavailable.
        pass
    return profile


def _session_expiry(session) -> Optional[int]:
    value = getattr(session, "expires_at", None)
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return int(value.timestamp())
    if value is not None:
        try:
            return int(value)
        except (TypeError, ValueError):
            return None
    expires_in = getattr(session, "expires_in", None)
    return int(datetime.now(timezone.utc).timestamp() + expires_in) if expires_in else None


def _auth_result(response, profile: dict) -> dict:
    """Convert a Supabase auth response into the frontend session shape."""
    session = getattr(response, "session", None)
    result = {
        "status": "success",
        "user": profile,
        "confirmation_required": session is None,
    }
    if session is not None:
        result.update({
            "token": session.access_token,
            "refresh_token": session.refresh_token,
            "token_type": getattr(session, "token_type", "bearer") or "bearer",
            "expires_in": getattr(session, "expires_in", None),
            "expires_at": _session_expiry(session),
        })
    return result


def _profile_from_auth_user(auth_user, fallback_full_name: Optional[str] = None) -> dict:
    email = getattr(auth_user, "email", None) or ""
    metadata = getattr(auth_user, "user_metadata", None) or {}
    full_name = (
        metadata.get("full_name")
        or metadata.get("name")
        or (fallback_full_name.strip() if fallback_full_name else None)
        or (email.split("@")[0] if email else "User")
    )
    avatar_url = metadata.get("avatar_url") or metadata.get("picture")
    return sync_user_profile(auth_user.id, email, full_name, avatar_url)


@router.post("/auth/signup")
async def signup(payload: SignUpRequest):
    phone_clean = payload.phone.strip()
    if len(phone_clean) != 10 or not phone_clean.isdigit():
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit phone number.")

    password_detail = _password_error(payload.password)
    if password_detail:
        raise HTTPException(status_code=400, detail=password_detail)

    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Full name is required.")

    auth_client = create_auth_client()
    try:
        response = auth_client.auth.sign_up({
            "email": str(payload.email).strip().lower(),
            "password": payload.password,
            "options": {"data": {"full_name": clean_name, "phone": phone_clean}},
        })
        auth_user = getattr(response, "user", None)
        if auth_user is None:
            raise HTTPException(status_code=400, detail="Unable to create the account. Please try again.")
        profile = _profile_from_auth_user(auth_user)
        return _auth_result(response, profile)
    except HTTPException:
        raise
    except Exception as error:
        logger.error(
        "Supabase signup failed: %s: %s",
        type(error).__name__,
        error
        )
        message = str(error).lower()
        if "already registered" in message:
            raise HTTPException(status_code=409, detail="An account with this email already exists.") from error
        raise HTTPException(status_code=400, detail="Unable to create the account. Please check your details and try again.") from error


@router.post("/auth/login")
async def login(payload: LoginRequest):
    auth_client = create_auth_client()
    try:
        response = auth_client.auth.sign_in_with_password({
            "email": str(payload.email).strip().lower(),
            "password": payload.password,
        })
        auth_user = getattr(response, "user", None)
        if auth_user is None or getattr(response, "session", None) is None:
            raise HTTPException(status_code=401, detail="Invalid email or password, or email not yet confirmed.")
        profile = _profile_from_auth_user(auth_user)
        return _auth_result(response, profile)
    except HTTPException:
        raise
    except Exception as error:
        message = str(error).lower()
        if "invalid login credentials" in message:
            detail = "Invalid email or password."
        elif "email not confirmed" in message:
            detail = "Please confirm your email before logging in."
        else:
            detail = "Unable to sign in right now. Please try again."
        raise HTTPException(status_code=401 if "invalid" in message or "not confirmed" in message else 503, detail=detail) from error


class OAuthLoginRequest(BaseModel):
    provider: Literal["google", "apple"]
    id_token: str = Field(min_length=20)
    access_token: Optional[str] = None
    nonce: Optional[str] = None
    full_name: Optional[str] = Field(default=None, max_length=120)


@router.post("/auth/oauth")
async def oauth_login(payload: OAuthLoginRequest):
    """Exchange a real provider ID token for a Supabase session."""
    auth_client = create_auth_client()
    credentials = {"provider": payload.provider, "token": payload.id_token}
    if payload.access_token:
        credentials["access_token"] = payload.access_token
    if payload.nonce:
        credentials["nonce"] = payload.nonce

    try:
        response = auth_client.auth.sign_in_with_id_token(credentials)
        auth_user = getattr(response, "user", None)
        if auth_user is None or getattr(response, "session", None) is None:
            raise HTTPException(status_code=401, detail="The identity provider did not return a valid session.")
        profile = _profile_from_auth_user(auth_user, payload.full_name)
        return _auth_result(response, profile)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=401, detail="The Google or Apple identity token could not be verified.") from error


class RefreshSessionRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


@router.post("/auth/refresh")
async def refresh_session(payload: RefreshSessionRequest):
    """Exchange a valid refresh token for a new Supabase session."""
    auth_client = create_auth_client()
    try:
        response = auth_client.auth.refresh_session(payload.refresh_token)
        auth_user = getattr(response, "user", None)
        if auth_user is None or getattr(response, "session", None) is None:
            raise ValueError("Refresh did not return a session")
        profile = _profile_from_auth_user(auth_user)
        return _auth_result(response, profile)
    except Exception as error:
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.") from error


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


@router.post("/auth/logout")
async def logout(
    payload: LogoutRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    """Revoke the current Supabase refresh-token session when possible."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentication required to sign out.")

    auth_client = create_auth_client()
    try:
        # set_session verifies the access token and can refresh it when expired.
        auth_client.auth.set_session(credentials.credentials, payload.refresh_token)
        auth_client.auth.sign_out({"scope": "local"})
        return {"status": "success"}
    except Exception as error:
        # The frontend still clears local credentials if remote revocation fails.
        raise HTTPException(status_code=400, detail="The server could not revoke this session. Local sign-out is still available.") from error


@router.get("/auth/me")
async def get_my_profile(current_user=Depends(get_current_user)):
    user_id = str(current_user.id)
    try:
        response = supabase.table("users").select(
            "id,email,full_name,avatar_url,home_city_id"
        ).eq("id", user_id).limit(1).execute()
        if response.data:
            return response.data[0]
    except Exception:
        # A verified Auth user can still use the app if profile storage is down.
        pass

    metadata = getattr(current_user, "user_metadata", None) or {}
    email = getattr(current_user, "email", None)
    return {
        "id": user_id,
        "email": email,
        "full_name": metadata.get("full_name") or (email.split("@")[0] if email else "User"),
        "avatar_url": metadata.get("avatar_url"),
        "home_city_id": None,
    }


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    avatar_url: Optional[str] = Field(default=None, max_length=2048)
    home_city_id: Optional[UUID] = None


@router.patch("/auth/me")
async def update_my_profile(payload: ProfileUpdateRequest, current_user=Depends(get_current_user)):
    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="Provide at least one profile field to update.")

    if "full_name" in updates:
        updates["full_name"] = updates["full_name"].strip()
        if not updates["full_name"]:
            raise HTTPException(status_code=400, detail="Full name cannot be empty.")
    if "home_city_id" in updates:
        updates["home_city_id"] = str(updates["home_city_id"])

    try:
        supabase.table("users").update(updates).eq("id", str(current_user.id)).execute()
        profile_response = supabase.table("users").select(
            "id,email,full_name,avatar_url,home_city_id"
        ).eq("id", str(current_user.id)).limit(1).execute()
    except Exception as error:
        raise HTTPException(status_code=503, detail="Profile service is temporarily unavailable.") from error

    if profile_response.data:
        return profile_response.data[0]
    raise HTTPException(status_code=404, detail="User profile not found.")


class ResetPasswordPayload(BaseModel):
    email: EmailStr


class VerifyOtpPayload(BaseModel):
    email: EmailStr
    token: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    new_password: str = Field(min_length=8, max_length=128)


@router.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordPayload):
    """Ask Supabase Auth to send its configured recovery email/OTP."""
    auth_client = create_auth_client()
    try:
        auth_client.auth.reset_password_for_email(str(payload.email).strip().lower())
    except Exception as error:
        error_message = str(error).lower()
        # Keep the response generic so callers cannot use this endpoint to
        # discover whether an email address is registered.
        if "rate limit" in error_message or "too many" in error_message:
            raise HTTPException(
            status_code=429,
            detail="Too many password reset requests. Please wait before trying again."
        )
        print("PASSWORD RESET ERROR:", repr(error))
        raise HTTPException(status_code=503, detail="Password recovery is temporarily unavailable. Please try again later.") from error

    return {
        "status": "success",
        "detail": "If an account exists for that email, a password recovery code has been sent.",
    }


@router.post("/auth/verify-otp")
async def verify_otp(payload: VerifyOtpPayload):
    password_detail = _password_error(payload.new_password)
    if password_detail:
        raise HTTPException(status_code=400, detail=password_detail)

    auth_client = create_auth_client()
    try:
        # Supabase verifies expiry and one-time use. Its configured email
        # template must include {{ .Token }} to deliver a code for this screen.
        auth_client.auth.verify_otp({
            "email": str(payload.email).strip().lower(),
            "token": payload.token,
            "type": "recovery",
        })
        auth_client.auth.update_user({"password": payload.new_password})
        return {"status": "success", "detail": "Password updated successfully."}
    except Exception as error:
        raise HTTPException(status_code=400, detail="The recovery code is invalid or expired, or the password could not be updated.") from error
