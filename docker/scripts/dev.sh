#!/bin/bash
IMMICH_PORT="${DEV_SERVER_PORT:-2283}"
DEV_PORT="${DEV_PORT:-3000}"

echo "Installing dependencies (server)"
npm --prefix /app/server install

echo "Installing dependencies (web)"
npm --prefix /app/open-api/typescript-sdk install
npm --prefix /app/open-api/typescript-sdk run build
npm --prefix /app/web install

(while true; do
    echo "Starting immich server"
    cd /app/server || exit 1
    node ./node_modules/.bin/nest start --debug "0.0.0.0:9230" --watch
    sleep 1
done) &

until curl --output /dev/null --silent --head --fail "http://127.0.0.1:${IMMICH_PORT}/api/server/config"; do
    echo 'waiting for api server...'
    sleep 1
done

(while true; do
    echo "Starting immich web"
    cd /app/web || exit 1
    node ./node_modules/.bin/vite dev --host 0.0.0.0 --port "${DEV_PORT}"
    sleep 1
done) &

sleep infinity
