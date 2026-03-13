# S3 Storage Gaps: Serving, Deletion, Email, Template Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 4 code paths that break when assets/thumbnails are stored on S3 instead of disk.

**Architecture:** Extract the existing `serveFromBackend` pattern to `BaseService` so all services can resolve S3 vs disk for file serving. Route person thumbnail deletion through the existing `FileDelete` job. Support Buffer-based email attachments for S3-stored thumbnails. Guard storage template migration to skip S3 assets.

**Tech Stack:** NestJS, TypeScript, Vitest, AWS S3 SDK (existing)

---

### Task 1: Extract `serveFromBackend` to BaseService

**Files:**

- Modify: `server/src/services/base.service.ts`
- Modify: `server/src/services/asset-media.service.ts:326-359`

**Step 1: Add imports and method to BaseService**

In `server/src/services/base.service.ts`, add the import at the top:

```typescript
import { StorageService } from 'src/services/storage.service';
import { ImmichFileResponse, ImmichMediaResponse, ImmichRedirectResponse, ImmichStreamResponse } from 'src/utils/file';
import { CacheControl } from 'src/enum';
```

Add this protected method to the `BaseService` class, after the `createUser` method:

```typescript
protected async serveFromBackend(
  filePath: string,
  contentType: string,
  cacheControl: CacheControl,
  fileName?: string,
): Promise<ImmichMediaResponse> {
  const backend = StorageService.resolveBackendForKey(filePath);
  const strategy = await backend.getServeStrategy(filePath, contentType);

  switch (strategy.type) {
    case 'file': {
      return new ImmichFileResponse({
        path: strategy.path,
        contentType,
        cacheControl,
        fileName,
      });
    }
    case 'redirect': {
      return new ImmichRedirectResponse({
        url: strategy.url,
        cacheControl,
      });
    }
    case 'stream': {
      return new ImmichStreamResponse({
        stream: strategy.stream,
        contentType,
        length: strategy.length,
        cacheControl,
        fileName,
      });
    }
  }
}
```

**Step 2: Remove the private copy from AssetMediaService**

In `server/src/services/asset-media.service.ts`, delete the private `serveFromBackend` method (lines 326-359). The existing calls (`this.serveFromBackend(...)` at lines 220, 267, 281) will now resolve to the inherited `BaseService` method.

Also remove the now-unused imports from `asset-media.service.ts`:

- `ImmichRedirectResponse` (no longer referenced directly)
- `ImmichStreamResponse` (no longer referenced directly)
- `StorageService` import (only if no other usage remains — check first)

**Step 3: Run existing AssetMediaService tests**

Run: `cd server && pnpm test -- --run src/services/asset-media.service.spec.ts`
Expected: All tests pass — behavior is unchanged, method is just inherited now.

**Step 4: Commit**

```
feat(server): extract serveFromBackend to BaseService
```

---

### Task 2: Fix PersonService.getThumbnail()

**Files:**

- Modify: `server/src/services/person.service.ts:44,165-177`
- Modify: `server/src/services/person.service.spec.ts:7,115-161`

**Step 1: Update the import in the test file**

In `server/src/services/person.service.spec.ts`, change the import at line 7:

```typescript
// Before
import { ImmichFileResponse } from 'src/utils/file';
// After
import { ImmichFileResponse } from 'src/utils/file';
import { DiskStorageBackend } from 'src/backends/disk-storage.backend';
import { StorageService } from 'src/services/storage.service';
```

Add a `beforeAll` block before the existing `beforeEach` (after line 19):

```typescript
beforeAll(() => {
  (StorageService as any).diskBackend = new DiskStorageBackend('/data');
});
```

**Step 2: Update the success test assertion**

The test at line 146 ("should serve the thumbnail") currently expects `ImmichFileResponse`. After the change, `serveFromBackend` with a disk backend still returns `ImmichFileResponse` (because `DiskStorageBackend.getServeStrategy` returns `{ type: 'file' }`), so the assertion remains valid. No test change needed for the assertion itself.

**Step 3: Run test to verify it passes as-is**

Run: `cd server && pnpm test -- --run src/services/person.service.spec.ts`
Expected: PASS (no functional change yet, just test setup)

**Step 4: Update PersonService.getThumbnail()**

In `server/src/services/person.service.ts`:

Change the import at line 44 from:

```typescript
import { ImmichFileResponse } from 'src/utils/file';
```

to:

```typescript
import { ImmichMediaResponse } from 'src/utils/file';
```

Replace `getThumbnail` method (lines 165-177):

```typescript
async getThumbnail(auth: AuthDto, id: string): Promise<ImmichMediaResponse> {
  await this.requireAccess({ auth, permission: Permission.PersonRead, ids: [id] });
  const person = await this.personRepository.getById(id);
  if (!person || !person.thumbnailPath) {
    throw new NotFoundException();
  }

  return this.serveFromBackend(
    person.thumbnailPath,
    mimeTypes.lookup(person.thumbnailPath),
    CacheControl.PrivateWithoutCache,
  );
}
```

**Step 5: Run tests**

Run: `cd server && pnpm test -- --run src/services/person.service.spec.ts`
Expected: All tests pass.

**Step 6: Commit**

```
feat(server): support S3 paths in PersonService.getThumbnail
```

---

### Task 3: Fix PersonService.removeAllPeople()

**Files:**

- Modify: `server/src/services/person.service.ts:255-260`
- Modify: `server/src/services/person.service.spec.ts:440-451`

**Step 1: Update the test**

In `server/src/services/person.service.spec.ts`, update the `handlePersonCleanup` test (line 440):

```typescript
describe('handlePersonCleanup', () => {
  it('should delete people without faces', async () => {
    const person = PersonFactory.create();

    mocks.person.getAllWithoutFaces.mockResolvedValue([person]);

    await sut.handlePersonCleanup();

    expect(mocks.person.delete).toHaveBeenCalledWith([person.id]);
    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.FileDelete,
      data: { files: [person.thumbnailPath] },
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/services/person.service.spec.ts`
Expected: FAIL — test expects `job.queue` with `FileDelete` but code still calls `storage.unlink`.

**Step 3: Update removeAllPeople()**

In `server/src/services/person.service.ts`, replace `removeAllPeople` (lines 255-260):

```typescript
@Chunked()
private async removeAllPeople(people: { id: string; thumbnailPath: string }[]) {
  const files = people.map((person) => person.thumbnailPath);
  await this.jobRepository.queue({ name: JobName.FileDelete, data: { files } });
  await this.personRepository.delete(people.map((person) => person.id));
  this.logger.debug(`Deleted ${people.length} people`);
}
```

**Step 4: Run tests**

Run: `cd server && pnpm test -- --run src/services/person.service.spec.ts`
Expected: All tests pass.

**Step 5: Commit**

```
feat(server): route person thumbnail deletion through FileDelete job
```

---

### Task 4: Fix UserService.getProfileImage()

**Files:**

- Modify: `server/src/services/user.service.ts:18,121-132`
- Modify: `server/src/services/user.service.spec.ts:1-10,18-27,180-193`

**Step 1: Update test imports and setup**

In `server/src/services/user.service.spec.ts`:

Change the import at line 5:

```typescript
// Before
import { ImmichFileResponse } from 'src/utils/file';
// After
import { ImmichFileResponse } from 'src/utils/file';
import { DiskStorageBackend } from 'src/backends/disk-storage.backend';
import { StorageService } from 'src/services/storage.service';
```

Add a `beforeAll` block before the existing `beforeEach` (after line 18):

```typescript
beforeAll(() => {
  (StorageService as any).diskBackend = new DiskStorageBackend('/data');
});
```

**Step 2: Run test to verify it passes as-is**

Run: `cd server && pnpm test -- --run src/services/user.service.spec.ts`
Expected: PASS

**Step 3: Update UserService.getProfileImage()**

In `server/src/services/user.service.ts`:

Change the import at line 18:

```typescript
// Before
import { ImmichFileResponse } from 'src/utils/file';
// After
import { ImmichMediaResponse } from 'src/utils/file';
```

Replace `getProfileImage` method (lines 121-132):

```typescript
async getProfileImage(id: string): Promise<ImmichMediaResponse> {
  const user = await this.findOrFail(id, {});
  if (!user.profileImagePath) {
    throw new NotFoundException('User does not have a profile image');
  }

  return this.serveFromBackend(user.profileImagePath, 'image/jpeg', CacheControl.None);
}
```

**Step 4: Run tests**

Run: `cd server && pnpm test -- --run src/services/user.service.spec.ts`
Expected: All tests pass (disk backend returns `ImmichFileResponse`, matching existing assertions).

**Step 5: Commit**

```
feat(server): support S3 paths in UserService.getProfileImage
```

---

### Task 5: Fix NotificationService email attachments

**Files:**

- Modify: `server/src/types.ts:236-240`
- Modify: `server/src/repositories/email.repository.ts:127-131`
- Modify: `server/src/services/notification.service.ts:1-32,435-456`
- Modify: `server/src/services/notification.service.spec.ts` (add S3 test)

**Step 1: Update EmailImageAttachment type**

In `server/src/types.ts`, replace lines 236-240:

```typescript
export type EmailImageAttachment = {
  filename: string;
  cid: string;
  path?: string;
  content?: Buffer;
};
```

**Step 2: Update EmailRepository to handle content field**

In `server/src/repositories/email.repository.ts`, update the attachments mapping (lines 127-131):

```typescript
const attachments = imageAttachments?.map((attachment) => ({
  filename: attachment.filename,
  cid: attachment.cid,
  ...(attachment.content ? { content: attachment.content } : { path: attachment.path }),
}));
```

**Step 3: Update NotificationService.getAlbumThumbnailAttachment()**

In `server/src/services/notification.service.ts`, add imports:

```typescript
import { isAbsolute } from 'node:path';
import { StorageService } from 'src/services/storage.service';
```

Replace `getAlbumThumbnailAttachment` method (lines 435-456):

```typescript
private async getAlbumThumbnailAttachment(album: {
  albumThumbnailAssetId: string | null;
}): Promise<EmailImageAttachment | undefined> {
  if (!album.albumThumbnailAssetId) {
    return;
  }

  const albumThumbnailFiles = await this.assetJobRepository.getAlbumThumbnailFiles(
    album.albumThumbnailAssetId,
    AssetFileType.Thumbnail,
  );

  if (albumThumbnailFiles.length !== 1) {
    return;
  }

  const filePath = albumThumbnailFiles[0].path;
  const filename = `album-thumbnail${getFilenameExtension(filePath)}`;

  if (!isAbsolute(filePath)) {
    const backend = StorageService.resolveBackendForKey(filePath);
    const { stream } = await backend.get(filePath);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return { filename, cid: 'album-thumbnail', content: Buffer.concat(chunks) };
  }

  return { filename, cid: 'album-thumbnail', path: filePath };
}
```

**Step 4: Run tests**

Run: `cd server && pnpm test -- --run src/services/notification.service.spec.ts`
Expected: All existing tests pass (they all use absolute paths via factories).

**Step 5: Commit**

```
feat(server): support S3 thumbnails in email attachments
```

---

### Task 6: Guard StorageTemplateService for S3 assets

**Files:**

- Modify: `server/src/services/storage-template.service.ts:1-5,141-170`
- Modify: `server/src/services/storage-template.service.spec.ts:97`

**Step 1: Write the failing test**

In `server/src/services/storage-template.service.spec.ts`, add a new test after the "should skip when storage template is disabled" test (after line 111):

```typescript
it('should skip S3 assets with relative paths', async () => {
  const asset = AssetFactory.from({ originalPath: 'upload/user/ab/cd/file.jpg' }).exif().build();
  mocks.assetJob.getForStorageTemplateJob.mockResolvedValue(getForStorageTemplate(asset));

  await expect(sut.handleMigrationSingle({ id: asset.id })).resolves.toBe(JobStatus.Skipped);

  expect(mocks.storage.rename).not.toHaveBeenCalled();
  expect(mocks.storage.copyFile).not.toHaveBeenCalled();
  expect(mocks.asset.update).not.toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/services/storage-template.service.spec.ts`
Expected: FAIL — S3 asset attempts migration and errors.

**Step 3: Add the guard**

In `server/src/services/storage-template.service.ts`, add import:

```typescript
import { isAbsolute } from 'node:path';
```

In `handleMigrationSingle` (after `if (!asset)` check around line 151), add:

```typescript
if (!isAbsolute(asset.originalPath)) {
  this.logger.debug(`Skipping storage template migration for S3 asset ${id}`);
  return JobStatus.Skipped;
}
```

**Step 4: Run tests**

Run: `cd server && pnpm test -- --run src/services/storage-template.service.spec.ts`
Expected: All tests pass.

**Step 5: Commit**

```
feat(server): skip storage template migration for S3 assets
```

---

### Task 7: Final verification

**Step 1: Run all affected test suites**

```bash
cd server && pnpm test -- --run \
  src/services/asset-media.service.spec.ts \
  src/services/person.service.spec.ts \
  src/services/user.service.spec.ts \
  src/services/notification.service.spec.ts \
  src/services/storage-template.service.spec.ts
```

Expected: All tests pass.

**Step 2: Type check**

Run: `cd server && npx tsc --noEmit`
Expected: No errors.

**Step 3: Lint**

Run: `cd server && npx eslint --max-warnings 0 src/services/base.service.ts src/services/asset-media.service.ts src/services/person.service.ts src/services/user.service.ts src/services/notification.service.ts src/services/storage-template.service.ts src/types.ts src/repositories/email.repository.ts`
Expected: No errors.
