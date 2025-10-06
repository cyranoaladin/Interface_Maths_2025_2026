#!/usr/bin/env python3
from __future__ import annotations

"""
Create the real teacher account locally and attach it to the 3 real groups.

Usage:
  python3 apps/backend/scripts/seed_real_teacher.py [email] [password]

Defaults:
  email = alaeddine.benrhouma@ert.tn
  password = secret
"""

import sys
from typing import List

from sqlalchemy.orm import Session

# Import app modules
from apps.backend.app.db import engine
from apps.backend.app.users import User, Group
from apps.backend.app.security import get_password_hash


DEFAULT_EMAIL = "alaeddine.benrhouma@ert.tn"
DEFAULT_PASSWORD = "secret"

GROUP_CODES = [
    "T-EDS-3",  # Terminale EDS Maths — Groupe 3
    "P-EDS-6",  # Première EDS Maths — Groupe 6
    "MX-1",     # Maths expertes — Groupe 1
]

FRIENDLY_NAMES = {
    "T-EDS-3": "Terminale EDS Maths — Groupe 3",
    "P-EDS-6": "Première EDS Maths — Groupe 6",
    "MX-1": "Maths expertes — Groupe 1",
}


def ensure_group(db: Session, code: str, name: str) -> Group:
    grp = db.query(Group).filter_by(code=code).one_or_none()
    if grp:
        if grp.name != name:
            grp.name = name
            db.commit()
        return grp
    grp = Group(code=code, name=name)
    db.add(grp)
    db.commit()
    db.refresh(grp)
    return grp


def ensure_teacher(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter_by(email=email).one_or_none()
    if user:
        if user.role != "teacher":
            user.role = "teacher"
        user.hashed_password = get_password_hash(password)
        if not user.full_name:
            user.full_name = email
        db.commit()
        db.refresh(user)
        return user
    user = User(
        email=email,
        full_name=email,
        role="teacher",
        hashed_password=get_password_hash(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def main(argv: List[str]) -> None:
    email = argv[1].strip() if len(argv) > 1 and argv[1].strip() else DEFAULT_EMAIL
    password = argv[2].strip() if len(argv) > 2 and argv[2].strip() else DEFAULT_PASSWORD

    with Session(bind=engine) as db:
        teacher = ensure_teacher(db, email=email, password=password)
        # Ensure and attach groups
        for code in GROUP_CODES:
            grp = ensure_group(db, code=code, name=FRIENDLY_NAMES.get(code, code))
            if grp not in teacher.groups:
                teacher.groups.append(grp)
        db.commit()

        # Output summary
        print("ok: teacher:", teacher.email)
        print("groups:", ", ".join(sorted(g.code for g in teacher.groups)))


if __name__ == "__main__":
    main(sys.argv)
