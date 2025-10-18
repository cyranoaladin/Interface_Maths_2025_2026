"""
Main FastAPI application file for the Maths Portal API.
"""
from __future__ import annotations

import os
import shutil
import time
from contextlib import suppress
from functools import lru_cache
from pathlib import Path
from typing import Callable

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from starlette.responses import FileResponse
from starlette.staticfiles import StaticFiles

from . import config, db, models, tree, users
from .routers import auth, compat, groups, testing

app = FastAPI(title="Maths Portal API")
# Optional JSON access logs
JSON_LOGS = os.getenv("JSON_LOGS", "0") == "1"
if JSON_LOGS:

    @app.middleware("http")
    async def json_access_logger(
        request: Request, call_next: Callable[[Request], Response]
    ) -> Response:
        """Adds a JSON access logger middleware."""
        started_at = time.perf_counter()
        response: Response | None = None
        try:
            response = await call_next(request)
            return response
        finally:
            with suppress(Exception):
                duration_ms = int((time.perf_counter() - started_at) * 1000)
                log_item = {
                    "ts": int(time.time()),
                    "method": request.method,
                    "path": request.url.path,
                    "status": getattr(response, "status_code", None),
                    "duration_ms": duration_ms,
                    "client_ip": request.client.host if request.client else None,
                }
                print(log_item)


# Routers
app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(testing.router)
app.include_router(compat.router)

# CORS (optional)
if config.settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Optional static serving for development only
if config.settings.SERVE_STATIC:
    CONTENT_ROOT_PATH = str(config.settings.CONTENT_ROOT)
    # Serve site both at /content and at root for compatibility
    app.mount(
        config.settings.STATIC_BASE_URL,
        StaticFiles(directory=CONTENT_ROOT_PATH, html=True),
        name="content",
    )
    app.mount(
        "/", StaticFiles(directory=CONTENT_ROOT_PATH, html=True), name="root-content"
    )
    # Also expose absolute /assets and /content/assets
    ASSETS_DIR = str(Path(CONTENT_ROOT_PATH) / "assets")
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
    app.mount(
        str(Path(config.settings.STATIC_BASE_URL) / "assets"),
        StaticFiles(directory=ASSETS_DIR),
        name="content-assets",
    )

    # Serve favicon to avoid 403 noise
    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        """Serves the favicon."""
        path = Path(CONTENT_ROOT_PATH) / "favicon.ico"
        if path.is_file():
            return FileResponse(path)
        # Fallback to SVG icon if available
        svg = Path(CONTENT_ROOT_PATH) / "assets" / "img" / "icon.svg"
        if svg.is_file():
            return FileResponse(svg)
        raise HTTPException(status_code=404, detail="Not found")

    # Service Worker and manifest at absolute paths
    @app.get("/sw.js", include_in_schema=False)
    async def sw():
        """Serves the service worker."""
        path = Path(CONTENT_ROOT_PATH) / "sw.js"
        if path.is_file():
            return FileResponse(path)
        raise HTTPException(status_code=404, detail="Not found")

    @app.get("/manifest.webmanifest", include_in_schema=False)
    async def manifest():
        """Serves the web manifest."""
        path = Path(CONTENT_ROOT_PATH) / "manifest.webmanifest"
        if path.is_file():
            return FileResponse(path)
        raise HTTPException(status_code=404, detail="Not found")


@app.on_event("startup")
async def on_startup_create_schema_and_bootstrap():
    """
    On startup:
    1. Ensures the database schema is created.
    2. Optionally bootstraps default user groups.
    3. Ensures a favicon exists to avoid 404s.
    """
    with suppress(Exception):
        db.Base.metadata.create_all(bind=db.engine)

    # Optional: auto-bootstrap groups in production when AUTO_BOOTSTRAP=1
    if os.getenv("AUTO_BOOTSTRAP") == "1":
        with Session(bind=db.engine) as session:
            defaults = [
                ("T-EDS-3", "Terminale EDS Maths — Groupe 3"),
                ("P-EDS-6", "Première EDS Maths — Groupe 6"),
                ("MX-1", "Maths expertes — Groupe 1"),
            ]
            for code, name in defaults:
                g = session.query(users.Group).filter_by(code=code).one_or_none()
                if not g:
                    session.add(users.Group(code=code, name=name))
            session.commit()

    # Ensure favicon exists at site root to avoid 404 from StaticFiles mounts
    with suppress(Exception):
        root_dir = Path(str(config.settings.CONTENT_ROOT))
        ico = root_dir / "favicon.ico"
        if not ico.is_file():
            svg = root_dir / "assets" / "img" / "icon.svg"
            if svg.is_file():
                shutil.copyfile(svg, ico)


@lru_cache(maxsize=1)
def get_full_tree_cached() -> models.DirNode:
    """Returns a cached directory tree of the content root."""
    content_root_str = str(config.settings.CONTENT_ROOT)
    if not Path(content_root_str).is_dir():
        raise RuntimeError(f"CONTENT_ROOT invalid: {content_root_str}")
    return tree.build_tree(content_root_str)


@app.get("/", include_in_schema=False)
async def read_root():
    """Returns a welcome message."""
    return {
        "message": "Bienvenue sur l’API Maths Portal",
        "content_root": str(config.settings.CONTENT_ROOT),
    }


@app.get("/api/version", include_in_schema=False)
def api_version():
    """Returns application version information."""
    return {
        "name": "maths-portal",
        "version": os.getenv("APP_VERSION", "unknown"),
        "commit": os.getenv("APP_COMMIT", "unknown"),
        "build_time": os.getenv("APP_BUILD_TIME", "unknown"),
    }


@app.get("/api/tree", response_model=models.DirNode)
async def api_tree():
    """Returns the full directory tree."""
    try:
        return get_full_tree_cached()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/api/tree/{subpath:path}", response_model=models.DirNode)
async def api_subtree(subpath: str):
    """Returns a subtree for a given subpath."""
    safe_subpath = Path(subpath).as_posix().lstrip("/")  # normalize
    content_root = Path(config.settings.CONTENT_ROOT)
    abs_dir = (content_root / safe_subpath).resolve()
    try:
        abs_dir.relative_to(content_root.resolve())  # prevent path traversal
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Chemin invalide") from exc
    if not abs_dir.is_dir():
        raise HTTPException(status_code=404, detail="Dossier introuvable")
    rel = abs_dir.relative_to(content_root).as_posix()
    return tree.build_tree(str(content_root), rel)
