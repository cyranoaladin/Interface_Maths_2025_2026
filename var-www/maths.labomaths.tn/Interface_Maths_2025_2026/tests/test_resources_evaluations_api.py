from __future__ import annotations

from tests.test_authorization_model import add_group, add_user, auth, token_for


def test_student_gets_only_authorized_resources(client, session):
    group = add_group(session, "P-EDS-6", "Premiere EDS Maths - Groupe 6")
    other = add_group(session, "T-EDS-3", "Terminale EDS Maths - Groupe 3")
    student = add_user(session, "student.resources@example.com", "student", [group])
    other_student = add_user(session, "student.resources.other@example.com", "student", [other])

    student_response = client.get("/resources/my", headers=auth(token_for(client, student.email)))
    other_response = client.get("/resources/my", headers=auth(token_for(client, other_student.email)))

    assert student_response.status_code == 200
    student_ids = {item["id"] for item in student_response.json()}
    assert "premiere-second-degre-cours" in student_ids
    assert "terminale-suites-cours" not in student_ids

    other_ids = {item["id"] for item in other_response.json()}
    assert "terminale-suites-cours" in other_ids
    assert "premiere-second-degre-cours" not in other_ids


def test_resource_detail_is_hidden_when_group_is_not_authorized(client, session):
    group = add_group(session, "T-EDS-3", "Terminale EDS Maths - Groupe 3")
    student = add_user(session, "student.resource.denied@example.com", "student", [group])
    token = token_for(client, student.email)

    response = client.get("/resources/premiere-second-degre-cours", headers=auth(token))

    assert response.status_code == 404


def test_student_evaluations_and_own_report_are_filtered(client, session):
    group = add_group(session, "P-EDS-6", "Premiere EDS Maths - Groupe 6")
    student = add_user(session, "eleve.test.p-eds-6@example.com", "student", [group])
    token = token_for(client, student.email)

    evaluations_response = client.get("/evaluations/my", headers=auth(token))
    report_response = client.get("/evaluations/eval1_second_degre/my-report", headers=auth(token))

    assert evaluations_response.status_code == 200
    assert [item["id"] for item in evaluations_response.json()] == ["eval1_second_degre"]
    assert report_response.status_code == 200
    report = report_response.json()
    assert report["email"] == student.email
    assert report["note_finale"] == 16.5


def test_student_cannot_use_teacher_evaluation_endpoint(client, session):
    group = add_group(session, "P-EDS-6", "Premiere EDS Maths - Groupe 6")
    student = add_user(session, "eleve.test.p-eds-6@example.com", "student", [group])

    response = client.get(
        "/teacher/groups/P-EDS-6/evaluations",
        headers=auth(token_for(client, student.email)),
    )

    assert response.status_code == 403


def test_teacher_reports_are_limited_to_assigned_students(client, session):
    group = add_group(session, "P-EDS-6", "Premiere EDS Maths - Groupe 6")
    other_group = add_group(session, "T-EDS-3", "Terminale EDS Maths - Groupe 3")
    teacher = add_user(session, "teacher.evals@example.com", "teacher", [group])
    own_student = add_user(session, "eleve.test.p-eds-6@example.com", "student", [group])
    other_student = add_user(session, "student.eval.other@example.com", "student", [other_group])
    token = token_for(client, teacher.email)

    own_response = client.get(f"/teacher/students/{own_student.id}/reports", headers=auth(token))
    other_response = client.get(f"/teacher/students/{other_student.id}/reports", headers=auth(token))

    assert own_response.status_code == 200
    assert own_response.json()[0]["evaluation_id"] == "eval1_second_degre"
    assert other_response.status_code == 404
