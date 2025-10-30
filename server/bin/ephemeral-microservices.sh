#!/usr/bin/env bash

# Ephemeral Microservices Orchestrator
# ------------------------------------
# Runs inside the Immich server container. It watches BullMQ queue statistics
# via `immich-admin queue-stats --total <state>` and spins up a temporary
# microservices worker process when there is queued work. After the queues
# drain (waiting + active == 0) and remain idle for a configurable time, it
# gracefully stops the microservices process.
#
# Assumptions:
#  - The main container process is already running the API (only) or at least
#    not running the microservices worker (i.e. IMMICH_WORKERS_INCLUDE does not
#    already include "microservices").
#  - `start.sh` and `immich-admin` are on PATH (they are in the official image).
#  - The build artifacts exist at server/dist (normal for released images).
#
# Environment variables (override as needed):
#   CHECK_INTERVAL          Seconds between queue polling (default: 15)
#   WAITING_THRESHOLD       Minimum total waiting jobs to trigger start (default: 1)
#   IDLE_AFTER_COMPLETE     Continuous idle seconds (waiting=0 & active=0) before stopping (default: 60)
#   GRACEFUL_TIMEOUT        Seconds to wait after SIGTERM before SIGKILL (default: 30)
#   VERBOSE                 If set to non-empty, enables extra logging
#   EXTRA_START_ENV         Extra env vars to export when starting microservices (format KEY=VAL space separated)
#
# Exit codes:
#   0  Normal exit (terminated by signal or EOF)
#   1  Unhandled error in script logic

set -euo pipefail

CHECK_INTERVAL="${CHECK_INTERVAL:-10}"
WAITING_THRESHOLD="${WAITING_THRESHOLD:-1}"
IDLE_AFTER_COMPLETE="${IDLE_AFTER_COMPLETE:-60}"
GRACEFUL_TIMEOUT="${GRACEFUL_TIMEOUT:-30}"
JITTER_MAX_SECONDS="${JITTER_MAX_SECONDS:-5}"  # Maximum random jitter added to each interval sleep
PID_FILE="/tmp/immich_ephemeral_microservices.pid"
LOG_TAG="[ephemeral-microservices]"

log() {
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_TAG} $*"
}

vlog() {
  if [[ -n "${VERBOSE:-}" ]]; then
    log "$@"
  fi
}

error() {
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_TAG} ERROR: $*" >&2
}

cleanup() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(<"$PID_FILE")" || true
    if [[ -n "$pid" && -d "/proc/$pid" ]]; then
      vlog "Script exiting; ensuring microservices process $pid is terminated"
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi
}
trap cleanup EXIT INT TERM

get_total() {
  local state="$1" value
  if ! value="$(node ./server/scripts/queue-stats.js --total "$state" 2>/dev/null | tr -d '\r')"; then
    echo "-1"
    return 0
  fi
  if [[ ! "$value" =~ ^[0-9]+$ ]]; then
    echo "-1"
    return 0
  fi
  echo "$value"
}

micro_running() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(<"$PID_FILE")" || true
    if [[ -n "$pid" && -d "/proc/$pid" ]]; then
      return 0
    fi
  fi
  return 1
}

start_micro() {
  if micro_running; then
    vlog "Microservices already running (pid $(<"$PID_FILE"))"
    return 0
  fi
  log "Starting microservices worker (threshold exceeded)"
  # Start only the microservices worker by constraining IMMICH_WORKERS_INCLUDE.
  # Use a subshell to isolate environment.
  (
    export IMMICH_WORKERS_INCLUDE="microservices"
    # Accept optional additional environment overrides.
    if [[ -n "${EXTRA_START_ENV:-}" ]]; then
      # shellcheck disable=SC2086
      export ${EXTRA_START_ENV}
    fi
    # start.sh will exec node main.js; we place it in background via sh -c wrapper.
    start.sh >/dev/null 2>&1 &
    echo $! > "$PID_FILE"
  )
  sleep 2
  if micro_running; then
    log "Microservices started (pid $(<"$PID_FILE"))"
  else
    error "Failed to start microservices"
    rm -f "$PID_FILE" || true
  fi
}

stop_micro() {
  if ! micro_running; then
    return 0
  fi
  local pid
  pid="$(<"$PID_FILE")"
  log "Stopping microservices process $pid"
  kill "$pid" 2>/dev/null || true
  local waited=0
  while micro_running && [[ $waited -lt $GRACEFUL_TIMEOUT ]]; do
    sleep 1
    waited=$((waited+1))
  done
  if micro_running; then
    error "Microservices did not exit after ${GRACEFUL_TIMEOUT}s; sending SIGKILL"
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$PID_FILE" || true
}

log "Starting ephemeral microservices monitor. Interval=${CHECK_INTERVAL}s Threshold=${WAITING_THRESHOLD} Idle=${IDLE_AFTER_COMPLETE}s"

idle_start=0

# Start microservices immediately on launch (requested behavior)
start_micro || true

while true; do
  waiting_total=$(get_total waiting)
  active_total=$(get_total active)

  if [[ $waiting_total -lt 0 || $active_total -lt 0 ]]; then
    error "Failed to read queue stats (waiting=$waiting_total active=$active_total). Will retry."
    sleep "$CHECK_INTERVAL"
    continue
  fi

  vlog "Queue totals: waiting=$waiting_total active=$active_total running=$(micro_running && echo yes || echo no)"

  if [[ $waiting_total -ge $WAITING_THRESHOLD ]]; then
    start_micro
    idle_start=0
  fi

  if micro_running; then
    if [[ $waiting_total -eq 0 && $active_total -eq 0 ]]; then
      if [[ $idle_start -eq 0 ]]; then
        idle_start=$(date +%s)
        vlog "Queues drained; starting idle timer"
      else
        now=$(date +%s)
        elapsed=$((now - idle_start))
        if [[ $elapsed -ge $IDLE_AFTER_COMPLETE ]]; then
          log "Idle period (${elapsed}s) exceeded threshold; stopping microservices"
          stop_micro
          idle_start=0
        fi
      fi
    else
      # Work resumed; reset idle timer
      if [[ $idle_start -ne 0 ]]; then
        vlog "Work resumed; resetting idle timer"
      fi
      idle_start=0
    fi
  fi

  # Sleep with random jitter (0..JITTER_MAX_SECONDS) to avoid synchronized polling storms
  jitter=$(( RANDOM % (JITTER_MAX_SECONDS + 1) ))
  vlog "Sleeping for base=${CHECK_INTERVAL}s + jitter=${jitter}s"
  sleep $(( CHECK_INTERVAL + jitter ))
done
