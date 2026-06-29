#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> 1/5 Frontend build (Vite site)"
(
  cd site
  npm install
  npm run build
)

echo "==> 2/5 Unit tests (Vitest)"
npm run -s test:unit

echo "==> 3/5 Backend tests (pytest)"
if command -v docker >/dev/null 2>&1; then
  echo "Using Docker isolated Python environment for backend tests."
  docker run --rm \
    -v "$ROOT_DIR:/work" \
    -w /work \
    -e TESTING=1 \
    -e ALLOW_UNAUTHENTICATED_DEV=1 \
    python:3.11-slim \
    bash -lc "pip install -q -r apps/backend/requirements.txt && pytest -q apps/backend/tests tests/test_auth_routes.py tests/test_config.py tests/test_groups_api.py tests/test_security.py"
else
  echo "Docker not found, falling back to local .venv for backend tests."
  "${ROOT_DIR}/.venv/bin/python3" -m pytest -q \
    apps/backend/tests \
    tests/test_auth_routes.py tests/test_config.py tests/test_groups_api.py tests/test_security.py
fi

echo "==> 4/5 Playwright browser check"
npx playwright install chromium >/dev/null

echo "==> 5/5 E2E tests"
npm run test:e2e:local -- tests/e2e

echo "All checks passed."
