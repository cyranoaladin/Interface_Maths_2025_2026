"""
Tests for authentication endpoints.
"""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Ensure repo root is on sys.path for 'apps.backend.*' imports
REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from apps.backend.app.users import User
from apps.backend.app.security import get_password_hash

# A test user and password
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "a_very_secure_password"


def create_test_user(db_session: Session, role: str = "student", email: str = TEST_USER_EMAIL) -> User:
    """Helper function to create a user in the test database."""
    hashed_password = get_password_hash(TEST_USER_PASSWORD)
    user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=f"Test {role.capitalize()}",
        first_name="Test",
        last_name=role.capitalize(),
        role=role,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_login_with_wrong_password(test_client: TestClient, db_session: Session):
    """
    Tests that logging in with an incorrect password fails.
    """
    create_test_user(db_session)
    response = test_client.post(
        "/auth/token",
        data={"username": TEST_USER_EMAIL, "password": "wrong_password"},
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Incorrect email or password"}


def test_login_with_correct_password(test_client: TestClient, db_session: Session):
    """
    Tests that logging in with the correct password succeeds and returns a token.
    """
    create_test_user(db_session)
    response = test_client.post(
        "/auth/token",
        data={"username": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_read_me_unauthenticated(test_client: TestClient):
    """
    Tests that accessing a protected endpoint without authentication fails.
    """
    response = test_client.get("/auth/me")
    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}


def test_read_me_authenticated(test_client: TestClient, db_session: Session):
    """
    Tests that a logged-in user can access their own information.
    """
    create_test_user(db_session)
    # First, log in to get a token
    login_response = test_client.post(
        "/auth/token",
        data={"username": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
    )
    token = login_response.json()["access_token"]

    # Now, use the token to access the protected endpoint
    headers = {"Authorization": f"Bearer {token}"}
    me_response = test_client.get("/auth/me", headers=headers)

    assert me_response.status_code == 200
    data = me_response.json()
    assert data["email"] == TEST_USER_EMAIL
    assert data["full_name"] == "Test Student"
    assert data["role"] == "student"


def test_teacher_only_endpoint_as_student(test_client: TestClient, db_session: Session):
    """
    Tests that a student cannot access a teacher-only endpoint.
    """
    create_test_user(db_session, role="student")
    login_response = test_client.post(
        "/auth/token",
        data={"username": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = test_client.get("/auth/admin/users", headers=headers)
    assert response.status_code == 403
    assert response.json() == {"detail": "Insufficient permissions"}


def test_teacher_only_endpoint_as_teacher(test_client: TestClient, db_session: Session):
    """
    Tests that a teacher CAN access a teacher-only endpoint.
    """
    teacher_email = "teacher@example.com"
    create_test_user(db_session, role="teacher", email=teacher_email)
    login_response = test_client.post(
        "/auth/token",
        data={"username": teacher_email, "password": TEST_USER_PASSWORD},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = test_client.get("/auth/admin/users", headers=headers)
    assert response.status_code == 200
    # The endpoint should return a list of users
    assert isinstance(response.json(), list)


def test_reset_student_password_by_teacher(test_client: TestClient, db_session: Session):
    """
    Tests that a teacher can reset a student's password.
    """
    # Create a teacher and a student
    teacher_email = "teacher@example.com"
    student_email = "student@example.com"
    create_test_user(db_session, role="teacher", email=teacher_email)
    create_test_user(db_session, role="student", email=student_email)

    # Log in as the teacher
    login_response = test_client.post(
        "/auth/token",
        data={"username": teacher_email, "password": TEST_USER_PASSWORD},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Teacher resets the student's password
    reset_response = test_client.post(
        "/auth/reset-student-password",
        json={"email": student_email},
        headers=headers,
    )
    assert reset_response.status_code == 200
    reset_data = reset_response.json()
    assert reset_data["ok"] is True
    assert "temp_password" in reset_data
    new_temp_password = reset_data["temp_password"]

    # Verify the student can log in with the new temporary password
    new_login_response = test_client.post(
        "/auth/token",
        data={"username": student_email, "password": new_temp_password},
    )
    assert new_login_response.status_code == 200
    assert "access_token" in new_login_response.json()
