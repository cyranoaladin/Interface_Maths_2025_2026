from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from apps.backend.app.security import get_password_hash
from apps.backend.app.users import Group, User


def create_teacher_and_get_token(client, session, email: str) -> str:
    teacher = session.query(User).filter_by(email=email).one_or_none()
    if not teacher:
        teacher = User(
            email=email,
            full_name="Teacher One",
            role="teacher",
            hashed_password=get_password_hash("secret"),
        )
        session.add(teacher)
    group = session.query(Group).filter_by(code="T-EDS-3").one_or_none()
    if not group:
        group = Group(code="T-EDS-3", name="Terminale EDS Maths — Groupe 3")
        session.add(group)
    if group not in teacher.groups:
        teacher.groups.append(group)
    session.commit()

    resp = client.post("/auth/token", data={"username": email, "password": "secret"})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def test_groups_list_and_students_seed_authorized(client, session):
    token = create_teacher_and_get_token(client, session, email="teacher.test@example.com")

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
