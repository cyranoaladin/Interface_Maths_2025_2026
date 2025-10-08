from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..db import get_db
from ..security import create_access_token, verify_password, get_current_user, require_teacher, get_password_hash
from ..users import User, GroupPublic, UserPublic

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


@router.get("/me", response_model=UserPublic)
async def read_me(current_user: User = Depends(get_current_user)):
    return UserPublic(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
    )


@router.get("/me/groups", response_model=List[GroupPublic])
async def read_my_groups(current_user: User = Depends(get_current_user)):
    return [GroupPublic(id=g.id, code=g.code, name=g.name) for g in current_user.groups]


# Example teacher-only endpoint
@router.get("/admin/users", response_model=List[UserPublic])
async def list_users_teacher_only(_: User = Depends(require_teacher), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).all()
    return [
        UserPublic(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            first_name=u.first_name,
            last_name=u.last_name,
        )
        for u in users
    ]


@router.post("/change-password")
async def change_password(
    new_password: str = Body(..., embed=True, alias="new_password"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=422, detail="Password too short")
    user = db.get(User, current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    return {"ok": True}


# Teacher-only: reset a student's password to a known temporary value
@router.post("/reset-student-password")
async def reset_student_password(
    email: str = Body(..., embed=True),
    _: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="Invalid email")
    user = db.query(User).filter(User.email == email.lower()).one_or_none()
    if not user or user.role != "student":
        raise HTTPException(status_code=404, detail="Student not found")
    temp_password = "password123"
    user.hashed_password = get_password_hash(temp_password)
    db.commit()
    return {"ok": True, "temp_password": temp_password}
