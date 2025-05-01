#!/bin/bash
# shellcheck source=common.sh
source /immich-devcontainer/common.sh

echo "Starting Nest API Server"

cd "${IMMICH_WORKSPACE}/server" || (
    echo workspace not found
    exit 1
)

while true; do
    node ./node_modules/.bin/nest start --debug "0.0.0.0:9230" --watch
    echo " Nest API Server crashed with exit code $?.  Respawning in 3s ..."
    sleep 3
done
