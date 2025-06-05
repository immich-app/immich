#!/bin/bash

/immich-devcontainer/container-server-post-create.sh

# Enable multiarch for arm64 if necessary
if [ "$(dpkg --print-architecture)" = "arm64" ]; then
    sudo dpkg --add-architecture amd64 &&
        sudo apt-get update &&
        sudo apt-get install -y --no-install-recommends \
            qemu-user-static \
            libc6:amd64 \
            libstdc++6:amd64 \
            libgcc1:amd64
fi

dart --disable-analytics

export IMMICH_PORT="${DEV_SERVER_PORT:-2283}"
export DEV_PORT="${DEV_PORT:-3000}"

sudo chown node -R /workspaces/immich/.vscode \
    /workspaces/immich/cli/node_modules \
    /workspaces/immich/e2e/node_modules \
    /workspaces/immich/open-api/typescript-sdk/node_modules \
    /workspaces/immich/server/node_modules \
    /workspaces/immich/web/node_modules \
    /workspaces/immich/server/upload

echo "Installing dependencies (server)"
npm --prefix /workspaces/immich/server install

echo "Installing dependencies (web)"
npm --prefix /workspaces/immich/open-api/typescript-sdk install
npm --prefix /workspaces/immich/open-api/typescript-sdk run build
npm --prefix /workspaces/immich/web install
