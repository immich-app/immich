# Profile Image S3 Upload — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make profile images respect `IMMICH_STORAGE_BACKEND=s3` by uploading to S3 and storing relative paths, matching the behavior of all other file types.

**Architecture:** After the existing disk write, check `StorageService.getWriteBackend()`. If it returns an S3 backend, upload the local file via `backend.put()`, update the DB with the relative key, and queue deletion of the local temp file. Two call sites: `UserService.createProfileImage` and `AuthService.syncProfilePicture`.

**Tech Stack:** NestJS, Vitest, Kysely, AWS SDK v3 (via `StorageBackend` abstraction)

**Migration tool:** No changes needed. The existing `streamProfileImages()` in the storage-migration repository already filters by path format (`LIKE '/%'` for toS3, `NOT LIKE '/%'` for toDisk), so new S3 profile images are correctly skipped by toS3 migrations and correctly picked up by toDisk migrations.

---

## Task 1: Add `getRelativeProfileImagePath` to StorageCore

**Files:**

- Modify: `server/src/cores/storage.core.ts:337-339` (add after `getRelativePersonThumbnailPath`)

### Step 1: Write the failing test

Since `StorageCore` methods are pure static functions with trivial delegation, they are tested transitively through the service tests in Tasks 2 and 3. Skip dedicated unit test.

### Step 2: Add the method

In `server/src/cores/storage.core.ts`, add after `getRelativePersonThumbnailPath` (line 339):

```typescript
static getRelativeProfileImagePath(userId: string, filename: string): string {
  return StorageCore.getRelativeNestedPath(StorageFolder.Profile, userId, filename);
}
```

### Step 3: Verify compilation

Run: `cd server && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

### Step 4: Commit

```bash
git add server/src/cores/storage.core.ts
git commit -m "feat(s3): add getRelativeProfileImagePath to StorageCore"
```

---

## Task 2: Add S3 upload to `UserService.createProfileImage` (TDD)

**Files:**

- Modify: `server/src/services/user.service.ts:93-110`
- Modify: `server/src/services/user.service.spec.ts:238-296`

### Step 1: Write failing tests for S3 upload behavior

Add these tests to the `createProfileImage` describe block in `server/src/services/user.service.spec.ts`. You'll need to add imports and a mock S3 backend setup.

Add to imports at the top of the file:

```typescript
import { StorageCore } from 'src/cores/storage.core';
```

Add these test cases inside the `describe('createProfileImage', ...)` block, after the existing tests:

```typescript
describe('with S3 write backend', () => {
  let mockS3Backend: { put: ReturnType<typeof vitest.fn>; getServeStrategy: ReturnType<typeof vitest.fn> };

  beforeEach(() => {
    mockS3Backend = {
      put: vitest.fn().mockResolvedValue(void 0),
      getServeStrategy: vitest.fn(),
    };
    (StorageService as any).s3Backend = mockS3Backend;
    (StorageService as any).writeBackendType = 's3';
  });

  afterEach(() => {
    (StorageService as any).s3Backend = void 0;
    (StorageService as any).writeBackendType = 'disk';
  });

  it('should upload profile image to S3 and store relative path', async () => {
    const user = factory.userAdmin({ profileImagePath: '' });
    const file = { path: '/data/profile/user-id/temp-file.jpg', originalname: 'avatar.jpg' } as Express.Multer.File;
    const relativeKey = StorageCore.getRelativeProfileImagePath(user.id, 'temp-file.jpg');

    mocks.user.get.mockResolvedValue(user);
    mocks.user.update.mockResolvedValue({ ...user, profileImagePath: relativeKey, profileChangedAt: new Date() });

    await sut.createProfileImage(factory.auth({ user }), file);

    expect(mockS3Backend.put).toHaveBeenCalledWith(relativeKey, expect.anything(), {
      contentType: 'image/jpeg',
    });
    expect(mocks.user.update).toHaveBeenCalledWith(user.id, {
      profileImagePath: relativeKey,
      profileChangedAt: expect.any(Date),
    });
  });

  it('should use correct content type for non-JPEG uploads', async () => {
    const user = factory.userAdmin({ profileImagePath: '' });
    const file = {
      path: '/data/profile/user-id/temp-file.png',
      originalname: 'avatar.png',
    } as Express.Multer.File;
    const relativeKey = StorageCore.getRelativeProfileImagePath(user.id, 'temp-file.png');

    mocks.user.get.mockResolvedValue(user);
    mocks.user.update.mockResolvedValue({ ...user, profileImagePath: relativeKey, profileChangedAt: new Date() });

    await sut.createProfileImage(factory.auth({ user }), file);

    expect(mockS3Backend.put).toHaveBeenCalledWith(relativeKey, expect.anything(), {
      contentType: 'image/png',
    });
  });

  it('should queue deletion of local temp file after S3 upload', async () => {
    const user = factory.userAdmin({ profileImagePath: '' });
    const file = { path: '/data/profile/user-id/temp-file.jpg', originalname: 'avatar.jpg' } as Express.Multer.File;

    mocks.user.get.mockResolvedValue(user);
    mocks.user.update.mockResolvedValue({ ...user, profileImagePath: 'profile/...' });

    await sut.createProfileImage(factory.auth({ user }), file);

    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.FileDelete,
      data: { files: [file.path] },
    });
  });

  it('should delete both old profile image and local temp file when replacing on S3', async () => {
    const user = factory.userAdmin({ profileImagePath: '/data/profile/user-id/old.jpg' });
    const file = { path: '/data/profile/user-id/new-file.jpg', originalname: 'avatar.jpg' } as Express.Multer.File;

    mocks.user.get.mockResolvedValue(user);
    mocks.user.update.mockResolvedValue({ ...user, profileImagePath: 'profile/...' });

    await sut.createProfileImage(factory.auth({ user }), file);

    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.FileDelete,
      data: { files: ['/data/profile/user-id/old.jpg'] },
    });
    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.FileDelete,
      data: { files: [file.path] },
    });
  });

  it('should clean up old S3 profile image when replacing with a new S3 upload', async () => {
    const oldRelativeKey = 'profile/user-id/ab/cd/old-file.jpg';
    const user = factory.userAdmin({ profileImagePath: oldRelativeKey });
    const file = { path: '/data/profile/user-id/new-file.jpg', originalname: 'avatar.jpg' } as Express.Multer.File;

    mocks.user.get.mockResolvedValue(user);
    mocks.user.update.mockResolvedValue({ ...user, profileImagePath: 'profile/...' });

    await sut.createProfileImage(factory.auth({ user }), file);

    // Old S3 path should be queued for deletion (FileDelete handler routes via resolveBackendForKey)
    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.FileDelete,
      data: { files: [oldRelativeKey] },
    });
    // Local temp file also queued for deletion
    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.FileDelete,
      data: { files: [file.path] },
    });
  });

  it('should not update DB if S3 upload fails', async () => {
    const user = factory.userAdmin({ profileImagePath: '' });
    const file = { path: '/data/profile/user-id/temp-file.jpg', originalname: 'avatar.jpg' } as Express.Multer.File;

    mocks.user.get.mockResolvedValue(user);
    mockS3Backend.put.mockRejectedValue(new Error('S3 upload failed'));

    await expect(sut.createProfileImage(factory.auth({ user }), file)).rejects.toThrow('S3 upload failed');

    expect(mocks.user.update).not.toHaveBeenCalled();
  });

  it('should return response with relative S3 path', async () => {
    const user = factory.userAdmin({ profileImagePath: '' });
    const file = { path: '/data/profile/user-id/temp-file.jpg', originalname: 'avatar.jpg' } as Express.Multer.File;
    const relativeKey = StorageCore.getRelativeProfileImagePath(user.id, 'temp-file.jpg');
    const profileChangedAt = new Date();

    mocks.user.get.mockResolvedValue(user);
    mocks.user.update.mockResolvedValue({ ...user, profileImagePath: relativeKey, profileChangedAt });

    const result = await sut.createProfileImage(factory.auth({ user }), file);

    expect(result).toEqual({
      userId: user.id,
      profileImagePath: relativeKey,
      profileChangedAt,
    });
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd server && npx vitest run src/services/user.service.spec.ts 2>&1 | tail -30`
Expected: 7 new tests FAIL (S3 put not called, path still absolute, etc.)

### Step 3: Implement S3 upload in createProfileImage

Replace `server/src/services/user.service.ts` method `createProfileImage` (lines 93-110) with:

```typescript
  async createProfileImage(auth: AuthDto, file: Express.Multer.File): Promise<CreateProfileImageResponseDto> {
    const { profileImagePath: oldpath } = await this.findOrFail(auth.user.id, { withDeleted: false });

    let profileImagePath = file.path;
    const writeBackend = StorageService.getWriteBackend();

    if (!(writeBackend instanceof DiskStorageBackend)) {
      const filename = file.path.split('/').pop()!;
      const relativeKey = StorageCore.getRelativeProfileImagePath(auth.user.id, filename);
      const stream = createReadStream(file.path);
      await writeBackend.put(relativeKey, stream, { contentType: mimeTypes.lookup(file.path) });
      profileImagePath = relativeKey;

      // Delete the local temp file
      await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [file.path] } });
    }

    const user = await this.userRepository.update(auth.user.id, {
      profileImagePath,
      profileChangedAt: new Date(),
    });

    if (oldpath !== '') {
      await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [oldpath] } });
    }

    return {
      userId: user.id,
      profileImagePath: user.profileImagePath,
      profileChangedAt: user.profileChangedAt,
    };
  }
```

Add the necessary imports at the top of `user.service.ts`:

```typescript
import { createReadStream } from 'node:fs';
import { DiskStorageBackend } from 'src/backends/disk-storage.backend';
import { StorageService } from 'src/services/storage.service';
import { mimeTypes } from 'src/utils/mime-types';
```

Note: `StorageCore` is already imported. Check if `StorageService` or `mimeTypes` are already imported before adding duplicates.

### Step 4: Run tests to verify they pass

Run: `cd server && npx vitest run src/services/user.service.spec.ts 2>&1 | tail -30`
Expected: ALL tests PASS (both existing disk tests and new S3 tests)

### Step 5: Run lint and type check

Run: `cd server && npx tsc --noEmit 2>&1 | head -20 && npx eslint src/services/user.service.ts --max-warnings 0 2>&1 | head -20`
Expected: No errors

### Step 6: Commit

```bash
git add server/src/services/user.service.ts server/src/services/user.service.spec.ts
git commit -m "feat(s3): upload profile images to S3 in UserService.createProfileImage"
```

---

## Task 3: Add S3-aware tests for `deleteProfileImage` and `getProfileImage`

These methods don't need code changes — they already work correctly with S3 paths. But we need tests to prove it and prevent regressions.

**Files:**

- Modify: `server/src/services/user.service.spec.ts`

### Step 1: Write tests

Add inside the `describe('deleteProfileImage', ...)` block:

```typescript
it('should queue deletion of S3 profile image (relative path)', async () => {
  const s3Path = 'profile/user-id/ab/cd/photo.jpg';
  const user = factory.userAdmin({ profileImagePath: s3Path });
  mocks.user.get.mockResolvedValue(user);

  await sut.deleteProfileImage(factory.auth({ user }));

  expect(mocks.user.update).toHaveBeenCalledWith(user.id, {
    profileImagePath: '',
    profileChangedAt: expect.any(Date),
  });
  // FileDelete handler uses resolveBackendForKey to route relative paths to S3
  expect(mocks.job.queue).toHaveBeenCalledWith({
    name: JobName.FileDelete,
    data: { files: [s3Path] },
  });
});
```

Add inside the `describe('getUserProfileImage', ...)` block:

```typescript
it('should serve profile image from S3 backend when path is relative', async () => {
  const s3Path = 'profile/user-id/ab/cd/photo.jpg';
  const user = UserFactory.create({ profileImagePath: s3Path });
  mocks.user.get.mockResolvedValue(user);

  // With S3 backend configured, serveFromBackend routes relative paths through S3
  // In tests with only diskBackend, relative paths still go through DiskStorageBackend.resolvePath
  // which joins with mediaLocation — the key point is serveFromBackend is called with the relative path
  const result = await sut.getProfileImage(user.id);

  expect(result).toBeDefined();
  expect(mocks.user.get).toHaveBeenCalledWith(user.id, {});
});
```

### Step 2: Run tests to verify they pass

Run: `cd server && npx vitest run src/services/user.service.spec.ts 2>&1 | tail -30`
Expected: ALL tests PASS (these test existing behavior, should pass immediately)

### Step 3: Commit

```bash
git add server/src/services/user.service.spec.ts
git commit -m "test: add S3 path coverage for deleteProfileImage and getProfileImage"
```

---

## Task 4: Add S3 upload to `AuthService.syncProfilePicture` (TDD)

**Files:**

- Modify: `server/src/services/auth.service.ts:363-384`
- Modify: `server/src/services/auth.service.spec.ts:838-865`

### Step 1: Write failing tests for S3 upload behavior

Add imports at the top of `server/src/services/auth.service.spec.ts` (if not already present):

```typescript
import { StorageCore } from 'src/cores/storage.core';
```

Add these test cases after the existing `'should sync the profile picture'` test (around line 865). Note: the `describe` block must be nested inside the existing `describe('callback', ...)` block so that the shared `loginDetails` variable and OAuth mocks are available:

```typescript
describe('syncProfilePicture with S3 backend', () => {
  let mockS3Backend: { put: ReturnType<typeof vitest.fn>; getServeStrategy: ReturnType<typeof vitest.fn> };

  beforeEach(() => {
    mockS3Backend = {
      put: vitest.fn().mockResolvedValue(void 0),
      getServeStrategy: vitest.fn(),
    };
    (StorageService as any).s3Backend = mockS3Backend;
    (StorageService as any).writeBackendType = 's3';
  });

  afterEach(() => {
    (StorageService as any).s3Backend = void 0;
    (StorageService as any).writeBackendType = 'disk';
  });

  it('should upload OAuth profile picture to S3 and store relative path', async () => {
    const fileId = newUuid();
    const user = UserFactory.create({ oauthId: 'oauth-id' });
    const profile = OAuthProfileFactory.create({ picture: 'https://auth.immich.cloud/profiles/1.jpg' });

    mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
    mocks.oauth.getProfile.mockResolvedValue(profile);
    mocks.user.getByOAuthId.mockResolvedValue(user);
    mocks.crypto.randomUUID.mockReturnValue(fileId);
    mocks.oauth.getProfilePicture.mockResolvedValue({
      contentType: 'image/jpeg',
      data: new Uint8Array([1, 2, 3, 4, 5]).buffer,
    });
    mocks.user.update.mockResolvedValue(user);
    mocks.session.create.mockResolvedValue(SessionFactory.create());

    await sut.callback(
      { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
      {},
      loginDetails,
    );

    const expectedRelativeKey = StorageCore.getRelativeProfileImagePath(user.id, `${fileId}.jpg`);
    expect(mockS3Backend.put).toHaveBeenCalledWith(expectedRelativeKey, expect.any(Buffer), {
      contentType: 'image/jpeg',
    });
    expect(mocks.user.update).toHaveBeenCalledWith(user.id, {
      profileImagePath: expectedRelativeKey,
      profileChangedAt: expect.any(Date),
    });
  });

  it('should use correct content type for non-JPEG OAuth pictures', async () => {
    const fileId = newUuid();
    const user = UserFactory.create({ oauthId: 'oauth-id' });
    const profile = OAuthProfileFactory.create({ picture: 'https://auth.immich.cloud/profiles/1.png' });

    mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
    mocks.oauth.getProfile.mockResolvedValue(profile);
    mocks.user.getByOAuthId.mockResolvedValue(user);
    mocks.crypto.randomUUID.mockReturnValue(fileId);
    mocks.oauth.getProfilePicture.mockResolvedValue({
      contentType: 'image/png',
      data: new Uint8Array([1, 2, 3]).buffer,
    });
    mocks.user.update.mockResolvedValue(user);
    mocks.session.create.mockResolvedValue(SessionFactory.create());

    await sut.callback(
      { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
      {},
      loginDetails,
    );

    const expectedRelativeKey = StorageCore.getRelativeProfileImagePath(user.id, `${fileId}.png`);
    expect(mockS3Backend.put).toHaveBeenCalledWith(expectedRelativeKey, expect.any(Buffer), {
      contentType: 'image/png',
    });
  });

  it('should still write to local disk first before S3 upload', async () => {
    const fileId = newUuid();
    const user = UserFactory.create({ oauthId: 'oauth-id' });
    const profile = OAuthProfileFactory.create({ picture: 'https://auth.immich.cloud/profiles/1.jpg' });

    mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
    mocks.oauth.getProfile.mockResolvedValue(profile);
    mocks.user.getByOAuthId.mockResolvedValue(user);
    mocks.crypto.randomUUID.mockReturnValue(fileId);
    mocks.oauth.getProfilePicture.mockResolvedValue({
      contentType: 'image/jpeg',
      data: new Uint8Array([1, 2, 3, 4, 5]).buffer,
    });
    mocks.user.update.mockResolvedValue(user);
    mocks.session.create.mockResolvedValue(SessionFactory.create());

    await sut.callback(
      { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
      {},
      loginDetails,
    );

    // Local disk write still happens (createFile called with absolute path)
    expect(mocks.storage.createFile).toHaveBeenCalledWith(
      expect.stringContaining(`/data/profile/${user.id}/`),
      expect.any(Buffer),
    );
  });

  it('should queue deletion of local temp file after S3 upload for OAuth picture', async () => {
    const fileId = newUuid();
    const user = UserFactory.create({ oauthId: 'oauth-id' });
    const profile = OAuthProfileFactory.create({ picture: 'https://auth.immich.cloud/profiles/1.jpg' });

    mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
    mocks.oauth.getProfile.mockResolvedValue(profile);
    mocks.user.getByOAuthId.mockResolvedValue(user);
    mocks.crypto.randomUUID.mockReturnValue(fileId);
    mocks.oauth.getProfilePicture.mockResolvedValue({
      contentType: 'image/jpeg',
      data: new Uint8Array([1, 2, 3, 4, 5]).buffer,
    });
    mocks.user.update.mockResolvedValue(user);
    mocks.session.create.mockResolvedValue(SessionFactory.create());

    await sut.callback(
      { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
      {},
      loginDetails,
    );

    // Local temp file should be queued for deletion
    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.FileDelete,
      data: { files: [expect.stringContaining(`/data/profile/${user.id}/`)] },
    });
  });

  it('should catch and log S3 upload failure without crashing', async () => {
    const fileId = newUuid();
    const user = UserFactory.create({ oauthId: 'oauth-id' });
    const profile = OAuthProfileFactory.create({ picture: 'https://auth.immich.cloud/profiles/1.jpg' });

    mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
    mocks.oauth.getProfile.mockResolvedValue(profile);
    mocks.user.getByOAuthId.mockResolvedValue(user);
    mocks.crypto.randomUUID.mockReturnValue(fileId);
    mocks.oauth.getProfilePicture.mockResolvedValue({
      contentType: 'image/jpeg',
      data: new Uint8Array([1, 2, 3, 4, 5]).buffer,
    });
    mocks.user.update.mockResolvedValue(user);
    mocks.session.create.mockResolvedValue(SessionFactory.create());
    mockS3Backend.put.mockRejectedValue(new Error('S3 upload failed'));

    // Should not throw — syncProfilePicture has a try/catch
    await expect(
      sut.callback(
        { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
        loginDetails,
      ),
    ).resolves.toBeDefined();

    // DB should NOT be updated with profile image path (error occurred before update)
    expect(mocks.user.update).not.toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ profileImagePath: expect.anything() }),
    );
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd server && npx vitest run src/services/auth.service.spec.ts -t "syncProfilePicture with S3" 2>&1 | tail -30`
Expected: 5 new tests FAIL

### Step 3: Implement S3 upload in syncProfilePicture

Replace `server/src/services/auth.service.ts` method `syncProfilePicture` (lines 363-384) with:

```typescript
  private async syncProfilePicture(user: UserAdmin, url: string) {
    try {
      const oldPath = user.profileImagePath;

      const { contentType, data } = await this.oauthRepository.getProfilePicture(url);
      const extensionWithDot = mimeTypes.toExtension(contentType || 'image/jpeg') ?? 'jpg';
      const filename = `${this.cryptoRepository.randomUUID()}${extensionWithDot}`;
      const localPath = join(
        StorageCore.getFolderLocation(StorageFolder.Profile, user.id),
        filename,
      );

      this.storageCore.ensureFolders(localPath);
      await this.storageRepository.createFile(localPath, Buffer.from(data));

      let profileImagePath = localPath;
      const writeBackend = StorageService.getWriteBackend();

      if (!(writeBackend instanceof DiskStorageBackend)) {
        const relativeKey = StorageCore.getRelativeProfileImagePath(user.id, filename);
        await writeBackend.put(relativeKey, Buffer.from(data), { contentType: contentType || 'image/jpeg' });
        profileImagePath = relativeKey;

        // Delete the local temp file
        await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [localPath] } });
      }

      await this.userRepository.update(user.id, { profileImagePath, profileChangedAt: new Date() });

      if (oldPath) {
        await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [oldPath] } });
      }
    } catch (error: Error | any) {
      this.logger.warn(`Unable to sync oauth profile picture: ${error}\n${error?.stack}`);
    }
  }
```

Add the necessary imports at the top of `auth.service.ts`:

```typescript
import { DiskStorageBackend } from 'src/backends/disk-storage.backend';
import { StorageService } from 'src/services/storage.service';
```

Note: `StorageCore`, `StorageFolder`, `join`, and `mimeTypes` should already be imported — check first.

### Step 4: Run tests to verify they pass

Run: `cd server && npx vitest run src/services/auth.service.spec.ts 2>&1 | tail -30`
Expected: ALL tests PASS (both existing and new)

### Step 5: Run lint and type check

Run: `cd server && npx tsc --noEmit 2>&1 | head -20 && npx eslint src/services/auth.service.ts --max-warnings 0 2>&1 | head -20`
Expected: No errors

### Step 6: Commit

```bash
git add server/src/services/auth.service.ts server/src/services/auth.service.spec.ts
git commit -m "feat(s3): upload OAuth profile pictures to S3 in AuthService.syncProfilePicture"
```

---

## Task 5: Verify existing disk-mode tests and migration compatibility (regression check)

### Step 1: Run all user service tests

Run: `cd server && npx vitest run src/services/user.service.spec.ts 2>&1 | tail -30`
Expected: ALL tests PASS

### Step 2: Run all auth service tests

Run: `cd server && npx vitest run src/services/auth.service.spec.ts 2>&1 | tail -30`
Expected: ALL tests PASS

### Step 3: Run storage migration tests

Run: `cd server && npx vitest run src/services/storage-migration.service.spec.ts 2>&1 | tail -30`
Expected: ALL tests PASS (no changes to migration code — this confirms compatibility)

### Step 4: Run full server test suite

Run: `cd server && pnpm test 2>&1 | tail -30`
Expected: ALL tests PASS

### Step 5: Run server lint and type check

Run: `cd server && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

### Step 6: Commit (no changes expected — this is a verification step)

No commit needed unless lint/format needed a fix.

---

## Task 6: Update S3 storage documentation

**Files:**

- Modify: `docs/docs/features/s3-storage.md` (Technical Implementation > Upload Flow section)

### Step 1: Update the Upload Flow section

In the S3 storage doc's Technical Implementation > Upload Flow section, add a note after the existing numbered list:

> Profile images (both user-uploaded and OAuth-synced) follow the same pattern: the file is written to disk first, then uploaded to S3 if the write backend is S3, and the local temp file is cleaned up.

### Step 2: Format

Run: `npx prettier --write docs/docs/features/s3-storage.md`
Expected: File formatted (or unchanged)

### Step 3: Commit

```bash
git add docs/docs/features/s3-storage.md
git commit -m "docs: note that profile images now support S3 upload"
```

---

## Test Matrix Summary

| Scenario                                          | Test Location                   | Type       |
| :------------------------------------------------ | :------------------------------ | :--------- |
| S3 upload with JPEG content type                  | user.service.spec (Task 2)      | New        |
| S3 upload with PNG content type                   | user.service.spec (Task 2)      | New        |
| Local temp file cleanup after S3 upload           | user.service.spec (Task 2)      | New        |
| Replace disk profile image via S3                 | user.service.spec (Task 2)      | New        |
| Replace S3 profile image with new S3 upload       | user.service.spec (Task 2)      | New        |
| S3 put failure — error propagates, DB not updated | user.service.spec (Task 2)      | New        |
| Response includes relative S3 path                | user.service.spec (Task 2)      | New        |
| Delete profile image with S3 path                 | user.service.spec (Task 3)      | New        |
| Serve profile image from S3 path                  | user.service.spec (Task 3)      | New        |
| OAuth S3 upload with correct relative key         | auth.service.spec (Task 4)      | New        |
| OAuth S3 upload with PNG content type             | auth.service.spec (Task 4)      | New        |
| OAuth local disk write still happens before S3    | auth.service.spec (Task 4)      | New        |
| OAuth local temp file cleanup after S3            | auth.service.spec (Task 4)      | New        |
| OAuth S3 failure caught and logged                | auth.service.spec (Task 4)      | New        |
| Disk mode — create profile (no S3 upload)         | user.service.spec (existing)    | Regression |
| Disk mode — delete previous profile               | user.service.spec (existing)    | Regression |
| Disk mode — OAuth sync profile picture            | auth.service.spec (existing)    | Regression |
| Storage migration — profile images                | storage-migration.spec (Task 5) | Regression |
