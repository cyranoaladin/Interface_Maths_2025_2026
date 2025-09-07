from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from .config import settings
from .models import DirNode
from .tree import build_tree

app = FastAPI(title="Maths Portal API")

# CORS (optional)
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Optional static serving for development only
if settings.SERVE_STATIC:
    content_root = str(settings.CONTENT_ROOT)
    app.mount(settings.STATIC_BASE_URL, StaticFiles(directory=content_root), name="content")


@lru_cache(maxsize=1)
def get_full_tree_cached() -> DirNode:
    root = str(settings.CONTENT_ROOT)
    if not Path(root).is_dir():
        raise RuntimeError(f"CONTENT_ROOT invalid: {root}")
    return build_tree(root)


@app.get("/", include_in_schema=False)
async def root():
    return {"message": "Bienvenue sur l’API Maths Portal", "content_root": str(settings.CONTENT_ROOT)}


@app.get("/api/tree", response_model=DirNode)
async def api_tree():
    try:
        return get_full_tree_cached()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tree/{subpath:path}", response_model=DirNode)
async def api_subtree(subpath: str):
    safe = Path(subpath).as_posix().lstrip("/")  # normalize
    root = Path(settings.CONTENT_ROOT)
    abs_dir = (root / safe).resolve()
    try:
        abs_dir.relative_to(root.resolve())  # prevent path traversal
    except Exception:
        raise HTTPException(status_code=400, detail="Chemin invalide")
    if not abs_dir.is_dir():
        raise HTTPException(status_code=404, detail="Dossier introuvable")
    rel = abs_dir.relative_to(root).as_posix()
    return build_tree(str(root), rel)

