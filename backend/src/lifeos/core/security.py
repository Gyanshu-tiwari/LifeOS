"""
Security module — Firebase ID token verification and user identity.

The authentication pattern follows Firebase Admin SDK verification:
client obtains a Firebase ID token, sends it as Bearer token in
Authorization header, backend verifies it here.
"""

import uuid
from typing import Annotated

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from lifeos.core.config import settings
from lifeos.core.logging import get_logger

logger = get_logger(__name__)

# Initialize Firebase Admin SDK once at module load
_firebase_app: firebase_admin.App | None = None

bearer_scheme = HTTPBearer(auto_error=False)


def init_firebase() -> None:
    """Initialize Firebase Admin SDK using the configured project."""
    global _firebase_app
    if _firebase_app is not None:
        return  # already initialized

    if settings.firebase_project_id:
        # In Cloud Run, Application Default Credentials work automatically.
        # Locally, GOOGLE_APPLICATION_CREDENTIALS env var should be set.
        _firebase_app = firebase_admin.initialize_app(
            options={"projectId": settings.firebase_project_id}
        )
        logger.info(
            "Firebase Admin SDK initialized",
            project_id=settings.firebase_project_id,
        )
    else:
        logger.warning(
            "FIREBASE_PROJECT_ID not set — authentication is DISABLED. "
            "Set FIREBASE_PROJECT_ID to enable Firebase token verification."
        )


def _get_firebase_app() -> firebase_admin.App | None:
    return _firebase_app


class VerifiedUser:
    """Represents the verified Firebase identity of the caller."""

    def __init__(
        self,
        firebase_uid: str,
        email: str | None,
        display_name: str | None = None,
    ) -> None:
        self.firebase_uid = firebase_uid
        self.email = email or ""
        self.display_name = display_name


async def verify_firebase_token(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
) -> VerifiedUser:
    """
    FastAPI dependency: extract and verify the Firebase Bearer token.

    Raises HTTP 401 if:
    - No Authorization header provided
    - Token is invalid, expired, or from wrong project

    When FIREBASE_PROJECT_ID is not configured, authentication is skipped
    and a placeholder user is returned (development mode only).
    """
    if not settings.firebase_project_id:
        # Dev mode: no auth required
        logger.warning("Auth bypassed — Firebase not configured")
        return VerifiedUser(
            firebase_uid="dev_uid",
            email="dev@lifeos.local",
            display_name="Dev User",
        )

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        decoded = firebase_auth.verify_id_token(
            credentials.credentials,
            app=_firebase_app,
            check_revoked=True,
        )
        return VerifiedUser(
            firebase_uid=decoded["uid"],
            email=decoded.get("email"),
            display_name=decoded.get("name"),
        )
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as exc:
        logger.warning("Token verification failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Type alias for injected verified user
CurrentUser = Annotated[VerifiedUser, Depends(verify_firebase_token)]
