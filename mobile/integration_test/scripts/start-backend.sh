#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.yml"

echo "Starting Immich backend for mobile integration tests..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "Waiting for server to be healthy..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:2285/api/server/ping > /dev/null 2>&1; then
    echo "Server is ready!"
    exit 0
  fi
  echo "  Waiting... ($i/60)"
  sleep 2
done

echo "ERROR: Server failed to start within 120 seconds"
docker compose -f "$COMPOSE_FILE" logs immich-server
exit 1
