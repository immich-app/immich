#!/bin/bash
# shellcheck source=common.sh
source /immich-devcontainer/common.sh

until curl --output /dev/null --silent --head --fail "http://127.0.0.1:${IMMICH_PORT}/api/server/config"; do
    echo 'waiting for api server...'
    sleep 1
done

echo "Starting web"
cd "${IMMICH_WORKSPACE}/web" || (
    echo workspace not found
    exit 1
)

while true; do
    node ./node_modules/.bin/vite dev --host 0.0.0.0 --port "${DEV_PORT}"
    echo "Web crashed with exit code $?.  Respawning in 3s ..."
    sleep 3
done
