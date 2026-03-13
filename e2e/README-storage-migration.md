# Storage Migration E2E Test

End-to-end test that validates migrating assets between local disk and S3 (MinIO) storage backends.

## Running

```bash
cd e2e

# Full workflow, keep infrastructure up after run
./storage-migration.sh

# Full workflow, tear down infrastructure after run
./storage-migration.sh --cleanup

# Run a single phase (useful for debugging)
./storage-migration.sh --phase setup
./storage-migration.sh --phase migrate-to-s3
./storage-migration.sh --phase migrate-to-disk

# Show docker logs inline
./storage-migration.sh --verbose
```

## Phases

1. **setup** - Uploads test assets (image, live photo, person crop) to Immich running on local disk storage.
2. **migrate-to-s3** - Triggers migration from disk to S3 (MinIO), then validates the results.
3. **migrate-to-disk** - Triggers migration from S3 back to disk, then validates the results.

## What it validates (per migration direction)

- DB paths are relative (S3) or absolute (disk)
- Assets accessible via Immich API (HTTP 200)
- Files exist in target storage (MinIO or disk) for all asset types:
  originals, thumbnails, previews, person thumbnails, profile images
- Files removed from source storage (`deleteSource: true`)
- Migration log entries created with correct direction and batch ID

## Known gaps

- No video asset upload (transcoding too slow/unreliable in e2e)
- No fullsize image testing
- No rollback endpoint testing
- No concurrent upload during migration testing
