# Shared Space Bulk Add Overload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make large shared-space bulk adds and shared-space people thumbnail viewing bounded so a 60k-photo space does not overload the API, workers, Redis, or S3 proxy.

**Architecture:** Replace `SharedSpaceFaceMatchAll` fan-out with an in-job keyset-paginated processor that calls the existing idempotent face matching helper and queues dedup once after completion. Add a per-process S3 proxy read limiter that holds slots for the full stream lifetime. Add shared-space people thumbnail gating so the browser only starts visible or near-visible thumbnails under a small client-side concurrency limit.

**Tech Stack:** NestJS services/repositories, Kysely, BullMQ job handlers, Vitest, Svelte 5, Testing Library, AWS SDK v3 streams.

---

## Safety Notes

- The worktree currently has unrelated local edits in storage and user service files. Before editing any file listed below, run `git diff -- <path>` and preserve existing local changes. Do not revert or overwrite those edits.
- Implement in TDD order. Each task starts with a failing test command, then the minimal code change, then the passing test command.
- Commit after each task so backend pagination, service behavior, S3 limiting, and frontend throttling can be reviewed independently.

## File Map

- Modify `server/src/repositories/shared-space.repository.ts`
  - Add `getAssetIdsInSpacePage(spaceId, options)` using keyset pagination over the combined direct + linked-library asset ids.
  - Keep `getAssetIdsInSpace(spaceId)` unchanged for existing callers that still need all rows.
- Modify `server/test/medium/specs/repositories/shared-space.repository.spec.ts`
  - Add medium repository tests covering ordering, pagination, deduplication, direct assets, linked-library assets, deleted library assets, and offline library assets.
- Modify `server/src/services/shared-space.service.ts`
  - Replace `SharedSpaceFaceMatchAll` `queueAll(...)` with bounded sequential pages and one final dedup.
  - Re-check space existence and `faceRecognitionEnabled` before each page.
- Modify `server/src/services/shared-space.service.spec.ts`
  - Replace fan-out expectations with bounded processor unit tests.
- Modify `server/src/backends/s3-storage.backend.ts`
  - Add `AsyncLimiter` and a proxy-stream wrapper that releases on `end`, `error`, and `close`.
  - Add optional config `proxyReadConcurrency`, defaulting to `32`.
- Modify `server/src/backends/s3-storage.backend.spec.ts`
  - Add limiter tests for concurrency, release paths, redirect bypass, and error propagation.
- Create `web/src/lib/components/people/deferred-person-thumbnail.svelte`
  - Render `ImageThumbnail` only after the tile enters the preload window and the thumbnail loader grants a slot.
- Create `web/src/lib/components/people/thumbnail-load-queue.svelte.ts`
  - Shared application-level queue with configurable concurrency and explicit release.
- Modify `web/src/lib/components/people/person-tile.svelte`
  - Add optional `deferThumbnail` prop and use `DeferredPersonThumbnail` when enabled.
- Modify `web/src/lib/components/people/people-management-grid.svelte`
  - Add optional `deferThumbnails` prop and pass it to `PersonTile`.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`
  - Enable `deferThumbnails` for the shared-space people grid.
- Modify `web/src/lib/components/people/people-visibility-modal.svelte`
  - Reuse the same deferred thumbnail loader for the shared-space visibility modal.
- Modify `web/src/lib/components/spaces/manage-space-people-visibility.svelte`
  - Enable deferred thumbnails for the shared-space visibility modal wrapper.
- Modify `web/src/lib/components/people/people-management-grid.test-wrapper.svelte`
  - Expose `deferThumbnails` for component tests.
- Modify `web/src/lib/components/people/people-management-grid.spec.ts`
  - Add tests for offscreen thumbnails, concurrency cap, failed loads, and paging.
- Modify `web/src/lib/components/people/people-visibility-modal.test-wrapper.svelte`
  - Expose `deferThumbnails` for visibility modal tests.
- Modify `web/src/lib/components/people/people-visibility-modal.spec.ts`
  - Add coverage that the modal does not eagerly assign thumbnail URLs.

---

### Task 1: Repository Keyset Pagination

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts`
- Test: `server/test/medium/specs/repositories/shared-space.repository.spec.ts`

- [ ] **Step 1: Add failing medium tests for paginated asset ids**

Append this `describe` block after the existing `bulkAddUserAssets` tests in `server/test/medium/specs/repositories/shared-space.repository.spec.ts`:

```ts
describe('getAssetIdsInSpacePage', () => {
  it('returns direct and linked-library assets in stable id order with keyset pagination', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });

    const { asset: directB } = await ctx.newAsset({ ownerId: user.id, id: '00000000-0000-4000-a000-000000000020' });
    const { asset: directA } = await ctx.newAsset({ ownerId: user.id, id: '00000000-0000-4000-a000-000000000010' });
    const { asset: libraryAsset } = await ctx.newAsset({
      ownerId: user.id,
      libraryId: library.id,
      id: '00000000-0000-4000-a000-000000000030',
    });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: directB.id, addedById: user.id });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: directA.id, addedById: user.id });

    const firstPage = await sut.getAssetIdsInSpacePage(space.id, { limit: 2 });
    const secondPage = await sut.getAssetIdsInSpacePage(space.id, {
      limit: 2,
      afterAssetId: firstPage.at(-1)?.assetId,
    });

    expect(firstPage.map(({ assetId }) => assetId)).toEqual([directA.id, directB.id]);
    expect(secondPage.map(({ assetId }) => assetId)).toEqual([libraryAsset.id]);
  });

  it('deduplicates assets reachable directly and through a linked library', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id, libraryId: library.id });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });

    const page = await sut.getAssetIdsInSpacePage(space.id, { limit: 10 });

    expect(page).toEqual([{ assetId: asset.id }]);
  });

  it('filters deleted and offline linked-library assets', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id });
    const { asset: visible } = await ctx.newAsset({ ownerId: user.id, libraryId: library.id });
    await ctx.newAsset({ ownerId: user.id, libraryId: library.id, deletedAt: new Date() });
    await ctx.newAsset({ ownerId: user.id, libraryId: library.id, isOffline: true });

    const page = await sut.getAssetIdsInSpacePage(space.id, { limit: 10 });

    expect(page).toEqual([{ assetId: visible.id }]);
  });

  it('returns an empty page after the last asset id', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });

    const page = await sut.getAssetIdsInSpacePage(space.id, { limit: 10, afterAssetId: asset.id });

    expect(page).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the repository tests and verify failure**

Run:

```bash
cd /home/pierre/dev/gallery/server
pnpm test:medium -- test/medium/specs/repositories/shared-space.repository.spec.ts
```

Expected: FAIL because `getAssetIdsInSpacePage` is not defined.

- [ ] **Step 3: Add the repository method**

In `server/src/repositories/shared-space.repository.ts`, add this method immediately before `getAssetIdsInSpace(spaceId: string)`:

```ts
  @GenerateSql({ params: [DummyValue.UUID, { limit: DummyValue.NUMBER, afterAssetId: DummyValue.UUID }] })
  getAssetIdsInSpacePage(
    spaceId: string,
    options: { limit: number; afterAssetId?: string } = { limit: 1000 },
  ) {
    const combined = this.db
      .selectFrom('shared_space_asset')
      .select('assetId as id')
      .where('spaceId', '=', spaceId)
      .union(
        this.db
          .selectFrom('shared_space_library')
          .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
          .select('asset.id')
          .where('shared_space_library.spaceId', '=', spaceId)
          .where('asset.deletedAt', 'is', null)
          .where('asset.isOffline', '=', false),
      )
      .as('combined');

    return this.db
      .selectFrom(combined)
      .select('combined.id as assetId')
      .$if(!!options.afterAssetId, (qb) => qb.where('combined.id', '>', options.afterAssetId!))
      .orderBy('combined.id', 'asc')
      .limit(options.limit)
      .execute();
  }
```

Leave the existing `getAssetIdsInSpace(spaceId: string)` method in place so unrelated callers keep their current unbounded behavior until they are migrated intentionally.

- [ ] **Step 4: Run the repository tests and verify pass**

Run:

```bash
cd /home/pierre/dev/gallery/server
pnpm test:medium -- test/medium/specs/repositories/shared-space.repository.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit repository pagination**

Run:

```bash
cd /home/pierre/dev/gallery
git add server/src/repositories/shared-space.repository.ts server/test/medium/specs/repositories/shared-space.repository.spec.ts
git commit -m "fix: page shared space asset ids"
```

---

### Task 2: Bounded SharedSpaceFaceMatchAll Processing

**Files:**

- Modify: `server/src/services/shared-space.service.ts`
- Test: `server/src/services/shared-space.service.spec.ts`

- [ ] **Step 1: Replace the current fan-out unit tests with bounded-processing tests**

In `server/src/services/shared-space.service.spec.ts`, replace only the `describe('handleSharedSpaceFaceMatchAll', ...)` block with this:

```ts
describe('handleSharedSpaceFaceMatchAll', () => {
  it('should skip when space not found', async () => {
    mocks.sharedSpace.getById.mockResolvedValue(void 0);

    const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId: 'space-1' });

    expect(result).toBe(JobStatus.Skipped);
    expect(mocks.sharedSpace.getAssetIdsInSpacePage).not.toHaveBeenCalled();
    expect(mocks.job.queue).not.toHaveBeenCalledWith(expect.objectContaining({ name: JobName.SharedSpacePersonDedup }));
  });

  it('should skip when face recognition is disabled', async () => {
    const space = factory.sharedSpace({ faceRecognitionEnabled: false });
    mocks.sharedSpace.getById.mockResolvedValue(space);

    const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId: space.id });

    expect(result).toBe(JobStatus.Skipped);
    expect(mocks.sharedSpace.getAssetIdsInSpacePage).not.toHaveBeenCalled();
    expect(mocks.job.queue).not.toHaveBeenCalledWith(expect.objectContaining({ name: JobName.SharedSpacePersonDedup }));
  });

  it('should process pages sequentially without queueing per-asset child jobs', async () => {
    const spaceId = newUuid();
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
    (sut as any).sharedSpaceFaceMatchBatchSize = 2;
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getAssetIdsInSpacePage
      .mockResolvedValueOnce([{ assetId: 'a1' }, { assetId: 'a2' }])
      .mockResolvedValueOnce([{ assetId: 'a3' }]);
    const processSpy = vi.spyOn(sut as any, 'processSpaceFaceMatch').mockResolvedValue(undefined);

    const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

    expect(result).toBe(JobStatus.Success);
    expect(mocks.sharedSpace.getAssetIdsInSpacePage).toHaveBeenNthCalledWith(1, spaceId, { limit: 2 });
    expect(mocks.sharedSpace.getAssetIdsInSpacePage).toHaveBeenNthCalledWith(2, spaceId, {
      limit: 2,
      afterAssetId: 'a2',
    });
    expect(processSpy).toHaveBeenNthCalledWith(1, spaceId, 'a1');
    expect(processSpy).toHaveBeenNthCalledWith(2, spaceId, 'a2');
    expect(processSpy).toHaveBeenNthCalledWith(3, spaceId, 'a3');
    expect(mocks.job.queueAll).not.toHaveBeenCalled();
    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.SharedSpacePersonDedup,
      data: { spaceId },
    });
  });

  it('should read an empty final page when the first page is exactly the batch size', async () => {
    const spaceId = newUuid();
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
    (sut as any).sharedSpaceFaceMatchBatchSize = 2;
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getAssetIdsInSpacePage
      .mockResolvedValueOnce([{ assetId: 'asset-1' }, { assetId: 'asset-2' }])
      .mockResolvedValueOnce([]);
    const processSpy = vi.spyOn(sut as any, 'processSpaceFaceMatch').mockResolvedValue(undefined);

    const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

    expect(result).toBe(JobStatus.Success);
    expect(mocks.sharedSpace.getAssetIdsInSpacePage).toHaveBeenCalledTimes(2);
    expect(processSpy).toHaveBeenCalledTimes(2);
    expect(mocks.job.queue).toHaveBeenCalledWith({
      name: JobName.SharedSpacePersonDedup,
      data: { spaceId },
    });
  });

  it('should succeed without dedup when there are no assets to process', async () => {
    const spaceId = newUuid();
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getAssetIdsInSpacePage.mockResolvedValueOnce([]);
    const processSpy = vi.spyOn(sut as any, 'processSpaceFaceMatch').mockResolvedValue(undefined);

    const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

    expect(result).toBe(JobStatus.Success);
    expect(processSpy).not.toHaveBeenCalled();
    expect(mocks.job.queue).not.toHaveBeenCalledWith(expect.objectContaining({ name: JobName.SharedSpacePersonDedup }));
  });

  it('should stop without dedup when face recognition is disabled between pages', async () => {
    const spaceId = newUuid();
    const enabled = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
    const disabled = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });
    (sut as any).sharedSpaceFaceMatchBatchSize = 2;
    mocks.sharedSpace.getById
      .mockResolvedValueOnce(enabled)
      .mockResolvedValueOnce(enabled)
      .mockResolvedValueOnce(disabled);
    mocks.sharedSpace.getAssetIdsInSpacePage.mockResolvedValueOnce([{ assetId: 'a1' }, { assetId: 'a2' }]);
    const processSpy = vi.spyOn(sut as any, 'processSpaceFaceMatch').mockResolvedValue(undefined);

    const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

    expect(result).toBe(JobStatus.Success);
    expect(processSpy).toHaveBeenCalledTimes(2);
    expect(mocks.sharedSpace.getAssetIdsInSpacePage).toHaveBeenCalledTimes(1);
    expect(mocks.job.queue).not.toHaveBeenCalledWith(expect.objectContaining({ name: JobName.SharedSpacePersonDedup }));
  });

  it('should stop without dedup when the space is deleted between pages', async () => {
    const spaceId = newUuid();
    const enabled = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
    (sut as any).sharedSpaceFaceMatchBatchSize = 2;
    mocks.sharedSpace.getById
      .mockResolvedValueOnce(enabled)
      .mockResolvedValueOnce(enabled)
      .mockResolvedValueOnce(void 0);
    mocks.sharedSpace.getAssetIdsInSpacePage.mockResolvedValueOnce([{ assetId: 'a1' }, { assetId: 'a2' }]);
    const processSpy = vi.spyOn(sut as any, 'processSpaceFaceMatch').mockResolvedValue(undefined);

    const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

    expect(result).toBe(JobStatus.Success);
    expect(processSpy).toHaveBeenCalledTimes(2);
    expect(mocks.sharedSpace.getAssetIdsInSpacePage).toHaveBeenCalledTimes(1);
    expect(mocks.job.queue).not.toHaveBeenCalledWith(expect.objectContaining({ name: JobName.SharedSpacePersonDedup }));
  });

  it('should re-check the space before queuing final dedup', async () => {
    const spaceId = newUuid();
    const enabled = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });
    const disabled = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });
    (sut as any).sharedSpaceFaceMatchBatchSize = 2;
    mocks.sharedSpace.getById
      .mockResolvedValueOnce(enabled)
      .mockResolvedValueOnce(enabled)
      .mockResolvedValueOnce(disabled);
    mocks.sharedSpace.getAssetIdsInSpacePage.mockResolvedValueOnce([{ assetId: 'a1' }]);
    const processSpy = vi.spyOn(sut as any, 'processSpaceFaceMatch').mockResolvedValue(undefined);

    const result = await sut.handleSharedSpaceFaceMatchAll({ spaceId });

    expect(result).toBe(JobStatus.Success);
    expect(processSpy).toHaveBeenCalledTimes(1);
    expect(mocks.job.queue).not.toHaveBeenCalledWith(expect.objectContaining({ name: JobName.SharedSpacePersonDedup }));
  });
});
```

- [ ] **Step 2: Run the service tests and verify failure**

Run:

```bash
cd /home/pierre/dev/gallery/server
pnpm test -- src/services/shared-space.service.spec.ts
```

Expected: FAIL because the handler still calls `getAssetIdsInSpace` and `queueAll`.

- [ ] **Step 3: Implement bounded processing**

In `server/src/services/shared-space.service.ts`, add this import beside the other Node imports:

```ts
import { setImmediate } from 'node:timers/promises';
```

Add this private field near the other service fields:

```ts
  private sharedSpaceFaceMatchBatchSize = 1000;
```

Replace `handleSharedSpaceFaceMatchAll` with:

```ts
  @OnJob({ name: JobName.SharedSpaceFaceMatchAll, queue: QueueName.FacialRecognition })
  async handleSharedSpaceFaceMatchAll({ spaceId }: JobOf<JobName.SharedSpaceFaceMatchAll>): Promise<JobStatus> {
    const batchSize = this.sharedSpaceFaceMatchBatchSize;
    let processedAny = false;
    let afterAssetId: string | undefined;

    const initialSpace = await this.sharedSpaceRepository.getById(spaceId);
    if (!initialSpace || !initialSpace.faceRecognitionEnabled) {
      return JobStatus.Skipped;
    }

    while (true) {
      const currentSpace = await this.sharedSpaceRepository.getById(spaceId);
      if (!currentSpace || !currentSpace.faceRecognitionEnabled) {
        return JobStatus.Success;
      }

      const assets = await this.sharedSpaceRepository.getAssetIdsInSpacePage(spaceId, {
        limit: batchSize,
        ...(afterAssetId ? { afterAssetId } : {}),
      });

      if (assets.length === 0) {
        break;
      }

      for (const { assetId } of assets) {
        await this.processSpaceFaceMatch(spaceId, assetId);
        processedAny = true;
      }

      afterAssetId = assets.at(-1)?.assetId;
      if (assets.length < batchSize) {
        break;
      }

      await setImmediate();
    }

    if (processedAny) {
      const finalSpace = await this.sharedSpaceRepository.getById(spaceId);
      if (!finalSpace || !finalSpace.faceRecognitionEnabled) {
        return JobStatus.Success;
      }

      await this.jobRepository.queue({
        name: JobName.SharedSpacePersonDedup,
        data: { spaceId },
      });
    }

    return JobStatus.Success;
  }
```

- [ ] **Step 4: Run service tests and verify pass**

Run:

```bash
cd /home/pierre/dev/gallery/server
pnpm test -- src/services/shared-space.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit bounded face matching**

Run:

```bash
cd /home/pierre/dev/gallery
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "fix: bound shared space face matching"
```

---

### Task 3: S3 Proxy Read Limiter

**Files:**

- Modify: `server/src/backends/s3-storage.backend.ts`
- Test: `server/src/backends/s3-storage.backend.spec.ts`

- [ ] **Step 1: Add failing limiter tests**

Append these tests inside the existing `describe('getServeStrategy', ...)` block in `server/src/backends/s3-storage.backend.spec.ts`:

```ts
it('should limit concurrent proxied S3 reads', async () => {
  const proxyBackend = new S3StorageBackend({
    bucket: 'test-bucket',
    region: 'us-east-1',
    presignedUrlExpiry: 3600,
    serveMode: 'proxy' as const,
    proxyReadConcurrency: 1,
  });
  const proxyClient = (S3Client as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
  let firstResolve!: (value: unknown) => void;
  proxyClient.send
    .mockReturnValueOnce(
      new Promise((resolve) => {
        firstResolve = resolve;
      }),
    )
    .mockResolvedValueOnce({ Body: Readable.from([Buffer.from('second')]), ContentLength: 6 });

  const first = proxyBackend.getServeStrategy('first.jpg', 'image/jpeg');
  const second = proxyBackend.getServeStrategy('second.jpg', 'image/jpeg');
  await Promise.resolve();

  expect(proxyClient.send).toHaveBeenCalledTimes(1);
  firstResolve({ Body: Readable.from([Buffer.from('first')]), ContentLength: 5 });
  const firstStrategy = await first;
  expect(proxyClient.send).toHaveBeenCalledTimes(1);
  if (firstStrategy.type === 'stream') {
    firstStrategy.stream.destroy();
  }
  await second;

  expect(proxyClient.send).toHaveBeenCalledTimes(2);
  await expect(second).resolves.toMatchObject({ type: 'stream' });
});

it('should release a proxy read slot when the stream ends', async () => {
  const proxyBackend = new S3StorageBackend({
    bucket: 'test-bucket',
    region: 'us-east-1',
    presignedUrlExpiry: 3600,
    serveMode: 'proxy' as const,
    proxyReadConcurrency: 1,
  });
  const proxyClient = (S3Client as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
  proxyClient.send
    .mockResolvedValueOnce({ Body: Readable.from([Buffer.from('first')]), ContentLength: 5 })
    .mockResolvedValueOnce({ Body: Readable.from([Buffer.from('second')]), ContentLength: 6 });

  const first = await proxyBackend.getServeStrategy('first.jpg', 'image/jpeg');
  const secondPromise = proxyBackend.getServeStrategy('second.jpg', 'image/jpeg');
  expect(proxyClient.send).toHaveBeenCalledTimes(1);
  if (first.type === 'stream') {
    for await (const _chunk of first.stream) {
      // drain stream
    }
  }
  const second = await secondPromise;

  expect(second.type).toBe('stream');
  expect(proxyClient.send).toHaveBeenCalledTimes(2);
});

it('should release a proxy read slot when stream creation fails', async () => {
  const proxyBackend = new S3StorageBackend({
    bucket: 'test-bucket',
    region: 'us-east-1',
    presignedUrlExpiry: 3600,
    serveMode: 'proxy' as const,
    proxyReadConcurrency: 1,
  });
  const proxyClient = (S3Client as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
  proxyClient.send.mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce({
    Body: Readable.from([Buffer.from('second')]),
    ContentLength: 6,
  });

  await expect(proxyBackend.getServeStrategy('first.jpg', 'image/jpeg')).rejects.toThrow('denied');
  const second = await proxyBackend.getServeStrategy('second.jpg', 'image/jpeg');

  expect(second.type).toBe('stream');
  expect(proxyClient.send).toHaveBeenCalledTimes(2);
});

it('should release a proxy read slot when the stream errors', async () => {
  const proxyBackend = new S3StorageBackend({
    bucket: 'test-bucket',
    region: 'us-east-1',
    presignedUrlExpiry: 3600,
    serveMode: 'proxy' as const,
    proxyReadConcurrency: 1,
  });
  const proxyClient = (S3Client as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
  const erroringStream = new Readable({
    read() {
      this.destroy(new Error('stream failed'));
    },
  });
  proxyClient.send
    .mockResolvedValueOnce({ Body: erroringStream, ContentLength: 5 })
    .mockResolvedValueOnce({ Body: Readable.from([Buffer.from('second')]), ContentLength: 6 });

  const first = await proxyBackend.getServeStrategy('first.jpg', 'image/jpeg');
  const secondPromise = proxyBackend.getServeStrategy('second.jpg', 'image/jpeg');
  if (first.type === 'stream') {
    await expect(
      (async () => {
        for await (const _chunk of first.stream) {
          // drain stream
        }
      })(),
    ).rejects.toThrow('stream failed');
  }
  const second = await secondPromise;

  expect(second.type).toBe('stream');
  expect(proxyClient.send).toHaveBeenCalledTimes(2);
});

it('should not acquire proxy read slots in redirect mode', async () => {
  const strategy = await backend.getServeStrategy('thumbs/user1/ab/cd/thumb.webp', 'image/webp');

  expect(strategy.type).toBe('redirect');
  expect(mockSend).not.toHaveBeenCalled();
  expect(getSignedUrl).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run S3 backend tests and verify failure**

Run:

```bash
cd /home/pierre/dev/gallery/server
pnpm test -- src/backends/s3-storage.backend.spec.ts
```

Expected: FAIL because `proxyReadConcurrency` is not part of `S3StorageConfig` and no limiter exists.

- [ ] **Step 3: Implement the limiter**

In `server/src/backends/s3-storage.backend.ts`, add this class above `export interface S3StorageConfig`:

```ts
class AsyncLimiter {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly max: number) {}

  async acquire(): Promise<() => void> {
    if (this.active >= this.max) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.active++;
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      this.active--;
      this.queue.shift()?.();
    };
  }
}
```

Extend `S3StorageConfig`:

```ts
  proxyReadConcurrency?: number;
```

Add a field to `S3StorageBackend`:

```ts
  private proxyReadLimiter: AsyncLimiter;
```

Initialize it in the constructor:

```ts
this.proxyReadLimiter = new AsyncLimiter(config.proxyReadConcurrency ?? 32);
```

Add this private method in the class:

```ts
  private releaseWhenStreamCloses(stream: Readable, release: () => void) {
    stream.once('end', release);
    stream.once('error', release);
    stream.once('close', release);
    return stream;
  }
```

Replace the proxy branch of `getServeStrategy` with:

```ts
if (this.serveMode === 'proxy') {
  const release = await this.proxyReadLimiter.acquire();
  try {
    const { stream, length } = await this.get(key);
    return { type: 'stream', stream: this.releaseWhenStreamCloses(stream, release), length };
  } catch (error) {
    release();
    throw error;
  }
}
```

- [ ] **Step 4: Run S3 backend tests and verify pass**

Run:

```bash
cd /home/pierre/dev/gallery/server
pnpm test -- src/backends/s3-storage.backend.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit S3 limiter**

Run:

```bash
cd /home/pierre/dev/gallery
git add server/src/backends/s3-storage.backend.ts server/src/backends/s3-storage.backend.spec.ts
git commit -m "fix: limit proxied s3 reads"
```

---

### Task 4: Shared-Space People Thumbnail Throttling

**Files:**

- Create: `web/src/lib/components/people/thumbnail-load-queue.svelte.ts`
- Create: `web/src/lib/components/people/deferred-person-thumbnail.svelte`
- Modify: `web/src/lib/components/people/person-tile.svelte`
- Modify: `web/src/lib/components/people/people-management-grid.svelte`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`
- Modify: `web/src/lib/components/people/people-visibility-modal.svelte`
- Modify: `web/src/lib/components/spaces/manage-space-people-visibility.svelte`
- Modify: `web/src/lib/components/people/people-management-grid.test-wrapper.svelte`
- Modify: `web/src/lib/components/people/people-visibility-modal.test-wrapper.svelte`
- Test: `web/src/lib/components/people/people-management-grid.spec.ts`
- Test: `web/src/lib/components/people/people-visibility-modal.spec.ts`

- [ ] **Step 1: Add failing frontend tests**

Append these tests to `web/src/lib/components/people/people-management-grid.spec.ts`:

```ts
it('does not assign thumbnail src for deferred offscreen tiles', () => {
  class NeverIntersectingObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', NeverIntersectingObserver);

  render(PeopleManagementGridWrapper, {
    props: {
      deferThumbnails: true,
      people: Array.from({ length: 3 }, (_, index) => ({ id: `person-${index}`, name: `Person ${index}` })),
    },
  });

  expect(screen.getAllByRole('img')).toHaveLength(3);
  expect(screen.getByTitle('Person 0')).not.toHaveAttribute('src');
  expect(screen.getByTitle('Person 1')).not.toHaveAttribute('src');
  expect(screen.getByTitle('Person 2')).not.toHaveAttribute('src');

  vi.unstubAllGlobals();
});

it('only starts the configured number of visible deferred thumbnails at once', async () => {
  let callback!: IntersectionObserverCallback;
  class VisibleObserver {
    observe = vi.fn((target: Element) => {
      callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    });
    disconnect = vi.fn();
    unobserve = vi.fn();
    constructor(cb: IntersectionObserverCallback) {
      callback = cb;
    }
  }
  vi.stubGlobal('IntersectionObserver', VisibleObserver);

  render(PeopleManagementGridWrapper, {
    props: {
      deferThumbnails: true,
      thumbnailConcurrency: 2,
      people: Array.from({ length: 4 }, (_, index) => ({ id: `person-${index}`, name: `Person ${index}` })),
    },
  });

  await waitFor(() => {
    expect(screen.getByTitle('Person 0')).toHaveAttribute('src', '/api/people/person-0/thumbnail');
    expect(screen.getByTitle('Person 1')).toHaveAttribute('src', '/api/people/person-1/thumbnail');
  });
  expect(screen.getByTitle('Person 2')).not.toHaveAttribute('src');
  expect(screen.getByTitle('Person 3')).not.toHaveAttribute('src');

  await fireEvent.load(screen.getByTitle('Person 0'));
  await waitFor(() => {
    expect(screen.getByTitle('Person 2')).toHaveAttribute('src', '/api/people/person-2/thumbnail');
  });

  vi.unstubAllGlobals();
});

it('releases a deferred thumbnail slot when an image fails', async () => {
  let callback!: IntersectionObserverCallback;
  class VisibleObserver {
    observe = vi.fn((target: Element) => {
      callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    });
    disconnect = vi.fn();
    unobserve = vi.fn();
    constructor(cb: IntersectionObserverCallback) {
      callback = cb;
    }
  }
  vi.stubGlobal('IntersectionObserver', VisibleObserver);

  render(PeopleManagementGridWrapper, {
    props: {
      deferThumbnails: true,
      thumbnailConcurrency: 1,
      people: [
        { id: 'person-1', name: 'Ada Lovelace' },
        { id: 'person-2', name: 'Grace Hopper' },
      ],
    },
  });

  await waitFor(() => expect(screen.getByTitle('Ada Lovelace')).toHaveAttribute('src'));
  expect(screen.getByTitle('Grace Hopper')).not.toHaveAttribute('src');
  await fireEvent.error(screen.getByTitle('Ada Lovelace'));
  await waitFor(() => expect(screen.getByTitle('Grace Hopper')).toHaveAttribute('src'));

  vi.unstubAllGlobals();
});

it('does not start every thumbnail at once when a new people page is appended', async () => {
  let callback!: IntersectionObserverCallback;
  class VisibleObserver {
    observe = vi.fn((target: Element) => {
      callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    });
    disconnect = vi.fn();
    unobserve = vi.fn();
    constructor(cb: IntersectionObserverCallback) {
      callback = cb;
    }
  }
  vi.stubGlobal('IntersectionObserver', VisibleObserver);

  const { rerender } = render(PeopleManagementGridWrapper, {
    props: {
      deferThumbnails: true,
      thumbnailConcurrency: 2,
      people: [
        { id: 'person-1', name: 'Ada Lovelace' },
        { id: 'person-2', name: 'Grace Hopper' },
      ],
    },
  });
  await waitFor(() => expect(screen.getByTitle('Ada Lovelace')).toHaveAttribute('src'));
  await waitFor(() => expect(screen.getByTitle('Grace Hopper')).toHaveAttribute('src'));

  await rerender({
    deferThumbnails: true,
    thumbnailConcurrency: 2,
    people: [
      { id: 'person-1', name: 'Ada Lovelace' },
      { id: 'person-2', name: 'Grace Hopper' },
      { id: 'person-3', name: 'Katherine Johnson' },
      { id: 'person-4', name: 'Dorothy Vaughan' },
      { id: 'person-5', name: 'Mary Jackson' },
    ],
  });

  expect(screen.getByTitle('Katherine Johnson')).not.toHaveAttribute('src');
  expect(screen.getByTitle('Dorothy Vaughan')).not.toHaveAttribute('src');
  expect(screen.getByTitle('Mary Jackson')).not.toHaveAttribute('src');

  await fireEvent.load(screen.getByTitle('Ada Lovelace'));
  await waitFor(() => expect(screen.getByTitle('Katherine Johnson')).toHaveAttribute('src'));
  expect(screen.getByTitle('Mary Jackson')).not.toHaveAttribute('src');

  vi.unstubAllGlobals();
});
```

Append this test to `web/src/lib/components/people/people-visibility-modal.spec.ts`:

```ts
it('does not assign thumbnail src for deferred offscreen visibility modal people', () => {
  class NeverIntersectingObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', NeverIntersectingObserver);

  render(PeopleVisibilityModalWrapper, {
    props: {
      people: [
        makePerson({ id: 'p1', displayName: 'Alice', thumbnailUrl: '/api/people/p1/thumbnail' }),
        makePerson({ id: 'p2', displayName: 'Bob', thumbnailUrl: '/api/people/p2/thumbnail' }),
      ],
      onClose,
      onUpdate,
      saveVisibilityChanges,
      deferThumbnails: true,
    },
  });

  expect(screen.getByTitle('Alice')).not.toHaveAttribute('src');
  expect(screen.getByTitle('Bob')).not.toHaveAttribute('src');

  vi.unstubAllGlobals();
});
```

- [ ] **Step 2: Run frontend tests and verify failure**

Run:

```bash
cd /home/pierre/dev/gallery/web
pnpm test -- src/lib/components/people/people-management-grid.spec.ts src/lib/components/people/people-visibility-modal.spec.ts
```

Expected: FAIL because `deferThumbnails` and `thumbnailConcurrency` props do not exist on the grid and visibility modal surfaces.

- [ ] **Step 3: Create the thumbnail queue**

Create `web/src/lib/components/people/thumbnail-load-queue.svelte.ts`:

```ts
export class ThumbnailLoadQueue {
  private active = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(private readonly concurrency = 8) {}

  request(start: () => void) {
    const run = () => {
      this.active++;
      start();
    };

    if (this.active < this.concurrency) {
      run();
      return;
    }

    this.waiting.push(run);
  }

  release() {
    if (this.active > 0) {
      this.active--;
    }
    this.waiting.shift()?.();
  }
}
```

- [ ] **Step 4: Create the deferred thumbnail component**

Create `web/src/lib/components/people/deferred-person-thumbnail.svelte`:

```svelte
<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import type { ThumbnailLoadQueue } from '$lib/components/people/thumbnail-load-queue.svelte';

  interface Props {
    queue: ThumbnailLoadQueue;
    url: string;
    altText: string;
    title: string;
    widthStyle?: string;
    shadow?: boolean;
    circle?: boolean;
  }

  let { queue, url, altText, title, widthStyle = '100%', shadow = false, circle = false }: Props = $props();
  let element = $state<HTMLDivElement>();
  let visible = $state(false);
  let started = $state(false);
  let released = false;

  const release = () => {
    if (released || !started) {
      return;
    }
    released = true;
    queue.release();
  };

  $effect(() => {
    if (!element || visible) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      visible = true;
      queue.request(() => {
        started = true;
      });
      return release;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          visible = true;
          observer.disconnect();
          queue.request(() => {
            started = true;
          });
        }
      },
      { rootMargin: '600px' },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      release();
    };
  });
</script>

<div bind:this={element}>
  {#if started}
    <ImageThumbnail {shadow} {url} {altText} {title} {widthStyle} {circle} preload={false} onComplete={release} />
  {:else}
    <img
      class={[
        'object-cover bg-gray-300 dark:bg-gray-700 transition-shadow duration-150',
        circle && 'aspect-square rounded-full',
        shadow && 'shadow-lg',
      ]}
      style={`width: ${widthStyle};`}
      alt=""
      draggable={false}
      title={title ?? undefined}
    />
  {/if}
</div>
```

- [ ] **Step 5: Wire deferred thumbnails into people tiles**

In `web/src/lib/components/people/person-tile.svelte`, add imports:

```ts
import DeferredPersonThumbnail from '$lib/components/people/deferred-person-thumbnail.svelte';
import type { ThumbnailLoadQueue } from '$lib/components/people/thumbnail-load-queue.svelte';
```

Extend `Props`:

```ts
    deferThumbnail?: boolean;
    thumbnailQueue?: ThumbnailLoadQueue;
```

Update props destructuring:

```ts
let { person, showActionMenu = true, actionMenu, footer, deferThumbnail = false, thumbnailQueue }: Props = $props();
```

Replace the existing `ImageThumbnail` block with:

```svelte
      {#if deferThumbnail && thumbnailQueue}
        <DeferredPersonThumbnail
          queue={thumbnailQueue}
          shadow
          url={person.thumbnailUrl}
          altText={person.displayName}
          title={person.displayName}
          widthStyle="100%"
          circle
        />
      {:else}
        <ImageThumbnail
          shadow
          url={person.thumbnailUrl}
          altText={person.displayName}
          title={person.displayName}
          widthStyle="100%"
          circle
          preload={false}
        />
      {/if}
```

- [ ] **Step 6: Wire the queue into the people grid and route**

In `web/src/lib/components/people/people-management-grid.svelte`, import the queue:

```ts
import { ThumbnailLoadQueue } from '$lib/components/people/thumbnail-load-queue.svelte';
```

Extend `Props`:

```ts
    deferThumbnails?: boolean;
    thumbnailConcurrency?: number;
```

Update props destructuring:

```ts
    deferThumbnails = false,
    thumbnailConcurrency = 8,
```

Create the queue after prop destructuring:

```ts
let thumbnailQueue = $derived(new ThumbnailLoadQueue(thumbnailConcurrency));
```

Update the `PersonTile` usage:

```svelte
      <PersonTile
        person={managedPerson}
        showActionMenu={shouldShowActions(person)}
        deferThumbnail={deferThumbnails}
        {thumbnailQueue}
      >
```

In `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`, add `deferThumbnails` to the `PeopleManagementGrid` props:

```svelte
      <PeopleManagementGrid
        deferThumbnails
```

In `web/src/lib/components/people/people-visibility-modal.svelte`, import the queue and deferred thumbnail:

```ts
import DeferredPersonThumbnail from '$lib/components/people/deferred-person-thumbnail.svelte';
import { ThumbnailLoadQueue } from '$lib/components/people/thumbnail-load-queue.svelte';
```

Extend `Props`:

```ts
    deferThumbnails?: boolean;
    thumbnailConcurrency?: number;
```

Update props destructuring:

```ts
    deferThumbnails = false,
    thumbnailConcurrency = 8,
```

Create the queue after props:

```ts
let thumbnailQueue = $derived(new ThumbnailLoadQueue(thumbnailConcurrency));
```

Replace the `ImageThumbnail` block inside each visibility person button with:

```svelte
          {#if deferThumbnails}
            <DeferredPersonThumbnail
              queue={thumbnailQueue}
              {hidden}
              shadow
              url={person.thumbnailUrl}
              altText={person.displayName}
              title={person.displayName}
              widthStyle="100%"
            />
          {:else}
            <ImageThumbnail
              {hidden}
              shadow
              url={person.thumbnailUrl}
              altText={person.displayName}
              title={person.displayName}
              widthStyle="100%"
              hiddenIconClass="text-white group-hover:text-black transition-colors"
              preload={false}
            />
          {/if}
```

Extend `DeferredPersonThumbnail` props with visibility support before wiring this:

```ts
    hidden?: boolean;
    hiddenIconClass?: string;
```

Include those props in the destructuring defaults:

```ts
let {
  queue,
  url,
  altText,
  title,
  widthStyle = '100%',
  shadow = false,
  circle = false,
  hidden = false,
  hiddenIconClass = 'text-white',
}: Props = $props();
```

Pass the visibility props through to `ImageThumbnail`:

```svelte
    <ImageThumbnail
      {shadow}
      {url}
      {altText}
      {title}
      {widthStyle}
      {circle}
      {hidden}
      {hiddenIconClass}
      preload={false}
      onComplete={release}
    />
```

In `web/src/lib/components/spaces/manage-space-people-visibility.svelte`, pass `deferThumbnails` to the modal:

```svelte
<PeopleVisibilityModal
  deferThumbnails
```

In `web/src/lib/components/people/people-management-grid.test-wrapper.svelte`, extend `Props`:

```ts
    deferThumbnails?: boolean;
    thumbnailConcurrency?: number;
```

Update props destructuring:

```ts
    deferThumbnails = false,
    thumbnailConcurrency = 8,
```

Pass both props to `PeopleManagementGrid`:

```svelte
<PeopleManagementGrid
  {people}
  {toManagedPerson}
  {canEditNames}
  {canShowActions}
  {onNameSubmit}
  {loadNextPage}
  {deferThumbnails}
  {thumbnailConcurrency}
>
```

In `web/src/lib/components/people/people-visibility-modal.test-wrapper.svelte`, extend `Props`:

```ts
    deferThumbnails?: boolean;
    thumbnailConcurrency?: number;
```

No wrapper markup change is needed because it already spreads `props` into `PeopleVisibilityModal`.

- [ ] **Step 7: Run frontend tests and verify pass**

Run:

```bash
cd /home/pierre/dev/gallery/web
pnpm test -- src/lib/components/people/people-management-grid.spec.ts src/lib/components/people/people-visibility-modal.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Commit frontend throttling**

Run:

```bash
cd /home/pierre/dev/gallery
git add web/src/lib/components/people/thumbnail-load-queue.svelte.ts web/src/lib/components/people/deferred-person-thumbnail.svelte web/src/lib/components/people/person-tile.svelte web/src/lib/components/people/people-management-grid.svelte 'web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte' web/src/lib/components/people/people-visibility-modal.svelte web/src/lib/components/spaces/manage-space-people-visibility.svelte web/src/lib/components/people/people-management-grid.test-wrapper.svelte web/src/lib/components/people/people-visibility-modal.test-wrapper.svelte web/src/lib/components/people/people-management-grid.spec.ts web/src/lib/components/people/people-visibility-modal.spec.ts
git commit -m "fix: throttle shared space people thumbnails"
```

---

### Task 5: Focused Verification and Integration Checks

**Files:**

- Verify only; no source edits expected.

- [ ] **Step 1: Run focused server unit tests**

Run:

```bash
cd /home/pierre/dev/gallery/server
pnpm test -- src/services/shared-space.service.spec.ts src/backends/s3-storage.backend.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run focused server medium tests**

Run:

```bash
cd /home/pierre/dev/gallery/server
pnpm test:medium -- test/medium/specs/repositories/shared-space.repository.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run focused web tests**

Run:

```bash
cd /home/pierre/dev/gallery/web
pnpm test -- src/lib/components/people/people-management-grid.spec.ts src/lib/components/people/people-visibility-modal.spec.ts src/lib/components/people/person-tile.spec.ts src/lib/components/assets/thumbnail/image-thumbnail.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Run type and lint checks for affected packages**

Run:

```bash
cd /home/pierre/dev/gallery/server
pnpm check
cd /home/pierre/dev/gallery/web
pnpm check:typescript
```

Expected: PASS.

- [ ] **Step 5: Inspect diff for accidental fan-out and local-change clobbering**

Run:

```bash
cd /home/pierre/dev/gallery
rg -n "SharedSpaceFaceMatch as const|queueAll\\(" server/src/services/shared-space.service.ts
git diff --stat
git diff -- server/src/backends/s3-storage.backend.ts server/src/backends/s3-storage.backend.spec.ts
```

Expected:

- `rg` does not show `queueAll` inside `handleSharedSpaceFaceMatchAll`.
- S3 backend diff contains the limiter and stream-release code without removing unrelated local storage work.

- [ ] **Step 6: Commit verification notes if checks required code fixes**

If verification caused any source edits, commit them:

```bash
cd /home/pierre/dev/gallery
git status --short
git add <edited-files>
git commit -m "test: cover shared space overload safeguards"
```

If no source edits were needed, do not create an empty commit.

---

## Self-Review

- Spec coverage: The plan covers bounded `SharedSpaceFaceMatchAll`, keyset repository pagination, one final dedup after completed work, stop-without-dedup when face recognition is disabled or the space is deleted mid-run, S3 proxy stream-lifetime backpressure, redirect bypass, frontend visible-thumbnail throttling on the people grid and visibility modal, and focused regression tests.
- Gap scan: No unresolved implementation gaps are present. The frontend plan uses the existing `ImageThumbnail` `onComplete` prop and renders a no-`src` stand-in image until the queue starts the real thumbnail.
- Type consistency: The plan consistently uses `getAssetIdsInSpacePage(spaceId, { limit, afterAssetId })`, `proxyReadConcurrency`, `ThumbnailLoadQueue`, `deferThumbnails`, `thumbnailConcurrency`, and `deferThumbnail`.
