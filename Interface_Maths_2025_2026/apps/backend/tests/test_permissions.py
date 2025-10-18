from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from apps.backend.app.db import Base, get_db
from apps.backend.app.main import app
from apps.backend.app.security import get_password_hash
from apps.backend.app.users import Group, User


def make_test_app(tmp_path: Path) -> TestClient:
    test_db = tmp_path / "perm.db"
    engine = create_engine(f"sqlite:///{test_db}", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


def seed_users(db_session):
    g = Group(code="P-EDS-6", name="Première EDS Maths — Groupe 6")
    db_session.add(g)
    student = User(
        email="student@example.com",
        full_name="John Doe",
        first_name="John",
        last_name="Doe",
        role="student",
        hashed_password=get_password_hash("password123"),
    )
    db_session.add(student)
    db_session.flush()
    g.members.append(student)
    teacher = User(
        email="teacher@example.com",
        full_name="Teacher One",
        role="teacher",
        hashed_password=get_password_hash("password123"),
    )
    db_session.add(teacher)
    db_session.commit()


def login_token(client: TestClient, email: str, password: str) -> str:
    res = client.post("/auth/token", data={"username": email, "password": password})
    assert res.status_code in (200, 400)
    if res.status_code != 200:
        return ""
    return res.json()["access_token"]


def test_student_forbidden_on_teacher_endpoint(tmp_path: Path):
    client = make_test_app(tmp_path)
    engine = create_engine(f"sqlite:///{tmp_path / 'perm.db'}", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    with TestingSessionLocal() as db:
        seed_users(db)
    # login as student
    token = login_token(client, "student@example.com", "password123")
    assert token
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/groups/P-EDS-6/students", headers=headers)
    assert res.status_code == 403


def test_login_accepts_correct_rejects_incorrect(tmp_path: Path):
    client = make_test_app(tmp_path)
    engine = create_engine(f"sqlite:///{tmp_path / 'perm.db'}", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    with TestingSessionLocal() as db:
        seed_users(db)

    # wrong password
    res_bad = client.post("/auth/token", data={"username": "teacher@example.com", "password": "wrong"})
    assert res_bad.status_code == 400

    # correct password
    res_ok = client.post("/auth/token", data={"username": "teacher@example.com", "password": "password123"})
    assert res_ok.status_code == 200
    assert res_ok.json().get("access_token")
