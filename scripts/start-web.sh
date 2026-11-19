#!/bin/bash
cd "/mnt/c/MyStuffs/Projects/Pictures/Immich RN/Immich Default/immich/web"
export PATH="/home/mohit/.local/share/mise/installs/node/26.13.0/bin:/usr/local/bin:/usr/bin:/bin"
export IMMICH_SERVER_URL="http://127.0.0.1:2283/"
exec node ./node_modules/vite/bin/vite.js dev --host 0.0.0.0 --port 3005

