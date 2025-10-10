from __future__ import annotations

import sys
from pathlib import Path

# Ensure repo root is on sys.path for 'apps.backend.*' imports
REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
