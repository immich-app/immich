# Storage Migration

Noodle Gallery includes a built-in tool for migrating files between disk and S3-compatible object storage. You can migrate all your existing files from disk to S3, or from S3 back to disk.

## Features

- **Bidirectional** — Migrate from disk to S3, or from S3 to disk.
- **Configurable file types** — Choose which file types to migrate (originals, thumbnails, previews, full-size images, encoded videos, sidecars, person thumbnails, profile images).
- **Pre-migration estimate** — See file counts and estimated data size before starting.
- **Resumable** — If a migration is interrupted, simply start it again. Files already migrated are skipped automatically.
- **Idempotent** — Running a migration multiple times is safe. Already-migrated files are detected and skipped.
- **Rollback** — Every migration creates a batch ID. You can roll back an entire batch to restore the original file paths.
- **Configurable concurrency** — Control how many files are migrated in parallel.
- **Safe with concurrent uploads** — Uses optimistic concurrency to prevent conflicts with files being uploaded during migration.

## Prerequisites

1. **S3 storage must be configured.** Set up your S3 environment variables as described in the [S3 Storage documentation](/features/s3-storage).

2. **Set `IMMICH_STORAGE_BACKEND` to match the migration direction:**
   - To migrate **to S3**: set `IMMICH_STORAGE_BACKEND=s3`
   - To migrate **to disk**: set `IMMICH_STORAGE_BACKEND=disk`

   This ensures that new uploads during migration go to the correct backend.

3. **Restart Immich** after changing environment variables.

## Using the Admin UI

### Starting a Migration

1. Go to **Administration > Storage Migration** in the web UI.
2. Select the migration direction (Disk to S3 or S3 to Disk).
3. Click **Get Estimate** to see how many files will be migrated and the estimated data size.
4. Choose which file types to include (all are selected by default).
5. Set the concurrency level (default: 5). Higher values migrate faster but use more resources.
6. Choose whether to delete source files after successful migration.
7. Click **Start Migration**.

### Monitoring Progress

The status panel shows:

- Whether a migration is currently active
- Number of waiting, active, completed, and failed jobs

### Rolling Back

If you need to undo a migration:

1. Copy the **batch ID** from when the migration was started (shown in the UI and server logs).
2. Enter it in the **Rollback** section.
3. Click **Rollback**. This reverts all database path changes for that batch.

:::warning
Rollback only reverts the **database paths**. If you enabled "delete source files" during migration, the original files will have been removed and rollback cannot restore them. To fully revert, you would need to run a migration in the opposite direction.
:::

## Using the API

The migration tool exposes four API endpoints under `/storage-migration`:

### Get Estimate

```
GET /storage-migration/estimate?direction=toS3
```

Returns file counts by type and estimated total size in bytes.

### Start Migration

```
POST /storage-migration/start
Content-Type: application/json

{
  "direction": "toS3",
  "deleteSource": false,
  "concurrency": 5,
  "fileTypes": {
    "originals": true,
    "thumbnails": true,
    "previews": true,
    "fullsize": true,
    "encodedVideos": true,
    "sidecars": true,
    "personThumbnails": true,
    "profileImages": true
  }
}
```

Returns a `batchId` that can be used for rollback.

### Check Status

```
GET /storage-migration/status
```

Returns whether a migration is active and job counts.

### Rollback

```
POST /storage-migration/rollback/{batchId}
```

Reverts all path changes from the specified batch.

## Tips

- **Back up your database** before starting a migration. While the migration is designed to be safe, a database backup provides an extra safety net.
- **Start with a low concurrency** (e.g., 3-5) and increase if your system handles it well.
- **Leave "delete source" off** for the first migration so you can verify everything works before removing source files.
- **Only one migration can run at a time.** Starting a new migration while one is in progress will return an error.
