from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from ..config import settings
from ..orm import User
from ..security import can_manage_group, shares_group_with, user_group_codes


EVALUATIONS = [
    {
        "id": "eval1_second_degre",
        "title": "Évaluation n°1 - Second degré",
        "group_code": "P-EDS-6",
        "subject": "EDS Maths",
        "chapter": "Second degré",
        "date": "2025-09-26",
        "json_path": "/EDS_premiere/Second_Degre/bilans_eval1_second_degre.json",
    }
]


def accessible_evaluations(user: User) -> list[dict[str, Any]]:
    if user.role == "admin":
        return EVALUATIONS.copy()
    if user.role == "teacher":
        return [item for item in EVALUATIONS if can_manage_group(user, item["group_code"])]
    groups = user_group_codes(user)
    return [item for item in EVALUATIONS if item["group_code"] in groups]


def get_accessible_evaluation(user: User, evaluation_id: str) -> dict[str, Any] | None:
    for item in accessible_evaluations(user):
        if item["id"] == evaluation_id:
            return item
    return None


@lru_cache(maxsize=8)
def load_reports(evaluation_id: str) -> list[dict[str, Any]]:
    evaluation = next((item for item in EVALUATIONS if item["id"] == evaluation_id), None)
    if not evaluation:
        return []
    path = settings.CONTENT_ROOT / str(evaluation["json_path"]).lstrip("/")
    if not Path(path).exists():
        return []
    with Path(path).open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return data if isinstance(data, list) else []


def report_for_student(evaluation_id: str, student: User) -> dict[str, Any] | None:
    email = student.email.strip().lower()
    for report in load_reports(evaluation_id):
        if str(report.get("email") or "").strip().lower() == email:
            return report
    return None


def own_report(user: User, evaluation_id: str) -> dict[str, Any] | None:
    evaluation = get_accessible_evaluation(user, evaluation_id)
    if not evaluation:
        return None
    return report_for_student(evaluation_id, user)


def reports_for_student(viewer: User, student: User) -> list[dict[str, Any]]:
    if student.role != "student" or not shares_group_with(viewer, student):
        return []
    reports: list[dict[str, Any]] = []
    for evaluation in accessible_evaluations(viewer):
        if evaluation["group_code"] not in user_group_codes(student):
            continue
        report = report_for_student(evaluation["id"], student)
        if report:
            enriched = {"evaluation_id": evaluation["id"], "evaluation_title": evaluation["title"], **report}
            reports.append(enriched)
    return reports
