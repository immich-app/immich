#!/bin/bash
export IMMICH_PORT="${DEV_SERVER_PORT:-2283}"
export DEV_PORT="${DEV_PORT:-3000}"

# search for immich directory inside workspace.
# /workspaces/immich is the bind mount, but other directories can be mounted if runing
# Devcontainer: Clone [repository|pull request] in container volumne
WORKSPACES_DIR="/workspaces"
IMMICH_DIR="$WORKSPACES_DIR/immich"

# Find directories excluding /workspaces/immich
mapfile -t other_dirs < <(find "$WORKSPACES_DIR" -mindepth 1 -maxdepth 1 -type d ! -path "$IMMICH_DIR")

if [ ${#other_dirs[@]} -gt 1 ]; then
    echo "Error: More than one directory found in $WORKSPACES_DIR other than $IMMICH_DIR."
    exit 1
elif [ ${#other_dirs[@]} -eq 1 ]; then
    export IMMICH_WORKSPACE="${other_dirs[0]}"
else
    export IMMICH_WORKSPACE="$IMMICH_DIR"
fi

echo "Found immich workspace in $IMMICH_WORKSPACE"
