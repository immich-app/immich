#! /bin/sh

# Rebind env vars to PUBLIC_ for svelte
export PUBLIC_IMMICH_SERVER_URL=$IMMICH_SERVER_URL
export PUBLIC_IMMICH_API_URL_EXTERNAL=$IMMICH_API_URL_EXTERNAL

export PROTOCOL_HEADER=X-Forwarded-Proto

if [ "$(id -u)" -eq 0 ] && [ -n "$PUID" ] && [ -n "$PGID" ]; then
    exec setpriv --reuid "$PUID" --regid "$PGID" --clear-groups node /usr/src/app/build/index.js
else
    exec node /usr/src/app/build/index.js
fi
