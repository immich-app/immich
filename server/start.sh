#!/usr/bin/env bash

lib_path="/usr/lib/$(arch)-linux-gnu/libmimalloc.so.2"
export LD_PRELOAD="$lib_path"

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

exec node /usr/src/app/dist/main "$@"
