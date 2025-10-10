#!/usr/bin/env python3
from __future__ import annotations

import sys
import re
from typing import Iterable
from pathlib import Path

# Ensure repo root on sys.path so 'apps.backend.app.*' imports work anywhere
SCRIPT_DIR = Path(__file__).resolve().parent
# Inner repo root that directly contains `apps/`
REPO_ROOT = SCRIPT_DIR.parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

# Local app imports
from apps.backend.app.db import SessionLocal
from apps.backend.app.users import User


LINE_RE = re.compile(r"^\s*([^\s]+)\s+([^\s]+)\s*$")
VALID_ROLES = {"student", "teacher"}


def iter_email_roles(lines: Iterable[str]):
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        m = LINE_RE.match(line)
        if not m:
            # skip headings or malformed lines
            continue
        email, role = m.group(1), m.group(2).lower()
        if role not in VALID_ROLES:
            # ignore unknown roles
            continue
        yield email, role


def main() -> None:
    db = SessionLocal()
    updated = 0
    missing = 0
    total = 0
    try:
        for email, role in iter_email_roles(sys.stdin):
            total += 1
            user = db.query(User).filter(User.email == email).one_or_none()
            if not user:
                missing += 1
                continue
            if user.role != role:
                user.role = role
                updated += 1
        if updated:
            db.commit()
        print(f"done: total={total} updated={updated} missing={missing}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
