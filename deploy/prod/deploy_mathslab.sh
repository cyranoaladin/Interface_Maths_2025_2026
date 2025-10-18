#!/usr/bin/env bash
set -euo pipefail

# Zero‑downtime deploy for maths.labomaths.tn
# Strategy: build release tarball locally, upload to VPS, unpack to a new
# release dir with timestamp, install deps, run DB migrations/seed if needed,
# switch Nginx root (or systemd service symlink) via atomic symlink swap, and
# reload Nginx. Previous release kept for quick rollback.

APP_NAME=maths_portal
DOMAIN=maths.labomaths.tn
REMOTE=${REMOTE:-"root@${DOMAIN}"}
BASE_DIR=${BASE_DIR:-"/var/www/${APP_NAME}"}
RELEASES_DIR="$BASE_DIR/releases"
CURRENT_LINK="$BASE_DIR/current"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REL="$RELEASES_DIR/$TIMESTAMP"

# 1) Build local release (static + backend)
ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
pushd "$ROOT" >/dev/null

echo "==> Packaging release"
ARTIFACT="/tmp/${APP_NAME}-${TIMESTAMP}.tar.gz"
# Nous sommes dans $ROOT (= Interface_Maths_2025_2026). Utiliser des chemins relatifs.
tar --exclude-vcs -czf "$ARTIFACT" \
  apps/backend \
  site \
  deploy \
  README.md

# 2) Upload
echo "==> Uploading to $REMOTE"
ssh "$REMOTE" "mkdir -p '$RELEASES_DIR'"
scp "$ARTIFACT" "$REMOTE:/tmp/"

# 3) Remote prepare
ssh "$REMOTE" bash -s <<EOF
set -euo pipefail
APP_NAME="$APP_NAME"
TIMESTAMP="$TIMESTAMP"
RELEASES_DIR="$RELEASES_DIR"
REL="$REL"
CURRENT_LINK="$CURRENT_LINK"
ART="/tmp/${APP_NAME}-${TIMESTAMP}.tar.gz"

mkdir -p "\$RELEASES_DIR" "\$REL"
tar -xzf "\$ART" -C "\$REL" --strip-components=0

# Backend venv + deps
cd "\$REL/apps/backend"
python3 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Seed/migrations (idempotent)
export SERVE_STATIC=1
export AUTO_BOOTSTRAP=1
export TEACHER_EMAIL="${TEACHER_EMAIL:-teacher@example.com}"
export TEACHER_PASSWORD="${TEACHER_PASSWORD:-changeit}"
python3 scripts/bootstrap_prod.py || true

# Bascule atomique du lien courant
ln -sfn "\$REL" "\$CURRENT_LINK"

# Recharger Nginx si présent
nginx -t && systemctl reload nginx || true

echo "Release ready: \$REL"
EOF

echo "==> Done. Current -> $TIMESTAMP"
popd >/dev/null
