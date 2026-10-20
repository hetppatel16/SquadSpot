"""Authentication dependencies used to secure private API routes."""

import logging

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from gotrue.errors import AuthApiError

from app.data_layer.repository import supabase_auth

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    """Validate the Supabase access token and return its verified user."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        response = supabase_auth.auth.get_user(credentials.credentials)
        user = getattr(response, "user", None)
        if user is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired authentication token. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user

    except AuthApiError as error:
        error_status = getattr(error, "status", None)
        error_code = getattr(error, "code", None)

        if error_status in (400, 401) or error_code == "bad_jwt":
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired authentication token. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            ) from error

        logger.exception("Supabase Auth error during token verification")
        raise HTTPException(
            status_code=503,
            detail="Authentication service is temporarily unavailable.",
        ) from error

    except HTTPException:
        raise

    except Exception as error:
        logger.exception("Unexpected error during token verification")
        raise HTTPException(
            status_code=503,
            detail="Authentication service is temporarily unavailable.",
        ) from error
