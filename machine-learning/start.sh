#!/usr/bin/env sh

# mimalloc seems to increase memory usage dramatically with openvino, need to investigate
mimalloc="/usr/lib/$(arch)-linux-gnu/libmimalloc.so.2"
if [ -f "$mimalloc" ]; then
	export LD_PRELOAD="$mimalloc"
fi

if { [ "$DEVICE" = "cuda" ] && [ "$(arch)" = "aarch64" ]; }; then
	lib_path="/usr/lib/$(arch)-linux-gnu/libmimalloc.so.2"
	export LD_PRELOAD="$lib_path"
fi
export LD_BIND_NOW=1

: "${IMMICH_HOST:=[::]}"
: "${IMMICH_PORT:=3003}"
: "${MACHINE_LEARNING_WORKERS:=1}"
: "${MACHINE_LEARNING_HTTP_KEEPALIVE_TIMEOUT_S:=2}"
if [ "$DEVICE" = "openvino" ]; then
	: "${MACHINE_LEARNING_WORKER_TIMEOUT:=300}"
else
	: "${MACHINE_LEARNING_WORKER_TIMEOUT:=120}"
fi

gunicorn app.main:app \
	-k app.config.CustomUvicornWorker \
	-c gunicorn_conf.py \
	-b "$IMMICH_HOST":"$IMMICH_PORT" \
	-w "$MACHINE_LEARNING_WORKERS" \
	-t "$MACHINE_LEARNING_WORKER_TIMEOUT" \
	--log-config-json log_conf.json \
	--keep-alive "$MACHINE_LEARNING_HTTP_KEEPALIVE_TIMEOUT_S" \
	--graceful-timeout 0
