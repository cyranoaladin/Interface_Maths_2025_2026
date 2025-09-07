from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings

# Load .env for local development (no secrets committed)
load_dotenv()


class Settings(BaseSettings):
    """Application settings.

    Values are read from environment variables. In dev, a .env file can be used.
    """

    CONTENT_ROOT: Path | None = None
    STATIC_BASE_URL: str = "/content"
    SERVE_STATIC: bool = False
    CORS_ORIGINS: List[str] = []

    @field_validator("CONTENT_ROOT", mode="before")
    @classmethod
    def default_content_root(cls, v: Optional[str | Path]) -> Path:
        if v:
            return Path(v)
        # Compute repo root from this file location: apps/backend/app/config.py -> repo root is 3 parents up
        repo_root = Path(__file__).resolve().parents[3]
        return repo_root

    @field_validator("STATIC_BASE_URL")
    @classmethod
    def normalize_base_url(cls, v: str) -> str:
        if not v.startswith("/"):
            v = "/" + v
        return v.rstrip("/") or "/content"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_cors(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v or []


settings = Settings()

