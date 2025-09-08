from __future__ import annotations

from pathlib import Path
from typing import List

from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings

# Load .env for local development (no secrets committed)
load_dotenv()


class Settings(BaseSettings):
    """Application settings.

    Values are read from environment variables. In dev, a .env file can be used.
    """

    # Content/static
    CONTENT_ROOT: Path | None = None
    STATIC_BASE_URL: str = "/content"
    SERVE_STATIC: bool = False
    CORS_ORIGINS: List[str] = []

    # Auth / DB
    SECRET_KEY: str | None = None
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str | None = None

    # Initial teacher provisioning
    TEACHER_EMAILS: List[str] = [
        # Non-secret default; can be overridden with env var
        "alaeddine.benrhouma@ert.tn",
    ]

    @field_validator("CONTENT_ROOT", mode="before")
    @classmethod
    def default_content_root(cls, v: str | Path | None) -> Path:
        if v:
            return Path(v)
        # Default to the public site root (site/) so URLs and content match deployment
        repo_root = Path(__file__).resolve().parents[3]
        return repo_root / "site"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def default_db_url(cls, v: str | None) -> str:
        if v:
            return v
        # Default SQLite database inside apps/backend/data/app.db
        repo_root = Path(__file__).resolve().parents[3]
        db_path = repo_root / "apps" / "backend" / "data" / "app.db"
        db_path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{db_path}"

    @field_validator("STATIC_BASE_URL")
    @classmethod
    def normalize_base_url(cls, v: str) -> str:
        if not v.startswith("/"):
            v = "/" + v
        return v.rstrip("/") or "/content"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_list(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v or []

    @field_validator("TEACHER_EMAILS", mode="before")
    @classmethod
    def split_teachers(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v or []


settings = Settings()

