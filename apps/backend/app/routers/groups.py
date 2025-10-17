from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..users import User, Group, GroupPublic, UserPublic
from ..security import require_teacher, get_current_user


router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/", response_model=List[GroupPublic])
async def list_groups(_: User = Depends(require_teacher), db: Session = Depends(get_db)):
    groups = db.query(Group).order_by(Group.code.asc()).all()
    return [GroupPublic(id=g.id, code=g.code, name=g.name) for g in groups]


@router.get("/{code}/students", response_model=List[UserPublic])
async def list_students_in_group(code: str, _: User = Depends(require_teacher), db: Session = Depends(get_db)):
    grp = db.query(Group).filter_by(code=code).one_or_none()
    if not grp:
        raise HTTPException(status_code=404, detail="Groupe introuvable")
    # members relationship is loaded with selectin; ensure order for stable UI
    students = [m for m in grp.members if m.role == "student"]
    students.sort(key=lambda u: (u.full_name or u.email).lower())
    return [
        UserPublic(
            id=s.id,
            email=s.email,
            full_name=s.full_name,
            role=s.role,
            first_name=s.first_name,
            last_name=s.last_name,
        )
        for s in students
    ]


@router.get("/my", response_model=List[GroupPublic])
async def my_groups(me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Return groups for current user (student or teacher)
    user = db.get(User, me.id)
    if not user:
        return []
    return [GroupPublic(id=g.id, code=g.code, name=g.name) for g in user.groups]


@router.post("/{code}/seed-test", response_model=UserPublic)
async def seed_test_student(code: str, _: User = Depends(require_teacher), db: Session = Depends(get_db)):
    from ..users import create_student

    # ensure group exists
    grp = db.query(Group).filter_by(code=code).one_or_none()
    if not grp:
        grp = Group(code=code, name=code)
        db.add(grp)
        db.commit()
        db.refresh(grp)

    email = f"eleve.test.{code.lower()}@example.com"
    full_name = f"Élève Test {code}"
    create_student(db, email=email, full_name=full_name, group_codes=[code])

    # fetch created/updated user
    user = db.query(User).filter_by(email=email).one()
    # Note: password is returned only via outputs file for security; not in API
    return UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        first_name=user.first_name,
        last_name=user.last_name,
    )
