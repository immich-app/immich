#!/usr/bin/env bash
# test-og-share-links.sh
#
# End-to-end verification for the OG-tag fix on per-asset shared-link URLs
# (issue #27786). Starts from an empty directory, clones the dev branch,
# boots the full dev stack in Docker, seeds an album + shared link via the
# REST API, and asserts that /share/<KEY>/photos/<ASSET_ID> returns the
# expected og:* meta tags.
#
# Usage (from an empty directory):
#   curl -fsSL https://raw.githubusercontent.com/liotier/immich/claude/fix-shared-album-links-SdKg5/scripts/test-og-share-links.sh | bash
#
# Or after cloning:
#   ./scripts/test-og-share-links.sh
#
# Teardown (removes containers, networks, volumes, dev images, and the
# working directory — leaves no Docker state behind):
#   ./scripts/test-og-share-links.sh --teardown
#
# Teardown keeping the checkout (useful for re-running):
#   KEEP_CHECKOUT=1 ./scripts/test-og-share-links.sh --teardown

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/liotier/immich.git}"
BRANCH="${BRANCH:-claude/fix-shared-album-links-SdKg5}"
WORKDIR="${WORKDIR:-$(pwd)}"
CHECKOUT_DIR="${CHECKOUT_DIR:-${WORKDIR}/immich}"
SERVER_URL="${SERVER_URL:-http://localhost:2283}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-password}"
ADMIN_NAME="${ADMIN_NAME:-Admin}"
READINESS_TIMEOUT="${READINESS_TIMEOUT:-900}"   # seconds, first build is slow
COMPOSE_FILE="docker/docker-compose.dev.yml"
COMPOSE_PROJECT="immich-dev"
DEV_IMAGES=(immich-server-dev:latest immich-web-dev:latest immich-machine-learning-dev:latest)

log()  { printf '\033[1;34m[og-test]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[og-test]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[og-test]\033[0m %s\n' "$*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || die "required command missing: $1"; }

teardown() {
  log "Tearing down the dev stack"
  if [ -f "$CHECKOUT_DIR/$COMPOSE_FILE" ]; then
    (cd "$CHECKOUT_DIR" && docker compose -f "$COMPOSE_FILE" down -v --remove-orphans) || true
  else
    warn "compose file not found; falling back to project-name removal"
    # Best-effort: remove by project label
    docker ps -a --filter "label=com.docker.compose.project=$COMPOSE_PROJECT" -q \
      | xargs -r docker rm -fv
    docker volume ls --filter "label=com.docker.compose.project=$COMPOSE_PROJECT" -q \
      | xargs -r docker volume rm
    docker network ls --filter "label=com.docker.compose.project=$COMPOSE_PROJECT" -q \
      | xargs -r docker network rm || true
  fi

  log "Removing dev images built from source"
  for img in "${DEV_IMAGES[@]}"; do
    docker image rm "$img" >/dev/null 2>&1 || true
  done

  if [ "${KEEP_CHECKOUT:-0}" != "1" ] && [ -d "$CHECKOUT_DIR" ]; then
    log "Removing checkout directory: $CHECKOUT_DIR"
    rm -rf "$CHECKOUT_DIR"
  fi

  log "Teardown complete."
  log "Note: base images (postgres, valkey) and the Docker build cache are kept."
  log "To prune those too:  docker image prune -a   &&   docker builder prune"
}

if [ "${1:-}" = "--teardown" ] || [ "${1:-}" = "-d" ]; then
  need docker
  docker compose version >/dev/null 2>&1 || die "docker compose v2 plugin is required"
  teardown
  exit 0
fi

for cmd in git docker curl jq python3; do need "$cmd"; done
docker compose version >/dev/null 2>&1 || die "docker compose v2 plugin is required"

# -------------------------------------------------------------------------
# 1. Clone or update the branch
# -------------------------------------------------------------------------
if [ ! -d "$CHECKOUT_DIR/.git" ]; then
  log "Cloning $REPO_URL (branch: $BRANCH) into $CHECKOUT_DIR"
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$CHECKOUT_DIR"
else
  log "Repo already present at $CHECKOUT_DIR, fetching latest $BRANCH"
  git -C "$CHECKOUT_DIR" fetch origin "$BRANCH"
  git -C "$CHECKOUT_DIR" checkout "$BRANCH"
  git -C "$CHECKOUT_DIR" pull --ff-only origin "$BRANCH"
fi

cd "$CHECKOUT_DIR"

# -------------------------------------------------------------------------
# 2. Prepare env file + data directories
# -------------------------------------------------------------------------
ENV_FILE="docker/.env"
if [ ! -f "$ENV_FILE" ]; then
  log "Creating $ENV_FILE from example.env"
  cp docker/example.env "$ENV_FILE"
fi
mkdir -p library postgres

# -------------------------------------------------------------------------
# 3. Bring up the dev stack
# -------------------------------------------------------------------------
log "Starting dev stack (this can take 10+ minutes on first run)"
docker compose -f "$COMPOSE_FILE" up -d --build

# -------------------------------------------------------------------------
# 4. Wait for the server to be ready
# -------------------------------------------------------------------------
log "Waiting for $SERVER_URL/api/server/ping (up to ${READINESS_TIMEOUT}s)"
deadline=$(( $(date +%s) + READINESS_TIMEOUT ))
until curl -fsS --max-time 5 "$SERVER_URL/api/server/ping" >/dev/null 2>&1; do
  if [ "$(date +%s)" -gt "$deadline" ]; then
    docker compose -f "$COMPOSE_FILE" logs --tail=100 immich-server || true
    die "server did not become ready within ${READINESS_TIMEOUT}s"
  fi
  sleep 3
done
log "Server is up."

# -------------------------------------------------------------------------
# 5. Admin sign-up (idempotent: ignore failure if already registered)
# -------------------------------------------------------------------------
log "Registering admin user (if needed): $ADMIN_EMAIL"
curl -fsS -X POST "$SERVER_URL/api/auth/admin-sign-up" \
  -H 'Content-Type: application/json' \
  -d "$(jq -nc --arg e "$ADMIN_EMAIL" --arg p "$ADMIN_PASSWORD" --arg n "$ADMIN_NAME" \
        '{email:$e, password:$p, name:$n}')" >/dev/null || \
  warn "admin-sign-up rejected (probably already registered) - continuing"

# -------------------------------------------------------------------------
# 6. Login, capture access token
# -------------------------------------------------------------------------
log "Logging in"
TOKEN=$(curl -fsS -X POST "$SERVER_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "$(jq -nc --arg e "$ADMIN_EMAIL" --arg p "$ADMIN_PASSWORD" '{email:$e, password:$p}')" \
  | jq -r '.accessToken')
[ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] || die "login failed, no access token"

auth_header="Authorization: Bearer $TOKEN"

# -------------------------------------------------------------------------
# 7. Generate a tiny JPEG and upload as an asset
# -------------------------------------------------------------------------
log "Generating a test JPEG"
TMP_IMG=$(mktemp --suffix=.jpg)
# Minimal valid JPEG (a solid colour 2x2) encoded in base64. Small enough
# to paste inline, avoids any external download.
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
  -F "deviceAssetId=og-test-device-asset-1" \
  -F "deviceId=og-test-device" \
  -F "fileCreatedAt=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" \
  -F "fileModifiedAt=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)")
ASSET_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.id')
[ -n "$ASSET_ID" ] && [ "$ASSET_ID" != "null" ] || die "upload did not return an asset id: $UPLOAD_RESPONSE"
log "Uploaded asset: $ASSET_ID"

# -------------------------------------------------------------------------
# 8. Create an album and add the asset
# -------------------------------------------------------------------------
log "Creating album"
ALBUM_ID=$(curl -fsS -X POST "$SERVER_URL/api/albums" \
  -H "$auth_header" -H 'Content-Type: application/json' \
  -d "$(jq -nc --arg n "OG Test Album" --arg a "$ASSET_ID" \
        '{albumName:$n, assetIds:[$a]}')" \
  | jq -r '.id')
[ -n "$ALBUM_ID" ] && [ "$ALBUM_ID" != "null" ] || die "album creation failed"
log "Album: $ALBUM_ID"

# -------------------------------------------------------------------------
# 9. Create an ALBUM shared link
# -------------------------------------------------------------------------
log "Creating shared link"
SHARE_KEY=$(curl -fsS -X POST "$SERVER_URL/api/shared-links" \
  -H "$auth_header" -H 'Content-Type: application/json' \
  -d "$(jq -nc --arg id "$ALBUM_ID" '{type:"ALBUM", albumId:$id}')" \
  | jq -r '.key')
[ -n "$SHARE_KEY" ] && [ "$SHARE_KEY" != "null" ] || die "shared link creation failed"
log "Share key: $SHARE_KEY"

# -------------------------------------------------------------------------
# 10. Fire the actual assertions
# -------------------------------------------------------------------------
ALBUM_URL="$SERVER_URL/share/$SHARE_KEY"
ASSET_URL="$SERVER_URL/share/$SHARE_KEY/photos/$ASSET_ID"

fetch() {
  curl -fsS -H 'Accept: text/html' -H 'User-Agent: og-test' "$1"
}

log ""
log "=== Regression check: album-level URL still renders og:* ==="
ALBUM_HTML=$(fetch "$ALBUM_URL")
echo "$ALBUM_HTML" | grep -E 'og:(title|description|image)' || {
  warn "no og:* tags on album URL — this is the pre-existing codepath"
  die "regression: album share link is not producing OG tags"
}

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
log "Tear down everything (containers, volumes, dev images, checkout) with:"
log "  $0 --teardown"
log "Or keep the repo:   KEEP_CHECKOUT=1 $0 --teardown"
