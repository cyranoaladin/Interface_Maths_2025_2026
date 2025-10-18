from __future__ import annotations

# pylint: disable=duplicate-code

from fastapi.testclient import TestClient

from apps.backend.app.db import SessionLocal, get_db
from apps.backend.app.main import app
from apps.backend.app.users import Group, User, create_student, ensure_bootstrap


def test_root_and_tree_endpoints_work():
    client = TestClient(app)
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert "content_root" in body

    r2 = client.get("/api/tree")
    assert r2.status_code == 200
    tree = r2.json()
    assert tree.get("type") == "dir"
    assert isinstance(tree.get("children"), list)


def test_db_session_generator_opens_and_closes():
    # Exercise get_db generator to bump coverage in app/db.py
    gen = get_db()
    db = next(gen)
    assert db.bind is not None
    try:
        # Simple query after bootstrap ensures engine/tables exist
        ensure_bootstrap()
        users = db.query(User).all()
        assert isinstance(users, list)
    finally:
        try:
            next(gen)
        except StopIteration:
            pass


def test_create_student_and_bootstrap_defaults():
    # Ensure default groups and teacher accounts exist
    ensure_bootstrap()
    with SessionLocal() as db:
        groups = db.query(Group).all()
        # Expect at least the 3 defaults from users.DEFAULT_GROUPS
        assert len(groups) >= 3
        teachers = db.query(User).filter(User.role == "teacher").all()
        assert len(teachers) >= 1
        # Create a student and attach groups (covers users.create_student)
        codes = [g.code for g in groups[:2]]
        pwd = create_student(
            db,
            email="student.cov@example.com",
            full_name="Cov Student",
            group_codes=codes,
        )
        # If user already existed, function returns empty password; both are acceptable
        assert pwd is not None
