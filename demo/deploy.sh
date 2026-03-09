#!/bin/bash
set -euo pipefail

# Called by CI after pushing new images.
# Pulls new images, restores the snapshot, and starts services.

BASE_DIR="/opt/slopich"
SNAPSHOT_NAME="default"
SNAPSHOT_DIR="${BASE_DIR}/snapshots/${SNAPSHOT_NAME}"

cd "$BASE_DIR"

echo "==> Pulling latest images..."
docker compose pull

echo "==> Stopping services..."
docker compose down

# Restore snapshot if one exists
if [ -d "$SNAPSHOT_DIR/postgres" ]; then
  echo "==> Restoring DB snapshot '${SNAPSHOT_NAME}'..."
  rm -rf "${BASE_DIR}/postgres"
  cp -a "${SNAPSHOT_DIR}/postgres" "${BASE_DIR}/postgres"
fi

if [ -d "$SNAPSHOT_DIR/library" ]; then
  echo "==> Restoring library snapshot '${SNAPSHOT_NAME}'..."
  rm -rf "${BASE_DIR}/library"
  cp -a "${SNAPSHOT_DIR}/library" "${BASE_DIR}/library"
fi

echo "==> Starting services..."
docker compose up -d --remove-orphans

echo "==> Pruning old images..."
docker image prune -f

echo "==> Deploy complete."
