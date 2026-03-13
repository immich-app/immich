#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.storage-migration.yml"
CLEANUP=false
VERBOSE=false
PHASE=""

# === Flag Parsing ===

while [[ $# -gt 0 ]]; do
  case $1 in
    --cleanup) CLEANUP=true; shift ;;
    --no-cleanup) CLEANUP=false; shift ;;
    --phase) PHASE="$2"; shift 2 ;;
    --verbose) VERBOSE=true; shift ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo "  --cleanup       Tear down infrastructure after run"
      echo "  --no-cleanup    Keep infrastructure running (default)"
      echo "  --phase <name>  Run only a specific phase (setup, migrate-to-s3, migrate-to-disk)"
      echo "  --verbose       Show docker logs inline"
      exit 0
      ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

# === Helper Functions ===

log() { echo ""; echo "========================================"; echo "  $1"; echo "========================================"; }

wait_for_server() {
  echo "Waiting for Immich server to be ready..."
  for i in $(seq 1 90); do
    if curl -sf http://localhost:2285/api/server/ping > /dev/null 2>&1; then
      echo "Server is ready (took ${i}s)"
      return 0
    fi
    sleep 1
  done
  echo "ERROR: Server failed to start within 90s"
  if [[ "$VERBOSE" == "true" ]]; then
    $COMPOSE logs immich-server --tail=50
  fi
  return 1
}

restart_server() {
  local backend=$1
  log "Restarting server with IMMICH_STORAGE_BACKEND=$backend"
  IMMICH_STORAGE_BACKEND=$backend $COMPOSE up -d immich-server
  sleep 3
  wait_for_server
}

run_phase() {
  local phase=$1
  log "Running phase: $phase"
  npx tsx src/storage-migration.ts "$phase"
}

dump_logs() {
  echo ""
  echo "=== Server Logs (last 50 lines) ==="
  $COMPOSE logs immich-server --tail=50 2>/dev/null || true
  echo ""
  echo "=== MinIO Logs (last 20 lines) ==="
  $COMPOSE logs minio --tail=20 2>/dev/null || true
}

do_cleanup() {
  log "Cleaning up"
  $COMPOSE down -v --remove-orphans
}

# Dump logs on failure
trap 'echo ""; echo "FAILED - dumping logs..."; dump_logs' ERR

# === Main ===

if [[ -n "$PHASE" ]]; then
  run_phase "$PHASE"
else
  log "Storage Migration E2E Test - Full Workflow"

  log "Phase 1: Starting infrastructure"
  $COMPOSE down -v --remove-orphans 2>/dev/null || true
  $COMPOSE up -d --build
  wait_for_server

  echo "Creating MinIO bucket..."
  $COMPOSE exec -T minio sh -c \
    "mc alias set local http://localhost:9000 minioadmin minioadmin && mc mb local/immich-test --ignore-existing"

  run_phase setup

  restart_server s3
  run_phase migrate-to-s3

  restart_server disk
  run_phase migrate-to-disk

  log "ALL PHASES PASSED"
fi

if [[ "$CLEANUP" == "true" ]]; then
  do_cleanup
fi
