from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..orm import Group, GroupPublic, User, UserPublic
from ..security import require_admin


router = APIRouter(prefix="/admin", tags=["admin"])


def user_public(user: User) -> UserPublic:
    return UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        first_name=user.first_name,
        last_name=user.last_name,
        must_change_password=user.must_change_password,
    )


@router.get("/users", response_model=List[UserPublic])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.id.asc()).offset(skip).limit(limit).all()
    return [user_public(user) for user in users]


@router.get("/groups", response_model=List[GroupPublic])
async def list_groups(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    groups = db.query(Group).order_by(Group.code.asc()).all()
    return [GroupPublic(id=group.id, code=group.code, name=group.name) for group in groups]


@router.patch("/users/{user_id}", response_model=UserPublic)
async def update_user(
    user_id: int,
    payload: dict,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    allowed_roles = {"admin", "teacher", "student"}
    if "role" in payload:
        role = str(payload["role"]).strip()
        if role not in allowed_roles:
            raise HTTPException(status_code=422, detail="Invalid role")
        user.role = role
    if "is_active" in payload:
        user.is_active = bool(payload["is_active"])
    if "full_name" in payload:
        user.full_name = str(payload["full_name"]).strip() or user.full_name
    db.commit()
    db.refresh(user)
    return user_public(user)
