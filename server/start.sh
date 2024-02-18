#!/usr/bin/env sh

lib_path="/usr/lib/$(arch)-linux-gnu/libmimalloc.so.2"
export LD_PRELOAD="$lib_path"

if [ "$DB_URL_FILE" ]; then
	DB_URL_CONTENT=$(cat "$DB_URL_FILE")
	export DB_URL="$DB_URL_CONTENT"
	unset DB_URL_FILE
fi

if [ "$DB_HOSTNAME_FILE" ]; then
	DB_HOSTNAME_CONTENT=$(cat "$DB_HOSTNAME_FILE")
	export DB_HOSTNAME="$DB_HOSTNAME_CONTENT"
	unset DB_HOSTNAME_FILE
fi

if [ "$DB_DATABASE_NAME_FILE" ]; then
	DB_DATABASE_CONTENT=$(cat "$DB_DATABASE_NAME_FILE")
	export DB_DATABASE_NAME="$DB_DATABASE_CONTENT"
	unset DB_DATABASE_NAME_FILE
fi

if [ "$DB_USERNAME_FILE" ]; then
	DB_USERNAME_CONTENT=$(cat "$DB_USERNAME_FILE")
	export DB_USERNAME="$DB_USERNAME_CONTENT"
	unset DB_USERNAME_FILE
fi

if [ "$DB_PASSWORD_FILE" ]; then
	DB_PASSWORD_CONTENT=$(cat "$DB_PASSWORD_FILE")
	export DB_PASSWORD="$DB_PASSWORD_CONTENT"
	unset DB_PASSWORD_FILE
fi

if [ "$REDIS_PASSWORD_FILE" ]; then
	REDIS_PASSWORD_CONTENT=$(cat "$REDIS_PASSWORD_FILE")
	export DB_PASSWORD="$REDIS_PASSWORD_CONTENT"
	unset REDIS_PASSWORD_FILE
fi

exec node /usr/src/app/dist/main "$@"
