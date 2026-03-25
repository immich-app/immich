# Spaces Access Checks & Bulk Download Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix missing space access checks in `searchRandom`/`searchLargeAssets` and add bulk download by `spaceId`.

**Architecture:** Add `SharedSpaceRead` guards to two search methods (3 lines each), add `spaceId` branch to the existing download flow (DTO + repository + service). All changes follow established patterns already used in `searchMetadata`, `searchSmart`, and `downloadAlbumId`.

**Tech Stack:** NestJS, Kysely, Vitest, Supertest (E2E)

**Design doc:** `docs/plans/2026-03-24-spaces-access-and-download-design.md`

---

### Task 1: Unit tests for `searchRandom` space access check

**Files:**

- Modify: `server/src/services/search.service.spec.ts:591-623` (inside `describe('searchRandom')`)

**Step 1: Write the failing tests**

Add these tests inside the existing `describe('searchRandom')` block, after the existing tests (after line 622):

```typescript
describe('shared space access (spaceId)', () => {
  it('should check shared space access when spaceId is provided', async () => {
    const spaceId = newUuid();
    mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
    mocks.search.searchRandom.mockResolvedValue([]);

    await sut.searchRandom(authStub.user1, { spaceId });

    expect(mocks.access.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(authStub.user1.user.id, new Set([spaceId]));
    expect(mocks.search.searchRandom).toHaveBeenCalledWith(250, expect.objectContaining({ spaceId }));
  });

  it('should not check space access when spaceId is not provided', async () => {
    mocks.search.searchRandom.mockResolvedValue([]);

    await sut.searchRandom(authStub.user1, {});

    expect(mocks.access.sharedSpace.checkMemberAccess).not.toHaveBeenCalled();
  });

  it('should throw when user is not a space member', async () => {
    const spaceId = newUuid();
    mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set());

    await expect(sut.searchRandom(authStub.user1, { spaceId })).rejects.toThrow();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts -t "searchRandom > shared space access"`

Expected: FAIL — `checkMemberAccess` is never called because the guard doesn't exist yet.

### Task 2: Implement `searchRandom` space access check

**Files:**

- Modify: `server/src/services/search.service.ts:89-97` (the `searchRandom` method)

**Step 1: Add the guard**

In `searchRandom`, add the access check after the visibility check (after line 92) and before `getUserIdsToSearch`:

```typescript
  async searchRandom(auth: AuthDto, dto: RandomSearchDto): Promise<AssetResponseDto[]> {
    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    if (dto.spaceId) {
      await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
    }

    const userIds = await this.getUserIdsToSearch(auth);
    const items = await this.searchRepository.searchRandom(dto.size || 250, { ...dto, userIds });
    return items.map((item) => mapAsset(item, { auth }));
  }
```

**Step 2: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts -t "searchRandom"`

Expected: ALL PASS (both existing and new tests).

**Step 3: Commit**

```
feat: add space access check to searchRandom
```

### Task 3: Unit tests for `searchLargeAssets` space access check

**Files:**

- Modify: `server/src/services/search.service.spec.ts:625-657` (inside `describe('searchLargeAssets')`)

**Step 1: Write the failing tests**

Add these tests inside the existing `describe('searchLargeAssets')` block, after the existing tests (after line 656):

```typescript
describe('shared space access (spaceId)', () => {
  it('should check shared space access when spaceId is provided', async () => {
    const spaceId = newUuid();
    mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
    mocks.search.searchLargeAssets.mockResolvedValue([]);

    await sut.searchLargeAssets(authStub.user1, { spaceId });

    expect(mocks.access.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(authStub.user1.user.id, new Set([spaceId]));
    expect(mocks.search.searchLargeAssets).toHaveBeenCalledWith(250, expect.objectContaining({ spaceId }));
  });

  it('should not check space access when spaceId is not provided', async () => {
    mocks.search.searchLargeAssets.mockResolvedValue([]);

    await sut.searchLargeAssets(authStub.user1, {});

    expect(mocks.access.sharedSpace.checkMemberAccess).not.toHaveBeenCalled();
  });

  it('should throw when user is not a space member', async () => {
    const spaceId = newUuid();
    mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set());

    await expect(sut.searchLargeAssets(authStub.user1, { spaceId })).rejects.toThrow();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts -t "searchLargeAssets > shared space access"`

Expected: FAIL — guard doesn't exist yet.

### Task 4: Implement `searchLargeAssets` space access check

**Files:**

- Modify: `server/src/services/search.service.ts:99-107` (the `searchLargeAssets` method)

**Step 1: Add the guard**

In `searchLargeAssets`, add the access check after the visibility check (after line 102):

```typescript
  async searchLargeAssets(auth: AuthDto, dto: LargeAssetSearchDto): Promise<AssetResponseDto[]> {
    if (dto.visibility === AssetVisibility.Locked) {
      requireElevatedPermission(auth);
    }

    if (dto.spaceId) {
      await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
    }

    const userIds = await this.getUserIdsToSearch(auth);
    const items = await this.searchRepository.searchLargeAssets(dto.size || 250, { ...dto, userIds });
    return items.map((item) => mapAsset(item, { auth }));
  }
```

**Step 2: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts -t "searchLargeAssets"`

Expected: ALL PASS.

**Step 3: Commit**

```
feat: add space access check to searchLargeAssets
```

### Task 5: Scaffold download DTO and repository (plumbing)

These are pure plumbing changes with no testable behavior in isolation. They must exist before the unit tests in Task 6 can reference the automocked `downloadSpaceId` method.

**Files:**

- Modify: `server/src/dtos/download.dto.ts:6-21` (the `DownloadInfoDto` class)
- Modify: `server/src/repositories/download.repository.ts:16-40` (add method to `DownloadRepository` class)

**Step 1: Add `spaceId` to `DownloadInfoDto`**

Add `spaceId` to `DownloadInfoDto`, after the `userId` field:

```typescript
export class DownloadInfoDto {
  @ValidateUUID({ each: true, optional: true, description: 'Asset IDs to download' })
  assetIds?: string[];

  @ValidateUUID({ optional: true, description: 'Album ID to download' })
  albumId?: string;

  @ValidateUUID({ optional: true, description: 'User ID to download assets from' })
  userId?: string;

  @ValidateUUID({ optional: true, description: 'Shared space ID to download all assets from' })
  spaceId?: string;

  @ApiPropertyOptional({ type: 'integer', description: 'Archive size limit in bytes' })
  @IsInt()
  @IsPositive()
  @Optional()
  archiveSize?: number;
}
```

**Step 2: Add `downloadSpaceId` to `DownloadRepository`**

Add after the existing `downloadUserId` method (after line 39):

```typescript
  downloadSpaceId(spaceId: string) {
    const direct = builder(this.db)
      .innerJoin('shared_space_asset', 'asset.id', 'shared_space_asset.assetId')
      .where('shared_space_asset.spaceId', '=', spaceId);

    const library = builder(this.db)
      .innerJoin('shared_space_library', (join) =>
        join.onRef('shared_space_library.libraryId', '=', 'asset.libraryId'),
      )
      .where('shared_space_library.spaceId', '=', spaceId)
      .where('asset.isOffline', '=', false);

    return direct.union(library).stream();
  }
```

Design notes:

- No `@GenerateSql` decorator — consistent with other methods in this file
- `isOffline` filter on library branch only — direct assets were explicitly added (always relevant), library assets can be offline due to external storage. Matches `getAssetIdsInSpace` pattern.
- `UNION` not `UNION ALL` — deduplicates assets appearing in both `shared_space_asset` and via `shared_space_library`
- `deletedAt IS NULL` inherited from shared `builder` function

### Task 6: Unit tests for download by `spaceId`

Now that the repository method exists (Task 5), the automock will have `downloadSpaceId` available.

**Files:**

- Modify: `server/src/services/download.service.spec.ts:258-394` (inside `describe('getDownloadInfo')`)

**Step 1: Write the failing tests**

Add a `newUuid` import at the top of the file:

```typescript
import { newUuid } from 'test/small.factory';
```

Then add these tests inside the existing `describe('getDownloadInfo')` block, after the last test (before the closing `});` of `getDownloadInfo`):

```typescript
it('should return a list of archives (spaceId)', async () => {
  const spaceId = newUuid();

  mocks.user.getMetadata.mockResolvedValue([]);
  mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
  mocks.downloadRepository.downloadSpaceId.mockReturnValue(
    makeStream([
      { id: 'asset-1', livePhotoVideoId: null, size: 100_000 },
      { id: 'asset-2', livePhotoVideoId: null, size: 5000 },
    ]),
  );

  await expect(sut.getDownloadInfo(authStub.admin, { spaceId })).resolves.toEqual(downloadResponse);

  expect(mocks.access.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set([spaceId]));
  expect(mocks.downloadRepository.downloadSpaceId).toHaveBeenCalledWith(spaceId);
});

it('should reject non-member for spaceId download', async () => {
  const spaceId = newUuid();
  mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set());

  await expect(sut.getDownloadInfo(authStub.admin, { spaceId })).rejects.toThrow();
});

it('should return empty archives for space with no assets', async () => {
  const spaceId = newUuid();

  mocks.user.getMetadata.mockResolvedValue([]);
  mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
  mocks.downloadRepository.downloadSpaceId.mockReturnValue(makeStream([]));

  await expect(sut.getDownloadInfo(authStub.admin, { spaceId })).resolves.toEqual({
    totalSize: 0,
    archives: [],
  });
});

it('should include live photo video for space download', async () => {
  const spaceId = newUuid();

  mocks.user.getMetadata.mockResolvedValue([]);
  mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));
  mocks.downloadRepository.downloadSpaceId.mockReturnValue(
    makeStream([{ id: 'asset-1', livePhotoVideoId: 'motion-1', size: 5000 }]),
  );
  mocks.downloadRepository.downloadMotionAssetIds.mockReturnValue(
    makeStream([{ id: 'motion-1', livePhotoVideoId: null, size: 2000, originalPath: '/path/to/file.mp4' }]),
  );

  const result = await sut.getDownloadInfo(authStub.admin, { spaceId });

  expect(result.totalSize).toBe(7000);
  expect(result.archives[0].assetIds).toEqual(['asset-1', 'motion-1']);
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/download.service.spec.ts -t "getDownloadInfo"`

Expected: FAIL — service doesn't have the `spaceId` branch yet, so `spaceId` falls through to the error case.

### Task 7: Implement space branch in `getDownloadInfo` service

**Files:**

- Modify: `server/src/services/download.service.ts:15-32` (the `getDownloadInfo` method)

**Step 1: Add the spaceId branch**

Add the `else if (dto.spaceId)` branch after the `userId` branch (after line 29), and update the error message:

```typescript
  async getDownloadInfo(auth: AuthDto, dto: DownloadInfoDto): Promise<DownloadResponseDto> {
    let assets;

    if (dto.assetIds) {
      const assetIds = dto.assetIds;
      await this.requireAccess({ auth, permission: Permission.AssetDownload, ids: assetIds });
      assets = this.downloadRepository.downloadAssetIds(assetIds);
    } else if (dto.albumId) {
      const albumId = dto.albumId;
      await this.requireAccess({ auth, permission: Permission.AlbumDownload, ids: [albumId] });
      assets = this.downloadRepository.downloadAlbumId(albumId);
    } else if (dto.userId) {
      const userId = dto.userId;
      await this.requireAccess({ auth, permission: Permission.TimelineDownload, ids: [userId] });
      assets = this.downloadRepository.downloadUserId(userId);
    } else if (dto.spaceId) {
      const spaceId = dto.spaceId;
      await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [spaceId] });
      assets = this.downloadRepository.downloadSpaceId(spaceId);
    } else {
      throw new BadRequestException('assetIds, albumId, userId, or spaceId is required');
    }
```

**Step 2: Add the error message test**

Now that the error message has been updated, add this test to the `describe('getDownloadInfo')` block (the message wording only changes in this task, so it belongs here, not in the earlier test-writing task):

```typescript
it('should include spaceId in error message for invalid dto', async () => {
  await expect(sut.getDownloadInfo(authStub.admin, {})).rejects.toThrow(
    'assetIds, albumId, userId, or spaceId is required',
  );
});
```

**Step 3: Run download tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/download.service.spec.ts`

Expected: ALL PASS (all existing tests plus the new ones from Task 6 and the error message test).

**Step 4: Commit**

```
feat: add bulk download by spaceId
```

### Task 8: E2E tests for search access checks

**Files:**

- Modify: `e2e/src/specs/server/api/search.e2e-spec.ts` (add new describe blocks inside the outer `describe('/search')`)

Note: `admin`, `assetFalcon`, and other assets are declared in the outer `describe('/search')` scope (lines 20-41) and initialized in `beforeAll` (lines 43+), so new nested describe blocks can access them.

Note: `searchRandom` is `POST` with `@Body()`. `searchLargeAssets` is `POST` with `@Query()` — parameters go in the query string, not the body.

**Step 1: Write the E2E tests**

Add two new describe blocks before the closing `});` of the outer `describe('/search')`:

```typescript
describe('POST /search/random (spaceId access)', () => {
  let space: SharedSpaceResponseDto;
  let outsider: LoginResponseDto;

  beforeAll(async () => {
    space = await utils.createSpace(admin.accessToken, { name: 'Random Search Space' });
    await utils.addSpaceAssets(admin.accessToken, space.id, [assetFalcon.id]);

    outsider = await utils.userSetup(admin.accessToken, {
      email: 'random-search-outsider@immich.cloud',
      name: 'Random Outsider',
      password: 'Password123!',
    });
  });

  it('should reject non-member', async () => {
    const { status } = await request(app)
      .post('/search/random')
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send({ spaceId: space.id });

    expect(status).toBe(400);
  });

  it('should return results for space member', async () => {
    const { status, body } = await request(app)
      .post('/search/random')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ spaceId: space.id, size: 10 });

    expect(status).toBe(200);
    expect(body.length).toBeGreaterThan(0);
    expect(body.map((a: AssetResponseDto) => a.id)).toContain(assetFalcon.id);
  });
});

describe('POST /search/large-assets (spaceId access)', () => {
  let space: SharedSpaceResponseDto;
  let outsider: LoginResponseDto;

  beforeAll(async () => {
    space = await utils.createSpace(admin.accessToken, { name: 'Large Assets Search Space' });
    await utils.addSpaceAssets(admin.accessToken, space.id, [assetFalcon.id]);

    outsider = await utils.userSetup(admin.accessToken, {
      email: 'large-assets-outsider@immich.cloud',
      name: 'Large Assets Outsider',
      password: 'Password123!',
    });
  });

  it('should reject non-member', async () => {
    const { status } = await request(app)
      .post(`/search/large-assets?spaceId=${space.id}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`);

    expect(status).toBe(400);
  });

  it('should return results for space member', async () => {
    const { status, body } = await request(app)
      .post(`/search/large-assets?spaceId=${space.id}&size=10`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});
```

**Step 2: Run E2E tests**

Run: `cd e2e && pnpm test -- --run src/specs/server/api/search.e2e-spec.ts`

Expected: ALL PASS. The dev E2E stack must be running (`make e2e`).

**Step 3: Commit**

```
test: add E2E tests for search space access checks
```

### Task 9: E2E tests for download by spaceId

**Files:**

- Modify: `e2e/src/specs/server/api/download.e2e-spec.ts`

Note: `admin`, `asset1`, `asset2` are declared in the outer `describe('/download')` scope and available to nested blocks. `LoginResponseDto` has a `userId` property (confirmed in shared-space E2E tests).

**Step 1: Write the E2E tests**

Update the import at line 1 to add `SharedSpaceResponseDto` and `SharedSpaceRole`:

```typescript
import { AssetMediaResponseDto, LoginResponseDto, SharedSpaceResponseDto, SharedSpaceRole } from '@immich/sdk';
```

Then add a new describe block after the existing `POST /download/archive` block:

```typescript
describe('POST /download/info (spaceId)', () => {
  let space: SharedSpaceResponseDto;
  let viewer: LoginResponseDto;
  let editor: LoginResponseDto;
  let outsider: LoginResponseDto;

  beforeAll(async () => {
    viewer = await utils.userSetup(admin.accessToken, {
      email: 'download-viewer@immich.cloud',
      name: 'Download Viewer',
      password: 'Password123!',
    });
    editor = await utils.userSetup(admin.accessToken, {
      email: 'download-editor@immich.cloud',
      name: 'Download Editor',
      password: 'Password123!',
    });
    outsider = await utils.userSetup(admin.accessToken, {
      email: 'download-outsider@immich.cloud',
      name: 'Download Outsider',
      password: 'Password123!',
    });

    space = await utils.createSpace(admin.accessToken, { name: 'Download Space' });
    await utils.addSpaceAssets(admin.accessToken, space.id, [asset1.id, asset2.id]);
    await utils.addSpaceMember(admin.accessToken, space.id, {
      userId: viewer.userId,
      role: SharedSpaceRole.Viewer,
    });
    await utils.addSpaceMember(admin.accessToken, space.id, {
      userId: editor.userId,
      role: SharedSpaceRole.Editor,
    });
  });

  it('should return download info for space owner', async () => {
    const { status, body } = await request(app)
      .post('/download/info')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ spaceId: space.id });

    expect(status).toBe(201);
    expect(body.archives).toHaveLength(1);
    expect(body.archives[0].assetIds).toContain(asset1.id);
    expect(body.archives[0].assetIds).toContain(asset2.id);
  });

  it('should allow editor to download', async () => {
    const { status, body } = await request(app)
      .post('/download/info')
      .set('Authorization', `Bearer ${editor.accessToken}`)
      .send({ spaceId: space.id });

    expect(status).toBe(201);
    expect(body.archives).toHaveLength(1);
    expect(body.archives[0].assetIds).toHaveLength(2);
  });

  it('should allow viewer to download', async () => {
    const { status, body } = await request(app)
      .post('/download/info')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({ spaceId: space.id });

    expect(status).toBe(201);
    expect(body.archives).toHaveLength(1);
    expect(body.archives[0].assetIds).toHaveLength(2);
  });

  it('should reject non-member', async () => {
    const { status } = await request(app)
      .post('/download/info')
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send({ spaceId: space.id });

    expect(status).toBe(400);
  });

  it('should return empty archives for empty space', async () => {
    const emptySpace = await utils.createSpace(admin.accessToken, { name: 'Empty Download Space' });

    const { status, body } = await request(app)
      .post('/download/info')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ spaceId: emptySpace.id });

    expect(status).toBe(201);
    expect(body.totalSize).toBe(0);
    expect(body.archives).toHaveLength(0);
  });
});
```

**Step 2: Run E2E tests**

Run: `cd e2e && pnpm test -- --run src/specs/server/api/download.e2e-spec.ts`

Expected: ALL PASS.

**Step 3: Commit**

```
test: add E2E tests for download by spaceId
```

### Task 10: Regenerate OpenAPI and run full regression

**Step 1: Regenerate OpenAPI**

Run: `make open-api-typescript`

This regenerates the TypeScript SDK to include the new `spaceId` field in `DownloadInfoDto`.

**Step 2: Run full server unit tests**

Run: `cd server && pnpm test`

Expected: ALL PASS.

**Step 3: Run full E2E tests**

Run: `cd e2e && pnpm test`

Expected: ALL PASS (requires E2E stack running via `make e2e`).

**Step 4: Lint and type-check**

Run these sequentially — each takes up to 10 minutes:

Run: `make check-server`

Expected: No errors.

Run: `make lint-server`

Expected: No errors.

**Step 5: Commit OpenAPI changes**

```
chore: regenerate OpenAPI for spaceId download support
```

### Task 11: Update permissions matrix doc

**Files:**

- Modify: `docs/plans/2026-03-23-spaces-permissions-matrix.md`

**Step 1: Update the matrix**

Fix the stale entries:

- Line 35: Remove `**BUG**` markers from Search suggestions row (already fixed in PR #141)
- Line 54: Change "Bulk download by space" from `**Missing**` to show the new `spaceId` support with `SharedSpaceRead` permission, all members allowed
- Remove "Bulk download by spaceId not supported" from Known Limitations (line 145)

**Step 2: Commit**

```
docs: update permissions matrix after access fixes and space download
```
