from __future__ import annotations

from fastapi.testclient import TestClient
from apps.backend.app.main import app
from apps.backend.app.users import ensure_bootstrap, _ensure_teacher
from apps.backend.app.db import SessionLocal


def create_teacher_and_get_token(client: TestClient, email: str) -> str:
    # Create teacher with provisional password written to outputs (not read here). We set known password by updating hash.
    ensure_bootstrap()
    with SessionLocal() as db:
        teacher = _ensure_teacher(db, email=email, full_name=email)
        # Reset to known password 'secret'
        from apps.backend.app.security import get_password_hash
        teacher.hashed_password = get_password_hash('secret')
        db.commit()
    resp = client.post("/auth/token", data={"username": email, "password": "secret"})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def test_groups_list_and_students_seed_authorized():
    client = TestClient(app)
    token = create_teacher_and_get_token(client, email="teacher.test@example.com")

    # Authorized list groups
    r = client.get("/groups/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    groups = r.json()
    assert isinstance(groups, list)

    # Seed student for a known code
    r2 = client.post("/groups/T-EDS-3/seed-test", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code in (200, 201)

    # Fetch students
    r3 = client.get("/groups/T-EDS-3/students", headers={"Authorization": f"Bearer {token}"})
    assert r3.status_code == 200
    students = r3.json()
    assert any('eleve.test.t-eds-3' in s['email'] for s in students)
