#!/bin/bash
set -euo pipefail

# Restores a snapshot of DB and library data.
# Usage: ./snapshot-restore.sh [snapshot-name]
# The snapshot name defaults to "default".

SNAPSHOT_NAME="${1:-default}"
BASE_DIR="/opt/slopich"
SNAPSHOT_DIR="${BASE_DIR}/snapshots/${SNAPSHOT_NAME}"

if [ ! -d "$SNAPSHOT_DIR" ]; then
  echo "ERROR: Snapshot '${SNAPSHOT_NAME}' not found at ${SNAPSHOT_DIR}"
  exit 1
fi

echo "==> Restoring snapshot '${SNAPSHOT_NAME}'..."

# Stop the stack
cd "$BASE_DIR"
docker compose down

# Restore postgres data
echo "==> Restoring postgres data..."
rm -rf "${BASE_DIR}/postgres"
cp -a "${SNAPSHOT_DIR}/postgres" "${BASE_DIR}/postgres"

# Restore library
echo "==> Restoring library data..."
rm -rf "${BASE_DIR}/library"
cp -a "${SNAPSHOT_DIR}/library" "${BASE_DIR}/library"

echo "==> Snapshot '${SNAPSHOT_NAME}' restored."
echo "==> Starting services..."
docker compose up -d
echo "==> Done."
