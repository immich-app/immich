# S3 Storage Gaps: File Serving, Deletion, Email Attachments, Template Migration

## Problem

The S3 storage backend was added to the core asset pipeline (upload, media processing, metadata, downloads, ML), but several secondary code paths still assume disk-only storage. They break when assets or thumbnails are stored on S3 using relative keys instead of absolute filesystem paths.

### Affected code paths

1. **PersonService.getThumbnail()** — returns `ImmichFileResponse` with raw path; `sendFile()` calls `fs.access()` which fails for S3 relative keys
2. **PersonService.removeAllPeople()** — calls `storageRepository.unlink()` directly; fails silently for S3 keys
3. **UserService.getProfileImage()** — same serving issue as #1
4. **NotificationService.getAlbumThumbnailAttachment()** — passes file path to nodemailer's `path` field; nodemailer tries to read from disk, fails for S3
5. **StorageTemplateService.moveAsset()** — uses `storageRepository.rename()`/`copyFile()`; errors on S3 assets with no guard

## Design

### 1. Extract `serveFromBackend` to BaseService

Move the existing `serveFromBackend()` method from `AssetMediaService` (private) to `BaseService` (protected). This method resolves the storage backend for a given path, gets the serve strategy, and returns the appropriate `ImmichMediaResponse` (file, redirect, or stream).

All services inherit from `BaseService`, so `PersonService`, `UserService`, and `AssetMediaService` can all call `this.serveFromBackend()`.

**Files:** `server/src/services/base.service.ts`, `server/src/services/asset-media.service.ts`

### 2. Fix PersonService

**Serving (`getThumbnail`):** Change return type from `ImmichFileResponse` to `ImmichMediaResponse`. Replace direct `ImmichFileResponse` construction with `this.serveFromBackend(person.thumbnailPath, contentType, CacheControl.PrivateWithoutCache)`. No controller changes needed — `sendFile()` already handles all three response types.

**Deletion (`removeAllPeople`):** Replace `storageRepository.unlink(person.thumbnailPath)` with `jobRepository.queue({ name: JobName.FileDelete, data: { files: [...] } })`. The `FileDelete` handler already routes to the correct backend via `isAbsolute()` check. This makes deletion async (via job queue), consistent with all other file deletions in the codebase.

**File:** `server/src/services/person.service.ts`

### 3. Fix UserService

**Serving (`getProfileImage`):** Same pattern as PersonService — change return type to `ImmichMediaResponse`, call `this.serveFromBackend(user.profileImagePath, 'image/jpeg', CacheControl.None)`.

Profile image uploads (`createProfileImage`) remain disk-only — out of scope.

**File:** `server/src/services/user.service.ts`

### 4. Fix NotificationService email attachments

**`EmailImageAttachment` type:** Add optional `content?: Buffer` field. Make `path` optional. One of `path` or `content` must be set.

**`getAlbumThumbnailAttachment()`:** When thumbnail path is a relative S3 key, stream the object via `backend.get()` into a Buffer, return `{ filename, cid, content: buffer }`. When it's an absolute disk path, keep existing `{ filename, cid, path }` behavior.

**`EmailRepository.sendEmail()`:** Map attachments to nodemailer using whichever field is set — `path` for disk, `content` for S3 buffers.

**Files:** `server/src/types.ts`, `server/src/services/notification.service.ts`, `server/src/repositories/email.repository.ts`

### 5. Guard StorageTemplateService

**`handleMigrationSingle()`:** After fetching the asset, check `isAbsolute(asset.originalPath)`. If false (S3 asset), log a debug message and return `JobStatus.Skipped`. S3 assets use ID-based relative keys and don't participate in storage template migration.

**File:** `server/src/services/storage-template.service.ts`

## Testing

- Update `PersonService` tests: init `StorageService.diskBackend` in `beforeAll`, update `getThumbnail` success case to match `ImmichMediaResponse`, update `removeAllPeople` to expect `JobName.FileDelete` queue call instead of `storageRepository.unlink`
- Update `UserService` tests: same pattern for `getProfileImage`
- Update `NotificationService` tests: verify S3 path produces `content` buffer attachment
- Update `StorageTemplateService` tests: verify S3 assets (relative paths) return `JobStatus.Skipped`
- Run `AssetMediaService` tests to confirm `serveFromBackend` still works via inheritance
