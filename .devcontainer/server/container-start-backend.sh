#!/bin/bash
# shellcheck source=common.sh
# shellcheck disable=SC1091
source /immich-devcontainer/container-common.sh

log "Preparing Immich Nest API Server"
log ""
export CI=1
run_cmd pnpm --filter immich install

log "Starting Nest API Server"
log ""
cd "${IMMICH_WORKSPACE}/server" || (
    log "Immich workspace not found"jj
    exit 1
)

while true; do
    run_cmd pnpm --filter immich exec nest start --debug "0.0.0.0:9230" --watch
    log "Nest API Server crashed with exit code $?.  Respawning in 3s ..."
    sleep 3
done
