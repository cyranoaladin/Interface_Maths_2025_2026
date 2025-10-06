#!/usr/bin/env python3
from __future__ import annotations

import csv
from pathlib import Path
from typing import List
import sys

# Ensure repo root on sys.path so that 'apps.backend.app.*' imports work
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from sqlalchemy.orm import Session
from apps.backend.app.db import engine
from apps.backend.app.users import create_student
from apps.backend.app.config import settings

"""
Import students from a CSV and generate provisional passwords.

CSV format (headers required):
email,full_name,groups

- email: student email (unique)
- full_name: "First Last"
- groups: semicolon-separated group codes (e.g., "T-EDS-3;P-EDS-6")

Output: writes an outputs/new_students_<timestamp>.csv with email and provisional password.
"""


def import_students(csv_path: str) -> Path:
    from datetime import datetime

    csv_file = Path(csv_path)
    if not csv_file.is_file():
        raise SystemExit(f"CSV not found: {csv_file}")

    out_dir = settings.OUTPUTS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"new_students_{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.csv"

    created_rows: List[List[str]] = []

    with Session(bind=engine) as db:
        with csv_file.open(newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            required = {"email", "full_name", "groups"}
            if not required.issubset(reader.fieldnames or {}):
                raise SystemExit(f"CSV headers must include: {required}")
            for row in reader:
                email = (row["email"] or "").strip()
                full_name = (row["full_name"] or "").strip()
                groups = [g.strip() for g in (row["groups"] or "").split(";") if g.strip()]
                if not email or not full_name:
                    continue
                password = create_student(db, email=email, full_name=full_name, group_codes=groups)
                if password:
                    created_rows.append([email, full_name, ";".join(groups), password])

    # Write credentials for newly created students
    with out_file.open("w", newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["email", "full_name", "groups", "provisional_password"])
        writer.writerows(created_rows)

    print(f"Wrote credentials to: {out_file}")
    return out_file


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Import students from a CSV")
    parser.add_argument("csv_path", help="Path to CSV file")
    args = parser.parse_args()
    import_students(args.csv_path)

    parser.add_argument("csv_path", help="Path to CSV file")
    args = parser.parse_args()
    import_students(args.csv_path)
