# Space Bulk Add Assets Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to add all their photos to a shared space via a single background job, and harden the existing `addAssets` path for large batches.

**Architecture:** New `POST /shared-spaces/:id/assets/bulk-add` endpoint queues a `SharedSpaceBulkAddAssets` BullMQ job. The job uses `INSERT...SELECT` to move all user-owned assets into the space in a single SQL statement, then notifies the user via websocket. The existing `addAssets` path gets `@Chunked` on the repository and batched job queuing.

**Tech Stack:** NestJS, Kysely, BullMQ, Vitest, PostgreSQL, SvelteKit, Socket.IO

---

## Task 1: Register job enum and type definitions

**Files:**

- Modify: `server/src/enum.ts:715-719`
- Modify: `server/src/types.ts:243-245` and `server/src/types.ts:446-449`

**Step 1: Add `SharedSpaceBulkAddAssets` to `JobName` enum**

In `server/src/enum.ts`, add the new job name after line 719 (after `SharedSpaceLibraryFaceSync`):

```typescript
  // Shared Space Face Recognition
  SharedSpaceFaceMatch = 'SharedSpaceFaceMatch',
  SharedSpaceFaceMatchAll = 'SharedSpaceFaceMatchAll',
  SharedSpacePersonThumbnail = 'SharedSpacePersonThumbnail',
  SharedSpaceLibraryFaceSync = 'SharedSpaceLibraryFaceSync',

  // Shared Space Bulk Operations
  SharedSpaceBulkAddAssets = 'SharedSpaceBulkAddAssets',
```

**Step 2: Add the job interface in `server/src/types.ts`**

After `ISharedSpaceLibraryFaceSyncJob` (line 250):

```typescript
export interface ISharedSpaceBulkAddAssetsJob extends IBaseJob {
  spaceId: string;
  userId: string;
}
```

**Step 3: Add to the `JobItem` union in `server/src/types.ts`**

After the `SharedSpaceLibraryFaceSync` entry (line 449):

```typescript
  | { name: JobName.SharedSpaceLibraryFaceSync; data: ISharedSpaceLibraryFaceSyncJob }

  // Shared Space Bulk Operations
  | { name: JobName.SharedSpaceBulkAddAssets; data: ISharedSpaceBulkAddAssetsJob };
```

(Remove the trailing semicolon from the `SharedSpaceLibraryFaceSync` line and put it on the new last line.)

**Step 4: Add `jobId` deduplication in `server/src/repositories/job.repository.ts`**

In the `getJobOptions` switch statement (around line 219-239), add a new case before `default`:

```typescript
      case JobName.SharedSpaceBulkAddAssets: {
        return { jobId: `bulk-add-${item.data.spaceId}-${item.data.userId}` };
      }
```

**Step 5: Map the job to `QueueName.BackgroundTask`**

Search for `SharedSpaceFaceMatch` in the handlers map in `server/src/repositories/job.repository.ts` and find the object that maps `JobName` to `QueueName`. Add:

```typescript
[JobName.SharedSpaceBulkAddAssets]: { queueName: QueueName.BackgroundTask },
```

**Step 6: Commit**

```bash
git add server/src/enum.ts server/src/types.ts server/src/repositories/job.repository.ts
git commit -m "feat: register SharedSpaceBulkAddAssets job enum, type, and queue mapping"
```

---

## Task 2: Add `bulkAddUserAssets` repository method with medium tests

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts:164`
- Test: `server/test/medium/specs/repositories/shared-space.repository.spec.ts`

**Step 1: Write the failing medium tests**

Add a new `describe('bulkAddUserAssets')` block in `server/test/medium/specs/repositories/shared-space.repository.spec.ts` after the existing `describe('addAssets')` block:

```typescript
describe('bulkAddUserAssets', () => {
  it('should insert all non-deleted, non-offline assets owned by the user', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset: asset1 } = await ctx.newAsset({ ownerId: user.id });
    const { asset: asset2 } = await ctx.newAsset({ ownerId: user.id });

    const count = await sut.bulkAddUserAssets(space.id, user.id);

    expect(count).toBe(2);
  });

  it('should return correct inserted row count', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newAsset({ ownerId: user.id });
    await ctx.newAsset({ ownerId: user.id });
    await ctx.newAsset({ ownerId: user.id });

    const count = await sut.bulkAddUserAssets(space.id, user.id);

    expect(count).toBe(3);
  });

  it('should skip soft-deleted assets', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newAsset({ ownerId: user.id });
    await ctx.newAsset({ ownerId: user.id, deletedAt: new Date() });

    const count = await sut.bulkAddUserAssets(space.id, user.id);

    expect(count).toBe(1);
  });

  it('should skip offline assets', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newAsset({ ownerId: user.id });
    await ctx.newAsset({ ownerId: user.id, isOffline: true });

    const count = await sut.bulkAddUserAssets(space.id, user.id);

    expect(count).toBe(1);
  });

  it('should not insert assets owned by other users', async () => {
    const { ctx, sut } = setup();
    const { user: owner } = await ctx.newUser();
    const { user: other } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id });
    await ctx.newAsset({ ownerId: owner.id });
    await ctx.newAsset({ ownerId: other.id });

    const count = await sut.bulkAddUserAssets(space.id, owner.id);

    expect(count).toBe(1);
  });

  it('should handle ON CONFLICT when some assets already exist', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset: existing } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newAsset({ ownerId: user.id });
    // Pre-add one asset
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: existing.id, addedById: user.id });

    const count = await sut.bulkAddUserAssets(space.id, user.id);

    // Only the new asset should be counted
    expect(count).toBe(1);
  });

  it('should return 0 when all assets already in space', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });

    const count = await sut.bulkAddUserAssets(space.id, user.id);

    expect(count).toBe(0);
  });

  it('should return 0 when user has no assets', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });

    const count = await sut.bulkAddUserAssets(space.id, user.id);

    expect(count).toBe(0);
  });

  it('should set addedById to the userId', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newAsset({ ownerId: user.id });

    await sut.bulkAddUserAssets(space.id, user.id);

    // Query shared_space_asset directly to verify addedById
    const rows = await ctx.database
      .selectFrom('shared_space_asset')
      .selectAll()
      .where('spaceId', '=', space.id)
      .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].addedById).toBe(user.id);
  });

  it('should set spaceId correctly on all inserted rows', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space: space1 } = await ctx.newSharedSpace({ createdById: user.id });
    const { space: space2 } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newAsset({ ownerId: user.id });

    await sut.bulkAddUserAssets(space1.id, user.id);

    const space1Assets = await sut.getAssetIdsInSpace(space1.id);
    const space2Assets = await sut.getAssetIdsInSpace(space2.id);
    expect(space1Assets).toHaveLength(1);
    expect(space2Assets).toHaveLength(0);
  });

  it('should not affect other spaces assets', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space: space1 } = await ctx.newSharedSpace({ createdById: user.id });
    const { space: space2 } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset: existingAsset } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newSharedSpaceAsset({ spaceId: space2.id, assetId: existingAsset.id, addedById: user.id });

    await ctx.newAsset({ ownerId: user.id });
    await sut.bulkAddUserAssets(space1.id, user.id);

    // space2 should still have only its original asset
    const space2Assets = await sut.getAssetIdsInSpace(space2.id);
    expect(space2Assets).toHaveLength(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test:medium -- --run test/medium/specs/repositories/shared-space.repository.spec.ts`
Expected: FAIL — `sut.bulkAddUserAssets is not a function`

**Step 3: Implement `bulkAddUserAssets` in the repository**

Add to `server/src/repositories/shared-space.repository.ts` before the existing `addAssets` method (around line 164):

```typescript
  async bulkAddUserAssets(spaceId: string, userId: string): Promise<number> {
    const result = await this.db
      .insertInto('shared_space_asset')
      .columns(['spaceId', 'assetId', 'addedById'])
      .expression(
        this.db
          .selectFrom('asset')
          .select([sql.lit(spaceId).as('spaceId'), 'asset.id as assetId', sql.lit(userId).as('addedById')])
          .where('asset.ownerId', '=', userId)
          .where('asset.deletedAt', 'is', null)
          .where('asset.isOffline', '=', false),
      )
      .onConflict((oc) => oc.doNothing())
      .executeTakeFirst();
    return Number(result?.numInsertedOrUpdatedRows ?? 0);
  }
```

Add the `sql` import at the top if not already present:

```typescript
import { sql } from 'kysely';
```

**Step 4: Run tests to verify they pass**

Run: `cd server && pnpm test:medium -- --run test/medium/specs/repositories/shared-space.repository.spec.ts`
Expected: All 11 new tests PASS

**Step 5: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts server/test/medium/specs/repositories/shared-space.repository.spec.ts
git commit -m "feat: add bulkAddUserAssets repository method with INSERT...SELECT"
```

---

## Task 3: Add `@Chunked` to existing `addAssets` repository method

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts:164-175`

**Step 1: Add the `@Chunked` decorator**

In `server/src/repositories/shared-space.repository.ts`, add the decorator to the existing `addAssets` method:

```typescript
  @ChunkedArray({ chunkSize: 20_000 })
  addAssets(values: Insertable<SharedSpaceAssetTable>[]) {
    if (values.length === 0) {
      return Promise.resolve([]);
    }

    return this.db
      .insertInto('shared_space_asset')
      .values(values)
      .onConflict((oc) => oc.doNothing())
      .returningAll()
      .execute();
  }
```

Make sure the `ChunkedArray` import exists at the top of the file:

```typescript
import { ChunkedArray } from 'src/decorators';
```

**Step 2: Run existing tests to verify nothing breaks**

Run: `cd server && pnpm test:medium -- --run test/medium/specs/repositories/shared-space.repository.spec.ts`
Expected: All existing `addAssets` tests still PASS

**Step 3: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "fix: add @ChunkedArray decorator to SharedSpaceRepository.addAssets"
```

---

## Task 4: Fix sequential face-match queuing in `addAssets` and `handleSharedSpaceFaceMatchAll`

**Files:**

- Modify: `server/src/services/shared-space.service.ts:416-423` and `server/src/services/shared-space.service.ts:803-809`
- Test: `server/src/services/shared-space.service.spec.ts:1601-1625` and `server/src/services/shared-space.service.spec.ts:2303-2325`

**Step 1: Update the face-match queuing test for `addAssets`**

In `server/src/services/shared-space.service.spec.ts`, update the test at line 1601 ("should queue SharedSpaceFaceMatch jobs when faceRecognitionEnabled is true"):

```typescript
it('should queue SharedSpaceFaceMatch jobs when faceRecognitionEnabled is true', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const assetId1 = newUuid();
  const assetId2 = newUuid();
  const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });
  const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

  mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId1, assetId2]));
  mocks.sharedSpace.addAssets.mockResolvedValue([]);
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.update.mockResolvedValue(space);
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  await sut.addAssets(auth, spaceId, { assetIds: [assetId1, assetId2] });

  expect(mocks.job.queueAll).toHaveBeenCalledWith([
    { name: JobName.SharedSpaceFaceMatch, data: { spaceId, assetId: assetId1 } },
    { name: JobName.SharedSpaceFaceMatch, data: { spaceId, assetId: assetId2 } },
  ]);
});
```

**Step 2: Update the face-match queuing test for `handleSharedSpaceFaceMatchAll`**

In `server/src/services/shared-space.service.spec.ts`, update the test at line 2303 ("should queue SharedSpaceFaceMatch for each asset in the space"):

```typescript
it('should queue SharedSpaceFaceMatch for each asset in the space', async () => {
  const spaceId = newUuid();
  const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.getAssetIdsInSpace.mockResolvedValue([{ assetId: 'a1' }, { assetId: 'a2' }, { assetId: 'a3' }]);

  const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

  expect(result).toBe(JobStatus.Success);
  expect(mocks.job.queueAll).toHaveBeenCalledWith([
    { name: JobName.SharedSpaceFaceMatch, data: { spaceId, assetId: 'a1' } },
    { name: JobName.SharedSpaceFaceMatch, data: { spaceId, assetId: 'a2' } },
    { name: JobName.SharedSpaceFaceMatch, data: { spaceId, assetId: 'a3' } },
  ]);
});
```

**Step 3: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: FAIL — the two updated tests fail because the service still uses sequential `queue()` calls

**Step 4: Fix `addAssets` in the service**

In `server/src/services/shared-space.service.ts`, replace lines 416-423:

```typescript
const space = await this.sharedSpaceRepository.getById(spaceId);
if (space?.faceRecognitionEnabled) {
  for (const assetId of dto.assetIds) {
    await this.jobRepository.queue({
      name: JobName.SharedSpaceFaceMatch,
      data: { spaceId, assetId },
    });
  }
}
```

With:

```typescript
const space = await this.sharedSpaceRepository.getById(spaceId);
if (space?.faceRecognitionEnabled) {
  await this.jobRepository.queueAll(
    dto.assetIds.map((assetId) => ({
      name: JobName.SharedSpaceFaceMatch as const,
      data: { spaceId, assetId },
    })),
  );
}
```

**Step 5: Fix `handleSharedSpaceFaceMatchAll` in the service**

In `server/src/services/shared-space.service.ts`, replace lines 803-809 (the for loop inside `handleSharedSpaceFaceMatchAll`):

```typescript
const assets = await this.sharedSpaceRepository.getAssetIdsInSpace(spaceId);
for (const { assetId } of assets) {
  await this.jobRepository.queue({
    name: JobName.SharedSpaceFaceMatch,
    data: { spaceId, assetId },
  });
}
```

With:

```typescript
const assets = await this.sharedSpaceRepository.getAssetIdsInSpace(spaceId);
await this.jobRepository.queueAll(
  assets.map(({ assetId }) => ({
    name: JobName.SharedSpaceFaceMatch as const,
    data: { spaceId, assetId },
  })),
);
```

**Step 6: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: All tests PASS (including the two updated ones)

**Step 7: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "fix: batch face-match job queuing instead of sequential awaits"
```

---

## Task 5: Implement `queueBulkAdd` service method with unit tests

**Files:**

- Modify: `server/src/services/shared-space.service.ts`
- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write the failing unit tests**

Add a new `describe('queueBulkAdd')` block in the spec file, after the existing `addAssets` describe block:

```typescript
describe('queueBulkAdd', () => {
  it('should queue SharedSpaceBulkAddAssets job when called by editor', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);

    await sut.queueBulkAdd(auth, spaceId);

    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.SharedSpaceBulkAddAssets,
      data: { spaceId, userId: auth.user.id },
    });
  });

  it('should queue job when called by owner', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();
    const ownerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Owner });

    mocks.sharedSpace.getMember.mockResolvedValue(ownerMember);

    await sut.queueBulkAdd(auth, spaceId);

    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.SharedSpaceBulkAddAssets,
      data: { spaceId, userId: auth.user.id },
    });
  });

  it('should throw ForbiddenException when called by viewer', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();
    const viewerMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Viewer });

    mocks.sharedSpace.getMember.mockResolvedValue(viewerMember);

    await expect(sut.queueBulkAdd(auth, spaceId)).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.job.queue).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when called by non-member', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();

    mocks.sharedSpace.getMember.mockResolvedValue(void 0);

    await expect(sut.queueBulkAdd(auth, spaceId)).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.job.queue).not.toHaveBeenCalled();
  });

  it('should return spaceId', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);

    const result = await sut.queueBulkAdd(auth, spaceId);

    expect(result).toEqual({ spaceId });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: FAIL — `sut.queueBulkAdd is not a function`

**Step 3: Implement the `queueBulkAdd` method**

Add to `server/src/services/shared-space.service.ts`, after the `addAssets` method:

```typescript
  async queueBulkAdd(auth: AuthDto, spaceId: string): Promise<{ spaceId: string }> {
    await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);
    await this.jobRepository.queue({
      name: JobName.SharedSpaceBulkAddAssets,
      data: { spaceId, userId: auth.user.id },
    });
    return { spaceId };
  }
```

**Step 4: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: All 5 new tests PASS

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: add queueBulkAdd service method for bulk asset addition"
```

---

## Task 6: Implement `handleSharedSpaceBulkAddAssets` job handler with unit tests

**Files:**

- Modify: `server/src/services/shared-space.service.ts`
- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write the failing unit tests**

Add a new `describe('handleSharedSpaceBulkAddAssets')` block in the spec file. Add `mapNotification` to the imports from `src/dtos/notification.dto` if needed:

```typescript
describe('handleSharedSpaceBulkAddAssets', () => {
  it('should skip when user is no longer a member', async () => {
    mocks.sharedSpace.getMember.mockResolvedValue(void 0);

    const result = await sut.handleSharedSpaceBulkAddAssets({ spaceId: newUuid(), userId: newUuid() });

    expect(result).toBe(JobStatus.Skipped);
    expect(mocks.sharedSpace.bulkAddUserAssets).not.toHaveBeenCalled();
  });

  it('should skip when user has been demoted to viewer', async () => {
    const spaceId = newUuid();
    const userId = newUuid();
    const viewerMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Viewer });

    mocks.sharedSpace.getMember.mockResolvedValue(viewerMember);

    const result = await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

    expect(result).toBe(JobStatus.Skipped);
    expect(mocks.sharedSpace.bulkAddUserAssets).not.toHaveBeenCalled();
  });

  it('should skip when space is deleted', async () => {
    const spaceId = newUuid();
    const userId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
    mocks.sharedSpace.getById.mockResolvedValue(void 0);

    const result = await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

    expect(result).toBe(JobStatus.Skipped);
    expect(mocks.sharedSpace.bulkAddUserAssets).not.toHaveBeenCalled();
  });

  it('should call bulkAddUserAssets with correct spaceId and userId', async () => {
    const spaceId = newUuid();
    const userId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(5);
    mocks.sharedSpace.update.mockResolvedValue(space);
    mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
    mocks.notification.create.mockResolvedValue({
      id: 'n1',
      createdAt: new Date(),
      level: 'success',
      type: 'Custom',
      title: '',
      description: null,
      data: null,
      readAt: null,
    } as any);

    await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

    expect(mocks.sharedSpace.bulkAddUserAssets).toHaveBeenCalledWith(spaceId, userId);
  });

  it('should update lastActivityAt on the space', async () => {
    const spaceId = newUuid();
    const userId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(10);
    mocks.sharedSpace.update.mockResolvedValue(space);
    mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
    mocks.notification.create.mockResolvedValue({
      id: 'n1',
      createdAt: new Date(),
      level: 'success',
      type: 'Custom',
      title: '',
      description: null,
      data: null,
      readAt: null,
    } as any);

    await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

    expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, { lastActivityAt: expect.any(Date) });
  });

  it('should log activity with count and bulk flag', async () => {
    const spaceId = newUuid();
    const userId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(42);
    mocks.sharedSpace.update.mockResolvedValue(space);
    mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
    mocks.notification.create.mockResolvedValue({
      id: 'n1',
      createdAt: new Date(),
      level: 'success',
      type: 'Custom',
      title: '',
      description: null,
      data: null,
      readAt: null,
    } as any);

    await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

    expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
      spaceId,
      userId,
      type: SharedSpaceActivityType.AssetAdd,
      data: { count: 42, bulk: true },
    });
  });

  it('should NOT log activity when count is 0', async () => {
    const spaceId = newUuid();
    const userId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(0);

    await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

    expect(mocks.sharedSpace.logActivity).not.toHaveBeenCalled();
    expect(mocks.sharedSpace.update).not.toHaveBeenCalled();
  });

  it('should NOT send notification when count is 0', async () => {
    const spaceId = newUuid();
    const userId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(0);

    await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

    expect(mocks.notification.create).not.toHaveBeenCalled();
    expect(mocks.websocket.clientSend).not.toHaveBeenCalled();
  });

  it('should queue SharedSpaceFaceMatchAll when faceRecognitionEnabled', async () => {
    const spaceId = newUuid();
    const userId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(100);
    mocks.sharedSpace.update.mockResolvedValue(space);
    mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
    mocks.notification.create.mockResolvedValue({
      id: 'n1',
      createdAt: new Date(),
      level: 'success',
      type: 'Custom',
      title: '',
      description: null,
      data: null,
      readAt: null,
    } as any);

    await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.SharedSpaceFaceMatchAll,
      data: { spaceId },
    });
  });

  it('should NOT queue SharedSpaceFaceMatchAll when faceRecognitionEnabled is false', async () => {
    const spaceId = newUuid();
    const userId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(10);
    mocks.sharedSpace.update.mockResolvedValue(space);
    mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
    mocks.notification.create.mockResolvedValue({
      id: 'n1',
      createdAt: new Date(),
      level: 'success',
      type: 'Custom',
      title: '',
      description: null,
      data: null,
      readAt: null,
    } as any);

    await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

    expect(mocks.job.queue).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: JobName.SharedSpaceFaceMatchAll }),
    );
  });

  it('should send websocket notification on completion', async () => {
    const spaceId = newUuid();
    const userId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });
    const notification = {
      id: 'n1',
      createdAt: new Date(),
      level: 'success',
      type: 'Custom',
      title: 'Bulk add complete',
      description: '200 photos added to space',
      data: null,
      readAt: null,
    } as any;

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(200);
    mocks.sharedSpace.update.mockResolvedValue(space);
    mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
    mocks.notification.create.mockResolvedValue(notification);

    await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

    expect(mocks.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        type: NotificationType.Custom,
        level: NotificationLevel.Success,
      }),
    );
    expect(mocks.websocket.clientSend).toHaveBeenCalledWith('on_notification', userId, expect.any(Object));
  });

  it('should return JobStatus.Failed when bulkAddUserAssets throws', async () => {
    const spaceId = newUuid();
    const userId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.bulkAddUserAssets.mockRejectedValue(new Error('FK constraint violation'));

    const result = await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

    expect(result).toBe(JobStatus.Failed);
  });

  it('should return JobStatus.Success on happy path', async () => {
    const spaceId = newUuid();
    const userId = newUuid();
    const editorMember = makeMemberResult({ spaceId, userId, role: SharedSpaceRole.Editor });
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });

    mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.bulkAddUserAssets.mockResolvedValue(5);
    mocks.sharedSpace.update.mockResolvedValue(space);
    mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
    mocks.notification.create.mockResolvedValue({
      id: 'n1',
      createdAt: new Date(),
      level: 'success',
      type: 'Custom',
      title: '',
      description: null,
      data: null,
      readAt: null,
    } as any);

    const result = await sut.handleSharedSpaceBulkAddAssets({ spaceId, userId });

    expect(result).toBe(JobStatus.Success);
  });
});
```

Ensure `NotificationLevel` and `NotificationType` are in the imports from `src/enum`.

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: FAIL — `sut.handleSharedSpaceBulkAddAssets is not a function`

**Step 3: Implement the job handler**

Add to `server/src/services/shared-space.service.ts`. Add necessary imports at the top:

```typescript
import { mapNotification } from 'src/dtos/notification.dto';
```

Add the handler method (near the other `@OnJob` handlers):

```typescript
  @OnJob({ name: JobName.SharedSpaceBulkAddAssets, queue: QueueName.BackgroundTask })
  async handleSharedSpaceBulkAddAssets({
    spaceId,
    userId,
  }: JobOf<JobName.SharedSpaceBulkAddAssets>): Promise<JobStatus> {
    const member = await this.sharedSpaceRepository.getMember(spaceId, userId);
    if (!member || ROLE_HIERARCHY[member.role as SharedSpaceRole] < ROLE_HIERARCHY[SharedSpaceRole.Editor]) {
      return JobStatus.Skipped;
    }

    const space = await this.sharedSpaceRepository.getById(spaceId);
    if (!space) {
      return JobStatus.Skipped;
    }

    let count: number;
    try {
      count = await this.sharedSpaceRepository.bulkAddUserAssets(spaceId, userId);
    } catch (error) {
      this.logger.error(`Bulk add assets failed for space ${spaceId}: ${error}`);
      return JobStatus.Failed;
    }

    if (count === 0) {
      return JobStatus.Success;
    }

    await this.sharedSpaceRepository.update(spaceId, { lastActivityAt: new Date() });

    await this.sharedSpaceRepository.logActivity({
      spaceId,
      userId,
      type: SharedSpaceActivityType.AssetAdd,
      data: { count, bulk: true },
    });

    if (space.faceRecognitionEnabled) {
      await this.jobRepository.queue({
        name: JobName.SharedSpaceFaceMatchAll,
        data: { spaceId },
      });
    }

    const notification = await this.notificationRepository.create({
      userId,
      type: NotificationType.Custom,
      level: NotificationLevel.Success,
      title: 'Bulk add complete',
      description: `${count} photos added to space`,
      data: JSON.stringify({ spaceId }),
    });
    this.websocketRepository.clientSend('on_notification', userId, mapNotification(notification));

    return JobStatus.Success;
  }
```

Add `NotificationLevel`, `NotificationType` to the enum import if not already present.

**Step 4: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: All 14 new tests PASS

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: add handleSharedSpaceBulkAddAssets job handler with notification"
```

---

## Task 7: Add controller endpoint

**Files:**

- Modify: `server/src/controllers/shared-space.controller.ts:210-220`

**Step 1: Add the new endpoint**

In `server/src/controllers/shared-space.controller.ts`, add before the existing `POST :id/assets` endpoint (around line 210):

```typescript
  @Post(':id/assets/bulk-add')
  @Authenticated({ permission: Permission.SharedSpaceAssetCreate })
  @HttpCode(HttpStatus.ACCEPTED)
  @Endpoint({
    summary: 'Add all user assets to a shared space',
    description: 'Queues a background job to add all assets owned by the authenticated user to the space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  bulkAddAssets(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<{ spaceId: string }> {
    return this.service.queueBulkAdd(auth, id);
  }
```

Make sure `HttpStatus` includes `ACCEPTED` in the import (it should — `HttpStatus` is from `@nestjs/common`).

**Step 2: Run lint and type check**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add server/src/controllers/shared-space.controller.ts
git commit -m "feat: add POST /shared-spaces/:id/assets/bulk-add endpoint"
```

---

## Task 8: Regenerate OpenAPI specs and SDK

**Step 1: Build server and regenerate**

```bash
cd server && pnpm build
cd server && pnpm sync:open-api
make open-api
```

**Step 2: Verify the new endpoint appears in the SDK**

Search the generated SDK for `bulkAdd` or `bulk-add` to confirm the endpoint was picked up.

**Step 3: Commit**

```bash
git add open-api/ server/immich-openapi-specs.json
git commit -m "chore: regenerate OpenAPI specs for bulk-add endpoint"
```

---

## Task 9: Add E2E tests for the new endpoint

**Files:**

- Modify: `e2e/src/specs/server/api/shared-space.e2e-spec.ts`

**Step 1: Add E2E tests**

Add a new `describe` block for the bulk-add endpoint in the e2e spec file, after the existing `POST /shared-spaces/:id/assets` block:

```typescript
describe('POST /shared-spaces/:id/assets/bulk-add', () => {
  it('should require authentication', async () => {
    const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Auth Test' });
    const { status, body } = await request(app).post(`/shared-spaces/${space.id}/assets/bulk-add`);

    expect(status).toBe(401);
    expect(body).toEqual(errorDto.unauthorized);
  });

  it('should return 202 when called by owner', async () => {
    const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Owner' });

    const { status, body } = await request(app)
      .post(`/shared-spaces/${space.id}/assets/bulk-add`)
      .set('Authorization', `Bearer ${user1.accessToken}`);

    expect(status).toBe(202);
    expect(body).toEqual(expect.objectContaining({ spaceId: space.id }));
  });

  it('should return 202 when called by editor', async () => {
    const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Editor' });
    await utils.addSpaceMember(user1.accessToken, space.id, {
      userId: user2.userId,
      role: SharedSpaceRole.Editor,
    });

    const { status, body } = await request(app)
      .post(`/shared-spaces/${space.id}/assets/bulk-add`)
      .set('Authorization', `Bearer ${user2.accessToken}`);

    expect(status).toBe(202);
    expect(body).toEqual(expect.objectContaining({ spaceId: space.id }));
  });

  it('should reject viewer', async () => {
    const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Viewer Reject' });
    await utils.addSpaceMember(user1.accessToken, space.id, { userId: user2.userId });

    const { status } = await request(app)
      .post(`/shared-spaces/${space.id}/assets/bulk-add`)
      .set('Authorization', `Bearer ${user2.accessToken}`);

    expect(status).toBe(403);
  });

  it('should reject non-member', async () => {
    const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Non-Member' });

    const { status } = await request(app)
      .post(`/shared-spaces/${space.id}/assets/bulk-add`)
      .set('Authorization', `Bearer ${user3.accessToken}`);

    expect(status).toBe(403);
  });

  it('should accept when user has zero assets', async () => {
    const space = await utils.createSpace(user3.accessToken, { name: 'Bulk No Assets' });

    const { status } = await request(app)
      .post(`/shared-spaces/${space.id}/assets/bulk-add`)
      .set('Authorization', `Bearer ${user3.accessToken}`);

    expect(status).toBe(202);
  });

  it('should be idempotent', async () => {
    const space = await utils.createSpace(user1.accessToken, { name: 'Bulk Idempotent' });

    const { status: status1 } = await request(app)
      .post(`/shared-spaces/${space.id}/assets/bulk-add`)
      .set('Authorization', `Bearer ${user1.accessToken}`);

    const { status: status2 } = await request(app)
      .post(`/shared-spaces/${space.id}/assets/bulk-add`)
      .set('Authorization', `Bearer ${user1.accessToken}`);

    expect(status1).toBe(202);
    expect(status2).toBe(202);
  });
});
```

**Step 2: Run E2E tests**

Run: `cd e2e && pnpm test -- --run src/specs/server/api/shared-space.e2e-spec.ts`
Expected: All 7 new tests PASS

**Step 3: Commit**

```bash
git add e2e/src/specs/server/api/shared-space.e2e-spec.ts
git commit -m "test: add e2e tests for bulk-add endpoint"
```

---

## Task 10: Run lint, format, and full test suite

**Step 1: Run formatter and linter**

```bash
make format-server && make lint-server && make check-server
```

**Step 2: Run full server unit tests**

```bash
cd server && pnpm test
```

**Step 3: Fix any issues and commit**

```bash
git add -u
git commit -m "fix: lint and format fixes"
```

---

## Task 11: Web frontend — "Add all photos" button and UX

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Test: Web component tests (location TBD based on existing patterns)

This task should use the `/frontend-design` skill for UX design. The implementation includes:

1. An "Add all my photos" button in the space action bar (visible to editors/owners only)
2. A confirmation dialog explaining this is a background operation
3. Calling the new `bulkAddAssets` SDK method on confirm
4. A toast message: "Adding all photos... You'll be notified when complete."
5. The existing `on_notification` websocket listener handles the completion notification

**Step 1: Invoke /frontend-design skill for UX**

Use the `/frontend-design` skill to design the button placement, confirmation dialog, and notification UX.

**Step 2: Implement and test**

Follow the design output. Write web component tests covering:

- Button visible to editors/owners, hidden from viewers
- Click shows confirmation dialog
- Confirm calls bulk-add API
- Cancel does not call API
- Toast appears after successful API call
- Button disabled while bulk-add is in progress
- Error toast on API failure

**Step 3: Commit**

```bash
git add web/
git commit -m "feat: add 'Add all photos' button with background job UX"
```

---

## Task 12: Regenerate OpenAPI (if controller changes affect specs) and final lint

**Step 1: Regenerate SQL docs (if `@GenerateSql` was added)**

```bash
make sql
```

**Step 2: Final format/lint pass**

```bash
make format-all && make lint-all && make check-all
```

**Step 3: Final commit if needed**

```bash
git add -u
git commit -m "chore: regenerate specs and final lint pass"
```

---

Plan complete and saved to `docs/plans/2026-03-24-space-bulk-add-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session in the worktree (`~/dev/gallery-bulk-add`), batch execution with checkpoints

Which approach?
