# S3 Storage Backend — Gap Fix Plan

> Supplemental plan for services missed in the original `2026-03-02-s3-storage-plan.md`.

**Problem:** After implementing the S3 storage backend, uploading works but post-upload processing fails. The MetadataService, SmartInfoService, PersonService, and AssetMediaService all read files using DB-stored paths directly as filesystem paths. For S3 assets, these paths are relative keys (e.g. `upload/user1/ab/cd/file.jpg`) that don't exist on the local filesystem.

**Root cause:** The original plan covered the media pipeline (thumbnails, video encoding), serving, download, upload, and deletion — but missed the metadata extraction pipeline, ML inference pipeline, and file-replace flow.

**Pattern:** Same `ensureLocalFile` pattern from MediaService: download S3 object to temp → process locally → clean up temp. For writes, use `persistFile` or the backend directly.

---

## Task A: Update MetadataService for S3 (critical — blocks thumbnails)

**Files:**

- Modify: `server/src/services/metadata.service.ts`

**What's broken:**

1. `handleMetadataExtraction()` calls `storageRepository.stat(asset.originalPath)` — fails on relative keys
2. `getExifTags()` calls `metadataRepository.readTags(asset.originalPath)` — exiftool needs a local file
3. `getExifTags()` calls `metadataRepository.readTags(sidecarFile.path)` — same issue for sidecars
4. `getVideoTags()` calls `mediaRepository.probe(originalPath)` — ffprobe needs a local file
5. `applyMotionPhotos()` calls `storageRepository.readFile(asset.originalPath)` — needs local file
6. `applyMotionPhotos()` calls `storageRepository.createFile(motionAsset.originalPath)` — writes to filesystem
7. `handleSidecarWrite()` calls `metadataRepository.writeTags(sidecarPath)` — exiftool writes to filesystem
8. `handleSidecarCheck()` calls `storageRepository.checkFileExists()` — filesystem check

**Fix approach:**

Add imports:

```typescript
import { StorageService } from 'src/services/storage.service';
import { isAbsolute } from 'node:path';
```

Add the same `ensureLocalFile` helper as MediaService:

```typescript
private async ensureLocalFile(filePath: string): Promise<{ localPath: string; cleanup: () => Promise<void> }> {
  if (isAbsolute(filePath)) {
    return { localPath: filePath, cleanup: async () => {} };
  }
  const backend = StorageService.resolveBackendForKey(filePath);
  return backend.downloadToTemp(filePath);
}
```

Then wrap each entry point:

### handleMetadataExtraction (the main fix)

Wrap the method body: download original + sidecar to temp, use local paths for readTags/stat/probe, cleanup after.

```typescript
const { localPath: localOriginal, cleanup: cleanupOriginal } = await this.ensureLocalFile(asset.originalPath);
// Also download sidecar if it exists and is a relative key
try {
  const [exifTags, stats] = await Promise.all([
    this.getExifTags(asset, localOriginal), // pass local path
    this.storageRepository.stat(localOriginal), // stat local file
  ]);
  // ... rest of method unchanged ...
} finally {
  await cleanupOriginal();
}
```

Update `getExifTags` to accept an optional `localOriginalPath` parameter (same pattern as MediaService):

- Use `localOriginalPath` for `readTags()` and `probe()`
- Use `asset.originalPath` for type/mime checks

### applyMotionPhotos

- Download original to temp for reading the embedded video
- For the extracted motion video write: if S3 mode, write to temp then upload via backend, store relative key
- This is complex — the method creates a new asset with a new path, so need to use `StorageCore.getRelativeNestedPath` for the key and upload

### handleSidecarWrite

- For S3 assets, download original + sidecar to temp, write tags to temp sidecar, upload sidecar back to S3
- If no sidecar exists yet, create a temp file, write tags, upload to S3 with the relative key

### handleSidecarCheck

- For S3 assets, use `backend.exists()` instead of `storageRepository.checkFileExists()`

**Tests:**

- Run: `cd server && pnpm test -- --run src/services/metadata.service.spec.ts`
- Existing tests use absolute paths → disk mode → no change in behavior

**Commit:** `feat(server): add S3 support to MetadataService`

---

## Task B: Update ML repository for S3 file paths

**Files:**

- Modify: `server/src/repositories/machine-learning.repository.ts`

**What's broken:**

- `getFormData()` calls `readFile(payload.imagePath)` — fails on relative S3 keys
- Used by both `encodeImage()` (SmartInfoService) and `detectFaces()` (PersonService)

**Fix approach:**

The ML repo already reads the file into a buffer and sends it as bytes over HTTP. The fix is to download from S3 first when the path is relative:

```typescript
if ('imagePath' in payload) {
  let fileBuffer: Buffer;
  if (isAbsolute(payload.imagePath)) {
    fileBuffer = await readFile(payload.imagePath);
  } else {
    const backend = StorageService.resolveBackendForKey(payload.imagePath);
    const { stream } = await backend.get(payload.imagePath);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    fileBuffer = Buffer.concat(chunks);
  }
  formData.append('image', new Blob([new Uint8Array(fileBuffer)]));
}
```

This is simpler than `ensureLocalFile` — we just stream from S3 into memory since we need the bytes anyway (no need for a temp file).

**Tests:**

- Run: `cd server && pnpm test -- --run src/repositories/machine-learning.repository.spec.ts`

**Commit:** `feat(server): support S3 paths in ML repository`

---

## Task C: Update AssetMediaService.replaceFileData for S3

**Files:**

- Modify: `server/src/services/asset-media.service.ts`

**What's broken:**

- `replaceFileData()` calls `storageRepository.utimes(file.originalPath, ...)` — S3 doesn't support utimes

**Fix approach:**

Skip `utimes` for S3 assets (relative keys). S3 doesn't support setting file modification times. The mtime is already stored in the database (exif data), so the filesystem timestamp is not critical.

```typescript
if (isAbsolute(file.originalPath)) {
  await this.storageRepository.utimes(file.originalPath, new Date(), new Date(dto.fileModifiedAt));
}
```

Also need to handle the replace flow for S3: upload the replacement file to S3 and update the DB path.

**Tests:**

- Run: `cd server && pnpm test -- --run src/services/asset-media.service.spec.ts`

**Commit:** `feat(server): handle S3 paths in replaceFileData`

---

## Task D: Verify end-to-end with Docker

**Steps:**

1. Restart dev stack: `make dev`
2. Upload a photo with `IMMICH_STORAGE_BACKEND=s3`
3. Check server logs for errors during metadata extraction
4. Verify thumbnail appears on /photos page
5. Verify clicking an asset shows the full image
6. Verify CLIP search works (if ML service is running)

---

## Task order

A → B → C → D (sequential — A is the critical blocker, B and C are secondary)

## Summary

| Task | Service             | Complexity | Fix pattern                                       |
| ---- | ------------------- | ---------- | ------------------------------------------------- |
| A    | MetadataService     | High       | ensureLocalFile + persistFile for sidecars/motion |
| B    | ML Repository       | Low        | Stream S3 object into buffer                      |
| C    | AssetMediaService   | Low        | Skip utimes for relative keys                     |
| D    | Docker verification | —          | Manual test                                       |
