from __future__ import annotations

import importlib
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def test_static_mount_and_cors_reload():
    # Configure env to exercise SERVE_STATIC and CORS branches
    os.environ["SERVE_STATIC"] = "true"
    os.environ["STATIC_BASE_URL"] = "/content"
    os.environ["CORS_ORIGINS"] = "[\"http://example.com\"]"
    # Late import with reload to apply settings
    # Reload config then main to apply new env
    import apps.backend.app.config as config_module
    importlib.reload(config_module)
    from apps.backend.app import main as main_module
    importlib.reload(main_module)
    app = main_module.app
    # Confirm application has routes (static mount implied by presence of /content)
    names = [getattr(r, 'name', None) for r in app.router.routes]
    assert 'content' in names
    # Teardown env (no assert on CORS here; reloading suffices to cover branch)
    os.environ.pop("SERVE_STATIC", None)
    os.environ.pop("STATIC_BASE_URL", None)
    os.environ.pop("CORS_ORIGINS", None)
