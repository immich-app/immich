#! /bin/bash
set -e

export IMMICH_WEB_HOST=${IMMICH_WEB_HOST:-immich-web}
export IMMICH_WEB_PORT=${IMMICH_WEB_PORT:-3000}
export IMMICH_SERVER_HOST=${IMMICH_SERVER_HOST:-immich-server}
export IMMICH_SERVER_PORT=${IMMICH_SERVER_PORT:-3001}

envsubst '$IMMICH_WEB_HOST $IMMICH_WEB_PORT $IMMICH_SERVER_HOST $IMMICH_SERVER_PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
