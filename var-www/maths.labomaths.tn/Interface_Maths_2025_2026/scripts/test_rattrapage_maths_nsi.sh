#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${PORT:-8877}"
BASE_URL="http://127.0.0.1:${PORT}/"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

node tests/rattrapage_maths_nsi/unit/static.test.cjs

python3 -m http.server "$PORT" --directory site/rattrapage_maths_nsi >/tmp/rattrapage_maths_nsi_http_${PORT}.log 2>&1 &
SERVER_PID="$!"

python3 - <<PY
import socket, time
deadline = time.time() + 10
while time.time() < deadline:
    with socket.socket() as sock:
        try:
            sock.connect(("127.0.0.1", $PORT))
        except OSError:
            time.sleep(0.1)
        else:
            raise SystemExit(0)
raise SystemExit("serveur local indisponible sur le port $PORT")
PY

TARGET_URL="$BASE_URL" node tests/rattrapage_maths_nsi/e2e/portal.e2e.cjs
TARGET_URL="$BASE_URL" node tests/rattrapage_maths_nsi/e2e/auto-bilan.e2e.cjs

echo "All tests OK"
