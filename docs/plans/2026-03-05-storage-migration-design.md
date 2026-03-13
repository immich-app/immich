# Storage Migration: Disk <-> S3

## Overview

A bidirectional migration tool that moves existing files between disk and S3 storage backends. Runs as a BullMQ background job within Immich's existing job system. Designed to be idempotent, resumable, and non-breaking.

## Constraints

- **Non-breaking**: Users can switch back to upstream Immich by reverting DB paths. The existing hybrid path resolution (absolute = disk, relative = S3) ensures migrated and unmigrated files coexist.
- **Idempotent**: Re-running the migration skips already-migrated files. The orchestrator only streams files whose DB path points to the source backend.
- **Resumable**: If interrupted, restarting picks up where it left off — unmigrated files are naturally included in the next run.
- **Single migration at a time**: Only one migration job can be active. The start endpoint rejects requests if a migration is already running.

## Architecture

### Two-Phase Job Pattern

Following Immich's established pattern (thumbnail generation, library sync):

1. **Orchestrator** (`StorageMigrationQueueAll`): Streams all files from DB, filters to those on the source backend, queues individual worker jobs in batches of 1000.

2. **Worker** (`StorageMigration`): Processes a single file — uploads to target backend, verifies, updates DB path with optimistic concurrency, optionally deletes source, writes to migration log.

### Migration Log Table

New `storage_migration_log` table:

| Column       | Type            | Description                                                               |
| ------------ | --------------- | ------------------------------------------------------------------------- |
| `id`         | uuid (PK)       | Auto-generated                                                            |
| `entityType` | enum            | `asset`, `assetFile`, `person`, `user`                                    |
| `entityId`   | uuid            | ID of the asset/person/user                                               |
| `fileType`   | enum (nullable) | `original`, `encodedVideo`, `preview`, `thumbnail`, `fullsize`, `sidecar` |
| `oldPath`    | text            | Path before migration                                                     |
| `newPath`    | text            | Path after migration                                                      |
| `direction`  | enum            | `toS3`, `toDisk`                                                          |
| `migratedAt` | timestamptz     | Completion timestamp                                                      |
| `batchId`    | uuid            | Groups files from a single migration run                                  |

Enables rollback (query by batchId, swap paths), progress tracking, and auditability.

## Job Configuration

```typescript
interface IStorageMigrationOptions {
  direction: 'toS3' | 'toDisk';
  deleteSource: boolean; // default: false
  fileTypes: {
    // all default to true
    originals: boolean;
    thumbnails: boolean;
    previews: boolean;
    fullsize: boolean;
    encodedVideos: boolean;
    sidecars: boolean;
    personThumbnails: boolean;
    profileImages: boolean;
  };
  concurrency: number; // default: 5
}
```

## Concurrent Upload Safety

**Enforcement**: The migration refuses to start unless `IMMICH_STORAGE_BACKEND` matches the target direction. This ensures new uploads go to the target backend while the migration handles legacy files.

**Optimistic concurrency**: DB path updates use `WHERE path = :oldPath`. If another job (thumbnail gen, video encoding, storage template migration) changes the path between read and write, 0 rows are affected and the worker skips the file. Next migration run picks it up.

**File-not-found**: If a file doesn't exist on the source (e.g., still being generated), the worker skips it gracefully.

## Error Handling

- Per-file errors are caught and logged; worker returns `JobStatus.Failed`
- BullMQ retries failed jobs (3 retries, exponential backoff)
- After max retries, the file stays unmigrated — next migration run picks it up
- No partial state: if upload succeeds but DB update fails, the migration log is not written, so the file is retried

## Pre-Migration Estimate

A `GET /storage-migration/estimate` endpoint returns:

```typescript
{
  direction: 'toS3' | 'toDisk';
  fileCounts: {
    originals: number;
    thumbnails: number;
    previews: number;
    fullsize: number;
    encodedVideos: number;
    sidecars: number;
    personThumbnails: number;
    profileImages: number;
    total: number;
  }
  estimatedSizeBytes: number; // from exif.fileSizeInByte (originals only)
}
```

Size estimate covers originals only (DB-sourced). Generated file sizes are not tracked in the DB — the estimate is labeled as a minimum.

## API Endpoints

| Method | Path                                   | Description                             |
| ------ | -------------------------------------- | --------------------------------------- |
| GET    | `/storage-migration/estimate`          | File counts and estimated size per type |
| POST   | `/storage-migration/start`             | Start migration with options            |
| GET    | `/storage-migration/status`            | Running/idle, progress, batch ID        |
| POST   | `/storage-migration/rollback/:batchId` | Roll back a completed migration batch   |

All endpoints require admin authentication.

## Admin UI

A new section under admin settings:

- Direction selector (disk -> S3 / S3 -> disk)
- File type checkboxes (which types to migrate)
- Delete source toggle
- Concurrency slider
- Estimate display (file counts + estimated size)
- Start / Stop / Rollback controls
- Progress indicator (from queue job counts)

## Validation

Before starting a migration:

1. `IMMICH_STORAGE_BACKEND` must match target direction (enforced)
2. S3 connection test (HEAD request to bucket)
3. For `toDisk`: verify upload directory is writable
4. No other migration already running

## Rollback

Query `storage_migration_log` by `batchId`, update each entity's path back to `oldPath`, delete log entries. If `deleteSource` was false, the original files are still on disk — rollback is instant. If `deleteSource` was true, files must be copied back from the target.
