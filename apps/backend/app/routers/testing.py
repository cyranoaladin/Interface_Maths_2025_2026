from __future__ import annotations

import os
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session

from ..db import SessionLocal, get_db
from ..users import _ensure_teacher, Group, create_student, User
import re
from ..security import get_password_hash


router = APIRouter(prefix="/testing", tags=["testing"])


@router.post("/ensure-teacher")
async def ensure_teacher(request: Request):
    """Testing-only utility: ensure a teacher exists with a known password
    and is assigned to default groups. Also seeds one test student per group.
    Enabled only when TESTING=1 in environment.
    """
    if os.getenv("TESTING") != "1":
        raise HTTPException(status_code=403, detail="disabled")

    # Accept both JSON and form bodies
    content_type = request.headers.get("content-type", "")
    email = None
    password = "secret"
    if "application/json" in content_type:
        data = await request.json()
        email = (data.get("email") or data.get("username") or "").strip()
        password = (data.get("password") or password).strip()
    else:
        form = await request.form()
        email = (form.get("email") or form.get("username") or "").strip()
        password = (form.get("password") or password).strip()
    if not email:
        raise HTTPException(status_code=422, detail="email required")
    with SessionLocal() as db:  # type: Session
        teacher = _ensure_teacher(db, email=email, full_name=email)
        teacher.hashed_password = get_password_hash(password)
        db.commit()

        # Ensure default groups exist and are linked (with friendly names)
        default_codes = ["T-EDS-3", "P-EDS-6", "MX-1"]
        friendly_names = {
            "T-EDS-3": "Terminale EDS Maths — Groupe 3",
            "P-EDS-6": "Première EDS Maths — Groupe 6",
            "MX-1": "Maths expertes — Groupe 1",
        }
        for code in default_codes:
            grp = db.query(Group).filter_by(code=code).one_or_none()
            if not grp:
                grp = Group(code=code, name=friendly_names.get(code, code))
                db.add(grp)
                db.flush()
            else:
                # Ensure friendly name even if group pre-existed
                friendly = friendly_names.get(code, code)
                if grp.name != friendly:
                    grp.name = friendly
            if grp not in teacher.groups:
                teacher.groups.append(grp)
        db.commit()

        # Seed one test student per group
        for code in [g.code for g in teacher.groups]:
            email_s = f"eleve.test.{code.lower()}@example.com"
            create_student(db, email=email_s, full_name=f"Élève Test {code}", group_codes=[code])

        # Attach teacher to ALL existing groups for convenience in TESTING
        groups_all = db.query(Group).all()
        for grp in groups_all:
            if grp not in teacher.groups:
                teacher.groups.append(grp)
        db.commit()

    return {"ok": True}


@router.post("/cleanup-group/{code}")
def cleanup_group(code: str, db: Session = Depends(get_db)):
    """Remove invalid students (email without @) and test student for a group (TESTING only)."""
    if os.getenv("TESTING") != "1":
        raise HTTPException(status_code=403, detail="disabled")
    grp = db.query(Group).filter_by(code=code).one_or_none()
    if not grp:
        raise HTTPException(status_code=404, detail="group not found")
    removed = []
    # Delete test student
    test_email = f"eleve.test.{code.lower()}@example.com"
    test_user = db.query(User).filter_by(email=test_email).one_or_none()
    if test_user and test_user in grp.members:
        grp.members.remove(test_user)
        # If user has no other groups, delete
        if len(test_user.groups) == 0:
            db.delete(test_user)
        removed.append(test_email)
    # Remove students with invalid email (no '@')
    invalids = [m for m in grp.members if m.role == "student" and "@" not in (m.email or "")]
    for u in invalids:
        grp.members.remove(u)
        if len(u.groups) == 0:
            db.delete(u)
        removed.append(u.email)
    db.commit()
    return {"ok": True, "removed": removed}


@router.post("/normalize-names")
def normalize_names(db: Session = Depends(get_db)):
    """Strip leading non-alphanumeric characters from user full_name (TESTING only)."""
    if os.getenv("TESTING") != "1":
        raise HTTPException(status_code=403, detail="disabled")
    changed = 0
    users = db.query(User).all()
    for u in users:
        if not u.full_name:
            continue
        new = re.sub(r"^[^0-9A-Za-zÀ-ÖØ-öø-ÿ]+", "", u.full_name)
        if new != u.full_name:
            u.full_name = new
            changed += 1
    if changed:
        db.commit()
    return {"ok": True, "changed": changed}


@router.post("/remove-user")
async def remove_user(request: Request):
    """Remove a user by email (TESTING only). Accepts JSON or form with 'email'."""
    if os.getenv("TESTING") != "1":
        raise HTTPException(status_code=403, detail="disabled")
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        data = await request.json()
        email = (data.get("email") or "").strip()
    else:
        form = await request.form()
        email = (form.get("email") or "").strip()
    if not email:
        raise HTTPException(status_code=422, detail="email required")
    with SessionLocal() as db:
        u = db.query(User).filter_by(email=email).one_or_none()
        if not u:
            return {"ok": True, "removed": False}
        # detach from groups then delete
        u.groups.clear()
        db.delete(u)
        db.commit()
        return {"ok": True, "removed": True}


        # Attach teacher to ALL existing groups for convenience in TESTING
        groups_all = db.query(Group).all()
        for grp in groups_all:
            if grp not in teacher.groups:
                teacher.groups.append(grp)
        db.commit()

    return {"ok": True}


@router.post("/cleanup-group/{code}")
def cleanup_group(code: str, db: Session = Depends(get_db)):
    """Remove invalid students (email without @) and test student for a group (TESTING only)."""
    if os.getenv("TESTING") != "1":
        raise HTTPException(status_code=403, detail="disabled")
    grp = db.query(Group).filter_by(code=code).one_or_none()
    if not grp:
        raise HTTPException(status_code=404, detail="group not found")
    removed = []
    # Delete test student
    test_email = f"eleve.test.{code.lower()}@example.com"
    test_user = db.query(User).filter_by(email=test_email).one_or_none()
    if test_user and test_user in grp.members:
        grp.members.remove(test_user)
        # If user has no other groups, delete
        if len(test_user.groups) == 0:
            db.delete(test_user)
        removed.append(test_email)
    # Remove students with invalid email (no '@')
    invalids = [m for m in grp.members if m.role == "student" and "@" not in (m.email or "")]
    for u in invalids:
        grp.members.remove(u)
        if len(u.groups) == 0:
            db.delete(u)
        removed.append(u.email)
    db.commit()
    return {"ok": True, "removed": removed}


@router.post("/normalize-names")
def normalize_names(db: Session = Depends(get_db)):
    """Strip leading non-alphanumeric characters from user full_name (TESTING only)."""
    if os.getenv("TESTING") != "1":
        raise HTTPException(status_code=403, detail="disabled")
    changed = 0
    users = db.query(User).all()
    for u in users:
        if not u.full_name:
            continue
        new = re.sub(r"^[^0-9A-Za-zÀ-ÖØ-öø-ÿ]+", "", u.full_name)
        if new != u.full_name:
            u.full_name = new
            changed += 1
    if changed:
        db.commit()
    return {"ok": True, "changed": changed}


@router.post("/remove-user")
async def remove_user(request: Request):
    """Remove a user by email (TESTING only). Accepts JSON or form with 'email'."""
    if os.getenv("TESTING") != "1":
        raise HTTPException(status_code=403, detail="disabled")
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        data = await request.json()
        email = (data.get("email") or "").strip()
    else:
        form = await request.form()
        email = (form.get("email") or "").strip()
    if not email:
        raise HTTPException(status_code=422, detail="email required")
    with SessionLocal() as db:
        u = db.query(User).filter_by(email=email).one_or_none()
        if not u:
            return {"ok": True, "removed": False}
        # detach from groups then delete
        u.groups.clear()
        db.delete(u)
        db.commit()
        return {"ok": True, "removed": True}
