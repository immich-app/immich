#!/usr/bin/env sh

export LD_PRELOAD="/usr/lib/$(arch)-linux-gnu/libmimalloc.so.2"

: "${MACHINE_LEARNING_HOST:=0.0.0.0}"
: "${MACHINE_LEARNING_PORT:=3003}"
: "${MACHINE_LEARNING_WORKERS:=1}"

gunicorn app.main:app \
	-k uvicorn.workers.UvicornWorker \
	-w $MACHINE_LEARNING_WORKERS \
	-b $MACHINE_LEARNING_HOST:$MACHINE_LEARNING_PORT \
	--log-config-json log_conf.json
