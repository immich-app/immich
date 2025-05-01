#!/bin/bash
# shellcheck source=common.sh
source /immich-devcontainer/common.sh

sudo find "${IMMICH_WORKSPACE}/server/upload" -not -path "${IMMICH_WORKSPACE}/server/upload/postgres/*" -not -path "${IMMICH_WORKSPACE}/server/upload/postgres" -exec chown node {} +

sudo chown node -R "${IMMICH_WORKSPACE}/.vscode" \
    "${IMMICH_WORKSPACE}/cli/node_modules" \
    "${IMMICH_WORKSPACE}/e2e/node_modules" \
    "${IMMICH_WORKSPACE}/open-api/typescript-sdk/node_modules" \
    "${IMMICH_WORKSPACE}/server/node_modules" \
    "${IMMICH_WORKSPACE}/server/dist" \
    "${IMMICH_WORKSPACE}/web/node_modules" \
    "${IMMICH_WORKSPACE}/web/dist"

run_cmd() {
    echo "$@"
    "$@"
}

echo "Installing dependencies"

run_cmd npm --prefix "${IMMICH_WORKSPACE}/server" install
run_cmd npm --prefix "${IMMICH_WORKSPACE}/open-api/typescript-sdk" install
run_cmd npm --prefix "${IMMICH_WORKSPACE}/open-api/typescript-sdk" run build
run_cmd npm --prefix "${IMMICH_WORKSPACE}/web" install
