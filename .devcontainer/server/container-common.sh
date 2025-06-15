#!/bin/bash
export IMMICH_PORT="${DEV_SERVER_PORT:-2283}"
export DEV_PORT="${DEV_PORT:-3000}"

# search for immich directory inside workspace.
# /workspaces/immich is the bind mount, but other directories can be mounted if runing
# Devcontainer: Clone [repository|pull request] in container volumne
WORKSPACES_DIR="/workspaces"
IMMICH_DIR="$WORKSPACES_DIR/immich"

# Find directories excluding /workspaces/immich
mapfile -t other_dirs < <(find "$WORKSPACES_DIR" -mindepth 1 -maxdepth 1 -type d ! -path "$IMMICH_DIR" ! -name ".*")

if [ ${#other_dirs[@]} -gt 1 ]; then
    echo "Error: More than one directory found in $WORKSPACES_DIR other than $IMMICH_DIR."
    exit 1
elif [ ${#other_dirs[@]} -eq 1 ]; then
    export IMMICH_WORKSPACE="${other_dirs[0]}"
else
    export IMMICH_WORKSPACE="$IMMICH_DIR"
fi

echo "Found immich workspace in $IMMICH_WORKSPACE"

run_cmd() {
    echo "$@"
    "$@"
}

fix_permissions() {

    echo "Fixing permissions for ${IMMICH_WORKSPACE}"

    run_cmd sudo find "${IMMICH_WORKSPACE}/server/upload" -not -path "${IMMICH_WORKSPACE}/server/upload/postgres/*" -not -path "${IMMICH_WORKSPACE}/server/upload/postgres" -exec chown node {} +

    run_cmd sudo chown node -R "${IMMICH_WORKSPACE}/.vscode" \
        "${IMMICH_WORKSPACE}/cli/node_modules" \
        "${IMMICH_WORKSPACE}/e2e/node_modules" \
        "${IMMICH_WORKSPACE}/open-api/typescript-sdk/node_modules" \
        "${IMMICH_WORKSPACE}/server/node_modules" \
        "${IMMICH_WORKSPACE}/server/dist" \
        "${IMMICH_WORKSPACE}/web/node_modules" \
        "${IMMICH_WORKSPACE}/web/dist"
}

install_dependencies() {

    echo "Installing dependencies"

    (
        cd "${IMMICH_WORKSPACE}" || exit 1
        run_cmd make install-server
        run_cmd make install-open-api
        run_cmd make build-open-api
        run_cmd make install-web
    )
}