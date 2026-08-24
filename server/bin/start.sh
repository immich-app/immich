#!/usr/bin/env bash

# Quiet mode suppresses informational output (enabled for immich-admin)
QUIET=false
if [ "$1" = "immich-admin" ]; then
  QUIET=true
fi

# Helper function that only logs when not in quiet mode
log_message() {
  if [ "$QUIET" = "false" ]; then
    echo "$@"
  fi
}

log_message "Initializing Immich $IMMICH_SOURCE_REF"

lib_path="/usr/lib/$(arch)-linux-gnu/libmimalloc.so.3"
if [ -f "$lib_path" ]; then
  export LD_PRELOAD="$lib_path"
else
  echo "skipping libmimalloc - path not found $lib_path"
fi
# jellyfin-ffmpeg bundles its own libxml2, fontconfig, freetype and harfbuzz. Its
# binaries locate those through the RUNPATH baked into them, so the directory does
# not need to be on the loader path, and having it there is actively harmful: the
# bundled libfontconfig pulls in libxml2.so.16 (2.16), which then wins symbol
# lookups for librsvg. librsvg is built against the system libxml2.so.2 (2.9.14),
# so it ends up building a SAX parser context in one libxml2 and initialising it
# in the other, and libvips segfaults whenever it renders an SVG. See #26605.
remove_from_ld_library_path() {
  local removed=""
  local entry
  local entries
  IFS=':' read -ra entries <<<"${LD_LIBRARY_PATH:-}"
  for entry in "${entries[@]}"; do
    if [ -z "$entry" ] || [ "$entry" = "$1" ]; then
      continue
    fi
    removed="${removed:+$removed:}$entry"
  done

  if [ -n "$removed" ]; then
    export LD_LIBRARY_PATH="$removed"
  else
    unset LD_LIBRARY_PATH
  fi
}
remove_from_ld_library_path "/usr/lib/jellyfin-ffmpeg/lib"
SERVER_HOME="$(readlink -f "$(dirname "$0")/..")"

read_file_and_export() {
	fname="${!1}"
	if [[ -z $fname ]] && [[ -e "$CREDENTIALS_DIRECTORY/$2" ]]; then
		fname="${CREDENTIALS_DIRECTORY}/$2"
	fi
	if [[ -n $fname ]]; then
		content="$(< "$fname")"
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
  log_message "Detected CPU Cores: $CPU_CORES"
  if [ "$CPU_CORES" -gt 4 ]; then
    export UV_THREADPOOL_SIZE=$CPU_CORES
  fi
else
  log_message "skipping get-cpus.sh - not found in PATH or failed: using default UV_THREADPOOL_SIZE"
fi

if [ -f "${SERVER_HOME}/dist/main.js" ]; then
  if [ "$QUIET" = "true" ]; then
    exec node --no-warnings "${SERVER_HOME}/dist/main.js" "$@"
  else
    exec node "${SERVER_HOME}/dist/main.js" "$@"
  fi
else
  echo "Error: ${SERVER_HOME}/dist/main.js not found"
  if [ "$IMMICH_ENV" = "development" ]; then
    echo "You may need to build the server first."
  fi
  exit 1
fi
