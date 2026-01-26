#!/usr/bin/env bash
export IMMICH_WORKERS_EXCLUDE=api
exec start.sh "$@"
