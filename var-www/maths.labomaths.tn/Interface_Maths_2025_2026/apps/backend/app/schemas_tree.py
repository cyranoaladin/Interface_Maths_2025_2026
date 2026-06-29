from __future__ import annotations

from typing import List, Literal, Optional, Union

from pydantic import BaseModel


class FileNode(BaseModel):
    type: Literal["file"] = "file"
    name: str
    path: str  # relative path from CONTENT_ROOT
    url: str   # public URL (served by Nginx or FastAPI in dev)
    title: Optional[str] = None


class DirNode(BaseModel):
    type: Literal["dir"] = "dir"
    name: str
    path: str  # relative path from CONTENT_ROOT
    children: List[Union["DirNode", FileNode]]


# Rebuild model to resolve forward refs (Pydantic v2)
DirNode.model_rebuild()
