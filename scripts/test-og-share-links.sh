#!/usr/bin/env bash
# test-og-share-links.sh
#
# End-to-end verification for the OG-tag fix on per-asset shared-link URLs
# (issue #27786). Three subcommands:
#
#   setup      Clone the dev branch, build a PRODUCTION immich-server image
#              from source, start a minimal prod-style stack (server +
#              Valkey + Postgres, no machine-learning), wait for the server
#              to become healthy.
#   test       Seed an admin user + album + shared link via the REST API
#              and assert OG tags on /share/<key>/photos/<assetId>.
#   teardown   Remove containers, volumes, networks, the built image, the
#              Docker build cache, and the checkout directory. Cleans up
#              state from both the og-test stack AND any leftover dev
#              stack from earlier attempts.
#
# WHY A PRODUCTION BUILD?
#   The SvelteKit frontend has SSR disabled; OG tags are injected by a
#   NestJS middleware that reads /build/www/index.html. Only the
#   production server image (server/Dockerfile) copies the built web UI
#   into that path — the dev image does not. So this test must use a
#   from-source production build to exercise the code path.
#
# Typical flow from an empty working directory:
#
#   curl -fsSLo og.sh https://raw.githubusercontent.com/liotier/immich/claude/fix-shared-album-links-SdKg5/scripts/test-og-share-links.sh
#   chmod +x og.sh
#   ./og.sh setup       # ~10-15 min on first run (full server image build)
#   ./og.sh test        # a few seconds
#   ./og.sh teardown    # prompts before pruning shared Docker state
#
# Env overrides:
#   REPO_URL, BRANCH, CHECKOUT_DIR, SERVER_URL,
#   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME,
#   READINESS_TIMEOUT  (seconds to wait for server readiness)
#   KEEP_CHECKOUT=1    (teardown: keep ./immich/)
#   FORCE_PRUNE=1      (teardown: skip the confirmation prompt)

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/liotier/immich.git}"
BRANCH="${BRANCH:-claude/fix-shared-album-links-SdKg5}"
WORKDIR="${WORKDIR:-$(pwd)}"
CHECKOUT_DIR="${CHECKOUT_DIR:-${WORKDIR}/immich}"
SERVER_URL="${SERVER_URL:-http://localhost:2283}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-password}"
ADMIN_NAME="${ADMIN_NAME:-Admin}"
READINESS_TIMEOUT="${READINESS_TIMEOUT:-1800}"   # seconds; first prod build can be slow

COMPOSE_FILE="scripts/docker-compose.og-test.yml"
COMPOSE_PROJECT="immich-og-test"
OG_TEST_IMAGE="immich-server:og-test"

# Legacy dev-stack state (from earlier iterations of this script) that
# teardown should also clear, so users upgrading from the dev-based
# version get a clean slate.
LEGACY_COMPOSE_FILE="docker/docker-compose.dev.yml"
LEGACY_COMPOSE_PROJECT="immich-dev"
LEGACY_DEV_IMAGES=(immich-server-dev:latest immich-web-dev:latest immich-machine-learning-dev:latest)

log()  { printf '\033[1;34m[og-test]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[og-test]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[og-test]\033[0m %s\n' "$*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || die "required command missing: $1"; }

usage() {
  sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-1}"
}

# =========================================================================
# SETUP
# =========================================================================
cmd_setup() {
  for c in git docker curl; do need "$c"; done
  docker compose version >/dev/null 2>&1 || die "docker compose v2 plugin is required"

  # --- clone / update ---
  if [ ! -d "$CHECKOUT_DIR/.git" ]; then
    log "Cloning $REPO_URL (branch: $BRANCH) into $CHECKOUT_DIR"
    git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$CHECKOUT_DIR"
  else
    log "Repo already present at $CHECKOUT_DIR, fetching latest $BRANCH"
    git -C "$CHECKOUT_DIR" fetch origin "$BRANCH"
    git -C "$CHECKOUT_DIR" checkout "$BRANCH"
    git -C "$CHECKOUT_DIR" pull --ff-only origin "$BRANCH" || \
      warn "pull --ff-only failed (probably local commits); continuing with current checkout"
  fi

  cd "$CHECKOUT_DIR"

  # --- env + data dirs ---
  if [ ! -f docker/.env ]; then
    log "Creating docker/.env from example.env"
    cp docker/example.env docker/.env
  fi
  mkdir -p library postgres

  # --- up (production build from source) ---
  log "Building immich-server from source and starting og-test stack"
  log "First build compiles the server + web UI — 10-15 min is normal"
  docker compose --env-file docker/.env -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT" up -d --build

  # --- wait for readiness ---
  log "Waiting for $SERVER_URL/api/server/ping (up to ${READINESS_TIMEOUT}s)"
  deadline=$(( $(date +%s) + READINESS_TIMEOUT ))
  until curl -fsS --max-time 5 "$SERVER_URL/api/server/ping" >/dev/null 2>&1; do
    if [ "$(date +%s)" -gt "$deadline" ]; then
      docker compose --env-file docker/.env -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT" logs --tail=100 immich-server || true
      die "server did not become ready within ${READINESS_TIMEOUT}s"
    fi
    sleep 3
  done

  log "Setup complete. Server is live at $SERVER_URL"
  log "Next: $0 test"
}

# =========================================================================
# TEST
# =========================================================================
cmd_test() {
  for c in docker curl jq; do need "$c"; done
  [ -d "$CHECKOUT_DIR" ] || die "checkout dir $CHECKOUT_DIR missing — run '$0 setup' first"

  # Sanity: server reachable.
  curl -fsS --max-time 5 "$SERVER_URL/api/server/ping" >/dev/null \
    || die "server not reachable at $SERVER_URL — is 'setup' finished?"

  # --- admin sign-up (idempotent) ---
  log "Registering admin user (if needed): $ADMIN_EMAIL"
  curl -fsS -X POST "$SERVER_URL/api/auth/admin-sign-up" \
    -H 'Content-Type: application/json' \
    -d "$(jq -nc --arg e "$ADMIN_EMAIL" --arg p "$ADMIN_PASSWORD" --arg n "$ADMIN_NAME" \
          '{email:$e, password:$p, name:$n}')" >/dev/null \
    || warn "admin-sign-up rejected (probably already registered) — continuing"

  # --- login ---
  log "Logging in"
  TOKEN=$(curl -fsS -X POST "$SERVER_URL/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d "$(jq -nc --arg e "$ADMIN_EMAIL" --arg p "$ADMIN_PASSWORD" '{email:$e, password:$p}')" \
    | jq -r '.accessToken')
  [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] || die "login failed, no access token"
  auth_header="Authorization: Bearer $TOKEN"

  # --- generate + upload a tiny JPEG ---
  log "Generating a test JPEG"
  TMP_IMG=$(mktemp --suffix=.jpg)
  trap 'rm -f "$TMP_IMG"' RETURN
  base64 -d > "$TMP_IMG" <<'B64'
/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a
HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIy
MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAQABADASIA
AhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQA
AAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3
ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWm
p6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMB
AAIRAxEAPwD3+iiigD//2Q==
B64

  log "Uploading asset"
  UPLOAD_RESPONSE=$(curl -fsS -X POST "$SERVER_URL/api/assets" \
    -H "$auth_header" \
    -F "assetData=@${TMP_IMG};type=image/jpeg" \
    -F "deviceAssetId=og-test-device-asset-$(date +%s)" \
    -F "deviceId=og-test-device" \
    -F "fileCreatedAt=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" \
    -F "fileModifiedAt=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)")
  ASSET_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.id')
  [ -n "$ASSET_ID" ] && [ "$ASSET_ID" != "null" ] || die "upload did not return an asset id: $UPLOAD_RESPONSE"
  log "Uploaded asset: $ASSET_ID"

  # --- album ---
  log "Creating album"
  ALBUM_ID=$(curl -fsS -X POST "$SERVER_URL/api/albums" \
    -H "$auth_header" -H 'Content-Type: application/json' \
    -d "$(jq -nc --arg n "OG Test Album" --arg a "$ASSET_ID" \
          '{albumName:$n, assetIds:[$a]}')" \
    | jq -r '.id')
  [ -n "$ALBUM_ID" ] && [ "$ALBUM_ID" != "null" ] || die "album creation failed"
  log "Album: $ALBUM_ID"

  # --- shared link ---
  log "Creating shared link"
  SHARE_KEY=$(curl -fsS -X POST "$SERVER_URL/api/shared-links" \
    -H "$auth_header" -H 'Content-Type: application/json' \
    -d "$(jq -nc --arg id "$ALBUM_ID" '{type:"ALBUM", albumId:$id}')" \
    | jq -r '.key')
  [ -n "$SHARE_KEY" ] && [ "$SHARE_KEY" != "null" ] || die "shared link creation failed"
  log "Share key: $SHARE_KEY"

  # --- assertions ---
  ALBUM_URL="$SERVER_URL/share/$SHARE_KEY"
  ASSET_URL="$SERVER_URL/share/$SHARE_KEY/photos/$ASSET_ID"
  fetch() { curl -fsS -H 'Accept: text/html' -H 'User-Agent: og-test' "$1"; }

  log ""
  log "=== Regression check: album-level URL still renders og:* ==="
  ALBUM_HTML=$(fetch "$ALBUM_URL")
  echo "$ALBUM_HTML" | grep -E 'og:(title|description|image)' \
    || die "regression: album share link is not producing OG tags"

  log ""
  log "=== Target case: per-asset URL must now render og:* ==="
  ASSET_HTML=$(fetch "$ASSET_URL")
  if ! echo "$ASSET_HTML" | grep -qE 'og:title'; then
    warn "---- received HTML head ----"
    echo "$ASSET_HTML" | head -c 2000 >&2
    die "FAIL: no og:title on per-asset URL — the fix is NOT active"
  fi
  echo "$ASSET_HTML" | grep -E 'og:(title|description|image)'

  log ""
  log "=== Asset-specific thumbnail URL must carry ?key= ==="
  IMG_URL=$(echo "$ASSET_HTML" | grep -oE 'og:image" content="[^"]+"' | head -1 \
                               | sed -E 's/.*content="([^"]+)"/\1/')
  log "og:image -> $IMG_URL"
  echo "$IMG_URL" | grep -q "assets/$ASSET_ID/thumbnail" \
    || die "FAIL: og:image does not point at the requested asset ($ASSET_ID)"
  echo "$IMG_URL" | grep -q "key=$SHARE_KEY" \
    || die "FAIL: og:image is missing key=$SHARE_KEY"

  log ""
  log "=== Thumbnail fetch with the embedded key returns 200 ==="
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "$IMG_URL")
  [ "$CODE" = "200" ] || die "FAIL: thumbnail fetch returned HTTP $CODE"

  log ""
  log "ALL CHECKS PASSED"
  log "  album  URL: $ALBUM_URL"
  log "  asset  URL: $ASSET_URL"
  log ""
  log "Done. To fully clean up: $0 teardown"
}

# =========================================================================
# TEARDOWN
# =========================================================================
# Brings down a compose project by file if present, otherwise by project label.
_down_project() {
  local file="$1" project="$2"
  if [ -f "$CHECKOUT_DIR/$file" ]; then
    local env_flag=()
    [ -f "$CHECKOUT_DIR/docker/.env" ] && env_flag=(--env-file docker/.env)
    (cd "$CHECKOUT_DIR" && docker compose "${env_flag[@]}" -f "$file" -p "$project" down -v --remove-orphans) || true
  else
    docker ps -a     --filter "label=com.docker.compose.project=$project" -q | xargs -r docker rm -fv
    docker volume ls --filter "label=com.docker.compose.project=$project" -q | xargs -r docker volume rm
    docker network ls --filter "label=com.docker.compose.project=$project" -q | xargs -r docker network rm || true
  fi
}

cmd_teardown() {
  need docker
  docker compose version >/dev/null 2>&1 || die "docker compose v2 plugin is required"

  log "Step 1/4: bringing down the og-test compose project"
  _down_project "$COMPOSE_FILE" "$COMPOSE_PROJECT"

  log "Step 1b/4: bringing down any leftover dev-stack state (harmless if absent)"
  _down_project "$LEGACY_COMPOSE_FILE" "$LEGACY_COMPOSE_PROJECT"

  log "Step 2/4: removing locally built images"
  docker image rm "$OG_TEST_IMAGE" >/dev/null 2>&1 || true
  for img in "${LEGACY_DEV_IMAGES[@]}"; do
    docker image rm "$img" >/dev/null 2>&1 || true
  done

  # --- aggressive prune (affects ALL Docker state, not just this project) ---
  log "Step 3/4: docker image prune -a  &&  docker builder prune"
  warn "This removes ALL unused images and the ENTIRE Docker build cache"
  warn "on this host — not just immich-related state."
  if [ "${FORCE_PRUNE:-0}" = "1" ]; then
    log "FORCE_PRUNE=1 — proceeding without prompt"
    REPLY=y
  else
    printf '\033[1;33m[og-test]\033[0m Continue? [y/N] ' >&2
    read -r REPLY || REPLY=n
  fi
  case "$REPLY" in
    [yY]|[yY][eE][sS])
      docker image prune -a -f
      docker builder prune -f
      ;;
    *)
      warn "skipped image/builder prune — pulled base images and build cache retained"
      ;;
  esac

  log "Step 4/4: removing checkout directory"
  if [ "${KEEP_CHECKOUT:-0}" = "1" ]; then
    log "KEEP_CHECKOUT=1 — leaving $CHECKOUT_DIR in place"
  elif [ -d "$CHECKOUT_DIR" ]; then
    rm -rf "$CHECKOUT_DIR"
    log "Removed $CHECKOUT_DIR"
  else
    log "Checkout dir already absent"
  fi

  log "Teardown complete."
}

# =========================================================================
# Dispatch
# =========================================================================
case "${1:-}" in
  setup)    shift; cmd_setup    "$@" ;;
  test)     shift; cmd_test     "$@" ;;
  teardown) shift; cmd_teardown "$@" ;;
  -h|--help|help|"") usage 0 ;;
  *) warn "unknown subcommand: $1"; usage 1 ;;
esac
