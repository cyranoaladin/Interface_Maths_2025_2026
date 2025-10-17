from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure repo root is on sys.path for 'apps.backend.*' imports
REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def _load_app_components():
    """Import app modules lazily once the path is configured."""
    from apps.backend.app.main import app as fastapi_app
    from apps.backend.app.db import Base as db_base, get_db as db_get_db

    return fastapi_app, db_base, db_get_db


app, Base, get_db = _load_app_components()

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Fixture to override the get_db dependency and use the test database
def override_get_db():
    """Overrides the database dependency to use a test database session."""
    database = TestingSessionLocal()
    try:
        yield database
    finally:
        database.close()


# Apply the override to the app
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db_session():
    """
    Pytest fixture to create and tear down the test database for each test function.
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop all tables
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def test_client():
    """
    Pytest fixture to provide a TestClient for making API requests.
    """
    with TestClient(app) as client:
        yield client
