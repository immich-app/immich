# -----------------------------------------------------------------------------
# This script sets the nightly job start time for IMMICH by updating its config.
#
# Steps performed:
# 1. Copies the IMMICH config file (from $IMMICH_CONFIG_FILE) to /tmp/immich_config.yaml.
# 2. Calculates the nightly job start time as the current UTC time plus 1 minute.
#    - Uses BSD/macOS or GNU/Linux date syntax depending on the system.
# 3. Appends a nightlyTasks section with the calculated start time to the config file.
# 4. Updates the IMMICH_CONFIG_FILE environment variable to point to the new config.
#
# Usage:
#   IMMICH_CONFIG_FILE=/path/to/config.yaml ./set-nightly-job-time.sh
#
# Requirements:
#   - IMMICH_CONFIG_FILE environment variable must be set to the source config file path.
#   - Script must be run on a system with bash and the 'date' command.
# -----------------------------------------------------------------------------
#!/usr/bin/env bash
set -euo pipefail

echo "[INFO] Copying IMMICH config file from '$IMMICH_CONFIG_FILE' to '/tmp/immich_config.yaml'..."
cp /files/immich-config.yaml /tmp/immich_config.yaml

NIGHTLY_TASKS_OFFSET_MINUTES=${NIGHTLY_TASKS_OFFSET_MINUTES:-1}
NIGHTLY_TASKS_JITTER_MINUTES=${NIGHTLY_TASKS_JITTER_MINUTES:-0}

# Calculate random jitter (0..NIGHTLY_TASKS_JITTER_MINUTES) if jitter > 0
JITTER_APPLIED=0
if [ "$NIGHTLY_TASKS_JITTER_MINUTES" -gt 0 ]; then
  # Use $RANDOM (0-32767) scaled to jitter range
  JITTER_APPLIED=$(( RANDOM % (NIGHTLY_TASKS_JITTER_MINUTES + 1) ))
fi

TOTAL_OFFSET_MINUTES=$(( NIGHTLY_TASKS_OFFSET_MINUTES + JITTER_APPLIED ))

echo "[INFO] Calculating nightly job start time (current UTC time + ${NIGHTLY_TASKS_OFFSET_MINUTES} base minute(s) + ${JITTER_APPLIED} jitter = ${TOTAL_OFFSET_MINUTES} total)..."
if date -u -v+${TOTAL_OFFSET_MINUTES}M "+%H:%M" >/dev/null 2>&1; then
  NIGHTLY_TASKS_START_TIME=$(date -u -v+${TOTAL_OFFSET_MINUTES}M "+%H:%M")
  echo "[INFO] Using BSD/macOS date syntax."
else
  NIGHTLY_TASKS_START_TIME=$(date -u -d "+${TOTAL_OFFSET_MINUTES} minute" "+%H:%M")
  echo "[INFO] Using GNU/Linux date syntax."
fi
echo "[INFO] Nightly job start time set to '$NIGHTLY_TASKS_START_TIME' (jitter applied: ${JITTER_APPLIED} minute(s))."

echo "[INFO] Appending nightlyTasks section to '/tmp/immich_config.yaml'..."
cat <<EOF >> /tmp/immich_config.yaml
nightlyTasks:
  startTime: "$NIGHTLY_TASKS_START_TIME"
  # Base offset (minutes): ${NIGHTLY_TASKS_OFFSET_MINUTES}
  # Jitter range (minutes): ${NIGHTLY_TASKS_JITTER_MINUTES}
  # Jitter applied (minutes): ${JITTER_APPLIED}
  # Total offset (minutes): ${TOTAL_OFFSET_MINUTES}
EOF

export IMMICH_CONFIG_FILE="/tmp/immich_config.yaml"
echo "[INFO] IMMICH_CONFIG_FILE updated to '/tmp/immich_config.yaml'."
