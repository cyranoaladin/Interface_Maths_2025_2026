from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Add the project root so "apps.backend" imports resolve when pytest collects
# this nested test suite.
REPO_ROOT = Path(__file__).resolve().parents[4]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from apps.backend.app.main import app


@pytest.fixture(autouse=True)
def _restore_dependency_overrides():
    """Preserve FastAPI dependency overrides across tests."""
    original_overrides = dict(app.dependency_overrides)
    try:
        yield
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(original_overrides)
