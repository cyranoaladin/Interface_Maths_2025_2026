#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8008}"
PYTHON_BIN="${PYTHON_BIN:-$ROOT_DIR/.venv/bin/python3}"
API_LOG="${API_LOG:-/tmp/interface-maths-e2e-api.log}"

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "Python introuvable: $PYTHON_BIN"
  echo "Définir PYTHON_BIN ou créer le venv projet (.venv)."
  exit 1
fi

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Démarrage API de test sur http://$HOST:$PORT ..."
PLAYWRIGHT_SKIP_WEB_SERVER=1 TESTING=1 SERVE_STATIC=1 \
  "$PYTHON_BIN" -m uvicorn apps.backend.app.main:app \
  --host "$HOST" --port "$PORT" >"$API_LOG" 2>&1 &
API_PID="$!"

ready=0
for _ in $(seq 1 90); do
  if curl -fsS "http://$HOST:$PORT/api/v1/ping" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" -ne 1 ]]; then
  echo "API non disponible après attente. Logs:"
  tail -n 120 "$API_LOG" || true
  exit 1
fi

echo "API prête. Lancement Playwright..."
PLAYWRIGHT_SKIP_WEB_SERVER=1 npm run test:e2e -- "$@"
