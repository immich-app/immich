#!/usr/bin/env sh

lib_path="/usr/lib/$(arch)-linux-gnu/libmimalloc.so.2"
export LD_PRELOAD="$lib_path"
export LD_BIND_NOW=1

: "${MACHINE_LEARNING_HOST:=0.0.0.0}"
: "${MACHINE_LEARNING_PORT:=3003}"
: "${MACHINE_LEARNING_WORKERS:=1}"
: "${MACHINE_LEARNING_WORKER_TIMEOUT:=120}"

gunicorn app.main:app \
	-k app.config.CustomUvicornWorker \
	-w "$MACHINE_LEARNING_WORKERS" \
	-b "$MACHINE_LEARNING_HOST":"$MACHINE_LEARNING_PORT" \
	-t "$MACHINE_LEARNING_WORKER_TIMEOUT" \
	--log-config-json log_conf.json \
	--graceful-timeout 0
