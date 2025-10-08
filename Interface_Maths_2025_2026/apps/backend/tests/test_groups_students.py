from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db import Base, get_db
from app.users import User, Group
from app.security import get_password_hash


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


def seed_data(session):
    g = Group(code="P-EDS-6", name="Première EDS Maths — Groupe 6")
    session.add(g)
    student = User(
        email="student@example.com",
        full_name="Doe John",
        first_name="John",
        last_name="Doe",
        role="student",
        hashed_password=get_password_hash("password123"),
    )
    session.add(student)
    session.flush()
    g.members.append(student)
    session.commit()


def test_get_students_in_group_returns_names(tmp_path: Path):
    client = make_test_app(tmp_path)
    # Recreate the same test session factory for seeding
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    # Seed
    with TestingSessionLocal() as db:
        seed_data(db)
        teacher = User(
            email="teacher@example.com",
            full_name="Teacher One",
            role="teacher",
            hashed_password=get_password_hash("password123"),
        )
        db.add(teacher)
        db.commit()

    # Login
    resp = client.post("/auth/token", data={"username": "teacher@example.com", "password": "password123"})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Call endpoint
    response = client.get("/groups/P-EDS-6/students", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["first_name"] is not None
    assert data[0]["last_name"] is not None
