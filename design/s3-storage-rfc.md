# RFC: S3 Storage Backend for Immich

Author: Codex Agent
Date: 2025-09-16
Status: Draft

## Summary

Introduce an S3-compatible storage backend for Immich-managed media (originals, thumbnails, encoded videos, person thumbnails, backups). The goal is to replace local disk usage with an S3 bucket while maintaining compatibility with existing features and external libraries on local disks.

## Goals

- Store Immich-managed files in S3-compatible object storage (AWS S3, MinIO, etc.).
- Keep local/external library scanning and watching unchanged (still local FS).
- Allow streaming/downloading assets from S3 with efficient range requests.
- Support media processing (ffmpeg, sharp, exif metadata) via local temp staging.
- Provide a migration path from local filesystem to S3.

## Non-Goals (initial phases)

- Indexing S3 buckets as external libraries (no S3 “watch” equivalent).
- Replacing Postgres/Redis with cloud equivalents.
- Providing quota/usage metrics directly from the bucket (future improvement).

## Architecture

### High-level

- Add a pluggable storage backend abstraction used for Immich-managed paths.
- Continue to use the existing `StorageRepository` for local filesystem operations and for external libraries.
- Route operations by path prefix: if a file is under the configured Immich media base, use the configured backend (S3); otherwise, use local FS.

### Components

- Storage engine config (new):
  - engine: `local` | `s3`
  - s3: `{ endpoint, region, bucket, prefix, accessKey, secretKey, forcePathStyle, useAccelerate, sse?, sseKmsKeyId? }`

- Backend interface (new):
  - `IAppStorageBackend` (Immich-managed storage only)
    - `exists(key: string)`
    - `head(key: string)` -> `{ size, lastModified, etag }`
    - `readStream(key: string, range?: { start:number, end?:number })`
    - `writeStream(key: string)` -> `Writable`
    - `putObject(key: string, buffer: Buffer, metadata?: Record<string,string>)`
    - `copyObject(srcKey: string, dstKey: string)`
    - `moveObject(srcKey: string, dstKey: string)` (copy + delete)
    - `deleteObject(key: string)`
    - `ensurePrefix(prefix: string)` (no-op for S3)

- Backends:
  - `LocalAppStorageBackend`: implements interface via Node FS (adapts to keys using the configured media root path).
  - `S3AppStorageBackend`: implements via `@aws-sdk/client-s3`.

- Key mapping:
  - DB stores full “path” today. For S3, use URIs: `s3://<bucket>/<prefix>/<folder>/<user>/<...>/<file>`.
  - `StorageCore` will continue to produce relative keys and combine with base media location. For S3, base media location becomes `s3://bucket/prefix`.
  - Update `StorageCore.isImmichPath` to support both local absolute paths and `s3://` URIs.

- Delegation strategy:
  - Introduce `AppStorageService` that wraps `IAppStorageBackend` and exposes the subset of methods used by `StorageCore` and streaming endpoints (stat, read, write, rename, copy, unlink, utimes[no-op]).
  - Leave `StorageRepository` in place for library crawling/watching/local-only operations.

### Media processing

- ffmpeg/sharp/exiftool require local files.
- Strategy: Stage S3 objects into temp files for read/transform, upload the result back to S3, then delete temp files.
- Implement helpers:
  - `stageToTemp(key): Promise<string>` downloads to `StorageCore.getTempPathInDir(os.tmpdir())`.
  - `uploadFromTemp(tempPath, key)` uploads and removes the temp file.
  - Wrap `mediaRepository.transcode()` and image generation calls to detect S3 inputs/outputs and stage as needed.

### Streaming & downloads

- For `createReadStream(filePath, mimeType?)`, detect S3 URIs and return a stream created via `GetObjectCommand`, with support for HTTP range headers.
- For zip downloads: Replace `archiver.file(path)` with `archiver.append(stream, { name })` when source is S3.

### Mount checks & disk usage

- `StorageService` performs mount checks by writing `.immich` files to each folder. For S3 engine:
  - Skip mount checks for Immich-managed folders (read/write a test object instead via backend and mark checks as passed).
  - Keep checks for any local paths used by external libraries.
- `checkDiskUsage` is local-only; for S3 engine return a placeholder or skip (we can add “N/A” in the server info response or estimate via S3 `HeadBucket`/`GetBucketMetrics` in a later phase).

## Configuration

- Environment variables (server):
  - `IMMICH_STORAGE_ENGINE=local|s3`
  - `S3_ENDPOINT` (optional for MinIO)
  - `S3_REGION`
  - `S3_BUCKET`
  - `S3_PREFIX` (optional)
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `S3_FORCE_PATH_STYLE=true|false`
  - `S3_USE_ACCELERATE=true|false`
  - `S3_SSE=S3|KMS|AES256` (optional)
  - `S3_SSE_KMS_KEY_ID` (optional)

- Extend `server/src/dtos/env.dto.ts` and `ConfigRepository` to accept these. Default engine `local` remains backwards compatible.

## Data model

- Keep DB columns as strings; for S3 use the `s3://` URI. All path comparisons updated to support both styles.
- `StorageCore.getMediaLocation()` may be a local absolute path or an S3 base URI.

## Migration plan

1. Deploy MinIO/S3 and configure credentials.
2. Introduce engine `s3` with read/write path handling behind a feature flag (ship disabled by default).
3. Implement migration command in server CLI:
   - Copy local files under media root to S3 with same relative layout.
   - Update file paths in DB from `<root>/<...>` to `s3://bucket/prefix/<...>`.
   - Verify hashes/sizes when enabled.
   - Optionally retain local files until verification completes.
4. Switch runtime engine to `s3`.
5. Optionally clean up local media after successful cutover.

## Phases

- Phase 0: RFC + scaffolding
  - Add RFC, config schema draft, backend interface + local stub + S3 stub (unreferenced so builds unaffected).
- Phase 1: Read path support + streaming
  - Allow DB `s3://` URIs, add `StorageCore.isImmichPath` URI support.
  - Implement S3 read stream + zip support.
- Phase 2: Write path support
  - Ensure thumbnails/encoded videos written to S3; stage inputs/outputs.
- Phase 3: Migration tool
  - CLI to copy and rewrite DB paths safely.
- Phase 4: Remove/relax local mount checks for S3 engine, refine server info reporting.

## Testing strategy

- Unit tests:
  - Path resolution and `isImmichPath` for local vs s3 schemes.
  - S3 client mocks for read/write/copy/move.
- Integration tests (docker e2e):
  - Add MinIO to `e2e/docker-compose.yml`.
  - Verify upload → thumbnails generated → streaming via S3.
  - Verify zip download aggregates S3 object streams.

## Security

- Credentials via env or AWS IAM role (when running on AWS).
- Optional SSE (bucket default or per-object SSE configuration).
- Least-privilege policy: List/Get/Put/Delete on configured prefix.

## Open questions

- Do we need presigned URLs for very large downloads? (Future optimization.)
- How to present storage usage in UI when S3 is used? (Future work.)
- Should we fallback to local FS when S3 unavailable? (Probably fail fast.)

## Backwards compatibility

- Default engine remains `local`.
- No changes required for existing installations.

## Estimated impact

- Server code: StorageCore (path semantics), StorageService (mount checks), StorageRepository (zip streaming), MediaRepository (staging helpers), new AppStorage backends.
- Config: Dto + repository additions.
- Dev tooling: Optional MinIO service for e2e.

