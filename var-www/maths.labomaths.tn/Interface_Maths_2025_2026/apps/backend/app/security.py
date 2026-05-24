"""
Security-related utilities for authentication, password hashing, and user authorization.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import config, db

if TYPE_CHECKING:
    from .orm import User

# Use bcrypt_sha256 to support passwords > 72 bytes safely
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

# OAuth2 scheme expects /auth/token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

ALGORITHM = "HS256"
_DEV_EPHEMERAL_SECRET: str | None = None


def get_secret_key() -> str:
    """
    Retrieves the secret key from settings.
    In development, falls back to an ephemeral key if not set.
    """
    if config.settings.SECRET_KEY:
        return config.settings.SECRET_KEY
    # Fallback only for local dev/testing — short-lived secret per process.
    global _DEV_EPHEMERAL_SECRET
    if _DEV_EPHEMERAL_SECRET is None:
        _DEV_EPHEMERAL_SECRET = secrets.token_urlsafe(48)
    return _DEV_EPHEMERAL_SECRET


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hashes a password for storing."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_minutes: Optional[int] = None) -> str:
    """Creates a new JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or config.settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, get_secret_key(), algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme), database: Session = Depends(db.get_db)
) -> "User":
    """
    Decodes the JWT token to get the current user.
    Raises credentials exception if the token is invalid or the user is not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])
        user_id: Optional[str] = str(payload.get("sub")) if payload.get("sub") else None
        if user_id is None:
            raise credentials_exception
    except InvalidTokenError as exc:
        raise credentials_exception from exc

    from . import orm as users_module

    user = database.get(users_module.User, int(user_id))
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_active_user(user: "User" = Depends(get_current_user)) -> "User":
    """Return the authenticated active user."""
    return user


def require_teacher(user: "User" = Depends(get_current_user)) -> "User":
    """
    Dependency that requires the current user to have the 'teacher' or 'admin' role.
    Raises a 403 Forbidden error otherwise.
    """
    if user.role not in {"teacher", "admin"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user


def require_admin(user: "User" = Depends(get_current_user)) -> "User":
    """Dependency that requires the current user to have the 'admin' role."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user


def is_admin(user: "User") -> bool:
    return user.role == "admin"


def user_group_codes(user: "User") -> set[str]:
    return {group.code for group in getattr(user, "groups", [])}


def can_manage_group(user: "User", group_code: str) -> bool:
    """Admins can manage all groups; teachers only their assigned groups."""
    if is_admin(user):
        return True
    if user.role != "teacher":
        return False
    return group_code in user_group_codes(user)


def shares_group_with(user: "User", other: "User") -> bool:
    """Return whether two non-admin users share at least one group."""
    if is_admin(user):
        return True
    return bool(user_group_codes(user) & user_group_codes(other))
