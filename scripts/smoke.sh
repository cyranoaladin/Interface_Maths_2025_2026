#!/usr/bin/env bash
set -euo pipefail

HOST="http://127.0.0.1:8001"

echo "[1/3] /api/v1/ping"
curl -fsS "${HOST}/api/v1/ping" | jq -e '.ok == true' >/dev/null
echo "  OK"

echo "[2/3] /openapi.json (JSON valide)"
curl -fsS "${HOST}/openapi.json" -o /tmp/openapi.json
jq -e '.openapi and .info and .paths' /tmp/openapi.json >/dev/null
echo "  OK"

echo "[3/3] /groups/ sans jeton -> 401 attendu"
code=$(curl -s -o /dev/null -w "%{http_code}" "${HOST}/groups/")
test "$code" = "401"
echo "  OK (401)"

echo "✅ Smoke tests: OK"
