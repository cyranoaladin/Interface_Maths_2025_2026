from __future__ import annotations

from pydantic import BaseModel


class ResourcePublic(BaseModel):
    id: str
    title: str
    description: str | None = None
    type: str = "other"
    level: str | None = None
    subject: str | None = None
    chapter: str | None = None
    group_code: str | None = None
    visibility: str = "authenticated"
    url: str | None = None
    is_active: bool = True
