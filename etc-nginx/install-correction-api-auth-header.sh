#!/usr/bin/env bash
set -euo pipefail

if [ -z "${ADMIN_API_TOKEN:-}" ]; then
  echo "ADMIN_API_TOKEN is required" >&2
  exit 2
fi

SNIPPET_DIR="${SNIPPET_DIR:-/etc/nginx/snippets}"
SNIPPET_FILE="${SNIPPET_FILE:-$SNIPPET_DIR/correction_api_auth_header.conf}"

install -d -m 0755 "$SNIPPET_DIR"
umask 077
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

printf 'proxy_set_header Authorization "Bearer %s";\n' "$ADMIN_API_TOKEN" > "$tmp"
install -m 0600 "$tmp" "$SNIPPET_FILE"

echo "Installed $SNIPPET_FILE"
