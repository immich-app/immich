# S3 Orphan Cleanup on User Delete — Design

## Context

`handleUserDelete` (`server/src/services/user.service.ts:261`) removes a deleted user's 5 disk folders via `fs.rm` and silently skips S3. On instances running `IMMICH_STORAGE_BACKEND=s3`, every deleted user's data stays in the bucket forever — assets, thumbnails, encoded video, profile images. Flagged as "tracked separately" in `2026-04-21-s3-relative-path-audit-design.md`; this design is the follow-up.

S3 key layout (all writes route through `StorageCore.getRelative*Path`): `<folder>/<ownerId>/<nested>/<filename>`. The four user-scoped folders written on S3:

- `upload/<userId>/<nested>/<assetId><ext>` — originals, sidecars, motion-photo `-MP.mp4`
- `profile/<userId>/<filename>` — profile images
- `thumbs/<userId>/<assetId>_*.{webp,jpeg}` and `thumbs/<userId>/<personId>.jpeg` — asset and person thumbnails (same prefix, both swept)
- `encoded-video/<userId>/<assetId>.mp4` — transcodes

Two `StorageFolder` enum values are intentionally excluded from the S3 sweep:

- `Library` — storage-template migration is a no-op on S3 (guard at `StorageCore.moveFile:189`, added by PR #391), so S3 never writes to `library/`. Disk cleanup for `library/<storageLabel ?? userId>/…` remains via existing `fs.rm`.
- `Backups` — admin/global scope, not per-user.

Related prior work: PR #398 (S3-relative-path audit). That PR's design doc flagged this exact bug as out of scope.

## Out of scope

- Backfill of orphans from pre-fix deletions. Documented workaround: `aws s3 rm --recursive s3://<bucket>/upload/<userId>/` per prefix, one prefix at a time. If an operator reports meaningful bucket bloat, add an admin endpoint as a follow-up PR.
- Shared/album assets — no duplication; S3 objects live under the owner's prefix only.
- External library assets — always absolute disk paths, never in the S3 bucket.
- Disk-only deployments — `StorageService.getS3Backend()` returns `undefined`, the S3 block is skipped (no client construction cost).
- Per-prefix object-count telemetry — cosmetic, adds SDK accounting complexity for no functional value.
- Concurrent deletion across prefixes — sequential execution deliberately bounds the throttling risk flagged below.

## Changes

### C1. Add `deletePrefix(prefix)` to the `StorageBackend` interface

```ts
// server/src/interfaces/storage-backend.interface.ts
interface StorageBackend {
  // ... existing ...
  /** Delete all objects/files under the given key prefix. Idempotent. No-op if nothing matches. */
  deletePrefix(prefix: string): Promise<void>;
}
```

**DiskStorageBackend**: `fs.rm(join(this.mediaLocation, prefix), { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })`. Retry options mirror the existing `storageRepository.unlinkDir` (`storage.repository.ts:159`) to preserve current semantics.

**S3StorageBackend**: `ListObjectsV2` paginated via `ContinuationToken` feeding `DeleteObjects` in 1000-key batches (both the `MaxKeys` and `DeleteObjects.Objects` SDK caps). Sequential; no concurrency — worsens throttling risk. Continue-on-error: on per-batch failures log at `warn` with the error's `Code`/`Message` (for `DeleteObjectsOutput.Errors`) or the thrown exception (for `List`/`Delete` transport errors); do not throw.

**No input validation on prefix.** A bare trailing-slash guard (e.g. rejecting `""`) is a half-measure — `"a/"` would still wipe anything under `a/` across the bucket. The real invariant lives at the call site: prefixes are always `<StorageFolder>/<uuid>/` built from an enum value and a UUID-validated `user.id`. If another caller adopts `deletePrefix`, their own review carries the scope-correctness check.

**Rationale for `deletePrefix` over a narrower `deleteUserScope(user)` helper**: composable, matches the S3 SDK primitive, reusable if future bulk-delete needs emerge, and keeps the backend interface domain-agnostic.

### C2. Rewrite `handleUserDelete` to call both backends

```ts
const diskFolders = [
  StorageCore.getLibraryFolder(user),
  StorageCore.getFolderLocation(StorageFolder.Upload, user.id),
  StorageCore.getFolderLocation(StorageFolder.Profile, user.id),
  StorageCore.getFolderLocation(StorageFolder.Thumbnails, user.id),
  StorageCore.getFolderLocation(StorageFolder.EncodedVideo, user.id),
];

// Disk: unchanged. Safe no-op if nothing lives there (fs.rm with force:true swallows ENOENT).
for (const folder of diskFolders) {
  this.logger.warn(`Removing user from filesystem: ${folder}`);
  await this.storageRepository.unlinkDir(folder, { recursive: true, force: true });
}

// S3: if configured, delete each user-scoped relative prefix.
// Library/Backups intentionally excluded — see Context.
const s3 = StorageService.getS3Backend();
if (s3) {
  const userScopedS3Folders = [
    StorageFolder.Upload,
    StorageFolder.Profile,
    StorageFolder.Thumbnails,
    StorageFolder.EncodedVideo,
  ] as const;
  for (const folder of userScopedS3Folders) {
    const prefix = `${folder}/${user.id}/`;
    try {
      await s3.deletePrefix(prefix);
      this.logger.log(`Cleaned S3 prefix ${prefix}`);
    } catch (error) {
      this.logger.warn(`Failed to clean S3 prefix ${prefix} for user ${user.id}`, error);
    }
  }
}
```

**Mixed-backend semantics**: both blocks run unconditionally (mod the S3-configured check). A disk instance skips S3 via `!getS3Backend()`. An S3 instance still runs the disk loop — safe because `/data/library/…` etc. are empty or absent on an S3-born instance (`fs.rm {force:true}` swallows ENOENT).

### C3. Logging

Per-prefix success log: `Cleaned S3 prefix upload/<uuid>/`. No object count — the SDK doesn't expose a cheap cumulative count without extra accounting, and the value is cosmetic. Per-prefix failure log: `warn` with the error object. On BullMQ retry, cleaned-prefix logs appear twice — acceptable; retries are rare and a duplicate log is harmless.

## Testing

### Unit

`server/src/backends/s3-storage.backend.spec.ts` — new `describe('deletePrefix', ...)`:

- 0 matches (`ListObjectsV2` returns empty `Contents`) → no `DeleteObjectsCommand` sent; returns cleanly.
- 1 batch (`Contents: [3 keys]`, `IsTruncated: false`) → 1 list call, 1 delete call with the 3 `Key`s.
- 2 list pages (`IsTruncated: true` + `NextContinuationToken` on first call, false on second) → 2 list calls, 2 delete calls.
- Partial failure: `DeleteObjectsCommand` resolves with `Errors: [{Key, Code, Message}]` (HTTP 200, not a thrown exception) → method logs the error entries at `warn`, does not throw, pagination continues.
- `ListObjectsV2Command` throws (transport/auth) → logs at `warn`, returns without attempting delete.

`server/src/backends/disk-storage.backend.spec.ts` — `deletePrefix` delegates to `fs.rm` with `{recursive: true, force: true, maxRetries: 5, retryDelay: 100}` on the `mediaLocation`-joined path.

`server/src/services/user.service.spec.ts` — extend `handleUserDelete` block:

- S3 configured → 5 `unlinkDir` calls AND 4 `s3.deletePrefix` calls with exactly `upload/<id>/`, `profile/<id>/`, `thumbs/<id>/`, `encoded-video/<id>/`.
- S3 not configured (`getS3Backend` returns `undefined`) → only `unlinkDir`, no S3 mock reached. Regression guard.
- One `s3.deletePrefix` throws → other 3 prefixes still attempted, disk loop still runs, `albumRepository.deleteAll` + `userRepository.delete` still run, `UserDelete` event still emitted. No orphan DB state.

### Integration

`server/src/backends/s3-storage.backend.integration.spec.ts` (gated on `IMMICH_TEST_DOCKER=true`): single case.

Pre-populate MinIO with 2500 keys under `test-prefix/`. Call `deletePrefix('test-prefix/')`. Assert `ListObjectsV2` on that prefix returns 0 keys post-delete. 2500 was chosen to cross both the 1000-key `ListObjectsV2` pagination boundary AND the 1000-key `DeleteObjects` batch boundary — one test exercises both.

### E2E

New phase `phaseUserDeleteS3Orphans` in `e2e/src/storage-migration.ts`:

1. Admin login.
2. `POST /admin/users` — create a disposable user (unique email: `orphan-test-<uniqueSuffix>@example.com`; capture the returned `id` from the response).
3. Login as the disposable user.
4. Upload 2 PNGs via the harness's `uploadAsset` helper.
5. `waitForProcessing` (drain metadata/thumbnails/etc.).
6. Enumerate MinIO keys under `upload/<id>/`, `thumbs/<id>/`, `profile/<id>/`, `encoded-video/<id>/`. Assert `upload/` and `thumbs/` non-empty. Do not assert `profile/` or `encoded-video/` — they may be empty depending on upload timing.
7. `DELETE /admin/users/<id>` body `{ force: true }` — queues `UserDelete` immediately (bypasses `deleteDelay`).
8. `waitForProcessing` (drain the `BackgroundTask` queue, where `UserDelete` runs).
9. Re-enumerate all 4 prefixes → assert all return 0 keys.

One new helper needed: MinIO list-by-prefix wrapper using `mc ls --recursive` (or AWS CLI). Chosen during implementation. Per `feedback_storage_migration_harness_conventions.md` the harness is self-contained; `createPng()` counter burn may be required if other phases collide.

Wire into `.github/workflows/storage-migration-tests.yml` after `phaseCopyAssetSidecarS3` — keeps the S3-live phases grouped.

### Manual smoke (via `/rc-personal`)

1. Create a disposable user on pierre.opennoodle.de, upload 2–3 photos, wait for thumbs.
2. Admin delete with `force: true`.
3. `docker logs gallery-server | grep 'Cleaned S3 prefix'` → see 4 lines.
4. Wasabi console → confirm `upload/<deleted-uuid>/` returns 0 objects.

## Rollout

- Single PR off today's `main` (already contains PR #398 — S3-relative-path audit).
- No database migration, no new env vars, no feature flag. Strictly additive; disk-only deployments see no difference.
- Rough diff budget: ~120 LOC production (interface + 2 impls + user.service changes) + ~220 LOC unit tests + ~60 LOC integration test + ~100 LOC e2e phase + workflow wire-up. If the plan grows materially beyond this, re-scope before continuing.
- Branch: `fix/s3-orphan-cleanup-user-delete`. PR title prefix: `fix(server)`.

## Risks

- **Bucket-wide delete from a misconstructed prefix.** Prefix is always `<StorageFolder enum>/<UUID>/`, never user-controlled input. Integration test uses non-overlapping `test-prefix/` scope. No guard inside `deletePrefix` itself — scope correctness lives at the call site.
- **Silent S3 throttling under high key counts.** Per-prefix `try/catch` with `warn` log. Operator-visible via log stream. Sequential (not parallel) across prefixes and inside pagination naturally bounds request rate. If throttling becomes an ops issue in practice, add backoff in `S3StorageBackend.deletePrefix` as a follow-up.
- **Interface churn breaks mocked tests.** Adding `deletePrefix` will cause TS errors wherever a mock `StorageBackend` literal is constructed. Known sites: `test/utils.ts` mock factory (if backends are covered) and `base.service.spec.ts`. Sweep during TDD — budget ~5 spec files for `deletePrefix: vi.fn()` stubs.
- **Job retry logs a duplicate "Cleaned" line.** BullMQ can re-run `UserDelete`. A retry will log `Cleaned S3 prefix …` again for an already-empty prefix. Acceptable — no data integrity impact; alternative (count-before-log) adds a round trip.
- **E2E test-user collisions.** Unique email suffix per phase invocation. Capture ID from `POST /admin/users` response, never assume a fixed UUID.

## Self-review findings (fixed before presenting)

Ran `code-reviewer` subagent on the draft. Issues surfaced and addressed:

- Library/Backups exclusion documented explicitly rather than hardcoded 4 strings without justification.
- Pagination numbers corrected: `ListObjectsV2.MaxKeys` and `DeleteObjects.Objects` are both capped at 1000. Integration test targets 2500 keys to exercise both boundaries.
- `DeleteObjects` partial-failure is HTTP 200 with `Errors` field, not a thrown exception. Unit test updated to assert log inspection of `response.Errors`.
- Force-delete API verified: `DELETE /admin/users/:id` body `{ force: true }` queues `JobName.UserDelete` immediately (via `user-admin.controller.ts:73` → `user-admin.service.ts:109`).
- Trailing-slash guard dropped as a half-measure; scope correctness documented as call-site invariant instead.
- Shared/album/external-library assets explicitly documented as no-ops in Out of scope.
