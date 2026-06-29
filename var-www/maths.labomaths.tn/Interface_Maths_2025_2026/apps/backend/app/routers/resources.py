from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException

from ..orm import User
from ..schemas.resources import ResourcePublic
from ..security import get_current_user
from ..services.resource_access import get_resource_for_user, resources_for_user


router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("/my", response_model=List[ResourcePublic])
async def my_resources(current_user: User = Depends(get_current_user)):
    return resources_for_user(current_user)


@router.get("/{resource_id}", response_model=ResourcePublic)
async def resource_detail(resource_id: str, current_user: User = Depends(get_current_user)):
    resource = get_resource_for_user(current_user, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource
