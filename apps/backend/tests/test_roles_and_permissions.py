from __future__ import annotations

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from apps.backend.app.main import app
from apps.backend.app.database import Base, get_db
from apps.backend.app.users import create_student, _ensure_teacher, Group, User
from apps.backend.app.security import create_access_token


@pytest.fixture(name="test_db_session")
def test_db_session_fixture():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(name="client")
def client_fixture(test_db_session: Session):
    def override_get_db():
        yield test_db_session
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


def seed_minimal(client: TestClient, db: Session):
    os.environ["TESTING"] = "1"
    _ensure_teacher(db, email="teacher@example.com", full_name="Teach Er")
    resp = client.post("/testing/ensure-teacher", json={"email": "teacher@example.com", "password": "secret"})
    assert resp.status_code == 200
    os.environ.pop("TESTING")
    # group and one student
    grp = db.query(Group).filter_by(code="P-EDS-6").one_or_none()
    if not grp:
        grp = Group(code="P-EDS-6", name="Première EDS Maths — Groupe 6")
        db.add(grp)
        db.commit()
        db.refresh(grp)
    create_student(db, email="eleve@example.com", full_name="Eleve Test", group_codes=["P-EDS-6"])


def test_student_session_and_403_on_teacher_endpoint(client: TestClient, test_db_session: Session):
    seed_minimal(client, test_db_session)
    user = test_db_session.query(User).filter_by(email="eleve@example.com").one()
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    headers = {"Authorization": f"Bearer {token}"}
    # session should reflect student
    r = client.get("/api/v1/session", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data["role"] == "student"
    # teacher-only endpoint must be forbidden
    r2 = client.get("/groups/P-EDS-6/students", headers=headers)
    assert r2.status_code == 403


def test_teacher_can_access_groups_students(client: TestClient, test_db_session: Session):
    seed_minimal(client, test_db_session)
    teacher = test_db_session.query(User).filter_by(email="teacher@example.com").one()
    token = create_access_token({"sub": str(teacher.id), "email": teacher.email, "role": teacher.role})
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/groups/P-EDS-6/students", headers=headers)
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list)
