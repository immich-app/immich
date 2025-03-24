#!/bin/bash
export IMMICH_PORT="${DEV_SERVER_PORT:-2283}"
export DEV_PORT="${DEV_PORT:-3000}"

sudo chown node -R /immich/cli/node_modules /immich/e2e/node_modules /immich/open-api/typescript-sdk/node_modules /immich/server/node_modules /immich/web/node_modules /mnt/upload

echo "Installing dependencies (server)"
npm --prefix /immich/server install

echo "Installing dependencies (web)"
npm --prefix /immich/open-api/typescript-sdk install
npm --prefix /immich/open-api/typescript-sdk run build
npm --prefix /immich/web install
