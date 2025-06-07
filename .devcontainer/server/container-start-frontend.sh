#!/bin/bash
# shellcheck source=common.sh
# shellcheck disable=SC1091
source /immich-devcontainer/container-common.sh

echo "Starting Immich Web Frontend"

cd "${IMMICH_WORKSPACE}/web" || (
    echo Workspace not found
    exit 1
)

until curl --output /dev/null --silent --head --fail "http://127.0.0.1:${IMMICH_PORT}/api/server/config"; do
    echo 'waiting for api server...'
    sleep 1
done

while true; do
    node ./node_modules/.bin/vite dev --host 0.0.0.0 --port "${DEV_PORT}"
    echo "Web crashed with exit code $?.  Respawning in 3s ..."
    sleep 3
done
