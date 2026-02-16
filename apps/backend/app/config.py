from __future__ import annotations
from pathlib import Path
import os
from typing import List
from pydantic_settings import BaseSettings


def _inner_repo_root() -> Path:
    # apps/backend/app/config.py → repo inner root at parents[3]
    here = Path(__file__).resolve()
    env_root = os.getenv("REPO_ROOT")
    if env_root:
        return Path(env_root).resolve()

    def candidate_score(parent: Path) -> int:
        weights = {
            "package.json": 6,
            "pyproject.toml": 5,
            "site": 4,
            "apps": 3,
            "deploy": 2,
            "scripts": 1,
        }
        score = 0
        for name, weight in weights.items():
            if (parent / name).exists():
                score += weight
        return score

    best_parent: Path | None = None
    best_score = -1
    for parent in here.parents:
        score = candidate_score(parent)
        if score > best_score or (score == best_score and best_parent and len(parent.parts) < len(best_parent.parts)):
            best_parent = parent
            best_score = score

    if best_parent and best_score > 0:
        return best_parent

    # Fall back to the nearest sensible parent (typically the project module root).
    parents = list(here.parents)
    if not parents:
        return here.parent
    fallback_index = 1 if len(parents) > 1 else 0
    return parents[fallback_index]


INNER_REPO_ROOT = _inner_repo_root()


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"
    # Use absolute SQLite path by default to be independent from CWD (pytest, uvicorn, etc.)
    DATABASE_URL: str = f"sqlite:////{(INNER_REPO_ROOT / 'apps/backend/data/app.db').as_posix()}"
    CORS_ORIGINS: List[str] = []
    SERVE_STATIC: bool = False
    # Absolute content root for predictable static mapping in dev/tests
    CONTENT_ROOT: Path = INNER_REPO_ROOT / "apps/legacy-site"
    STATIC_BASE_URL: str = "/content"
    OUTPUTS_DIR: Path = INNER_REPO_ROOT / "apps/backend/outputs"
    TESTING: bool = False
    TEACHER_EMAILS: List[str] = ["alaeddine.benrhouma@ert.tn", "teacher.test@example.com"]
    # Development / test can set this to keep deterministic first-login flows.
    DEFAULT_STUDENT_PASSWORD: str = ""
    APP_ENV: str = "development"


settings = Settings()
