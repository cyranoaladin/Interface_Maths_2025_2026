from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure the project root (containing the "apps" package) is importable when
# running tests from this directory.
REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from apps.backend.app.db import Base, get_db
from apps.backend.app.main import app


@pytest.fixture()
def test_database(tmp_path):
    """Provide an isolated SQLite file database for API tests."""
    db_path = tmp_path / "test_api.db"
    engine = create_engine(
        f"sqlite:///{db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    try:
        yield {
            "engine": engine,
            "session_factory": session_factory,
        }
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(test_database):
    session_factory = test_database["session_factory"]

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture()
def session(test_database):
    db = test_database["session_factory"]()
    try:
        yield db
    finally:
        db.close()
