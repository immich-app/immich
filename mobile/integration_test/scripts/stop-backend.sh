#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.yml"

echo "Stopping Immich backend..."
docker compose -f "$COMPOSE_FILE" down -v
