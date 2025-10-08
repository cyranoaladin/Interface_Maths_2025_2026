#!/usr/bin/env bash
set -euo pipefail

echo "==> Pull"
cd /opt/interface_maths
git pull --ff-only

echo "==> Build (no cache)"
docker build --no-cache -t interface-maths/backend:prod -f deploy/prod/Dockerfile.backend .

echo "==> Restart"
docker rm -f maths_backend 2>/dev/null || true
docker network inspect infra_nsi_network >/dev/null 2>&1 || docker network create infra_nsi_network >/dev/null
docker run -d --name maths_backend \
  --network infra_nsi_network \
  -p 127.0.0.1:8001:8000 \
  -v /var/www/maths:/site:ro \
  -v /opt/maths_outputs:/outputs \
  -e DATABASE_URL="postgresql+psycopg://nsi:7c9e3a5f1b2d4c6e8a0f3b5d7e9c1a2f@infra-postgres-1:5432/nsi" \
  -e CORS_ORIGINS='["https://maths.labomaths.tn"]' \
  -e SERVE_STATIC="false" \
  -e CONTENT_ROOT="/site" \
  -e SECRET_KEY="$(openssl rand -hex 32)" \
  interface-maths/backend:prod

echo "==> Wait health"
for i in {1..10}; do
  s=$(docker inspect --format '{{.State.Health.Status}}' maths_backend 2>/dev/null || echo "missing")
  echo "   - $s"
  [ "$s" = "healthy" ] && break
  sleep 2
done

echo "==> Smoke"
/opt/interface_maths/scripts/smoke.sh

echo "==> Restart policy"
docker update --restart unless-stopped maths_backend >/dev/null

echo "✅ Deploy OK"
