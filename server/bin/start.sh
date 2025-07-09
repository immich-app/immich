#!/usr/bin/env bash
echo "Initializing Immich $IMMICH_SOURCE_REF"

lib_path="/usr/lib/$(arch)-linux-gnu/libmimalloc.so.2"
if [ -f "$lib_path" ]; then
  export LD_PRELOAD="$lib_path"
else
  echo "skipping libmimalloc - path not found $lib_path"
fi
export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/usr/lib/jellyfin-ffmpeg/lib"
SERVER_HOME=/usr/src/app/server

read_file_and_export() {
	if [ -n "${!1}" ]; then
		content="$(cat "${!1}")"
		export "$2"="${content}"
		unset "$1"
	fi
}
read_file_and_export "DB_URL_FILE" "DB_URL"
read_file_and_export "DB_HOSTNAME_FILE" "DB_HOSTNAME"
read_file_and_export "DB_DATABASE_NAME_FILE" "DB_DATABASE_NAME"
read_file_and_export "DB_USERNAME_FILE" "DB_USERNAME"
read_file_and_export "DB_PASSWORD_FILE" "DB_PASSWORD"
read_file_and_export "REDIS_PASSWORD_FILE" "REDIS_PASSWORD"

if CPU_CORES="${CPU_CORES:=$(get-cpus.sh 2>/dev/null)}"; then
  echo "Detected CPU Cores: $CPU_CORES"
  if [ "$CPU_CORES" -gt 4 ]; then
    export UV_THREADPOOL_SIZE=$CPU_CORES
  fi
else
  echo "skipping get-cpus.sh - not found in PATH or failed: using default UV_THREADPOOL_SIZE"
fi

if [ -f "${SERVER_HOME}/dist/main.js" ]; then
  exec node "${SERVER_HOME}/dist/main.js" "$@"
else
  echo "Error: ${SERVER_HOME}/dist/main.js not found"
  if [ "$IMMICH_ENV" = "development" ]; then
    echo "You may need to build the server first."
  fi
  exit 1
fi
