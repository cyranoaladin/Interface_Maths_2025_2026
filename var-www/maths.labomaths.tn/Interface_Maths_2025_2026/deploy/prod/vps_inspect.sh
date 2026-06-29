#!/usr/bin/env bash
set -euo pipefail

# VPS Inspector — multi-domain Linux host (Debian/Ubuntu)
# Outputs a JSON and a human report about: OS, CPU/RAM/Disk, Network, DNS hints,
# open ports/listening services, firewall, processes, Nginx sites, SSL certs,
# systemd services (uvicorn/gunicorn/nginx), timers, journald logs, crontab,
# fail2ban, docker, node/python versions, and deployment directories.

OUT_DIR=${OUT_DIR:-"$(pwd)/vps_audit"}
mkdir -p "$OUT_DIR"
TS=$(date +%Y%m%d-%H%M%S)
JSON="$OUT_DIR/report-$TS.json"
TXT="$OUT_DIR/report-$TS.txt"

echo "Writing: $JSON and $TXT"

json_kv() { printf '  "%s": %s,\n' "$1" "$2"; }
json_str() { printf '  "%s": "%s",\n' "$1" "$2" | sed 's/\\/\\\\/g;s/"/\\"/g'; }

collect_cmd() {
  local title="$1"; shift
  echo "## $title" >> "$TXT"
  { "$@" 2>&1 || true; } | sed 's/\t/    /g' >> "$TXT"
  echo >> "$TXT"
}

echo '{' > "$JSON"

# OS / host
HOSTNAME=$(hostname)
OS=$(grep PRETTY_NAME /etc/os-release | cut -d= -f2- | tr -d '"')
KERNEL=$(uname -r)
UPTIME=$(uptime -p || true)
json_str hostname "$HOSTNAME" >> "$JSON"
json_str os "$OS" >> "$JSON"
json_str kernel "$KERNEL" >> "$JSON"
json_str uptime "$UPTIME" >> "$JSON"

# CPU/RAM/Disk
collect_cmd "CPU" lscpu
collect_cmd "MEMORY" sh -c 'free -h || vm_stat || true'
collect_cmd "DISKS" lsblk -f
DISK_FREE=$(df -hP / | tail -1 | awk '{print $4}')
json_str disk_free_root "$DISK_FREE" >> "$JSON"

# Network
collect_cmd "INTERFACES" ip -br a
collect_cmd "ROUTES" ip r
collect_cmd "LISTENING PORTS" sh -c 'ss -ltnup || netstat -plnt'

# DNS hints (requires domain list)
DOMAINS_FILE=${DOMAINS_FILE:-"/etc/nginx/domains.list"}
if [[ -f "$DOMAINS_FILE" ]]; then
  echo '  "domains": [' >> "$JSON"
  first=1
  while read -r d; do
    [[ -z "$d" || "$d" =~ ^# ]] && continue
    ip4=$(dig +short A "$d" | paste -sd ',')
    ip6=$(dig +short AAAA "$d" | paste -sd ',')
    if [[ $first -eq 0 ]]; then echo ',' >> "$JSON"; fi
    first=0
    printf '    {"domain":"%s","A":"%s","AAAA":"%s"}' "$d" "${ip4:-}" "${ip6:-}" >> "$JSON"
  done < "$DOMAINS_FILE"
  echo -e '\n  ],' >> "$JSON"
fi

# Firewall / security
collect_cmd "UFW STATUS" sh -c 'ufw status verbose || true'
collect_cmd "FIREWALLD" sh -c 'firewall-cmd --list-all || true'
collect_cmd "FAIL2BAN" sh -c 'fail2ban-client status || true'

# Nginx
collect_cmd "NGINX -V" sh -c 'nginx -v 2>&1; nginx -V 2>&1 | tr " " "\n" | grep -- --with || true'
collect_cmd "NGINX SITES-ENABLED" sh -c 'ls -l /etc/nginx/sites-enabled || true'
collect_cmd "NGINX TEST" sh -c 'nginx -t || true'
collect_cmd "NGINX MAP" sh -c 'grep -R "server_name\|root\|proxy_pass" -n /etc/nginx/sites-enabled 2>/dev/null || true'

# Certs (Let’s Encrypt)
collect_cmd "CERTBOT" sh -c 'certbot certificates || true'

# Systemd
collect_cmd "SYSTEMD SERVICES (nginx/uvicorn/gunicorn)" sh -c 'systemctl -a | grep -E "nginx|uvicorn|gunicorn|node|docker" || true'
collect_cmd "SYSTEMD TIMERS" sh -c 'systemctl list-timers --all || true'

# Processes
collect_cmd "TOP PROCESSES" sh -c 'ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head -n 30'

# Docker
collect_cmd "DOCKER" sh -c 'docker ps -a || true'

# Runtimes
collect_cmd "NODE" sh -c 'node -v && npm -v || true'
collect_cmd "PYTHON" sh -c 'python3 -V && pip3 -V || true'

# Project layout guesses
collect_cmd "PROJECT DIRS" sh -c 'ls -la ~ /var/www /opt 2>/dev/null || true'

echo '  "ok": true' >> "$JSON"
echo '}' >> "$JSON"

echo "Audit terminé. Dossier: $OUT_DIR"
