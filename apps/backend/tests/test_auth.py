from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db import Base, get_db
from app.security import get_password_hash
from app.users import User


def make_test_app(tmp_path: Path) -> TestClient:
    test_db = tmp_path / "test.db"
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


def test_auth_token_and_me(tmp_path: Path):
    client = make_test_app(tmp_path)

    # Create a user directly in DB
    db = next(iter(app.dependency_overrides[get_db]()))
    try:
        u = User(
            email="student@example.com",
            full_name="John Doe",
            role="student",
            hashed_password=get_password_hash("secret"),
        )
        db.add(u)
        db.commit()
        db.refresh(u)
    finally:
        db.close()

    # Obtain token
    r = client.post(
        "/auth/token",
        data={"username": "student@example.com", "password": "secret"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]

    # Call /auth/me
    r2 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200
    body = r2.json()
    assert body["email"] == "student@example.com"
    assert body["role"] == "student"


def test_teacher_only_requires_teacher(tmp_path: Path):
    client = make_test_app(tmp_path)
    # Create a student
    db = next(iter(app.dependency_overrides[get_db]()))
    try:
        student = User(
            email="stud@example.com",
            full_name="Stud",
            role="student",
            hashed_password=get_password_hash("s"),
        )
        teacher = User(
            email="teach@example.com",
            full_name="Teach",
            role="teacher",
            hashed_password=get_password_hash("t"),
        )
        db.add_all([student, teacher])
        db.commit()
        db.refresh(student)
        db.refresh(teacher)
    finally:
        db.close()

    # Student token
    r_stud_token = client.post(
        "/auth/token",
        data={"username": "stud@example.com", "password": "s"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    t1 = r_stud_token.json()["access_token"]
    # Teacher token
    r_teach_token = client.post(
        "/auth/token",
        data={"username": "teach@example.com", "password": "t"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    t2 = r_teach_token.json()["access_token"]

    # Student should be forbidden
    r_stud = client.get("/auth/admin/users", headers={"Authorization": f"Bearer {t1}"})
    assert r_stud.status_code == 403

    # Teacher should succeed
    r_teach = client.get("/auth/admin/users", headers={"Authorization": f"Bearer {t2}"})
    assert r_teach.status_code == 200

