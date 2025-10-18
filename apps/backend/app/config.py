from __future__ import annotations
from pathlib import Path
import os
from typing import List
from pydantic_settings import BaseSettings


def _inner_repo_root() -> Path:
    # apps/backend/app/config.py → repo inner root at parents[3]
    here = Path(__file__).resolve()
    default_root = here.parents[3]
    env_root = os.getenv("REPO_ROOT")
    return Path(env_root).resolve() if env_root else default_root


INNER_REPO_ROOT = _inner_repo_root()


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "dev-local-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"
    # Use absolute SQLite path by default to be independent from CWD (pytest, uvicorn, etc.)
    DATABASE_URL: str = f"sqlite:////{(INNER_REPO_ROOT / 'apps/backend/data/app.db').as_posix()}"
    CORS_ORIGINS: List[str] = []
    SERVE_STATIC: bool = False
    # Absolute content root for predictable static mapping in dev/tests
    CONTENT_ROOT: Path = INNER_REPO_ROOT / "site"
    STATIC_BASE_URL: str = "/content"
    OUTPUTS_DIR: Path = INNER_REPO_ROOT / "apps/backend/outputs"
    TESTING: bool = False
    TEACHER_EMAILS: List[str] = ["alaeddine.benrhouma@ert.tn", "teacher.test@example.com"]
    # Mot de passe provisoire par défaut pour tous les élèves (peut être surchargé par env)
    DEFAULT_STUDENT_PASSWORD: str = "Maths2025!"


settings = Settings()
