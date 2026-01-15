#!/bin/bash
# Glacier Archive Script
#
# This script syncs Immich data from Tigris to AWS Glacier Deep Archive
# for disaster recovery purposes.
#
# Prerequisites:
# - rclone installed and configured with 'tigris' and 'glacier' remotes
# - AWS credentials with S3/Glacier access
# - Tigris credentials
#
# Configuration:
# - TIGRIS_BUCKET: Source Tigris bucket name
# - GLACIER_BUCKET: Destination AWS S3 bucket name
# - RCLONE_CONFIG: Path to rclone config file (optional)
#
# Usage:
#   ./archive.sh
#
# This will sync:
# - Original photos/videos (users/ prefix)
# - Database backups (backups/ prefix)
# - Profile images (profile/ prefix)
#
# It will NOT sync (regenerable data):
# - Thumbnails (thumbs/)
# - Previews
# - Encoded videos (can be re-encoded)

set -euo pipefail

# Configuration
TIGRIS_BUCKET="${TIGRIS_BUCKET:?TIGRIS_BUCKET environment variable is required}"
GLACIER_BUCKET="${GLACIER_BUCKET:?GLACIER_BUCKET environment variable is required}"
RCLONE_TRANSFERS="${RCLONE_TRANSFERS:-8}"
RCLONE_CHECKERS="${RCLONE_CHECKERS:-16}"
DRY_RUN="${DRY_RUN:-false}"

# Rclone common flags
RCLONE_FLAGS=(
    --transfers "$RCLONE_TRANSFERS"
    --checkers "$RCLONE_CHECKERS"
    --fast-list
    --stats 30s
    --stats-one-line
    --log-level INFO
)

if [ "$DRY_RUN" = "true" ]; then
    RCLONE_FLAGS+=(--dry-run)
    echo "DRY RUN MODE - No changes will be made"
fi

echo "================================================"
echo "Glacier Archive Job Started"
echo "Source: tigris:${TIGRIS_BUCKET}"
echo "Destination: glacier:${GLACIER_BUCKET}"
echo "Transfers: ${RCLONE_TRANSFERS}"
echo "Dry Run: ${DRY_RUN}"
echo "================================================"

# Archive originals (users/ folder contains originals when using S3)
echo ""
echo "[1/3] Archiving originals..."
rclone sync "tigris:${TIGRIS_BUCKET}/users" "glacier:${GLACIER_BUCKET}/users" \
    "${RCLONE_FLAGS[@]}" \
    --s3-storage-class DEEP_ARCHIVE \
    --exclude "**/thumbs/**" \
    --exclude "**/previews/**" \
    --exclude "**/encoded-video/**" || {
        echo "Warning: Originals sync had errors (continuing...)"
    }

# Archive database backups
echo ""
echo "[2/3] Archiving database backups..."
rclone sync "tigris:${TIGRIS_BUCKET}/backups" "glacier:${GLACIER_BUCKET}/backups" \
    "${RCLONE_FLAGS[@]}" \
    --s3-storage-class DEEP_ARCHIVE || {
        echo "Warning: Backups sync had errors (continuing...)"
    }

# Archive profile images
echo ""
echo "[3/3] Archiving profile images..."
rclone sync "tigris:${TIGRIS_BUCKET}/profile" "glacier:${GLACIER_BUCKET}/profile" \
    "${RCLONE_FLAGS[@]}" \
    --s3-storage-class DEEP_ARCHIVE || {
        echo "Warning: Profile sync had errors (continuing...)"
    }

echo ""
echo "================================================"
echo "Glacier Archive Job Completed"
echo "================================================"
echo ""
echo "Note: Objects archived to Glacier Deep Archive have:"
echo "  - 12-48 hour retrieval time"
echo "  - ~\$1/TB/month storage cost"
echo "  - Minimum 180-day storage duration"
