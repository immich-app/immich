#!/usr/bin/env bash
# Pre-stop script for Immich server container
# This script is intended to be run when the container is stopping.
# It performs any necessary cleanup tasks before the container exits.
echo "[INFO] Running pre-stop script..."
node ./server/scripts/queue-stats.js --wait
