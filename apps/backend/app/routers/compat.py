from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..db import get_db
from ..security import create_access_token, verify_password, get_secret_key
from ..security import get_password_hash
from ..users import User, UserPublic
from jose import jwt
from ..security import ALGORITHM
import os
from ..config import settings


class LoginBody(BaseModel):
    email: EmailStr | None = None
    username: EmailStr | None = None
    password: str


router = APIRouter(prefix="/api/v1", tags=["compat"])


COOKIE_NAME = "auth_token"


@router.post("/login")
async def compat_login(request: Request, response: Response, db: Session = Depends(get_db)):
    # Accept both JSON and form
    content_type = request.headers.get("content-type", "")
    email = ""
    password = ""
    if "application/json" in content_type:
        data = await request.json()
        email = (data.get("email") or data.get("username") or "").strip()
        password = (data.get("password") or "").strip()
    else:
        form = await request.form()
        email = (form.get("email") or form.get("username") or "").strip()
        password = (form.get("password") or "").strip()
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    response.set_cookie(key=COOKIE_NAME, value=token, httponly=True, samesite="lax", max_age=60*60, path="/")
    # Enforce password reset at first login when default student password is used
    first_login = False
    try:
        if password == settings.DEFAULT_STUDENT_PASSWORD and user.role == "student":
            first_login = True
    except Exception:
        pass
    return {"access_token": token, "token_type": "bearer", "first_login": first_login}


@router.post("/login-form")
async def compat_login_form(request: Request, response: Response, db: Session = Depends(get_db)):
    form = await request.form()
    email = (form.get('email') or form.get('username') or '').strip()
    password = (form.get('password') or '').strip()
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60*60,
        path="/",
    )
    first_login = False
    try:
        if password == settings.DEFAULT_STUDENT_PASSWORD and user.role == "student":
            first_login = True
    except Exception:
        pass
    return {"access_token": token, "token_type": "bearer", "first_login": first_login}


@router.get("/login")
async def compat_login_get():
    # Help text for users navigating directly in the browser
    return {"message": "POST JSON {email,password} to /api/v1/login, or form to /api/v1/login-form"}


@router.get("/ping")
async def ping():
    return {"ok": True}


@router.post("/login/dev")
async def compat_login_dev(request: Request, response: Response, db: Session = Depends(get_db)):
    """DEV ONLY: authenticate without checking password when TESTING=1.
    Body may contain {email|username}.
    """
    if os.getenv("TESTING") != "1":
        raise HTTPException(status_code=403, detail="disabled")
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        data = await request.json()
        email = (data.get("email") or data.get("username") or "").strip()
    else:
        form = await request.form()
        email = (form.get("email") or form.get("username") or "").strip()
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    response.set_cookie(key=COOKIE_NAME, value=token, httponly=True, samesite="lax", max_age=60*60, path="/")
    return {"access_token": token, "token_type": "bearer"}


@router.get("/session", response_model=UserPublic)
async def compat_session(request: Request, db: Session = Depends(get_db)):
    """Return current user using Authorization header or auth_token cookie."""
    # Try header first via the standard dependency
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        # Delegate to existing dependency path by constructing a subrequest would be heavy; decode directly
        token = auth.split(None, 1)[1]
    else:
        token = request.cookies.get(COOKIE_NAME) or ""
    if not token:
        # DEV fallback: when TESTING=1, allow returning default teacher to unblock frontend without credentials
        if os.getenv("TESTING") == "1":
            # Prefer specific teacher email if exists
            preferred = "alaeddine.benrhouma@ert.tn"
            user = db.query(User).filter(User.email == preferred).one_or_none()
            if not user:
                # fallback to first teacher
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
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive user")
    return UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        first_name=user.first_name,
        last_name=user.last_name,
    )


@router.post("/logout")
async def compat_logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}


class ChangePasswordBody(BaseModel):
    new_password: str


def _extract_token_from_request(req: Request) -> str:
    """Return bearer token from Authorization header or auth_token cookie."""
    auth = req.headers.get("authorization") or req.headers.get("Authorization") or ""
    if auth.lower().startswith("bearer "):
        return auth.split(None, 1)[1]
    return req.cookies.get(COOKIE_NAME) or ""


@router.post("/change-password")
async def compat_change_password(
    request: Request,
    body: ChangePasswordBody,
    db: Session = Depends(get_db),
):
    """
    Change password using either Authorization: Bearer <token> or auth_token cookie.
    This endpoint mirrors /auth/change-password but is tolerant to cookie-only auth,
    which is commonly set during the compat login flow.
    """
    new_password = (body.new_password or "").strip()
    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=422, detail="Password too short")

    token = _extract_token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive user")

    user.hashed_password = get_password_hash(new_password)
    db.commit()
    return {"ok": True}
