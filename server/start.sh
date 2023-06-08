#!/bin/sh

if [ "$DB_HOSTNAME_FILE" ]; then
	export DB_HOSTNAME=$(cat $DB_HOSTNAME_FILE)
	unset DB_HOSTNAME_FILE
fi

if [ "$DB_DATABASE_NAME_FILE" ]; then
	export DB_DATABASE_NAME=$(cat $DB_DATABASE_NAME_FILE)
	unset DB_DATABASE_NAME_FILE
fi

if [ "$DB_USERNAME_FILE" ]; then
	export DB_USERNAME=$(cat $DB_USERNAME_FILE)
	unset DB_USERNAME_FILE
fi

if [ "$DB_PASSWORD_FILE" ]; then
	export DB_PASSWORD=$(cat $DB_PASSWORD_FILE)
	unset DB_PASSWORD_FILE
fi

exec node dist/main $1
