#!/bin/bash
# shellcheck source=common.sh
# shellcheck disable=SC1091
source /immich-devcontainer/container-common.sh

log "Starting Nest API Server"
log ""
cd "${IMMICH_WORKSPACE}/server" || (
    log "Immich workspace not found"
    exit 1
)

while true; do
    run_cmd node ./node_modules/.bin/nest start --debug "0.0.0.0:9230" --watch
    log "Nest API Server crashed with exit code $?.  Respawning in 3s ..."
    sleep 3
done
