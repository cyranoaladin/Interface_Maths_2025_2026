from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"
    DATABASE_URL: str
    CORS_ORIGINS: List[str] = []
    SERVE_STATIC: bool = False
    CONTENT_ROOT: str = "/site"
    STATIC_BASE_URL: str = "/content"
    OUTPUTS_DIR: str = "/outputs"
    TESTING: bool = False

settings = Settings()
