#!/usr/bin/env bash
set -euo pipefail

# One-shot deployment script for Interface Maths (backend + frontend + DB bootstrap + services)
# Requirements on VPS: python3, node/npm, sudo (for systemd/nginx), nginx installed

PROJECT_ROOT="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$PROJECT_ROOT"

# Load env (if exists)
if [ -f .env.production ]; then
  set -a
  . ./.env.production
  set +a
fi

# Defaults
: "${DATABASE_URL:=sqlite:///$PROJECT_ROOT/apps/backend/data/app.db}"
: "${CONTENT_ROOT:=$PROJECT_ROOT/site}"
: "${STATIC_BASE_URL:=/content}"
: "${SERVE_STATIC:=false}"
: "${SECRET_KEY:=change-me-long-and-random}"
: "${TEACHER_EMAIL:=alaeddine.benrhouma@ert.tn}"
: "${TEACHER_PASSWORD:=secret}"
: "${API_PORT:=8000}"
: "${API_HOST:=127.0.0.1}"
: "${DOMAIN:=maths.example.com}"

echo "[1/7] Backend venv + requirements"
python3 -m venv apps/backend/.venv || true
. apps/backend/.venv/bin/activate
pip install -U pip
pip install -r apps/backend/requirements.txt

echo "[2/7] Frontend build"
pushd apps/frontend >/dev/null
npm ci || npm install
npm run build
popd >/dev/null
mkdir -p site/assets
rsync -a apps/frontend/dist/assets/ site/assets/ || true

echo "[3/7] Database bootstrap"
export DATABASE_URL CONTENT_ROOT STATIC_BASE_URL SERVE_STATIC SECRET_KEY
export TEACHER_EMAIL TEACHER_PASSWORD
python3 apps/backend/scripts/bootstrap_prod.py

echo "[4/7] Systemd service (interface-maths)"
SERVICE_UNIT="/etc/systemd/system/interface-maths.service"
SERVICE_CONTENT="[Unit]\nDescription=Interface Maths API\nAfter=network.target\n\n[Service]\nType=simple\nWorkingDirectory=$PROJECT_ROOT\nEnvironment=CONTENT_ROOT=$CONTENT_ROOT\nEnvironment=STATIC_BASE_URL=$STATIC_BASE_URL\nEnvironment=SERVE_STATIC=false\nEnvironment=DATABASE_URL=$DATABASE_URL\nEnvironment=SECRET_KEY=$SECRET_KEY\nExecStart=$PROJECT_ROOT/apps/backend/.venv/bin/uvicorn apps.backend.app.main:app --host $API_HOST --port $API_PORT --log-level info\nRestart=on-failure\nUser=www-data\nGroup=www-data\n\n[Install]\nWantedBy=multi-user.target\n"
if sudo -n true 2>/dev/null; then
  printf "%b" "$SERVICE_CONTENT" | sudo tee "$SERVICE_UNIT" >/dev/null
  sudo systemctl daemon-reload
  sudo systemctl enable interface-maths || true
  sudo systemctl restart interface-maths
else
  echo "! sudo indisponible: créez le service manuellement:\n$SERVICE_UNIT\n$SERVICE_CONTENT"
fi

echo "[5/7] Nginx vhost"
NGINX_CONF="/etc/nginx/sites-available/interface-maths.conf"
NGINX_CONTENT="server {\n  listen 80;\n  server_name $DOMAIN;\n\n  root $CONTENT_ROOT;\n  index index.html;\n\n  location /content/ {\n    alias $CONTENT_ROOT/;\n    try_files $uri $uri/ =404;\n  }\n\n  location /assets/ {\n    alias $CONTENT_ROOT/assets/;\n    try_files $uri $uri/ =404;\n  }\n\n  location /api/ {\n    proxy_pass http://$API_HOST:$API_PORT;\n    proxy_set_header Host $host;\n    proxy_set_header X-Forwarded-For $remote_addr;\n  }\n  location ~ ^/(auth|groups|testing|api/v1)/ {\n    proxy_pass http://$API_HOST:$API_PORT;\n    proxy_set_header Host $host;\n    proxy_set_header X-Forwarded-For $remote_addr;\n  }\n}\n"
if sudo -n true 2>/dev/null; then
  printf "%b" "$NGINX_CONTENT" | sudo tee "$NGINX_CONF" >/dev/null
  sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/interface-maths.conf
  sudo nginx -t
  sudo systemctl reload nginx
else
  echo "! sudo indisponible: vhost à installer manuellement:\n$NGINX_CONF\n$NGINX_CONTENT"
fi

echo "[6/7] Summary"
echo "API: http://$API_HOST:$API_PORT"
echo "Site (derrière Nginx): http://$DOMAIN/content/index.html"
echo "Login enseignant: $TEACHER_EMAIL / $TEACHER_PASSWORD"

echo "[7/7] Done."
