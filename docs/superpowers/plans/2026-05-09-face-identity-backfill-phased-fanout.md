# Face Identity Backfill Phased Fan-Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make face identity backfill phase-aware so it repairs identity state first, then queues only exact targeted shared-space projection work with TDD proof for fan-out, races, and edge cases.

**Architecture:** Add a phase-aware backfill work summary in `FaceIdentityRepository`, derive the compatibility `hasBackfillWork()` from it, and update `PersonService.handleFaceIdentityBackfill()` to fan out only when identity work is clean. Keep full force recognition rebuilds on the existing `SharedSpaceFaceMatchAll` path, while identity backfill queues only deduped `SharedSpaceFaceMatch` jobs with `source: 'identity-backfill'`.

**Tech Stack:** TypeScript, NestJS services, Kysely SQL, BullMQ job repository, Vitest unit tests, Gallery medium DB tests.

---

## File Structure

- Modify: `server/src/repositories/face-identity.repository.ts`
  - Owns `FaceIdentityBackfillWork`, phase-aware SQL predicates, compatibility `hasBackfillWork()`, and exact projection target discovery.
- Modify: `server/src/services/person.service.ts`
  - Owns `FaceIdentityBackfill` orchestration, phase gating, targeted queue fan-out, and metadata avoidance from identity-backfill finalization.
- Modify: `server/src/repositories/job.repository.ts`
  - Owns stable job ids for root/cursor backfills and identity-backfill `SharedSpaceFaceMatch` jobs.
- Modify: `server/src/types.ts`
  - Owns the optional `source: 'identity-backfill'` job data field.
- Modify: `server/src/services/shared-space.service.ts`
  - Owns current-state checks when stale targeted jobs execute after asset/space/library changes.
- Modify: `server/src/services/person.service.spec.ts`
  - Unit coverage for bootstrap, phase gating, fan-out, batching, no metadata race, and full-reset preservation.
- Modify: `server/src/services/shared-space.service.spec.ts`
  - Unit coverage for stale targeted job execution after target removal or face-recognition disablement.
- Modify: `server/src/repositories/job.repository.spec.ts`
  - Unit coverage for stable job ids and no normal-vs-backfill face-match collision.
- Modify: `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
  - Medium DB coverage for phase summary categories, target discovery, exclusions, same-photo multi-space, direct+library dedupe, and stale assignment repair.
- Modify: `server/test/medium/specs/services/metadata.service.spec.ts`
  - Medium service coverage for legacy imported metadata faces using targeted backfill.

## Execution Preflight

- [ ] **Step 1: Start from a TDD-clean implementation baseline**

The current worktree may contain earlier uncommitted server edits. Preserve the committed design/spec docs, but do not let existing production hunks satisfy tests without a red phase.

Run:

```bash
git status --short
git diff --name-only -- server/src/repositories/face-identity.repository.ts server/src/repositories/job.repository.spec.ts server/src/repositories/job.repository.ts server/src/services/person.service.spec.ts server/src/services/person.service.ts server/src/types.ts server/test/medium/specs/repositories/face-identity.repository.spec.ts server/test/medium/specs/services/metadata.service.spec.ts
```

Expected in this worktree before cleanup: those server files may be listed as modified.

If they are modified before implementation starts, first determine ownership:

- If the diffs are the earlier prototype from this branch, save them as a reference patch and remove them from the execution worktree before writing the first red test.
- If any hunk appears user-owned or unrelated to this backfill work, do not restore it. Create a fresh implementation worktree from `HEAD` and execute the plan there instead.

For prototype-owned diffs only, use:

```bash
git diff -- server/src/repositories/face-identity.repository.ts server/src/repositories/job.repository.spec.ts server/src/repositories/job.repository.ts server/src/services/person.service.spec.ts server/src/services/person.service.ts server/src/types.ts server/test/medium/specs/repositories/face-identity.repository.spec.ts server/test/medium/specs/services/metadata.service.spec.ts > /tmp/face-identity-backfill-prototype.diff
git restore -- server/src/repositories/face-identity.repository.ts server/src/repositories/job.repository.spec.ts server/src/repositories/job.repository.ts server/src/services/person.service.spec.ts server/src/services/person.service.ts server/src/types.ts server/test/medium/specs/repositories/face-identity.repository.spec.ts server/test/medium/specs/services/metadata.service.spec.ts
git status --short
```

Expected after cleanup: only committed docs remain clean, and no server implementation files are modified. Keep `/tmp/face-identity-backfill-prototype.diff` as a reference only; do not apply it wholesale.

For user-owned or ambiguous diffs, create a clean execution worktree:

```bash
git worktree add ../fix-shared-space-backfill-targeted-rematch-impl HEAD
cd ../fix-shared-space-backfill-targeted-rematch-impl
git status --short
```

Expected: clean status before the first red test.

## Task 1: Repository Phase Summary

**Files:**

- Modify: `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`

- [ ] **Step 1: Write failing medium tests for phase-aware work summary**

Add tests near the existing `hasBackfillWork()` tests:

```ts
it('classifies personal identity work separately from projection work', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  try {
    const { person } = await ctx.newPerson({ ownerId: user.id, identityId: null });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

    await expect(sut.getBackfillWork()).resolves.toEqual({
      hasPersonalIdentityWork: true,
      hasSpacePersonIdentityWork: false,
      hasSharedSpaceProjectionWork: false,
    });
    await expect(sut.hasBackfillWork()).resolves.toBe(true);
  } finally {
    await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
  }
});

it('classifies shared-space identity repair separately from projection work', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  try {
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const first = await newIdentityFace(ctx, sut, { ownerId: user.id });
    const second = await newIdentityFace(ctx, sut, { ownerId: user.id });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: first.identity.id,
        representativeFaceId: first.assetFace.id,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await linkSpaceFace(ctx, spacePerson.id, first.assetFace.id);
    await linkSpaceFace(ctx, spacePerson.id, second.assetFace.id);

    await expect(sut.getBackfillWork()).resolves.toEqual({
      hasPersonalIdentityWork: false,
      hasSpacePersonIdentityWork: true,
      hasSharedSpaceProjectionWork: true,
    });
  } finally {
    await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
  }
});

it('classifies projection work only when identities are already linked', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  try {
    const linked = await newIdentityFace(ctx, sut, { ownerId: user.id });
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: linked.asset.id, addedById: user.id });

    await expect(sut.getBackfillWork()).resolves.toEqual({
      hasPersonalIdentityWork: false,
      hasSpacePersonIdentityWork: false,
      hasSharedSpaceProjectionWork: true,
    });
    await expect(sut.getSharedSpaceFaceMatchBackfillTargets()).resolves.toEqual([
      { spaceId: space.id, assetId: linked.asset.id },
    ]);
  } finally {
    await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
  }
});
```

- [ ] **Step 2: Run the focused medium tests and verify RED**

Run:

```bash
corepack pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts -t "classifies"
```

Expected: FAIL because `getBackfillWork()` is not defined.

- [ ] **Step 3: Implement the phase-aware repository API**

In `server/src/repositories/face-identity.repository.ts`, add the type near `SpacePersonBackfillResult`:

```ts
export type FaceIdentityBackfillWork = {
  hasPersonalIdentityWork: boolean;
  hasSpacePersonIdentityWork: boolean;
  hasSharedSpaceProjectionWork: boolean;
};
```

Replace `hasBackfillWork()` with a wrapper and add `getBackfillWork()`. The projection boolean must be derived from `getSharedSpaceFaceMatchBackfillTargets({ limit: 1 })` so it uses the exact same predicate as target discovery:

```ts
async getBackfillWork(): Promise<FaceIdentityBackfillWork> {
  const result = await sql<Pick<FaceIdentityBackfillWork, 'hasPersonalIdentityWork' | 'hasSpacePersonIdentityWork'>>`
    SELECT
      (
        EXISTS (
          SELECT 1
          FROM person
          WHERE person."identityId" IS NULL
        )
        OR EXISTS (
          SELECT 1
          FROM asset_face
          INNER JOIN asset ON asset.id = asset_face."assetId"
          LEFT JOIN face_identity_face ON face_identity_face."assetFaceId" = asset_face.id
          WHERE asset_face."personId" IS NOT NULL
            AND asset_face."deletedAt" IS NULL
            AND asset_face."isVisible" = true
            AND asset."deletedAt" IS NULL
            AND face_identity_face."assetFaceId" IS NULL
        )
      ) AS "hasPersonalIdentityWork",
      EXISTS (
        SELECT 1
        FROM shared_space_person
        INNER JOIN shared_space ON shared_space.id = shared_space_person."spaceId"
        INNER JOIN shared_space_person_face
          ON shared_space_person_face."personId" = shared_space_person.id
        INNER JOIN asset_face
          ON asset_face.id = shared_space_person_face."assetFaceId"
        INNER JOIN face_identity_face
          ON face_identity_face."assetFaceId" = asset_face.id
        WHERE shared_space."faceRecognitionEnabled" = true
          AND asset_face."deletedAt" IS NULL
          AND asset_face."isVisible" = true
          AND shared_space_person."identityId" IS DISTINCT FROM face_identity_face."identityId"
      ) AS "hasSpacePersonIdentityWork"
  `.execute(this.db);
  const projectionTargets = await this.getSharedSpaceFaceMatchBackfillTargets({ limit: 1 });

  return {
    hasPersonalIdentityWork: result.rows[0]?.hasPersonalIdentityWork ?? false,
    hasSpacePersonIdentityWork: result.rows[0]?.hasSpacePersonIdentityWork ?? false,
    hasSharedSpaceProjectionWork: projectionTargets.length > 0,
  };
}

async hasBackfillWork(): Promise<boolean> {
  const work = await this.getBackfillWork();
  return work.hasPersonalIdentityWork || work.hasSpacePersonIdentityWork || work.hasSharedSpaceProjectionWork;
}
```

- [ ] **Step 4: Run the focused medium tests and verify GREEN**

Run:

```bash
corepack pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts -t "classifies"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/test/medium/specs/repositories/face-identity.repository.spec.ts server/src/repositories/face-identity.repository.ts
git commit -m "feat: split face identity backfill work phases"
```

## Task 2: Projection Target Predicate Coverage

**Files:**

- Modify: `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`

- [ ] **Step 1: Write failing medium tests for projection target alignment and exclusions**

Add tests near `returns targeted shared-space face match work for missing and stale space projections`:

```ts
it('keeps projection work summary aligned with target discovery', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  try {
    const linked = await newIdentityFace(ctx, sut, { ownerId: user.id });
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: linked.asset.id, addedById: user.id });

    await expect(sut.getBackfillWork()).resolves.toMatchObject({ hasSharedSpaceProjectionWork: true });
    await expect(sut.getSharedSpaceFaceMatchBackfillTargets()).resolves.toEqual([
      { spaceId: space.id, assetId: linked.asset.id },
    ]);

    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: linked.identity.id,
        representativeFaceId: linked.assetFace.id,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await linkSpaceFace(ctx, spacePerson.id, linked.assetFace.id);

    await expect(sut.getBackfillWork()).resolves.toMatchObject({ hasSharedSpaceProjectionWork: false });
    await expect(sut.getSharedSpaceFaceMatchBackfillTargets()).resolves.toEqual([]);
  } finally {
    await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
  }
});

it('dedupes direct and linked-library projection targets for the same asset in the same space', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  try {
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    const linked = await newIdentityFace(ctx, sut, { ownerId: user.id, libraryId: library.id });
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: linked.asset.id, addedById: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });

    await expect(sut.getSharedSpaceFaceMatchBackfillTargets()).resolves.toEqual([
      { spaceId: space.id, assetId: linked.asset.id },
    ]);
  } finally {
    await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
  }
});

it('excludes disabled spaces and ineligible assets from projection targets', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  try {
    const timeline = await newIdentityFace(ctx, sut, { ownerId: user.id });
    const offline = await newIdentityFace(ctx, sut, { ownerId: user.id, isOffline: true });
    const deleted = await newIdentityFace(ctx, sut, { ownerId: user.id, deletedAt: new Date() });
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    const { space: disabled } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: false });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: disabled.id, userId: user.id, role: SharedSpaceRole.Owner });
    for (const assetId of [timeline.asset.id, offline.asset.id, deleted.asset.id]) {
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId, addedById: user.id });
      await ctx.newSharedSpaceAsset({ spaceId: disabled.id, assetId, addedById: user.id });
    }

    await expect(sut.getSharedSpaceFaceMatchBackfillTargets()).resolves.toEqual([
      { spaceId: space.id, assetId: timeline.asset.id },
    ]);
  } finally {
    await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
  }
});

it('excludes deleted invisible unassigned and identity-less faces from projection targets', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  try {
    const eligible = await newIdentityFace(ctx, sut, { ownerId: user.id });
    const deletedFace = await newIdentityFace(ctx, sut, { ownerId: user.id });
    const invisibleFace = await newIdentityFace(ctx, sut, { ownerId: user.id });
    const unassignedFace = await newIdentityFace(ctx, sut, { ownerId: user.id });
    const identityless = await newIdentityFace(ctx, sut, { ownerId: user.id });
    await ctx.database
      .updateTable('asset_face')
      .set({ deletedAt: new Date() })
      .where('id', '=', deletedFace.assetFace.id)
      .execute();
    await ctx.database
      .updateTable('asset_face')
      .set({ isVisible: false })
      .where('id', '=', invisibleFace.assetFace.id)
      .execute();
    await ctx.database
      .updateTable('asset_face')
      .set({ personId: null })
      .where('id', '=', unassignedFace.assetFace.id)
      .execute();
    await ctx.database.deleteFrom('face_identity_face').where('assetFaceId', '=', identityless.assetFace.id).execute();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    for (const assetId of [
      eligible.asset.id,
      deletedFace.asset.id,
      invisibleFace.asset.id,
      unassignedFace.asset.id,
      identityless.asset.id,
    ]) {
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId, addedById: user.id });
    }

    await expect(sut.getSharedSpaceFaceMatchBackfillTargets()).resolves.toEqual([
      { spaceId: space.id, assetId: eligible.asset.id },
    ]);
    await expect(sut.getBackfillWork()).resolves.toMatchObject({
      hasPersonalIdentityWork: true,
      hasSharedSpaceProjectionWork: true,
    });
  } finally {
    await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
  }
});
```

Extend the local `newIdentityFace()` helper in this spec file so it accepts `libraryId`, `isOffline`, and `deletedAt`, then passes those values into `ctx.newAsset()`.

- [ ] **Step 2: Run focused medium tests and verify RED**

Run:

```bash
corepack pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts -t "projection target|direct and linked-library|ineligible assets|identity-less faces"
```

Expected: FAIL if target discovery and summary predicates disagree or helper inputs are unsupported.

- [ ] **Step 3: Align projection SQL and helper inputs**

In `getSharedSpaceFaceMatchTargets()`, keep the existing `UNION` direct/library shape and ensure both halves apply:

```ts
WHERE shared_space."faceRecognitionEnabled" = true
  AND asset."deletedAt" IS NULL
  AND asset."isOffline" = false
  AND asset.visibility IN (${sql.join(peopleAssetVisibilities)})
  AND asset_face."personId" IS NOT NULL
  AND asset_face."deletedAt" IS NULL
  AND asset_face."isVisible" = true
  ${assetFaceFilter}
```

Keep the outer target selection as:

```ts
targets AS (
  SELECT DISTINCT "spaceId", "assetId"
  FROM face_spaces
  ${backfillWorkFilter}
)
SELECT "spaceId", "assetId"
FROM targets
ORDER BY "spaceId", "assetId"
${limit}
```

Replace the local medium-test helper signature with:

```ts
const newIdentityFace = async (
  ctx: ReturnType<typeof setup>['ctx'],
  sut: FaceIdentityRepository,
  input: {
    ownerId: string;
    name?: string;
    isHidden?: boolean;
    libraryId?: string | null;
    isOffline?: boolean;
    deletedAt?: Date | null;
    visibility?: AssetVisibility;
  },
) => {
  const { person } = await ctx.newPerson({
    ownerId: input.ownerId,
    name: input.name ?? '',
    isHidden: input.isHidden ?? false,
  });
  const { asset } = await ctx.newAsset({
    ownerId: input.ownerId,
    libraryId: input.libraryId,
    isOffline: input.isOffline ?? false,
    deletedAt: input.deletedAt ?? null,
    visibility: input.visibility ?? AssetVisibility.Timeline,
  });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  const identity = await sut.ensurePersonIdentity(person.id);
  await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'backfill' });
  return { person, asset, assetFace, identity };
};
```

- [ ] **Step 4: Run focused medium tests and verify GREEN**

Run:

```bash
corepack pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts -t "projection target|direct and linked-library|ineligible assets|identity-less faces"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/test/medium/specs/repositories/face-identity.repository.spec.ts server/src/repositories/face-identity.repository.ts
git commit -m "test: cover shared-space projection target predicates"
```

## Task 3: Job Data and Stable IDs

**Files:**

- Modify: `server/src/types.ts`
- Modify: `server/src/repositories/job.repository.spec.ts`
- Modify: `server/src/repositories/job.repository.ts`

- [ ] **Step 1: Write failing unit test for identity-backfill face-match job ids**

Add to `server/src/repositories/job.repository.spec.ts` near the stable-id tests:

```ts
it('uses distinct stable ids for identity-backfill shared-space face matches', async () => {
  const { sut, queue } = setup();
  setHandlers(sut, [JobName.SharedSpaceFaceMatch]);

  await sut.queueAll([
    { name: JobName.SharedSpaceFaceMatch, data: { spaceId: 'space-1', assetId: 'asset-1' } },
    {
      name: JobName.SharedSpaceFaceMatch,
      data: { spaceId: 'space-1', assetId: 'asset-1', source: 'identity-backfill' },
    },
  ]);

  expect(queue.add).toHaveBeenCalledWith(
    JobName.SharedSpaceFaceMatch,
    { spaceId: 'space-1', assetId: 'asset-1' },
    { jobId: 'shared-space-face-match/space-1/asset-1', removeOnComplete: true },
  );
  expect(queue.add).toHaveBeenCalledWith(
    JobName.SharedSpaceFaceMatch,
    { spaceId: 'space-1', assetId: 'asset-1', source: 'identity-backfill' },
    { jobId: 'shared-space-face-match/identity-backfill/space-1/asset-1', removeOnComplete: true },
  );
});
```

- [ ] **Step 2: Run focused unit test and verify RED**

Run:

```bash
corepack pnpm --dir server test src/repositories/job.repository.spec.ts -t "identity-backfill shared-space face matches"
```

Expected: FAIL because `source` is not typed or not included in the job id.

- [ ] **Step 3: Implement job data type and stable id**

In `server/src/types.ts`:

```ts
export interface ISharedSpaceFaceMatchJob extends IBaseJob {
  spaceId: string;
  assetId: string;
  source?: 'identity-backfill';
}
```

In `server/src/repositories/job.repository.ts`, update `getJobOptions()`:

```ts
case JobName.SharedSpaceFaceMatch: {
  const source = item.data.source === 'identity-backfill' ? 'identity-backfill/' : '';
  return {
    jobId: `shared-space-face-match/${source}${item.data.spaceId}/${item.data.assetId}`,
    removeOnComplete: true,
  };
}
```

- [ ] **Step 4: Run focused unit test and verify GREEN**

Run:

```bash
corepack pnpm --dir server test src/repositories/job.repository.spec.ts -t "identity-backfill shared-space face matches"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/types.ts server/src/repositories/job.repository.ts server/src/repositories/job.repository.spec.ts
git commit -m "feat: key identity-backfill face match jobs separately"
```

## Task 4: PersonService Phase Gating

**Files:**

- Modify: `server/src/services/person.service.spec.ts`
- Modify: `server/src/services/person.service.ts`

- [ ] **Step 1: Update test setup for the phase-aware repository method**

In `beforeEach()` of `server/src/services/person.service.spec.ts`, add:

```ts
(mocks.faceIdentity as any).getBackfillWork ??= vi.fn().mockResolvedValue({
  hasPersonalIdentityWork: false,
  hasSpacePersonIdentityWork: false,
  hasSharedSpaceProjectionWork: false,
});
```

- [ ] **Step 2: Write failing service tests for identity-work gating**

Add to `describe('handleFaceIdentityBackfill')`:

```ts
it('requeues identity backfill without projection fan-out when identity work remains after final pages', async () => {
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValue({ processed: 0 });
  mocks.faceIdentity.backfillSpacePersonIdentities.mockResolvedValue({ processed: 0, conflictCount: 0 });
  (mocks.faceIdentity as any).getBackfillWork.mockResolvedValue({
    hasPersonalIdentityWork: true,
    hasSpacePersonIdentityWork: false,
    hasSharedSpaceProjectionWork: true,
  });

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

  expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.FaceIdentityBackfill, data: {} });
  expect((mocks.faceIdentity as any).getSharedSpaceFaceMatchBackfillTargets).not.toHaveBeenCalled();
  expect(mocks.job.queueAll).not.toHaveBeenCalledWith(
    expect.arrayContaining([expect.objectContaining({ name: JobName.SharedSpaceFaceMatch })]),
  );
  expect(mocks.job.queue).not.toHaveBeenCalledWith({
    name: JobName.SharedSpacePersonMetadataBackfill,
    data: {},
  });
});

it('does not discover projection targets until paginated personal backfill is complete', async () => {
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValue({
    processed: 1,
    nextCursor: 'person-cursor',
    affectedSpaceAssets: [{ spaceId: 'space-1', assetId: 'asset-1' }],
  });

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

  expect(mocks.job.queue).toHaveBeenCalledWith({
    name: JobName.FaceIdentityBackfill,
    data: { stage: 'person', cursor: 'person-cursor' },
  });
  expect((mocks.faceIdentity as any).getBackfillWork).not.toHaveBeenCalled();
  expect((mocks.faceIdentity as any).getSharedSpaceFaceMatchBackfillTargets).not.toHaveBeenCalled();
  expect(mocks.job.queueAll).not.toHaveBeenCalled();
});

it('does not discover projection targets until paginated space-person backfill is complete', async () => {
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValue({ processed: 0 });
  mocks.faceIdentity.backfillSpacePersonIdentities.mockResolvedValue({
    processed: 1,
    nextCursor: 'space-person-cursor',
    conflictCount: 0,
    affectedSpaceAssets: [{ spaceId: 'space-1', assetId: 'asset-1' }],
  });

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

  expect(mocks.job.queue).toHaveBeenCalledWith({
    name: JobName.FaceIdentityBackfill,
    data: { stage: 'space-person', cursor: 'space-person-cursor' },
  });
  expect((mocks.faceIdentity as any).getBackfillWork).not.toHaveBeenCalled();
  expect((mocks.faceIdentity as any).getSharedSpaceFaceMatchBackfillTargets).not.toHaveBeenCalled();
  expect(mocks.job.queueAll).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Run focused service tests and verify RED**

Run:

```bash
corepack pnpm --dir server test src/services/person.service.spec.ts -t "identity backfill|paginated"
```

Expected: FAIL because `handleFaceIdentityBackfill()` still uses broad `hasBackfillWork()` or queues metadata/fan-out at the wrong time.

- [ ] **Step 4: Implement phase gating in `handleFaceIdentityBackfill()`**

In `server/src/services/person.service.ts`, replace the final broad work check with:

```ts
const work = await this.faceIdentityRepository.getBackfillWork();

if (work.hasPersonalIdentityWork || work.hasSpacePersonIdentityWork) {
  await this.jobRepository.queue({
    name: JobName.FaceIdentityBackfill,
    data: {},
  });
  return JobStatus.Success;
}

if (work.hasSharedSpaceProjectionWork) {
  affectedSpaceAssets.push(...(await this.faceIdentityRepository.getSharedSpaceFaceMatchBackfillTargets()));
}

await this.queueSharedSpaceFaceMatchTargets(affectedSpaceAssets);

return JobStatus.Success;
```

Remove the identity-backfill finalization call to global `queueSpacePersonMetadataBackfill()`. Keep other callers of metadata backfill unchanged.

- [ ] **Step 5: Run focused service tests and verify GREEN**

Run:

```bash
corepack pnpm --dir server test src/services/person.service.spec.ts -t "identity backfill|paginated"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/services/person.service.ts server/src/services/person.service.spec.ts
git commit -m "feat: gate identity backfill projection fanout"
```

## Task 5: Targeted Fan-Out Deduping and Batching

**Files:**

- Modify: `server/src/services/person.service.spec.ts`
- Modify: `server/src/services/person.service.ts`

- [ ] **Step 1: Write failing service tests for exact targeted queueing**

Add to `describe('handleFaceIdentityBackfill')`:

```ts
it('queues exact deduped projection targets after identity work is clean', async () => {
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValue({
    processed: 1,
    affectedSpaceAssets: [{ spaceId: 'space-1', assetId: 'asset-1' }],
  });
  mocks.faceIdentity.backfillSpacePersonIdentities.mockResolvedValue({
    processed: 0,
    conflictCount: 0,
    affectedSpaceAssets: [{ spaceId: 'space-1', assetId: 'asset-1' }],
  });
  (mocks.faceIdentity as any).getBackfillWork.mockResolvedValue({
    hasPersonalIdentityWork: false,
    hasSpacePersonIdentityWork: false,
    hasSharedSpaceProjectionWork: true,
  });
  (mocks.faceIdentity as any).getSharedSpaceFaceMatchBackfillTargets.mockResolvedValue([
    { spaceId: 'space-2', assetId: 'asset-2' },
    { spaceId: 'space-1', assetId: 'asset-1' },
  ]);

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

  expect(mocks.job.queueAll).toHaveBeenCalledTimes(1);
  expect(mocks.job.queueAll).toHaveBeenCalledWith([
    {
      name: JobName.SharedSpaceFaceMatch,
      data: { spaceId: 'space-1', assetId: 'asset-1', source: 'identity-backfill' },
    },
    {
      name: JobName.SharedSpaceFaceMatch,
      data: { spaceId: 'space-2', assetId: 'asset-2', source: 'identity-backfill' },
    },
  ]);
  expect(mocks.job.queueAll).not.toHaveBeenCalledWith(
    expect.arrayContaining([expect.objectContaining({ name: JobName.SharedSpaceFaceMatchAll })]),
  );
});

it('rediscovers earlier-page targets after paginated identity backfill completes', async () => {
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValueOnce({
    processed: 1,
    nextCursor: 'person-cursor',
    affectedSpaceAssets: [{ spaceId: 'space-1', assetId: 'asset-1' }],
  });

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

  expect(mocks.job.queueAll).not.toHaveBeenCalled();
  expect((mocks.faceIdentity as any).getSharedSpaceFaceMatchBackfillTargets).not.toHaveBeenCalled();

  mocks.job.queue.mockClear();
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValueOnce({ processed: 1 });
  mocks.faceIdentity.backfillSpacePersonIdentities.mockResolvedValueOnce({ processed: 0, conflictCount: 0 });
  (mocks.faceIdentity as any).getBackfillWork.mockResolvedValue({
    hasPersonalIdentityWork: false,
    hasSpacePersonIdentityWork: false,
    hasSharedSpaceProjectionWork: true,
  });
  (mocks.faceIdentity as any).getSharedSpaceFaceMatchBackfillTargets.mockResolvedValue([
    { spaceId: 'space-1', assetId: 'asset-1' },
    { spaceId: 'space-1', assetId: 'asset-2' },
  ]);

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person', cursor: 'person-cursor' })).resolves.toBe(
    JobStatus.Success,
  );

  expect(mocks.job.queueAll).toHaveBeenCalledWith([
    {
      name: JobName.SharedSpaceFaceMatch,
      data: { spaceId: 'space-1', assetId: 'asset-1', source: 'identity-backfill' },
    },
    {
      name: JobName.SharedSpaceFaceMatch,
      data: { spaceId: 'space-1', assetId: 'asset-2', source: 'identity-backfill' },
    },
  ]);
});

it('does not call queueAll for an empty targeted face-match list', async () => {
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValue({ processed: 0 });
  mocks.faceIdentity.backfillSpacePersonIdentities.mockResolvedValue({ processed: 0, conflictCount: 0 });
  (mocks.faceIdentity as any).getBackfillWork.mockResolvedValue({
    hasPersonalIdentityWork: false,
    hasSpacePersonIdentityWork: false,
    hasSharedSpaceProjectionWork: false,
  });

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

  expect(mocks.job.queueAll).not.toHaveBeenCalled();
});

it('does not write an empty trailing batch for exactly one full chunk', async () => {
  const targets = Array.from({ length: 1000 }, (_, index) => ({
    spaceId: 'space-1',
    assetId: `asset-${index.toString().padStart(4, '0')}`,
  }));
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValue({ processed: 0 });
  mocks.faceIdentity.backfillSpacePersonIdentities.mockResolvedValue({ processed: 0, conflictCount: 0 });
  (mocks.faceIdentity as any).getBackfillWork.mockResolvedValue({
    hasPersonalIdentityWork: false,
    hasSpacePersonIdentityWork: false,
    hasSharedSpaceProjectionWork: true,
  });
  (mocks.faceIdentity as any).getSharedSpaceFaceMatchBackfillTargets.mockResolvedValue(targets);

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

  expect(mocks.job.queueAll).toHaveBeenCalledTimes(1);
  expect(mocks.job.queueAll.mock.calls[0][0]).toHaveLength(1000);
});

it('logs a projection invariant warning instead of falling back to a full rebuild when projection work has no targets', async () => {
  const warn = vi.spyOn((sut as any).logger, 'warn').mockImplementation(() => undefined);
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValue({ processed: 0 });
  mocks.faceIdentity.backfillSpacePersonIdentities.mockResolvedValue({ processed: 0, conflictCount: 0 });
  (mocks.faceIdentity as any).getBackfillWork.mockResolvedValue({
    hasPersonalIdentityWork: false,
    hasSpacePersonIdentityWork: false,
    hasSharedSpaceProjectionWork: true,
  });
  (mocks.faceIdentity as any).getSharedSpaceFaceMatchBackfillTargets.mockResolvedValue([]);

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('projection backfill work was reported but no targets were found'),
  );
  expect(mocks.job.queueAll).not.toHaveBeenCalled();
  expect(mocks.sharedSpace.getSpaceIdsWithFaceRecognitionEnabled).not.toHaveBeenCalled();
});

it('regenerates targeted projection work on a later run after a queue write failure', async () => {
  const target = { spaceId: 'space-1', assetId: 'asset-1' };
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValue({ processed: 1 });
  mocks.faceIdentity.backfillSpacePersonIdentities.mockResolvedValue({ processed: 0, conflictCount: 0 });
  (mocks.faceIdentity as any).getBackfillWork.mockResolvedValue({
    hasPersonalIdentityWork: false,
    hasSpacePersonIdentityWork: false,
    hasSharedSpaceProjectionWork: true,
  });
  (mocks.faceIdentity as any).getSharedSpaceFaceMatchBackfillTargets.mockResolvedValue([target]);
  mocks.job.queueAll.mockRejectedValueOnce(new Error('redis write failed'));

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).rejects.toThrow('redis write failed');

  mocks.job.queueAll.mockReset();
  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

  expect(mocks.job.queueAll).toHaveBeenCalledWith([
    {
      name: JobName.SharedSpaceFaceMatch,
      data: { ...target, source: 'identity-backfill' },
    },
  ]);
});

it('regenerates only remaining current targets after a later queue batch fails', async () => {
  const targets = Array.from({ length: 1001 }, (_, index) => ({
    spaceId: 'space-1',
    assetId: `asset-${index.toString().padStart(4, '0')}`,
  }));
  const remainingTarget = targets.at(-1)!;
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValue({ processed: 1 });
  mocks.faceIdentity.backfillSpacePersonIdentities.mockResolvedValue({ processed: 0, conflictCount: 0 });
  (mocks.faceIdentity as any).getBackfillWork.mockResolvedValue({
    hasPersonalIdentityWork: false,
    hasSpacePersonIdentityWork: false,
    hasSharedSpaceProjectionWork: true,
  });
  (mocks.faceIdentity as any).getSharedSpaceFaceMatchBackfillTargets.mockResolvedValueOnce(targets);
  mocks.job.queueAll.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('redis write failed'));

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).rejects.toThrow('redis write failed');

  mocks.job.queueAll.mockReset();
  (mocks.faceIdentity as any).getSharedSpaceFaceMatchBackfillTargets.mockResolvedValueOnce([remainingTarget]);
  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

  expect(mocks.job.queueAll).toHaveBeenCalledWith([
    {
      name: JobName.SharedSpaceFaceMatch,
      data: { ...remainingTarget, source: 'identity-backfill' },
    },
  ]);
});
```

- [ ] **Step 2: Run focused service tests and verify RED**

Run:

```bash
corepack pnpm --dir server test src/services/person.service.spec.ts -t "deduped projection targets|earlier-page targets|empty targeted|empty trailing|projection invariant|queue write failure|queue batch fails"
```

Expected: FAIL until the batching helper skips empty arrays, uses identity-backfill source, logs the empty-target invariant, and leaves queue-failure recovery to regenerated DB-derived targets.

- [ ] **Step 3: Implement deduped bounded queue writes**

In `server/src/services/person.service.ts`, update the projection target discovery block so an inconsistent empty target list logs a warning without falling back to a full rebuild:

```ts
if (work.hasSharedSpaceProjectionWork) {
  const projectionTargets = await this.faceIdentityRepository.getSharedSpaceFaceMatchBackfillTargets();
  if (projectionTargets.length === 0) {
    this.logger.warn('Face identity projection backfill work was reported but no targets were found');
  }
  affectedSpaceAssets.push(...projectionTargets);
}
```

Then add or update the bounded queue helper:

```ts
private async queueSharedSpaceFaceMatchTargets(targets: SharedSpaceFaceMatchTarget[]): Promise<void> {
  const uniqueTargets = [
    ...new Map(
      targets
        .toSorted((a, b) => a.spaceId.localeCompare(b.spaceId) || a.assetId.localeCompare(b.assetId))
        .map((target) => [`${target.spaceId}:${target.assetId}`, target]),
    ).values(),
  ];

  if (uniqueTargets.length === 0) {
    return;
  }

  let jobs: JobItem[] = [];
  for (const { spaceId, assetId } of uniqueTargets) {
    jobs.push({
      name: JobName.SharedSpaceFaceMatch as const,
      data: { spaceId, assetId, source: 'identity-backfill' },
    });

    if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
      await this.jobRepository.queueAll(jobs);
      jobs = [];
    }
  }

  if (jobs.length > 0) {
    await this.jobRepository.queueAll(jobs);
  }
}
```

Ensure the `server/src/services/person.service.ts` imports include:

```ts
import { SharedSpaceFaceMatchTarget } from 'src/repositories/face-identity.repository';
import { JobItem } from 'src/types';
```

- [ ] **Step 4: Run focused service tests and verify GREEN**

Run:

```bash
corepack pnpm --dir server test src/services/person.service.spec.ts -t "deduped projection targets|earlier-page targets|empty targeted|empty trailing|projection invariant|queue write failure|queue batch fails"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/services/person.service.ts server/src/services/person.service.spec.ts
git commit -m "feat: queue targeted identity backfill face matches"
```

## Task 6: Metadata Ordering and Manual Backfill Preservation

**Files:**

- Modify: `server/src/services/person.service.spec.ts`
- Modify: `server/src/services/job.service.spec.ts`

- [ ] **Step 1: Write failing tests for metadata ordering**

Replace or update the old expectation that identity backfill globally queues metadata after processed rows. In `server/src/services/person.service.spec.ts`, add:

```ts
it('does not queue global metadata backfill from identity-backfill finalization when targeted face matches are queued', async () => {
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValue({
    processed: 1,
    affectedSpaceAssets: [{ spaceId: 'space-1', assetId: 'asset-1' }],
  });
  mocks.faceIdentity.backfillSpacePersonIdentities.mockResolvedValue({ processed: 0, conflictCount: 0 });
  (mocks.faceIdentity as any).getBackfillWork.mockResolvedValue({
    hasPersonalIdentityWork: false,
    hasSpacePersonIdentityWork: false,
    hasSharedSpaceProjectionWork: false,
  });

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

  expect(mocks.job.queueAll).toHaveBeenCalledWith([
    {
      name: JobName.SharedSpaceFaceMatch,
      data: { spaceId: 'space-1', assetId: 'asset-1', source: 'identity-backfill' },
    },
  ]);
  expect(mocks.job.queue).not.toHaveBeenCalledWith({
    name: JobName.SharedSpacePersonMetadataBackfill,
    data: {},
  });
});
```

In `server/src/services/job.service.spec.ts`, keep manual global metadata behavior explicit:

```ts
it('should queue a SharedSpacePersonMetadataBackfill job', async () => {
  await sut.create({ name: 'shared-space-person-metadata-backfill' as ManualJobName });

  expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.SharedSpacePersonMetadataBackfill, data: {} });
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
corepack pnpm --dir server test src/services/person.service.spec.ts src/services/job.service.spec.ts -t "metadata backfill|SharedSpacePersonMetadataBackfill"
```

Expected: FAIL if identity-backfill finalization still queues global metadata.

- [ ] **Step 3: Remove identity-backfill global metadata finalization**

In `handleFaceIdentityBackfill()`, ensure the final block does not include:

```ts
await this.queueSpacePersonMetadataBackfill();
```

Do not change `queueSpacePersonMetadataBackfill()` callers in shared-space service or explicit manual job handling.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
corepack pnpm --dir server test src/services/person.service.spec.ts src/services/job.service.spec.ts -t "metadata backfill|SharedSpacePersonMetadataBackfill"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/services/person.service.ts server/src/services/person.service.spec.ts server/src/services/job.service.spec.ts
git commit -m "fix: avoid identity backfill metadata race"
```

## Task 7: Medium End-to-End Backfill Proof

**Files:**

- Modify: `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
- Modify: `server/test/medium/specs/services/metadata.service.spec.ts`

- [ ] **Step 1: Write failing medium test for end-to-end targeted fan-out**

Add this service-level medium test to `server/test/medium/specs/services/metadata.service.spec.ts`, using the existing `setupFaceIdentityBackfillService()` helper. The unit tests above prove paginated no-loss behavior; this medium test proves the final DB-derived targets materialize through real shared-space matching.

```ts
it('materializes DB-derived projection work after identity backfill finishes', async () => {
  const { ctx } = setupFaceImport();
  const { user } = await ctx.newUser();
  try {
    const first = await ctx.newPerson({ ownerId: user.id, identityId: null });
    const second = await ctx.newPerson({ ownerId: user.id, identityId: null });
    const { asset: firstAsset } = await ctx.newAsset({ ownerId: user.id });
    const { asset: secondAsset } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newAssetFace({ assetId: firstAsset.id, personId: first.person.id });
    await ctx.newAssetFace({ assetId: secondAsset.id, personId: second.person.id });
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: firstAsset.id, addedById: user.id });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: secondAsset.id, addedById: user.id });
    const { sut: backfillService, ctx: backfillCtx } = setupFaceIdentityBackfillService(ctx.database);
    const { sut: sharedSpaceService, ctx: sharedSpaceCtx } = setupSharedSpaceService(ctx.database);

    await expect(backfillService.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

    const queuedJobs = backfillCtx
      .getMock<JobRepository, Mocked<JobRepository>>(JobRepository)
      .queueAll.mock.calls.flatMap(([jobs]) => jobs)
      .filter((job) => job.name === JobName.SharedSpaceFaceMatch);
    expect(queuedJobs).toEqual(
      expect.arrayContaining([
        {
          name: JobName.SharedSpaceFaceMatch,
          data: { spaceId: space.id, assetId: firstAsset.id, source: 'identity-backfill' },
        },
        {
          name: JobName.SharedSpaceFaceMatch,
          data: { spaceId: space.id, assetId: secondAsset.id, source: 'identity-backfill' },
        },
      ]),
    );
    expect(queuedJobs).toHaveLength(2);
    for (const job of queuedJobs) {
      await expect(sharedSpaceService.handleSharedSpaceFaceMatch(job.data)).resolves.toBe(JobStatus.Success);
    }
    await drainSharedSpaceFaceJobs(sharedSpaceService, sharedSpaceCtx);
    await expect(backfillCtx.get(FaceIdentityRepository).hasBackfillWork()).resolves.toBe(false);
  } finally {
    await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
  }
});
```

- [ ] **Step 2: Write failing medium test for same-photo multi-space materialization**

Add this service-level medium test to `server/test/medium/specs/services/metadata.service.spec.ts`:

```ts
it('materializes one targeted projection per enabled space for the same photo in 10 spaces', async () => {
  const { ctx } = setupFaceImport();
  const sut = ctx.get(FaceIdentityRepository);
  const { user } = await ctx.newUser();
  try {
    const { person } = await ctx.newPerson({ ownerId: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    await sut.backfillPersonalIdentities({ limit: 100 });
    const enabledSpaceIds: string[] = [];
    for (let index = 0; index < 10; index++) {
      const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
      enabledSpaceIds.push(space.id);
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
    }
    const { space: disabledSpace } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: false });
    await ctx.newSharedSpaceMember({ spaceId: disabledSpace.id, userId: user.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceAsset({ spaceId: disabledSpace.id, assetId: asset.id, addedById: user.id });

    const { sut: backfillService, ctx: backfillCtx } = setupFaceIdentityBackfillService(ctx.database);
    const { sut: sharedSpaceService, ctx: sharedSpaceCtx } = setupSharedSpaceService(ctx.database);
    await expect(backfillService.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);
    const queuedJobs = backfillCtx
      .getMock<JobRepository, Mocked<JobRepository>>(JobRepository)
      .queueAll.mock.calls.flatMap(([jobs]) => jobs)
      .filter((job) => job.name === JobName.SharedSpaceFaceMatch);
    expect(queuedJobs).toEqual(
      enabledSpaceIds.sort().map((spaceId) => ({
        name: JobName.SharedSpaceFaceMatch,
        data: { spaceId, assetId: asset.id, source: 'identity-backfill' },
      })),
    );
    for (const job of queuedJobs) {
      await expect(sharedSpaceService.handleSharedSpaceFaceMatch(job.data)).resolves.toBe(JobStatus.Success);
    }
    await drainSharedSpaceFaceJobs(sharedSpaceService, sharedSpaceCtx);
    await expect(
      ctx.database
        .selectFrom('shared_space_person_face')
        .innerJoin('shared_space_person', 'shared_space_person.id', 'shared_space_person_face.personId')
        .select((eb) => eb.fn.countAll().as('count'))
        .where('shared_space_person_face.assetFaceId', '=', assetFace.id)
        .where('shared_space_person.spaceId', 'in', enabledSpaceIds)
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ count: '10' });
    await expect(
      ctx.database
        .selectFrom('face_identity_face')
        .select('assetFaceId')
        .where('assetFaceId', '=', assetFace.id)
        .executeTakeFirst(),
    ).resolves.toEqual({ assetFaceId: assetFace.id });
  } finally {
    await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
  }
});
```

- [ ] **Step 3: Run focused medium tests and verify RED**

Run:

```bash
corepack pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/services/metadata.service.spec.ts -t "DB-derived projection work|same photo in 10 spaces|legacy imported metadata faces"
```

Expected: FAIL for missing service behavior or assertion mismatch before final implementation is complete.

- [ ] **Step 4: Implement minimal fixes discovered by medium tests**

Use the production code from Tasks 1-6. If the medium tests expose a mismatch, keep the fix inside:

```ts
FaceIdentityRepository.getBackfillWork();
FaceIdentityRepository.getSharedSpaceFaceMatchBackfillTargets();
PersonService.handleFaceIdentityBackfill();
PersonService.queueSharedSpaceFaceMatchTargets();
```

Do not add `SharedSpaceFaceMatchAll` fallback in identity backfill.

- [ ] **Step 5: Run focused medium tests and verify GREEN**

Run:

```bash
corepack pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/services/metadata.service.spec.ts -t "DB-derived projection work|same photo in 10 spaces|legacy imported metadata faces"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/test/medium/specs/repositories/face-identity.repository.spec.ts server/test/medium/specs/services/metadata.service.spec.ts server/src/repositories/face-identity.repository.ts server/src/services/person.service.ts
git commit -m "test: prove targeted identity backfill materialization"
```

## Task 8: Targeted Job Execution Skip Guards

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`
- Modify: `server/src/services/shared-space.service.ts` only if the skip behavior is not already implemented.

- [ ] **Step 1: Write or verify targeted-job execution skip tests**

Ensure `describe('handleSharedSpaceFaceMatch')` contains explicit tests for stale targeted jobs:

```ts
it('skips safely when a targeted asset is no longer in the space before execution', async () => {
  const spaceId = newUuid();
  const assetId = newUuid();
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
  mocks.sharedSpace.isAssetInSpace.mockResolvedValue(false);

  const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId, source: 'identity-backfill' });

  expect(result).toBe(JobStatus.Success);
  expect(mocks.sharedSpace.getAssetFacesForMatching).not.toHaveBeenCalled();
  expect(mocks.sharedSpace.addPersonFaces).not.toHaveBeenCalled();
  expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.SharedSpacePersonDedup, data: { spaceId } });
});

it('skips safely when face recognition is disabled before targeted execution', async () => {
  const space = factory.sharedSpace({ faceRecognitionEnabled: false });
  mocks.sharedSpace.getById.mockResolvedValue(space);

  const result = await sut.handleSharedSpaceFaceMatch({
    spaceId: space.id,
    assetId: 'asset-1',
    source: 'identity-backfill',
  });

  expect(result).toBe(JobStatus.Skipped);
  expect(mocks.sharedSpace.isAssetInSpace).not.toHaveBeenCalled();
  expect(mocks.sharedSpace.addPersonFaces).not.toHaveBeenCalled();
});
```

The first test covers direct asset removal and linked-library removal because both collapse to `isAssetInSpace(spaceId, assetId) === false` at execution time.

- [ ] **Step 2: Run focused shared-space tests**

Run:

```bash
corepack pnpm --dir server test src/services/shared-space.service.spec.ts -t "targeted asset is no longer|face recognition is disabled before targeted execution"
```

Expected: PASS if existing current-state checks already cover stale targeted jobs. If either test fails, fix only `handleSharedSpaceFaceMatch()` or `processSpaceFaceMatch()` so stale jobs skip without writing person-face rows.

- [ ] **Step 3: Commit if tests or fixes were added**

```bash
git add server/src/services/shared-space.service.spec.ts server/src/services/shared-space.service.ts
git commit -m "test: cover stale targeted shared-space face jobs"
```

## Task 9: Full Reset Preservation and Race Guard

**Files:**

- Modify: `server/src/services/person.service.spec.ts`

- [ ] **Step 1: Verify the existing force-reset full rebuild test remains present**

Confirm `server/src/services/person.service.spec.ts` has this force-reset regression test under the `force wipes space state` describe block:

```ts
it('should wipe shared_space_person tables and queue SharedSpaceFaceMatchAll per space when force=true', async () => {
  const face = AssetFaceFactory.from().person().build();
  mocks.job.getJobCounts.mockResolvedValue({
    active: 1,
    waiting: 0,
    paused: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
  });
  mocks.person.getAll.mockReturnValue(makeStream([face.person!]));
  mocks.person.getAllFaces.mockReturnValue(makeStream([face]));
  mocks.person.getAllWithoutFaces.mockResolvedValue([]);
  mocks.person.unassignFaces.mockResolvedValue();
  mocks.sharedSpace.deleteAllPersonFaces.mockResolvedValue(void 0 as any);
  mocks.sharedSpace.deleteAllPersons.mockResolvedValue(void 0 as any);
  mocks.sharedSpace.getSpaceIdsWithFaceRecognitionEnabled.mockResolvedValue(['space-a', 'space-b']);

  await sut.handleQueueRecognizeFaces({ force: true });

  expect(mocks.sharedSpace.deleteAllPersonFaces).toHaveBeenCalledOnce();
  expect(mocks.sharedSpace.deleteAllPersons).toHaveBeenCalledOnce();
  expect(mocks.sharedSpace.getSpaceIdsWithFaceRecognitionEnabled).toHaveBeenCalledOnce();
  expect(mocks.job.queueAll).toHaveBeenCalledWith([
    { name: JobName.SharedSpaceFaceMatchAll, data: { spaceId: 'space-a' } },
    { name: JobName.SharedSpaceFaceMatchAll, data: { spaceId: 'space-b' } },
  ]);
});
```

- [ ] **Step 2: Write failing service test for no identity-backfill full rebuild**

Add to `describe('handleFaceIdentityBackfill')`:

```ts
it('does not queue full shared-space rebuilds when identity backfill is retriggered during face recognition work', async () => {
  mocks.faceIdentity.backfillPersonalIdentities.mockResolvedValue({ processed: 0 });
  mocks.faceIdentity.backfillSpacePersonIdentities.mockResolvedValue({ processed: 0, conflictCount: 0 });
  (mocks.faceIdentity as any).getBackfillWork.mockResolvedValue({
    hasPersonalIdentityWork: true,
    hasSpacePersonIdentityWork: false,
    hasSharedSpaceProjectionWork: true,
  });

  await expect(sut.handleFaceIdentityBackfill({ stage: 'person' })).resolves.toBe(JobStatus.Success);

  expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.FaceIdentityBackfill, data: {} });
  expect(mocks.job.queueAll).not.toHaveBeenCalledWith(
    expect.arrayContaining([expect.objectContaining({ name: JobName.SharedSpaceFaceMatchAll })]),
  );
});
```

- [ ] **Step 3: Run focused tests and verify RED for the new identity-backfill test**

Run:

```bash
corepack pnpm --dir server test src/services/person.service.spec.ts -t "force face recognition|retriggered during face recognition"
```

Expected: the existing force-reset test PASSes; the new retrigger test FAILs if identity backfill still has a full rebuild path.

- [ ] **Step 4: Preserve existing force reset code and remove identity-backfill full rebuild hooks**

In `handleQueueRecognizeFaces({ force: true })`, keep:

```ts
const spaceIds = await this.sharedSpaceRepository.getSpaceIdsWithFaceRecognitionEnabled();
await this.jobRepository.queueAll(
  spaceIds.map((spaceId) => ({
    name: JobName.SharedSpaceFaceMatchAll as const,
    data: { spaceId },
  })),
);
```

In `handleFaceIdentityBackfill()`, do not call:

```ts
this.sharedSpaceRepository.getSpaceIdsWithFaceRecognitionEnabled();
```

and do not queue:

```ts
{ name: JobName.SharedSpaceFaceMatchAll, data: { spaceId } }
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
corepack pnpm --dir server test src/services/person.service.spec.ts -t "force face recognition|retriggered during face recognition"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/services/person.service.spec.ts server/src/services/person.service.ts
git commit -m "test: preserve full reset rebuild boundary"
```

## Task 10: Final Verification

**Files:**

- No new file edits unless verification exposes a bug.

- [ ] **Step 1: Run focused unit suite**

```bash
corepack pnpm --dir server test src/services/person.service.spec.ts src/repositories/job.repository.spec.ts src/services/job.service.spec.ts src/services/shared-space.service.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run focused medium suite**

```bash
corepack pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/services/metadata.service.spec.ts
```

Expected: PASS. If unrelated local EXIF fixtures are missing, rerun with the focused `-t` filters from Tasks 1, 2, and 7 and record the fixture limitation in the final implementation summary.

- [ ] **Step 3: Run typecheck, lint, and full unit tests**

```bash
corepack pnpm --dir server check
corepack pnpm --dir server lint
corepack pnpm --dir server test
```

Expected: PASS.

- [ ] **Step 4: Check diff hygiene**

```bash
git diff --check
git status --short
```

Expected: `git diff --check` has no output. `git status --short` lists only intentional committed or ready-to-commit changes.

- [ ] **Step 5: Commit any verification-only test fixes**

If Step 1-4 required small fixes:

```bash
git add server/src server/test/medium/specs
git commit -m "test: harden face identity backfill coverage"
```

Expected: no uncommitted implementation or test changes remain after the final commit.

## Self-Review Checklist

- [ ] Spec coverage: every goal in `docs/superpowers/specs/2026-05-09-face-identity-backfill-phased-fanout-design.md` maps to a task above.
- [ ] TDD proof: each behavior change has a RED command before production code.
- [ ] Race proof: identity work remaining, cursor races, retriggers, queue failures, and stale targets are covered by service or medium tests.
- [ ] Fan-out proof: identity backfill queues `SharedSpaceFaceMatch` only, never `SharedSpaceFaceMatchAll`.
- [ ] Edge proof: same photo in 10 spaces, disabled spaces, direct+library dedupe, stale assignment repair, deleted/offline/invisible inputs, and legacy imported metadata faces are covered.
- [ ] Metadata proof: identity-backfill finalization does not queue global metadata ahead of targeted face-match jobs.
- [ ] Compatibility proof: force reset full rebuild path remains unchanged.
