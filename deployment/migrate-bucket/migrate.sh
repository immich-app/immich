#!/bin/bash
set -e

echo "=== Tigris Bucket Migration ==="
echo "From: ${OLD_BUCKET} @ ${OLD_ENDPOINT}"
echo "To:   ${NEW_BUCKET} @ ${NEW_ENDPOINT}"
echo ""

# Create rclone config
mkdir -p ~/.config/rclone
cat > ~/.config/rclone/rclone.conf << EOF
[old]
type = s3
provider = Other
endpoint = ${OLD_ENDPOINT}
access_key_id = ${OLD_ACCESS_KEY}
secret_access_key = ${OLD_SECRET_KEY}
region = auto

[new]
type = s3
provider = Other
endpoint = ${NEW_ENDPOINT}
access_key_id = ${NEW_ACCESS_KEY}
secret_access_key = ${NEW_SECRET_KEY}
region = auto
EOF

echo "Checking source bucket..."
rclone size old:${OLD_BUCKET}

echo ""
echo "Checking destination bucket..."
rclone size new:${NEW_BUCKET} || echo "(empty or new bucket)"

echo ""
echo "Starting sync (preserving storage classes)..."
rclone sync old:${OLD_BUCKET} new:${NEW_BUCKET} \
  --progress \
  --transfers 32 \
  --checkers 16 \
  --fast-list \
  --checksum \
  --stats 30s \
  --metadata

echo ""
echo "=== Migration Complete ==="
echo "Verifying..."
echo ""
echo "Source:"
rclone size old:${OLD_BUCKET}
echo ""
echo "Destination:"
rclone size new:${NEW_BUCKET}

echo ""
echo "Running integrity check..."
rclone check old:${OLD_BUCKET} new:${NEW_BUCKET} --one-way
echo ""
echo "Migration successful!"
