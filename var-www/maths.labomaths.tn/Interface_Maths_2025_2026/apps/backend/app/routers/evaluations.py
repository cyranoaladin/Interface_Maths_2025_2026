from __future__ import annotations

from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..orm import User
from ..schemas.evaluations import EvaluationPublic
from ..security import can_manage_group, get_current_user, require_teacher
from ..services.evaluation_service import (
    accessible_evaluations,
    own_report,
    reports_for_student,
)


router = APIRouter(tags=["evaluations"])


@router.get("/evaluations/my", response_model=List[EvaluationPublic])
async def my_evaluations(current_user: User = Depends(get_current_user)):
    return accessible_evaluations(current_user)


@router.get("/evaluations/{evaluation_id}/my-report")
async def my_report(evaluation_id: str, current_user: User = Depends(get_current_user)):
    report = own_report(current_user, evaluation_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/teacher/groups/{code}/evaluations", response_model=List[EvaluationPublic])
async def teacher_group_evaluations(code: str, current_user: User = Depends(require_teacher)):
    if not can_manage_group(current_user, code):
        raise HTTPException(status_code=404, detail="Group not found")
    return [item for item in accessible_evaluations(current_user) if item["group_code"] == code]


@router.get("/teacher/students/{student_id}/reports")
async def teacher_student_reports(
    student_id: int,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    student = db.get(User, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    reports = reports_for_student(current_user, student)
    if not reports:
        raise HTTPException(status_code=404, detail="Report not found")
    return reports
