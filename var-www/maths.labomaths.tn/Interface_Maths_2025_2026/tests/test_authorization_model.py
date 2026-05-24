from __future__ import annotations

from apps.backend.app.orm import Group, User
from apps.backend.app.security import get_password_hash


TEST_PASSWORD = "test-only-credential"


def add_group(session, code: str, name: str | None = None) -> Group:
    group = session.query(Group).filter_by(code=code).one_or_none()
    if group:
        return group
    group = Group(code=code, name=name or code)
    session.add(group)
    session.commit()
    session.refresh(group)
    return group


def add_user(
    session,
    email: str,
    role: str,
    groups: list[Group] | None = None,
    full_name: str | None = None,
) -> User:
    user = session.query(User).filter_by(email=email).one_or_none()
    if not user:
        user = User(
            email=email,
            full_name=full_name or email,
            role=role,
            hashed_password=get_password_hash(TEST_PASSWORD),
        )
        session.add(user)
    user.role = role
    user.hashed_password = get_password_hash(TEST_PASSWORD)
    for group in groups or []:
        if group not in user.groups:
            user.groups.append(group)
    session.commit()
    session.refresh(user)
    return user


def token_for(client, email: str) -> str:
    response = client.post(
        "/auth/token",
        data={"username": email, "password": TEST_PASSWORD},  # NOSONAR: test fixture credential
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_student_cannot_access_teacher_or_admin_endpoints(client, session):
    group = add_group(session, "P-EDS-6", "Premiere EDS Maths - Groupe 6")
    student = add_user(session, "student.authz@example.com", "student", [group])
    token = token_for(client, student.email)

    groups_response = client.get("/groups/", headers=auth(token))
    admin_response = client.get("/admin/users", headers=auth(token))

    assert groups_response.status_code == 403
    assert admin_response.status_code == 403


def test_teacher_only_sees_and_opens_assigned_groups(client, session):
    assigned = add_group(session, "T-EDS-3", "Terminale EDS Maths - Groupe 3")
    other = add_group(session, "P-EDS-6", "Premiere EDS Maths - Groupe 6")
    teacher = add_user(session, "teacher.authz@example.com", "teacher", [assigned])
    add_user(session, "student.assigned@example.com", "student", [assigned])
    add_user(session, "student.other@example.com", "student", [other])
    token = token_for(client, teacher.email)

    groups_response = client.get("/groups/", headers=auth(token))
    assigned_students = client.get("/groups/T-EDS-3/students", headers=auth(token))
    other_students = client.get("/groups/P-EDS-6/students", headers=auth(token))

    assert groups_response.status_code == 200
    assert [group["code"] for group in groups_response.json()] == ["T-EDS-3"]
    assert assigned_students.status_code == 200
    assert [student["email"] for student in assigned_students.json()] == ["student.assigned@example.com"]
    assert other_students.status_code == 404


def test_admin_can_access_admin_and_all_groups(client, session):
    add_group(session, "T-EDS-3", "Terminale EDS Maths - Groupe 3")
    add_group(session, "P-EDS-6", "Premiere EDS Maths - Groupe 6")
    admin = add_user(session, "admin.authz@example.com", "admin")
    token = token_for(client, admin.email)

    admin_response = client.get("/admin/users", headers=auth(token))
    groups_response = client.get("/groups/", headers=auth(token))

    assert admin_response.status_code == 200
    assert groups_response.status_code == 200
    assert {group["code"] for group in groups_response.json()} == {"P-EDS-6", "T-EDS-3"}


def test_teacher_can_reset_only_students_in_assigned_groups(client, session):
    assigned = add_group(session, "T-EDS-3", "Terminale EDS Maths - Groupe 3")
    other = add_group(session, "P-EDS-6", "Premiere EDS Maths - Groupe 6")
    teacher = add_user(session, "teacher.reset@example.com", "teacher", [assigned])
    own_student = add_user(session, "student.reset.ok@example.com", "student", [assigned])
    other_student = add_user(session, "student.reset.no@example.com", "student", [other])
    token = token_for(client, teacher.email)

    own_response = client.post(
        "/auth/reset-student-password",
        json={"email": own_student.email},
        headers=auth(token),
    )
    other_response = client.post(
        "/auth/reset-student-password",
        json={"email": other_student.email},
        headers=auth(token),
    )

    assert own_response.status_code == 200
    assert "temp_password" in own_response.json()
    assert other_response.status_code == 404
