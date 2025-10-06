from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.responses import FileResponse

from .config import settings
from .db import Base, engine
from .users import Group
import os
from .models import DirNode
from .tree import build_tree
from .routers.auth import router as auth_router
from .routers.groups import router as groups_router
from .routers.testing import router as testing_router
from .routers.compat import router as compat_router

app = FastAPI(title="Maths Portal API")

# Routers
app.include_router(auth_router)
app.include_router(groups_router)
app.include_router(testing_router)
app.include_router(compat_router)

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
    # Also expose absolute /assets for pages that reference absolute paths
    app.mount("/assets", StaticFiles(directory=str(Path(content_root) / "assets")), name="assets")

    # Serve favicon to avoid 403 noise
    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        # Prefer site/favicon.ico if exists, else return 404
        path = Path(content_root) / "favicon.ico"
        if path.is_file():
            return FileResponse(path)
        # Fallback to SVG icon if available
        svg = Path(content_root) / "assets" / "img" / "icon.svg"
        if svg.is_file():
            return FileResponse(svg)
        raise HTTPException(status_code=404, detail="Not found")

    # Service Worker and manifest at absolute paths
    @app.get("/sw.js", include_in_schema=False)
    async def sw():
        path = Path(content_root) / "sw.js"
        if path.is_file():
            return FileResponse(path)
        raise HTTPException(status_code=404, detail="Not found")

    @app.get("/manifest.webmanifest", include_in_schema=False)
    async def manifest():
        path = Path(content_root) / "manifest.webmanifest"
        if path.is_file():
            return FileResponse(path)
        raise HTTPException(status_code=404, detail="Not found")


@app.on_event("startup")
async def on_startup_create_schema_and_bootstrap():
    # Always ensure schema exists (no-op if already created)
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    # Optional: auto-bootstrap groups in production when AUTO_BOOTSTRAP=1
    if os.getenv("AUTO_BOOTSTRAP") == "1":
        from sqlalchemy.orm import Session
        from .users import Group
        with Session(bind=engine) as db:
            defaults = [
                ("T-EDS-3", "Terminale EDS Maths — Groupe 3"),
                ("P-EDS-6", "Première EDS Maths — Groupe 6"),
                ("MX-1", "Maths expertes — Groupe 1"),
            ]
            for code, name in defaults:
                g = db.query(Group).filter_by(code=code).one_or_none()
                if not g:
                    db.add(Group(code=code, name=name))
            db.commit()

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
