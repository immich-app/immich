# S3 Storage Backend Design

## Overview

Add S3-compatible object storage as an alternative to local disk for storing media files (originals, thumbnails, encoded video, sidecars). The system supports both backends simultaneously — old assets remain on disk, new assets go to whichever backend is configured. This is a write-path switch, not a migration tool.

## Decisions

- **Approach:** New `StorageBackend` abstraction alongside existing `StorageRepository` (not polymorphic refactor)
- **Serving:** Configurable — presigned URL redirects (default) or proxy through server
- **S3 provider target:** AWS S3 (others may work but aren't explicitly supported)
- **Storage template:** Sets the initial S3 key at upload time; no re-organization on template change
- **S3 moves:** No physical copy+delete; template changes don't move S3 objects
- **Sidecars:** Included — stored in S3 alongside media files
- **Mixed mode:** Both backends always initialized; config controls where new files are written; path format (absolute vs relative) determines which backend reads them

## 1. StorageBackend Interface

```typescript
interface StorageBackend {
  put(key: string, source: Readable | Buffer, metadata?: { contentType?: string }): Promise<void>;
  get(key: string): Promise<{ stream: Readable; contentType?: string; length?: number }>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  getServeStrategy(key: string, contentType: string): Promise<ServeStrategy>;
  downloadToTemp(key: string): Promise<{ tempPath: string; cleanup: () => Promise<void> }>;
}

type ServeStrategy =
  | { type: 'file'; path: string }
  | { type: 'redirect'; url: string }
  | { type: 'stream'; stream: Readable; length?: number };
```

**DiskStorageBackend:**

- `put` writes to `{mediaLocation}/{key}`, creating directories as needed
- `get` returns a `createReadStream` on the local file
- `getServeStrategy` always returns `{ type: 'file', path }`
- `downloadToTemp` returns the real path directly (no copy needed)

**S3StorageBackend:**

- `put` uses `@aws-sdk/lib-storage` Upload for multipart support on large files
- `get` returns the S3 GetObject body stream
- `getServeStrategy` returns `redirect` (presigned URL) or `stream` (proxy) based on config
- `downloadToTemp` downloads to a temp file and returns path + cleanup function

**Backend resolution:** Both backends are always instantiated. A resolver function determines which to use:

```typescript
function resolveBackend(key: string): StorageBackend {
  if (path.isAbsolute(key)) return diskBackend; // legacy disk asset
  return s3Backend; // new S3 asset
}
```

The `IMMICH_STORAGE_BACKEND` config only controls the write path (where new assets go).

### Verification

- **Unit tests for DiskStorageBackend:** Test put/get/exists/delete against a temp directory. Verify `getServeStrategy` returns `file` type. Verify `downloadToTemp` returns the actual path without copying.
- **Unit tests for S3StorageBackend:** Mock `@aws-sdk/client-s3` calls. Verify `put` uses multipart upload. Verify `getServeStrategy` returns `redirect` with a valid presigned URL structure when configured for redirect, and `stream` when configured for proxy. Verify `downloadToTemp` writes to temp and cleanup deletes the file.
- **Unit tests for resolveBackend:** Absolute paths resolve to disk, relative paths resolve to S3.
- **Integration test:** Spin up MinIO in a test container. Run put/get/exists/delete against it. Verify round-trip: put a file, get it back, compare bytes.

## 2. Configuration

Environment variables:

```
IMMICH_STORAGE_BACKEND=disk|s3          # default: disk — controls where NEW files are written
IMMICH_S3_BUCKET=my-immich-bucket
IMMICH_S3_REGION=us-east-1
IMMICH_S3_ENDPOINT=https://s3.amazonaws.com   # optional, for custom endpoints
IMMICH_S3_ACCESS_KEY_ID=...                    # optional, falls back to IAM role
IMMICH_S3_SECRET_ACCESS_KEY=...                # optional, falls back to IAM role
IMMICH_S3_PRESIGNED_URL_EXPIRY=3600            # seconds, default 1 hour
IMMICH_S3_SERVE_MODE=redirect|proxy            # default: redirect
```

When `IMMICH_STORAGE_BACKEND=disk`, all S3 vars are ignored and everything works exactly as today. Both backends are always initialized so mixed-mode serving works.

### Verification

- **Unit test:** Config parsing with all vars set, with only required vars, with `disk` backend (S3 vars ignored).
- **Unit test:** Validation — `s3` backend requires `IMMICH_S3_BUCKET`; missing it throws a clear startup error.
- **Integration test:** Start server with `IMMICH_STORAGE_BACKEND=disk`, verify S3 code is not invoked for uploads. Start with `s3`, verify uploads go to S3.

## 3. Storage Keys

DB columns that store file paths (`assets.originalPath`, `assets.encodedVideoPath`, `assets.sidecarPath`, `asset_files.path`, `person.thumbnailPath`) use two formats:

- **Absolute path** (starts with `/`): legacy disk asset, resolved by DiskStorageBackend
- **Relative key** (no leading `/`): S3 asset, used as the S3 object key directly

Key format examples:

```
upload/user123/ab/cd/original.jpg
thumbs/user123/ab/cd/thumb.webp
encoded-video/user123/ab/cd/video.mp4
sidecar/user123/ab/cd/original.xmp
```

S3 bucket/endpoint info is not stored in the DB — it comes from config at runtime. This mirrors how `IMMICH_MEDIA_LOCATION` works for disk paths today.

**StorageCore changes:** Path-building methods return relative keys (without `mediaLocation` prefix). The backend prepends `mediaLocation` (disk) or uses the key as-is (S3).

No schema migration needed — columns are already strings.

### Verification

- **Unit tests for StorageCore:** Verify path methods return relative keys without leading `/` or `mediaLocation` prefix.
- **Unit test:** Verify DiskStorageBackend resolves key to `{mediaLocation}/{key}`.
- **Unit test:** Verify S3StorageBackend uses key as-is for S3 object key.
- **DB test:** Insert an asset with a relative key, read it back, verify `resolveBackend` picks S3.

## 4. Upload Flow

```
Client → multer (writes to disk temp) → SHA1 computed during stream
  → storage template computes final key from metadata
  → if S3: upload temp file to S3 at final key, create DB record with relative key, delete temp
  → if disk: move temp file to final path, create DB record with absolute path (existing behavior)
  → metadata extraction job runs
    → if S3: downloads from S3 to temp, extracts EXIF, cleans up temp
    → if disk: reads directly from disk (existing behavior)
```

Key points:

- Multer still writes to local disk first (streaming SHA1 checksum requirement)
- Storage template determines the initial S3 key at upload time — one write, no subsequent move
- Large uploads use `@aws-sdk/lib-storage` multipart upload
- Temp files are cleaned up after S3 upload completes

### Verification

- **Unit test:** Mock S3 backend. Upload a file with `IMMICH_STORAGE_BACKEND=s3`. Verify: temp file created, `backend.put` called with correct key, DB record has relative key, temp file deleted.
- **Unit test:** Upload with `IMMICH_STORAGE_BACKEND=disk`. Verify existing behavior unchanged — absolute path in DB, no S3 interaction.
- **Integration test (MinIO):** Upload a real image. Verify the object exists in MinIO at the expected key. Verify the DB record has the correct relative key. Download the object and compare bytes to the original.
- **Integration test:** Upload, then run metadata extraction job. Verify EXIF data is correctly extracted (proves the download-to-temp-for-exiftool path works).

## 5. Thumbnail & Transcode Flow

```
Job picks up asset
  → if S3: download original from S3 to temp
  → if disk: read original directly (existing behavior)
  → ffmpeg/sharp processes to local temp output
  → if S3: upload output to S3, save relative key in DB, clean up temps
  → if disk: save to final disk path, save absolute path in DB (existing behavior)
```

Applies to: thumbnail generation (sharp), video transcoding (ffmpeg), sidecar extraction.

The processing code (ffmpeg, sharp, exiftool) doesn't change — it reads and writes local file paths. The S3 interaction is a bracket around the processing: download before, upload after, clean up temps.

Temp files use `os.tmpdir()` with an `immich-` prefix.

### Verification

- **Unit test:** Mock S3 backend. Trigger thumbnail generation for an S3 asset. Verify: `downloadToTemp` called, sharp processes the temp file, `put` called with thumbnail key, temp files cleaned up, DB updated with relative key.
- **Unit test:** Trigger thumbnail generation for a disk asset. Verify existing behavior unchanged.
- **Integration test (MinIO):** Upload an image to MinIO, trigger thumbnail job, verify thumbnail object exists in MinIO. Download thumbnail, verify it's a valid image.
- **Integration test (MinIO):** Upload a video to MinIO, trigger transcode job, verify encoded video exists in MinIO. Download and verify it's a valid video.
- **Error handling test:** Simulate S3 upload failure after processing. Verify temp files are still cleaned up (no temp disk leaks). Verify job fails gracefully and can be retried.

## 6. File Serving Flow

```
Controller → reads key from DB
  → resolveBackend(key): absolute → diskBackend, relative → s3Backend
  → backend.getServeStrategy(key, contentType)
  → 'file'     → res.sendFile(path)           // disk assets
  → 'redirect' → res.redirect(presignedUrl)   // S3 redirect mode
  → 'stream'   → pipe stream to response      // S3 proxy mode
```

Applies to all file-serving endpoints: asset originals, thumbnails, video playback, person thumbnails, sidecar downloads.

`ImmichFileResponse` is extended to support redirect and stream strategies alongside the existing `sendFile`.

Mixed mode works naturally — the path format determines the backend, which determines the serve strategy.

### Verification

- **Unit test:** Request a disk asset (absolute path in DB). Verify `sendFile` called with correct path.
- **Unit test:** Request an S3 asset in redirect mode. Verify response is 302 with a presigned URL.
- **Unit test:** Request an S3 asset in proxy mode. Verify response streams the S3 object body.
- **Integration test (MinIO):** Upload an image to MinIO. Request it via the API in redirect mode. Verify 302 redirect with a working presigned URL that returns the correct bytes.
- **Integration test (MinIO):** Same test in proxy mode. Verify response bytes match the original.
- **Mixed mode test:** Have one disk asset and one S3 asset. Request both via the same API. Verify disk asset returns via `sendFile`, S3 asset returns via redirect. Both return correct bytes.
- **Presigned URL expiry test:** Generate a presigned URL, wait for expiry, verify it returns 403.

## 7. Download (ZIP) Flow

The download service streams multiple assets into a ZIP archive. For S3 assets, each file is streamed from S3 into the ZIP stream (no need to download entire files to disk first — they can be piped directly).

### Verification

- **Integration test:** Create a ZIP download containing both disk and S3 assets. Verify the ZIP is valid and contains all files with correct bytes.

## 8. Files That Change

| Layer                  | File(s)                                           | Change                                                 |
| ---------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| Config                 | `config.repository.ts`, `config.ts`               | Add S3 env vars and config types                       |
| Backend interface      | New `src/interfaces/storage-backend.interface.ts` | New file                                               |
| Disk backend           | New `src/backends/disk-storage.backend.ts`        | Wraps existing local fs ops                            |
| S3 backend             | New `src/backends/s3-storage.backend.ts`          | AWS SDK S3 client                                      |
| Backend factory        | `app.module.ts` or new provider                   | Instantiate both backends, provide resolver            |
| StorageCore            | `cores/storage.core.ts`                           | Path methods return relative keys                      |
| Upload interceptor     | `middleware/file-upload.interceptor.ts`           | After multer writes temp, upload to S3 if enabled      |
| Asset media service    | `services/asset-media.service.ts`                 | Use backend for serve/download                         |
| Media service          | `services/media.service.ts`                       | Bracket processing with downloadToTemp/put             |
| File utils             | `utils/file.ts`                                   | ImmichFileResponse supports redirect/stream strategies |
| Asset media controller | `controllers/asset-media.controller.ts`           | Handle redirect/stream responses                       |
| Storage service        | `services/storage.service.ts`                     | Bootstrap initializes both backends                    |
| Download service       | `services/download.service.ts`                    | ZIP streaming from S3                                  |
| Person service         | `services/person.service.ts`                      | Use backend for person thumbnail paths                 |

## 9. What Stays the Same

- External libraries (isExternal assets) — local paths, not managed by StorageBackend
- File watcher (chokidar for library scanning) — local-only
- StorageRepository — unchanged, still handles filesystem ops (directory creation, watching, crawling)
- Profile photos — follow the same StorageBackend pattern
- All existing disk-mode behavior — no changes when `IMMICH_STORAGE_BACKEND=disk`

## 10. Dependencies

- `@aws-sdk/client-s3` — S3 API calls
- `@aws-sdk/s3-request-presigner` — presigned URL generation
- `@aws-sdk/lib-storage` — multipart uploads
- `testcontainers` (dev) — MinIO container for integration tests
