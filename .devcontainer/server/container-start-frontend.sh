#!/bin/bash
# shellcheck source=common.sh
# shellcheck disable=SC1091
source /immich-devcontainer/container-common.sh

log "Starting Immich Web Frontend"
log ""
cd "${IMMICH_WORKSPACE}/web" || (
    log "Immich Workspace not found"
    exit 1
)

until curl --output /dev/null --silent --head --fail "http://127.0.0.1:${IMMICH_PORT}/api/server/config"; do
    log "Waiting for api server..."
    sleep 1
done

while true; do
    run_cmd node ./node_modules/.bin/vite dev --host 0.0.0.0 --port "${DEV_PORT}"
    log "Web crashed with exit code $?.  Respawning in 3s ..."
    sleep 3
done
