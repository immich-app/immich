npm run build
if [ `id -u` -eq 0 ] && [ -n "$PUID" ] && [ -n "$PGID" ]; then
    exec setpriv --reuid $PUID --regid $PGID --clear-groups node /usr/src/app/build/index.js
else
    node /usr/src/app/build/index.js
fi