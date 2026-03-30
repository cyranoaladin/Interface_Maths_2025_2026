import os
import jwt
from ..config import settings
from ..security import ALGORITHM

from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from starlette.responses import RedirectResponse

from ..db import get_db
from ..orm import User, UserPublic
from ..security import create_access_token, get_password_hash, get_secret_key
from ..services_auth import authenticate_user


router = APIRouter(tags=["compat"])
limiter = Limiter(key_func=get_remote_address, enabled=os.getenv("TESTING") != "1")


@router.post("/api/v1/login")
@limiter.limit("10/minute")
async def compat_login(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    JSON-based login (for programmatic clients or future frontend).
    Sets an auth_token cookie.
    """
    user_req = await request.json()
    if not user_req or "email" not in user_req or "password" not in user_req:
        raise HTTPException(status_code=400, detail="Missing email or password")
    
    user = authenticate_user(db, user_req["email"], user_req["password"])
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token = create_access_token({"sub": str(user.id)})
    
    # Also set a cookie for convenience (legacy frontend might still use it)
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=False,  # Needs to be read by JS temporarily
        samesite="lax",
        max_age=3600 * 24
    )
    
    return {"access_token": token, "first_login": user.first_login if hasattr(user, "first_login") else False}


@router.post("/api/v1/login-form")
@limiter.limit("10/minute")
async def compat_login_form(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    email: str = Form(None),
    username: str = Form(None),
    password: str = Form(...)
):
    """
    Form-based login (legacy).
    Accepts email or username fields.
    """
    actual_email = email or username
    if not actual_email:
        raise HTTPException(status_code=400, detail="Missing email")
        
    user = authenticate_user(db, actual_email, password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token = create_access_token({"sub": str(user.id)})
    
    # Also set a cookie for convenience
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=False,
        samesite="lax",
        max_age=3600 * 24
    )
    
    return {"access_token": token, "first_login": user.first_login if hasattr(user, "first_login") else False}


@router.post("/api/v1/login/dev")
async def compat_login_dev(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Dev-only bypass login.
    """
    if os.getenv("TESTING") != "1" or os.getenv("APP_ENV", "development") == "production":
        raise HTTPException(status_code=403, detail="Not available in production")
        
    user_req = await request.json()
    email = user_req.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Missing email")
        
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    token = create_access_token({"sub": str(user.id)})
    
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=False,
        samesite="lax",
        max_age=3600 * 24
    )
    
    return {"access_token": token}


def _extract_token_from_request(req: Request) -> str:
    auth_header = req.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    return req.cookies.get("auth_token", "")


@router.get("/api/v1/session", response_model=UserPublic)
async def compat_session(request: Request, db: Session = Depends(get_db)):
    """
    Session check relying on the auth_token cookie or Authorization header.
    """
    token = _extract_token_from_request(request)
    
    if not token:
        # DEV fallback
        if os.getenv("ALLOW_UNAUTHENTICATED_DEV") == "1" and os.getenv("APP_ENV", "development") != "production":
            preferred = "teacher.test@example.com"
            user = db.query(User).filter(User.email == preferred).one_or_none()
            if not user:
                user = db.query(User).filter(User.role == "teacher").first()
            if user:
                return UserPublic(
                    id=user.id,
                    email=user.email,
                    full_name=user.full_name,
                    role=user.role,
                    first_name=user.first_name,
                    last_name=user.last_name,
                )
        raise HTTPException(status_code=401, detail="No session")
        
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        user = db.query(User).filter(User.id == int(user_id)).one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
            
        return UserPublic(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            first_name=user.first_name,
            last_name=user.last_name,
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/api/v1/change-password")
async def compat_change_password(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Change password based on current session token.
    """
    token = _extract_token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="No session")
        
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        req_data = await request.json()
        new_password = req_data.get("new_password")
        if not new_password or len(new_password) < 8:
            raise HTTPException(status_code=422, detail="Password too short")
        if len(new_password) > 128:
            raise HTTPException(status_code=422, detail="Password too long")
            
        user = db.query(User).filter(User.id == int(user_id)).one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        return {"ok": True}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/api/v1/logout")
async def compat_logout(response: Response):
    """
    Clears the auth_token cookie.
    """
    response.delete_cookie("auth_token", path="/")
    return {"ok": True}
