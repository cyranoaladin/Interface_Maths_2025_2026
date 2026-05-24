#!/usr/bin/env python3
from __future__ import annotations

"""
Reset all students' passwords to the default configured value
(settings.DEFAULT_STUDENT_PASSWORD). Optionally filter by group code.

Usage:
  python3 apps/backend/scripts/reset_passwords_to_default.py [--group P-EDS-6]
"""

import sys
from pathlib import Path
from typing import Optional

# Ensure repo root on sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from apps.backend.app.db import engine  # noqa: E402
from apps.backend.app.users import User, Group  # noqa: E402
from apps.backend.app.security import get_password_hash  # noqa: E402
from apps.backend.app.config import settings  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402


def reset_passwords(db: Session, group_code: Optional[str] = None) -> int:
    default_pwd = settings.DEFAULT_STUDENT_PASSWORD
    hashed = get_password_hash(default_pwd)
    q = db.query(User).filter(User.role == "student")
    if group_code:
        q = q.join(User.groups).filter(Group.code == group_code)
    count = 0
    for user in q.all():
        user.hashed_password = hashed
        count += 1
    db.commit()
    return count


def main(argv: list[str]) -> None:
    group_code: Optional[str] = None
    if "--group" in argv:
        try:
            idx = argv.index("--group")
            group_code = argv[idx + 1]
        except Exception:
            print("Usage: --group CODE", file=sys.stderr)
            sys.exit(2)
    with Session(bind=engine) as db:
        num = reset_passwords(db, group_code=group_code)
        print(f"ok: reset {num} student password(s) to default '{settings.DEFAULT_STUDENT_PASSWORD}'")


if __name__ == "__main__":
    main(sys.argv[1:])
