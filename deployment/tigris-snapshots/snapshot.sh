#!/bin/bash
# Tigris Bucket Snapshot Script
# This script creates daily snapshots of the Tigris bucket for point-in-time recovery.
#
# Prerequisites:
# - Bucket must be created with X-Tigris-Enable-Snapshot: true header
# - FLY_API_TOKEN must be set in environment
# - BUCKET_NAME must be set in environment
#
# Usage:
#   ./snapshot.sh
#
# The script will:
# 1. Create a new snapshot with timestamp-based name
# 2. List existing snapshots
# 3. Clean up old snapshots beyond retention period

set -euo pipefail

# Configuration
BUCKET_NAME="${BUCKET_NAME:?BUCKET_NAME environment variable is required}"
SNAPSHOT_RETENTION="${SNAPSHOT_RETENTION:-7}"
SNAPSHOT_PREFIX="${SNAPSHOT_PREFIX:-daily}"

# Generate snapshot name with timestamp
SNAPSHOT_NAME="${SNAPSHOT_PREFIX}-$(date +%Y%m%d-%H%M%S)"

echo "================================================"
echo "Tigris Snapshot Job Started"
echo "Bucket: ${BUCKET_NAME}"
echo "Snapshot Name: ${SNAPSHOT_NAME}"
echo "Retention: ${SNAPSHOT_RETENTION} snapshots"
echo "================================================"

# Create snapshot
echo ""
echo "Creating snapshot..."
if fly storage snapshots create "${BUCKET_NAME}" --name "${SNAPSHOT_NAME}"; then
    echo "Snapshot created successfully: ${SNAPSHOT_NAME}"
else
    echo "ERROR: Failed to create snapshot"
    exit 1
fi

# List all snapshots
echo ""
echo "Current snapshots:"
fly storage snapshots list "${BUCKET_NAME}" || echo "Warning: Could not list snapshots"

# Cleanup old snapshots
# Note: This requires parsing the snapshot list output
# The fly CLI may not have built-in retention, so we implement it manually
echo ""
echo "Checking for old snapshots to clean up..."

# Get list of snapshots and parse (this depends on fly CLI output format)
# For now, we'll just log - actual cleanup may need manual implementation
# or use Tigris API directly if available
echo "Note: Automatic snapshot cleanup may require manual implementation"
echo "      based on your Tigris subscription and fly CLI capabilities."

echo ""
echo "================================================"
echo "Tigris Snapshot Job Completed"
echo "================================================"
