import pytest
from app import security
from app.orm import User, Group

@pytest.fixture
def seeded_db(db_session):
    teacher = User(email="teacher@example.com", full_name="Teacher", role="teacher", hashed_password=security.get_password_hash("teacher_pass"))
    student = User(email="student@example.com", full_name="Student", role="student", hashed_password=security.get_password_hash("student_pass"))
    db_session.add_all([teacher, student])
    db_session.commit()
    return db_session

def test_compat_login_json(test_client, seeded_db):
    response = test_client.post("/api/v1/login", json={"email": "student@example.com", "password": "student_pass"})
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "auth_token" in response.headers.get("set-cookie", "")

def test_compat_login_form(test_client, seeded_db):
    response = test_client.post("/api/v1/login-form", data={"email": "teacher@example.com", "password": "teacher_pass"})
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "auth_token" in response.headers.get("set-cookie", "")

def test_compat_session_missing_token(test_client, seeded_db):
    test_client.cookies.clear()
    import os
    original = os.environ.get("ALLOW_UNAUTHENTICATED_DEV")
    os.environ["ALLOW_UNAUTHENTICATED_DEV"] = "0"
    try:
        response = test_client.get("/api/v1/session")
        assert response.status_code == 401
    finally:
        if original is not None:
            os.environ["ALLOW_UNAUTHENTICATED_DEV"] = original
        else:
            del os.environ["ALLOW_UNAUTHENTICATED_DEV"]

def test_compat_session_with_token(test_client, seeded_db):
    # Log in first
    login_resp = test_client.post("/api/v1/login", json={"email": "student@example.com", "password": "student_pass"})
    assert login_resp.status_code == 200
    cookies = login_resp.cookies
    
    # Try session check with cookies
    session_resp = test_client.get("/api/v1/session", cookies=cookies)
    assert session_resp.status_code == 200
    assert session_resp.json()["email"] == "student@example.com"

def test_compat_change_password(test_client, seeded_db):
    # Log in first
    login_resp = test_client.post("/api/v1/login", json={"email": "student@example.com", "password": "student_pass"})
    cookies = login_resp.cookies
    
    # Change password
    change_resp = test_client.post("/api/v1/change-password", json={"new_password": "new_student_pass"}, cookies=cookies)
    assert change_resp.status_code == 200
    
    # Verify login with new password
    new_login_resp = test_client.post("/api/v1/login", json={"email": "student@example.com", "password": "new_student_pass"})
    assert new_login_resp.status_code == 200

def test_compat_logout(test_client, seeded_db):
    response = test_client.post("/api/v1/logout")
    assert response.status_code == 200
    assert "auth_token" in response.headers.get("set-cookie", "")
