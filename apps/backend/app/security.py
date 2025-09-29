from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .users import User

# Use bcrypt_sha256 to support passwords > 72 bytes safely
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

# OAuth2 scheme expects /auth/token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

ALGORITHM = "HS256"


def get_secret_key() -> str:
    # In dev, allow ephemeral secret if unset; in prod, MUST be set
    if settings.SECRET_KEY:
        return settings.SECRET_KEY
    # Fallback only for local dev — short-lived secret per process
    return "dev-ephemeral-secret-key-change-me"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # bcrypt family limits to 72 bytes; truncate defensively
    return pwd_context.verify(plain_password[:72], hashed_password)


def get_password_hash(password: str) -> str:
    # truncate to 72 bytes to avoid backend errors
    return pwd_context.hash(password[:72])


def create_access_token(data: dict, expires_minutes: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, get_secret_key(), algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    from .users import User as UserModel
    user = db.get(UserModel, int(user_id))
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_teacher(user: User = Depends(get_current_user)) -> User:
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user
