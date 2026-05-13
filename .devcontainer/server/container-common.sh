#!/bin/bash
export IMMICH_PORT="${DEV_SERVER_PORT:-2283}"
export DEV_PORT="${DEV_PORT:-3000}"

IMMICH_DEVCONTAINER_LOG="$HOME/immich-devcontainer.log"

log() {
    # Display command on console, log with timestamp to file
    echo "$*"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >>"$IMMICH_DEVCONTAINER_LOG"
}

run_cmd() {
    # Ensure log directory exists
    mkdir -p "$(dirname "$IMMICH_DEVCONTAINER_LOG")"

    log "$@"

    # Execute command: display normally on console, log with timestamps to file
    "$@" 2>&1 | tee >(while IFS= read -r line; do
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $line" >>"$IMMICH_DEVCONTAINER_LOG"
    done)

    # Preserve exit status
    return "${PIPESTATUS[0]}"
}

export IMMICH_WORKSPACE="/usr/src/app"

log "Found immich workspace in $IMMICH_WORKSPACE"
log ""

