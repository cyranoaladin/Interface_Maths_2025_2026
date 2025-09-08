from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.db import get_db, SessionLocal
from app.users import ensure_bootstrap, User, Group


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


def test_ensure_bootstrap_creates_defaults():
    # Ensure default groups and teacher accounts exist
    ensure_bootstrap()
    with SessionLocal() as db:
        groups = db.query(Group).all()
        # Expect at least the 3 defaults from users.DEFAULT_GROUPS
        assert len(groups) >= 3
        teachers = db.query(User).filter(User.role == "teacher").all()
        assert len(teachers) >= 1
