#! /bin/bash
set -e

export IMMICH_WEB_URL=${IMMICH_WEB_URL:-http://immich-web:3000}
export IMMICH_WEB_SCHEME=$(echo $IMMICH_WEB_URL | grep -Eo 'https?://')
export IMMICH_WEB_HOST=$(echo $IMMICH_WEB_URL | cut -d '/' -f 3)
export IMMICH_SERVER_URL=${IMMICH_SERVER_URL:-http://immich-server:3001}
export IMMICH_SERVER_SCHEME=$(echo $IMMICH_WEB_URL | grep -Eo 'https?://')
export IMMICH_SERVER_HOST=$(echo $IMMICH_SERVER_URL | cut -d '/' -f 3)

envsubst '$IMMICH_WEB_SCHEME $IMMICH_WEB_HOST  $IMMICH_SERVER_SCHEME $IMMICH_SERVER_HOST' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
