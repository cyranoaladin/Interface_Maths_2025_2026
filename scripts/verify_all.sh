#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> 1/6 CSS build (legacy site)"
npm run -s css:build

echo "==> 2/6 Frontend build (Vue)"
(
  cd apps/frontend
  npm run -s build
)

echo "==> 3/6 Unit tests (Vitest)"
npm run -s test:unit

echo "==> 4/6 Backend tests (pytest)"
if command -v docker >/dev/null 2>&1; then
  echo "Using Docker isolated Python environment for backend tests."
  docker run --rm \
    -v "$ROOT_DIR:/work" \
    -w /work \
    python:3.11-slim \
    bash -lc "pip install -q -r apps/backend/requirements.txt && TESTING=1 pytest -q apps/backend/tests tests/test_auth_routes.py tests/test_config.py tests/test_groups_api.py tests/test_security.py"
else
  echo "Docker not found, falling back to local .venv for backend tests."
  TESTING=1 "${ROOT_DIR}/.venv/bin/python3" -m pytest -q \
    apps/backend/tests \
    tests/test_auth_routes.py tests/test_config.py tests/test_groups_api.py tests/test_security.py
fi

echo "==> 5/6 Playwright browser check"
npx playwright install chromium >/dev/null

echo "==> 6/6 E2E tests"
npm run test:e2e:local -- tests/e2e

echo "All checks passed."
