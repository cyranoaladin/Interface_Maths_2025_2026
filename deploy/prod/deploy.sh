#!/usr/bin/env bash
set -euo pipefail

# Configurable vars
VPS_HOST=${VPS_HOST:-root@46.202.171.14}
VPS_VHOST_PATH=/etc/nginx/sites-available/maths.labomaths.tn
VPS_VHOST_LINK=/etc/nginx/sites-enabled/maths.labomaths.tn
VPS_WEBROOT=/var/www/maths
VPS_APP_DIR=/opt/maths_portal

# Paths relative to repo root (deploy/prod → repo is two levels up)
REPO_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
SITE_DIR="$REPO_ROOT/site"
COMPOSE_FILE="$REPO_ROOT/deploy/prod/docker-compose.prod.yml"
NGINX_FILE="$REPO_ROOT/deploy/prod/nginx.maths.labomaths.tn.conf"

echo "[1/3] Sync static site → $VPS_HOST:$VPS_WEBROOT"
rsync -avz --delete "$SITE_DIR/" "$VPS_HOST:$VPS_WEBROOT/"

echo "[2/3] Deploy backend compose → $VPS_HOST:$VPS_APP_DIR"
ssh "$VPS_HOST" "mkdir -p $VPS_APP_DIR"
# Upload compose + backend sources in expected structure
scp "$COMPOSE_FILE" "$VPS_HOST:$VPS_APP_DIR/docker-compose.yml"
rsync -avz "$REPO_ROOT/Interface_Maths_2025_2026/apps/backend/" "$VPS_HOST:$VPS_APP_DIR/backend/"
scp "$REPO_ROOT/deploy/prod/Dockerfile.backend" "$VPS_HOST:$VPS_APP_DIR/Dockerfile.backend"
ssh "$VPS_HOST" "cd $VPS_APP_DIR && docker compose up -d --build && docker compose ps"

echo "[3/3] Install Nginx vhost and reload"
scp "$NGINX_FILE" "$VPS_HOST:$VPS_VHOST_PATH"
ssh "$VPS_HOST" "ln -sf $VPS_VHOST_PATH $VPS_VHOST_LINK && nginx -t && systemctl reload nginx"

echo "Done. Quick checks:"
echo "  curl -I https://maths.labomaths.tn/"
echo "  curl -I https://maths.labomaths.tn/content/index.html"
echo "  curl -s -o /dev/null -w '%{http_code}\\n' https://maths.labomaths.tn/api/v1/ping"
