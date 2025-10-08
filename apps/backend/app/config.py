from __future__ import annotations

from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings

# Charge le .env en développement
load_dotenv()


class Settings(BaseSettings):
    CONTENT_ROOT: Optional[Path] = None
    STATIC_BASE_URL: str = "/content"
    SERVE_STATIC: bool = False
    CORS_ORIGINS: List[str] = []

    SECRET_KEY: Optional[str] = None
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: Optional[str] = None

    OUTPUTS_DIR: Optional[Path] = None
    TEACHER_EMAILS: List[str] = ["alaeddine.benrhouma@ert.tn"]

    @field_validator("CONTENT_ROOT", mode="before")
    @classmethod
    def default_content_root(cls, v: str | Path | None) -> Path:
        if v:
            return Path(v)
        repo_root = Path(__file__).resolve().parents[3]
        return repo_root / "site"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def default_db_url(cls, v: str | None) -> str:
        if v:
            return v
        repo_root = Path(__file__).resolve().parents[3]
        db_path = repo_root / "apps" / "backend" / "data" / "app.db"
        db_path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{db_path}"

    @field_validator("OUTPUTS_DIR", mode="before")
    @classmethod
    def default_outputs_dir(cls, v: str | Path | None) -> Path:
        if v:
            return Path(v)
        repo_root = Path(__file__).resolve().parents[3]
        return repo_root / "apps" / "backend" / "outputs"


settings = Settings()
