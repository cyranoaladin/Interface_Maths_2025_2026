from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..db import get_db
from ..security import create_access_token, verify_password, get_current_user, require_teacher
from ..users import User, UserRead, GroupRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # username field contains email in our case
    user = db.query(User).filter(User.email == form_data.username).one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
async def read_me(current_user: User = Depends(get_current_user)):
    return UserRead(id=current_user.id, email=current_user.email, full_name=current_user.full_name, role=current_user.role)


@router.get("/me/groups", response_model=List[GroupRead])
async def read_my_groups(current_user: User = Depends(get_current_user)):
    return [GroupRead(id=g.id, code=g.code, name=g.name) for g in current_user.groups]


# Example teacher-only endpoint
@router.get("/admin/users", response_model=List[UserRead])
async def list_users_teacher_only(_: User = Depends(require_teacher), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).all()
    return [UserRead(id=u.id, email=u.email, full_name=u.full_name, role=u.role) for u in users]

