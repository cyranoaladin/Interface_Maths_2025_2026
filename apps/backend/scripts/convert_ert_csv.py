#!/usr/bin/env python3
from __future__ import annotations

import csv
from pathlib import Path
import sys


def _find_email_index(header: list[str]) -> int:
    # Try common headers variants
    lowered = [h.strip().lower() for h in header]
    candidates = [
        "adresse e-mail",
        "adresse email",
        "email",
        "e-mail",
        "adresse",
    ]
    for cand in candidates:
        if cand in lowered:
            return lowered.index(cand)
    # If split across two columns like "Adresse","E-mail", merge logic expects next column is email
    for i in range(len(lowered) - 1):
        if lowered[i] == "adresse" and lowered[i + 1] in ("email", "e-mail"):
            return i + 1
    raise ValueError("email column not found")


def convert_ert_csv(src_path: str, dest_path: str, group_code: str) -> None:
    src = Path(src_path)
    if not src.is_file():
        raise SystemExit(f"CSV introuvable: {src}")
    dest = Path(dest_path)
    dest.parent.mkdir(parents=True, exist_ok=True)

    with src.open(encoding="utf-8", newline="") as fin, dest.open(
        "w", encoding="utf-8", newline=""
    ) as fout:
        reader = csv.reader(fin, delimiter="," if src.suffix.lower() == ".csv" else ";")
        writer = csv.writer(fout)
        writer.writerow(["email", "full_name", "groups"])

        header = next(reader, [])
        try:
            email_idx = _find_email_index(header)
        except ValueError:
            # fallback try semicolon-delimited read
            fin.seek(0)
            reader = csv.reader(fin, delimiter=";")
            header = next(reader, [])
            email_idx = _find_email_index(header)

        for row in reader:
            if not row:
                continue
            # Build full name from first non-empty cell
            full_name = ""
            for cell in row:
                if cell and cell.strip():
                    full_name = cell.strip()
                    break
            email = row[email_idx].strip() if len(row) > email_idx else ""
            if not email:
                continue
            writer.writerow([email, full_name, group_code])


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: convert_ert_csv.py <src_csv> <dest_csv> <group_code>")
        sys.exit(2)
    convert_ert_csv(sys.argv[1], sys.argv[2], sys.argv[3])


import csv
from pathlib import Path
import sys


def _find_email_index(header: list[str]) -> int:
    # Try common headers variants
    lowered = [h.strip().lower() for h in header]
    candidates = [
        "adresse e-mail",
        "adresse email",
        "email",
        "e-mail",
        "adresse",
    ]
    for cand in candidates:
        if cand in lowered:
            return lowered.index(cand)
    # If split across two columns like "Adresse","E-mail", merge logic expects next column is email
    for i in range(len(lowered) - 1):
        if lowered[i] == "adresse" and lowered[i + 1] in ("email", "e-mail"):
            return i + 1
    raise ValueError("email column not found")


def convert_ert_csv(src_path: str, dest_path: str, group_code: str) -> None:
    src = Path(src_path)
    if not src.is_file():
        raise SystemExit(f"CSV introuvable: {src}")
    dest = Path(dest_path)
    dest.parent.mkdir(parents=True, exist_ok=True)

    with src.open(encoding="utf-8", newline="") as fin, dest.open(
        "w", encoding="utf-8", newline=""
    ) as fout:
        reader = csv.reader(fin, delimiter="," if src.suffix.lower() == ".csv" else ";")
        writer = csv.writer(fout)
        writer.writerow(["email", "full_name", "groups"])

        header = next(reader, [])
        try:
            email_idx = _find_email_index(header)
        except ValueError:
            # fallback try semicolon-delimited read
            fin.seek(0)
            reader = csv.reader(fin, delimiter=";")
            header = next(reader, [])
            email_idx = _find_email_index(header)

        for row in reader:
            if not row:
                continue
            # Build full name from first non-empty cell
            full_name = ""
            for cell in row:
                if cell and cell.strip():
                    full_name = cell.strip()
                    break
            email = row[email_idx].strip() if len(row) > email_idx else ""
            if not email:
                continue
            writer.writerow([email, full_name, group_code])


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: convert_ert_csv.py <src_csv> <dest_csv> <group_code>")
        sys.exit(2)
    convert_ert_csv(sys.argv[1], sys.argv[2], sys.argv[3])
