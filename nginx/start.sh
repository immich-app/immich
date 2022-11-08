#! /bin/bash
set -e

export IMMICH_WEB_URL=${IMMICH_WEB_URL:-http://immich-web:3000}
export IMMICH_SERVER_URL=${IMMICH_SERVER_URL:-http://immich-server:3001}

envsubst '$IMMICH_WEB_URL $IMMICH_SERVER_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
