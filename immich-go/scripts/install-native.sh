#!/usr/bin/env bash
# =============================================================================
# immich-go NATIVE installer (DietPi / Debian / Ubuntu / Alpine — any Linux)
#
# Fully self-contained: it does NOT depend on the upstream Immich repo.
# It installs either from pre-built binaries (--from-dir dist/arm64) or,
# if a Go toolchain is available, builds from source right here.
#
# Usage (as root):
#   ./scripts/install-native.sh                       # auto: use ./dist/<arch> or build
#   ./scripts/install-native.sh --from-dir dist/arm64 # install cross-compiled binaries
#   ./scripts/install-native.sh --admin-email me@x.com --admin-password 'S3cret!'
#   ./scripts/install-native.sh --port 8080
#   ./scripts/install-native.sh --uninstall           # remove service+binaries (keeps data)
#
# What it creates:
#   /usr/local/bin/immich-server , /usr/local/bin/immich-migrate
#   /var/lib/immich-go            (data dir: SQLite db + photos/thumbnails)
#   /etc/immich-go.env            (config; world-readable=no, chmod 640)
#   /etc/systemd/system/immich-go.service + user "immich"
# =============================================================================
set -euo pipefail

# ---------------------------- defaults & args --------------------------------
FROM_DIR=""
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD=""
PORT="2283"
DATA_DIR="/var/lib/immich-go"
BIN_DIR="/usr/local/bin"
ETC_ENV="/etc/immich-go.env"
SERVICE_FILE="/etc/systemd/system/immich-go.service"
UNINSTALL=false
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from-dir)       FROM_DIR="$2"; shift 2 ;;
    --admin-email)    ADMIN_EMAIL="$2"; shift 2 ;;
    --admin-password) ADMIN_PASSWORD="$2"; shift 2 ;;
    --port)           PORT="$2"; shift 2 ;;
    --data-dir)       DATA_DIR="$2"; shift 2 ;;
    --uninstall)      UNINSTALL=true; shift ;;
    -h|--help)        sed -n '2,22p' "$0"; exit 0 ;;
    *) echo "unknown flag: $1 (see --help)"; exit 1 ;;
  esac
done

log()  { printf '\e[1;32m[immich-go]\e[0m %s\n' "$*"; }
die()  { printf '\e[1;31m[immich-go] ERROR:\e[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run as root (sudo ./scripts/install-native.sh)"

# ------------------------------ uninstall ------------------------------------
if $UNINSTALL; then
  log "Uninstalling service and binaries (data in $DATA_DIR is KEPT)..."
  systemctl disable --now immich-go 2>/dev/null || true
  rm -f "$SERVICE_FILE" "$BIN_DIR/immich-server" "$BIN_DIR/immich-migrate"
  systemctl daemon-reload
  log "Done. To also delete all photos/database: rm -rf $DATA_DIR && rm -f $ETC_ENV"
  exit 0
fi

# ------------------------------ locate binaries -------------------------------
SERVER_BIN=""
MIGRATE_BIN=""
find_binaries() {
  local arch
  arch="$(uname -m)"
  case "$arch" in
    aarch64|arm64) arch=arm64 ;;
    x86_64)        arch=amd64 ;;
    armv7l|armhf)  arch=arm ;;
    *)             arch="$arch" ;;
  esac
  for d in "${FROM_DIR:-}" "$SRC_DIR/dist/$arch" "$SRC_DIR/dist" "$SRC_DIR"; do
    [[ -n "$d" && -x "$d/immich-server" ]] || continue
    SERVER_BIN="$d/immich-server"
    MIGRATE_BIN="$d/immich-migrate"
    return 0
  done
  return 1
}

if ! find_binaries; then
  # Fallback: build from source if Go is installed.
  command -v go >/dev/null 2>&1 || die \
    "No pre-built binaries found and no Go toolchain installed.
     Option A: build elsewhere with scripts/build.sh arm64, copy the dist/ folder over, re-run with --from-dir <dir>.
     Option B: install Go 1.21+ (https://go.dev/dl) and re-run this script."
  log "Binaries not found — building from source with $(go version | awk '{print $3}')"
  ( cd "$SRC_DIR" && CGO_ENABLED=0 go build -trimpath -ldflags "-s -w" \
      -o dist/native/immich-server  ./cmd/server \
   && CGO_ENABLED=0 go build -trimpath -ldflags "-s -w" \
      -o dist/native/immich-migrate ./cmd/migrate )
  SERVER_BIN="$SRC_DIR/dist/native/immich-server"
  MIGRATE_BIN="$SRC_DIR/dist/native/immich-migrate"
fi

log "Using server binary : $SERVER_BIN"
log "Using migrate binary: $MIGRATE_BIN"

# ------------------------------ system user ----------------------------------
if ! id immich >/dev/null 2>&1; then
  if command -v adduser >/dev/null 2>&1 && ! command -v getent >/dev/null 2>&1; then
    adduser -S -D immich 2>/dev/null || adduser -system --disabled-login immich
  else
    useradd --system --home-dir "$DATA_DIR" --shell /usr/sbin/nologin immich 2>/dev/null || \
      adduser -S -H -D immich
  fi
  log "Created system user 'immich'"
else
  log "System user 'immich' already exists"
fi

# ------------------------------ data dir --------------------------------------
mkdir -p "$DATA_DIR/photos" "$DATA_DIR/thumbnails" "$DATA_DIR/encoded"
chown -R immich:immich "$DATA_DIR"
chmod 750 "$DATA_DIR"

# ------------------------------ env file ---------------------------------------
JWT_SECRET="$( (command -v openssl >/dev/null && openssl rand -hex 32) || \
               (head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n') )"

# Generate a random admin password if none supplied.
if [[ -z "$ADMIN_PASSWORD" ]]; then
  ADMIN_PASSWORD="$(head -c 12 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 16)"
  PASS_SHOWN=true
else
  PASS_SHOWN=false
fi

if [[ -f "$ETC_ENV" ]]; then
  cp "$ETC_ENV" "$ETC_ENV.bak.$(date +%s)"
  log "Existing env backed up; keeping current IMMICHGO_JWT_SECRET (tokens stay valid)"
  # keep old secret, only refresh admin bootstrap values if empty
  OLD_SECRET="$(grep -m1 '^IMMICHGO_JWT_SECRET=' "$ETC_ENV" | cut -d= -f2- || true)"
  [[ -n "$OLD_SECRET" ]] && JWT_SECRET="$OLD_SECRET"
fi

cat > "$ETC_ENV" <<EOF
# immich-go configuration — edited by install-native.sh on $(date -u +%F\ %TZ)
# After first successful login you may delete the two ADMIN_* lines below.
IMMICHGO_DATA_DIR=$DATA_DIR
IMMICHGO_DB_PATH=$DATA_DIR/immich.db
IMMICHGO_PORT=$PORT
IMMICHGO_JWT_SECRET=$JWT_SECRET
IMMICHGO_ADMIN_EMAIL=$ADMIN_EMAIL
IMMICHGO_ADMIN_PASSWORD=$ADMIN_PASSWORD
GIN_MODE=release
IMMICHGO_DB_MAX_CONNS=5
IMMICHGO_IMAGE_WORKERS=2
IMMICHGO_MAX_IMAGE_WIDTH=2048
IMMICHGO_JPEG_QUALITY=80
IMMICHGO_WORKER_INTERVAL=30s
IMMICHGO_WORKER_SLEEP=2s
IMMICHGO_MEMORY_LIMIT_MB=500
EOF
chmod 640 "$ETC_ENV"
chown root:immich "$ETC_ENV"

# ------------------------------ systemd unit -----------------------------------
if command -v systemctl >/dev/null 2>&1; then
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=immich-go - Immich-compatible photo server (pure Go)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=immich
Group=immich
EnvironmentFile=$ETC_ENV
ExecStart=$BIN_DIR/immich-server
WorkingDirectory=$DATA_DIR
Restart=on-failure
RestartSec=3
MemoryMax=600M
MemoryHigh=500M
CPUWeight=50
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ReadWritePaths=$DATA_DIR

[Install]
WantedBy=multi-user.target
EOF
  install -m 755 "$SERVER_BIN"  "$BIN_DIR/immich-server"
  install -m 755 "$MIGRATE_BIN" "$BIN_DIR/immich-migrate"
  systemctl daemon-reload
  systemctl enable --now immich-go
  sleep 1
  systemctl --no-pager status immich-go | head -5 || true
else
  # No systemd (e.g. some containers): install + print manual run command.
  install -m 755 "$SERVER_BIN"  "$BIN_DIR/immich-server"
  install -m 755 "$MIGRATE_BIN" "$BIN_DIR/immich-migrate"
  log "systemd not detected — start manually with:"
  echo "    set -a; . $ETC_ENV; set +a; sudo -u immich $BIN_DIR/immich-server"
fi

# ------------------------------ smoke test -------------------------------------
if command -v curl >/dev/null 2>&1; then
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    log "Health check PASSED: http://127.0.0.1:${PORT}/api/health"
  else
    log "WARN: health check failed yet (server may still be booting). Check: journalctl -u immich-go -n 50"
  fi
fi

echo
log "Installation complete."
log "  Server URL   : http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 127.0.0.1):${PORT}"
log "  Admin email  : $ADMIN_EMAIL"
if $PASS_SHOWN; then
  log "  Admin password (generated, save it now!): $ADMIN_PASSWORD"
else
  log "  Admin password: the one you passed to --admin-password"
fi
log "  Config       : $ETC_ENV    (edit then: systemctl restart immich-go)"
log "  Logs         : journalctl -u immich-go -f"
log "  Mobile app   : in Immich app, server URL = http://<this-ip>:${PORT}/api"
