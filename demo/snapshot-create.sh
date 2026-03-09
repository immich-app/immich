#!/bin/bash
set -euo pipefail

# Creates a snapshot of the current DB and library data.
# Usage: ./snapshot-create.sh [snapshot-name]
# The snapshot name defaults to "default".

SNAPSHOT_NAME="${1:-default}"
BASE_DIR="/opt/slopich"
SNAPSHOT_DIR="${BASE_DIR}/snapshots/${SNAPSHOT_NAME}"

echo "==> Creating snapshot '${SNAPSHOT_NAME}'..."

# Stop the stack to ensure data consistency
cd "$BASE_DIR"
docker compose down

# Create snapshot directory
mkdir -p "${SNAPSHOT_DIR}"

# Snapshot postgres data
echo "==> Snapshotting postgres data..."
rm -rf "${SNAPSHOT_DIR}/postgres"
cp -a "${BASE_DIR}/postgres" "${SNAPSHOT_DIR}/postgres"

# Snapshot library (uploaded media)
echo "==> Snapshotting library data..."
rm -rf "${SNAPSHOT_DIR}/library"
cp -a "${BASE_DIR}/library" "${SNAPSHOT_DIR}/library"

echo "==> Snapshot '${SNAPSHOT_NAME}' created at ${SNAPSHOT_DIR}"
echo "==> Restarting services..."
docker compose up -d
echo "==> Done."
