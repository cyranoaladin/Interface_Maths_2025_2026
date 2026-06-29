from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from ..config import settings
from ..orm import User
from ..security import user_group_codes


MANIFEST_PATH = settings.CONTENT_ROOT / "assets/data/resources.json"


@lru_cache(maxsize=1)
def load_resource_manifest() -> list[dict[str, Any]]:
    if not Path(MANIFEST_PATH).exists():
        return []
    with Path(MANIFEST_PATH).open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, dict) and item.get("is_active", True)]


def can_access_resource(user: User, resource: dict[str, Any]) -> bool:
    visibility = str(resource.get("visibility") or "authenticated")
    group_code = resource.get("group_code")
    if user.role == "admin":
        return True
    if visibility in {"public", "authenticated"}:
        return True
    if visibility == "teacher":
        return user.role == "teacher"
    if visibility == "admin":
        return False
    if visibility == "group":
        return bool(group_code and group_code in user_group_codes(user))
    return False


def resources_for_user(user: User) -> list[dict[str, Any]]:
    return [resource for resource in load_resource_manifest() if can_access_resource(user, resource)]


def get_resource_for_user(user: User, resource_id: str) -> dict[str, Any] | None:
    for resource in load_resource_manifest():
        if resource.get("id") == resource_id and can_access_resource(user, resource):
            return resource
    return None
