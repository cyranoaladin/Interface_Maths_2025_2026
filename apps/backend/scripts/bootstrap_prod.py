#!/usr/bin/env python3
from __future__ import annotations

"""
Bootstrap production database for Maths Portal.

Actions:
  - Create DB schema if missing
  - Ensure default groups (T-EDS-3, P-EDS-6, MX-1)
  - Ensure teacher account (email + password from env)

Environment variables:
  DATABASE_URL (optional; default SQLite apps/backend/data/app.db)
  TEACHER_EMAIL (required)
  TEACHER_PASSWORD (required)

Usage:
  TEACHER_EMAIL=... TEACHER_PASSWORD=... python3 apps/backend/scripts/bootstrap_prod.py
"""

import os
import sys
from sqlalchemy.orm import Session

from apps.backend.app.db import engine, Base
from apps.backend.app.users import Group, User
from apps.backend.app.security import get_password_hash


def ensure_groups(db: Session) -> None:
    defaults = [
        ("T-EDS-3", "Terminale EDS Maths — Groupe 3"),
        ("P-EDS-6", "Première EDS Maths — Groupe 6"),
        ("MX-1", "Maths expertes — Groupe 1"),
    ]
    for code, name in defaults:
        g = db.query(Group).filter_by(code=code).one_or_none()
        if not g:
            db.add(Group(code=code, name=name))
    db.commit()


def ensure_teacher(db: Session, email: str, password: str) -> User:
    u = db.query(User).filter_by(email=email).one_or_none()
    if u:
        u.role = "teacher"
        u.hashed_password = get_password_hash(password)
        if not u.full_name:
            u.full_name = email
        db.commit()
        return u
    u = User(email=email, full_name=email, role="teacher", hashed_password=get_password_hash(password))
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def attach_teacher_to_all_groups(db: Session, teacher: User) -> None:
    groups = db.query(Group).all()
    for g in groups:
        if g not in teacher.groups:
            teacher.groups.append(g)
    db.commit()


def main() -> None:
    email = os.getenv("TEACHER_EMAIL", "").strip()
    password = os.getenv("TEACHER_PASSWORD", "").strip()
    if not email or not password:
        print("TEACHER_EMAIL and TEACHER_PASSWORD env vars are required", file=sys.stderr)
        sys.exit(2)

    # Create schema
    Base.metadata.create_all(bind=engine)
    with Session(bind=engine) as db:
        ensure_groups(db)
        teacher = ensure_teacher(db, email=email, password=password)
        attach_teacher_to_all_groups(db, teacher)
        print("ok: bootstrap complete for:", teacher.email)


if __name__ == "__main__":
    main()
