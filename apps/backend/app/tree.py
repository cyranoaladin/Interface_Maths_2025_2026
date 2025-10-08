from __future__ import annotations

import os
from typing import List, Union

from .config import settings
from .models import DirNode, FileNode


def _is_hidden(name: str) -> bool:
    return name.startswith(".") or name.startswith("_")


def _read_title_if_any(abs_path: str) -> str | None:
    try:
        with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
            head = f.read(4096)
        low = head.lower()
        start = low.find("<title>")
        end = low.find("</title>")
        if 0 <= start < end:
            return head[start + 7:end].strip()
    except Exception:
        pass
    return None


def _node_for_file(root: str, abs_path: str) -> FileNode:
    rel_path = os.path.relpath(abs_path, root).replace(os.sep, "/")
    return FileNode(
        name=os.path.basename(abs_path),
        path=rel_path,
        url=f"{settings.STATIC_BASE_URL}/{rel_path}",
        title=_read_title_if_any(abs_path),
    )


def build_tree(root: str, rel_path: str = "") -> DirNode:
    abs_dir = os.path.join(root, rel_path)
    name = os.path.basename(abs_dir) if rel_path else os.path.basename(root.rstrip(os.sep))
    children: List[Union[DirNode, FileNode]] = []

    with os.scandir(abs_dir) as it:
        dirs, files = [], []
        for entry in it:
            if _is_hidden(entry.name):
                continue
            if entry.is_dir(follow_symlinks=False):
                dirs.append(entry.name)
            elif entry.is_file(follow_symlinks=False):
                files.append(entry.name)

    dirs.sort()
    files.sort()

    for d in dirs:
        child_rel = os.path.join(rel_path, d) if rel_path else d
        children.append(build_tree(root, child_rel))

    for f in files:
        ext = os.path.splitext(f)[1].lower()
        if ext in {".html", ".htm"}:
            abs_file = os.path.join(abs_dir, f)
            children.append(_node_for_file(root, abs_file))

    return DirNode(type="dir", name=name, path=rel_path.replace(os.sep, "/"), children=children)
