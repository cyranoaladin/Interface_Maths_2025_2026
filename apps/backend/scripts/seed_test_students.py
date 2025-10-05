#!/usr/bin/env python3
from __future__ import annotations

from sqlalchemy.orm import Session

from app.db import engine
from app.users import create_student


def main():
    groups = [
        ("T-EDS-3", "Terminale EDS Maths — Groupe 3"),
        ("P-EDS-6", "Première EDS Maths — Groupe 6"),
        ("MX-1", "Maths expertes — Groupe 1"),
    ]
    with Session(bind=engine) as db:
        for code, _ in groups:
            email = f"eleve.test.{code.lower()}@example.com"
            full_name = f"Élève Test {code}"
            create_student(db, email=email, full_name=full_name, group_codes=[code])
    print("Seed test students: done")


if __name__ == "__main__":
    main()

