from __future__ import annotations

from pydantic import BaseModel


class EvaluationPublic(BaseModel):
    id: str
    title: str
    group_code: str
    subject: str | None = None
    chapter: str | None = None
    date: str | None = None
    json_path: str | None = None
