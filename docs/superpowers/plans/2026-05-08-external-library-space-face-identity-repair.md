# External Library Space Face Identity Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every production-code task. Use superpowers:verification-before-completion before claiming this phase is done. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add regression coverage and repair logic so identity-backed faces from multiple external libraries linked into one space remain assigned to the correct Space People rows and produce consistent People face statistics.

**Architecture:** Keep global People identity links and Space People face links as separate read models, but make space face matching identity-aware when an existing selected-space assignment is missing, stale, wrong, or type-incompatible. Add repository methods that inspect and replace only the selected face's selected-space links, then update the shared-space matching service to repair stale rows during `SharedSpaceFaceMatch`, `SharedSpaceLibraryFaceSync`, and `SharedSpaceFaceMatchAll`. Use medium tests for SQL scope/statistics and real DB service paths, unit tests for orchestration, and a developer note for repair semantics.

**Tech Stack:** NestJS services, Kysely/Postgres repositories, `@immich/sql-tools` generated SQL snapshots, Vitest small and medium tests, Docusaurus developer docs.

---

## Phase Boundary

This phase owns:

- Multiple external libraries linked to one shared space.
- Space People face assignments for identity-backed human and pet faces.
- Repairing selected-space `shared_space_person_face` rows that point to the wrong space person, no longer match the face identity, or block an identity-correct assignment.
- Medium statistics tests for global People and selected Space People count invariants.
- Real DB service tests that invoke `SharedSpaceLibraryFaceSync` and `SharedSpaceFaceMatchAll`.
- Developer documentation for linked-library identity repair and intentional global-vs-space scope differences.

This phase does not own:

- Browser UI tests for People pages.
- Real ML inference or filesystem library scanning.
- Redesigning identity reconciliation, metadata inheritance, or face clustering.
- A new operator UI for picking an arbitrary space ID unless the existing face-recognition toggle route is proven insufficient during implementation.

## Existing Behavior To Preserve

- Global People statistics use `face_identity_face` in `FaceIdentityRepository.getAccessiblePeopleFaceStatistics`.
- Space People statistics use `shared_space_person_face` in `SharedSpaceRepository.getPeopleFaceStatisticsBySpaceId`.
- Selected Space People includes direct space assets and linked-library assets whose asset visibility is in `visibleSpaceAssetVisibilities` (`archive` and `timeline` today).
- Global People includes the viewer's timeline-accessible assets and excludes archived assets.
- Faces without a native `personId` stay gated out of automatic space-person matching.
- Faces whose source person has no `identityId` keep the legacy matching path and existing short-circuit behavior.
- Existing correct selected-space face assignments stay idempotent.

## File Map

Production code:

- Modify `server/src/repositories/shared-space.repository.ts`
  - Add `SpaceFaceAssignment` export.
  - Add `getPersonFaceAssignmentsForSpace(assetFaceId, spaceId)`.
  - Add `removePersonFaceAssignmentsForSpaceFace(spaceId, assetFaceId)`.
  - Add `deleteOrphanedPersonsByIds(spaceId, personIds)`.
- Modify `server/src/services/shared-space.service.ts`
  - Stop using the broad assigned-face short-circuit for identity-backed faces.
  - Repair identity-backed assignments before inserting the identity-correct link.
  - Keep the old short-circuit for non-identity legacy faces.
  - Recount affected people and delete stale selected-space orphans after repair.

Tests:

- Modify `server/test/medium/specs/repositories/shared-space.repository.spec.ts`
  - Add read-side multi-library selected-space statistics tests.
  - Add repository method tests for selected-space face assignment inspection and removal.
  - Add scope boundary tests for archive, unlink/relink, and multi-space isolation.
- Modify `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
  - Add global accessible statistics tests for linked libraries, timeline opt-out, and cross-user access.
- Modify `server/src/services/shared-space.service.spec.ts`
  - Replace the stale-row preservation unit test for identity-backed faces with repair tests.
  - Add no-op, missing-link, stale-link, wrong-identity, type-incompatible, library-sync, and queueing tests.
- Add `server/test/medium/specs/services/shared-space-face-identity-repair.spec.ts`
  - Invoke real `SharedSpaceService` with real repositories and mocked job queue.
  - Prove library sync links multiple external libraries into one identity-backed space person.
  - Prove library sync repairs stale selected-space assignments for linked-library faces.
  - Prove full-space rematch repairs production drift.
  - Prove type-incompatible selected-space assignments do not inflate assigned Space People stats.

Generated artifacts:

- Modify `server/src/queries/shared.space.repository.sql` via `pnpm --dir server build && pnpm --dir server sync:sql`.

Documentation:

- Modify `docs/docs/developer/face-identity-backfill.md`.

## TDD Rules

- Production behavior changes start with a failing unit or medium test.
- Read-side count tests may pass on the first run because they lock existing behavior; if they fail, fix the aggregate SQL before committing them.
- Repair tests must fail before production repair code is added.
- The real DB service integration spec is written and run red immediately after repository helper contracts exist; it is committed only after the service repair code makes it green.
- Run the focused command after each test addition and again after the minimal implementation.
- Run adjacent unit and medium suites after each production task.
- Do not change generated SQL snapshots until repository method tests and service tests are green.

## Subagent Work Slices

Use one fresh implementer subagent per task unless executing inline. Tell each worker they are not alone in the codebase, must not revert edits made by others, and must adapt to already-landed changes.

- Worker A owns repository read-side and mutation tests plus `SharedSpaceRepository` methods.
- Worker C owns the real DB service integration spec and runs it red before service repair code changes.
- Worker B owns `SharedSpaceService` unit tests and service repair logic, then reruns Worker C's real DB integration spec green.
- Worker D owns global/scope medium tests and docs.
- Worker E owns generated SQL snapshots and final verification.

Do not run Worker A and Worker B production edits in parallel because both touch the service/repository contract. Worker C can write the new medium service spec after Worker A's repository method signatures are known.

---

## Task 1: Add Multi-Library Read-Side Statistics Coverage

**Files:**

- Modify `server/test/medium/specs/repositories/shared-space.repository.spec.ts`.
- Modify `server/test/medium/specs/repositories/face-identity.repository.spec.ts`.

- [ ] **Step 1: Add selected-space helper functions**

In `server/test/medium/specs/repositories/shared-space.repository.spec.ts`, add these helpers after `expectStats`:

```ts
const createIdentityBackedFace = async (
  ctx: ReturnType<typeof setup>['ctx'],
  input: {
    ownerId: string;
    libraryId?: string;
    identityId?: string;
    personId?: string;
    visibility?: AssetVisibility;
    name?: string;
  },
) => {
  const { result: person } = input.personId
    ? {
        result: await ctx.database
          .selectFrom('person')
          .selectAll()
          .where('id', '=', input.personId)
          .executeTakeFirstOrThrow(),
      }
    : await ctx.newPerson({ ownerId: input.ownerId, name: input.name ?? 'Person' });
  const identityId =
    input.identityId ??
    person.identityId ??
    (
      await ctx.database
        .insertInto('face_identity')
        .values({ type: 'person' })
        .returning('id')
        .executeTakeFirstOrThrow()
    ).id;

  if (!person.identityId) {
    await ctx.database.updateTable('person').set({ identityId }).where('id', '=', person.id).execute();
  }

  const { asset } = await ctx.newAsset({
    ownerId: input.ownerId,
    libraryId: input.libraryId,
    visibility: input.visibility ?? AssetVisibility.Timeline,
  });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  await ctx.database.insertInto('face_search').values({ faceId: assetFace.id, embedding: newEmbedding() }).execute();
  await ctx.database
    .insertInto('face_identity_face')
    .values({ assetFaceId: assetFace.id, identityId, source: 'owner-person' })
    .onConflict((oc) => oc.doNothing())
    .execute();

  return { asset, assetFace, identityId, person };
};

const createSpaceIdentityPerson = async (
  sut: SharedSpaceRepository,
  input: { spaceId: string; identityId: string; representativeFaceId: string; name?: string; isHidden?: boolean },
) => {
  return sut.createPerson({
    spaceId: input.spaceId,
    identityId: input.identityId,
    name: input.name ?? 'Alice',
    representativeFaceId: input.representativeFaceId,
    isHidden: input.isHidden ?? false,
    type: 'person',
  });
};
```

- [ ] **Step 2: Add selected-space multi-library count tests**

In the `describe('getPeopleFaceStatisticsBySpaceId')` block of `server/test/medium/specs/repositories/shared-space.repository.spec.ts`, add:

```ts
it('getPeopleFaceStatisticsBySpaceId counts one identity across multiple linked libraries once', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { library: library1 } = await ctx.newLibrary({ ownerId: user.id });
  const { library: library2 } = await ctx.newLibrary({ ownerId: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library1.id, addedById: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library2.id, addedById: user.id });

  const first = await createIdentityBackedFace(ctx, { ownerId: user.id, libraryId: library1.id, name: 'Alice' });
  const second = await createIdentityBackedFace(ctx, {
    ownerId: user.id,
    libraryId: library2.id,
    personId: first.person.id,
    identityId: first.identityId,
  });
  const spacePerson = await createSpaceIdentityPerson(sut, {
    spaceId: space.id,
    identityId: first.identityId,
    representativeFaceId: first.assetFace.id,
    name: 'Alice',
  });
  await sut.addPersonFaces(
    [
      { personId: spacePerson.id, assetFaceId: first.assetFace.id },
      { personId: spacePerson.id, assetFaceId: second.assetFace.id },
    ],
    { skipRecount: true },
  );
  await sut.recountPersons([spacePerson.id]);

  expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }), {
    detectedFaceCount: 2,
    assignedVisibleFaceCount: 2,
    namedVisiblePersonCount: 1,
    assignedHiddenFaceCount: 0,
    unassignedFaceCount: 0,
  });
});

it('getPeopleFaceStatisticsBySpaceId preserves assigned and unassigned buckets across multiple linked libraries', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { library: library1 } = await ctx.newLibrary({ ownerId: user.id });
  const { library: library2 } = await ctx.newLibrary({ ownerId: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library1.id, addedById: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library2.id, addedById: user.id });

  const visible = await createIdentityBackedFace(ctx, { ownerId: user.id, libraryId: library1.id, name: 'Visible' });
  const visibleSecondLibrary = await createIdentityBackedFace(ctx, {
    ownerId: user.id,
    libraryId: library2.id,
    personId: visible.person.id,
    identityId: visible.identityId,
  });
  const hidden = await createIdentityBackedFace(ctx, { ownerId: user.id, libraryId: library2.id, name: 'Hidden' });
  const { asset: unassignedAsset } = await ctx.newAsset({
    ownerId: user.id,
    libraryId: library2.id,
    visibility: AssetVisibility.Timeline,
  });
  await ctx.newAssetFace({ assetId: unassignedAsset.id });

  const visibleSpacePerson = await createSpaceIdentityPerson(sut, {
    spaceId: space.id,
    identityId: visible.identityId,
    representativeFaceId: visible.assetFace.id,
    name: 'Visible',
  });
  const hiddenSpacePerson = await createSpaceIdentityPerson(sut, {
    spaceId: space.id,
    identityId: hidden.identityId,
    representativeFaceId: hidden.assetFace.id,
    name: 'Hidden',
    isHidden: true,
  });
  await sut.addPersonFaces(
    [
      { personId: visibleSpacePerson.id, assetFaceId: visible.assetFace.id },
      { personId: visibleSpacePerson.id, assetFaceId: visibleSecondLibrary.assetFace.id },
      { personId: hiddenSpacePerson.id, assetFaceId: hidden.assetFace.id },
    ],
    { skipRecount: true },
  );
  await sut.recountPersons([visibleSpacePerson.id, hiddenSpacePerson.id]);

  const result = await sut.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 });

  expectStats(result, {
    detectedFaceCount: 4,
    assignedVisibleFaceCount: 2,
    namedVisiblePersonCount: 1,
    assignedHiddenFaceCount: 1,
    unassignedFaceCount: 1,
  });
  expect(result.assignedVisibleFaceCount + result.assignedHiddenFaceCount + result.unassignedFaceCount).toBe(
    result.detectedFaceCount,
  );
});
```

- [ ] **Step 3: Run selected-space read-side tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/shared-space.repository.spec.ts -t "multiple linked libraries|preserves assigned and unassigned"
```

Expected: PASS if the existing aggregate already handles direct linked-library counting. If it fails with wrong counts, fix only `getPeopleFaceStatisticsBySpaceId` scope/dedup SQL before committing Task 1.

- [ ] **Step 4: Add global accessible linked-library tests**

In `server/test/medium/specs/repositories/face-identity.repository.spec.ts`, add this helper after `newIdentityFace`:

```ts
const newLibraryIdentityFace = async (
  ctx: ReturnType<typeof setup>['ctx'],
  sut: FaceIdentityRepository,
  input: {
    ownerId: string;
    libraryId: string;
    personId?: string;
    identityId?: string;
    visibility?: AssetVisibility;
    name?: string;
  },
) => {
  const { person } = input.personId
    ? {
        person: await ctx.database
          .selectFrom('person')
          .selectAll()
          .where('id', '=', input.personId)
          .executeTakeFirstOrThrow(),
      }
    : await ctx.newPerson({ ownerId: input.ownerId, name: input.name ?? '' });
  const identity =
    input.identityId === undefined
      ? await sut.ensurePersonIdentity(person.id)
      : { id: input.identityId, type: 'person' };
  const { asset } = await ctx.newAsset({
    ownerId: input.ownerId,
    libraryId: input.libraryId,
    visibility: input.visibility ?? AssetVisibility.Timeline,
  });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  await ctx.database.insertInto('face_search').values({ faceId: assetFace.id, embedding: newEmbedding() }).execute();
  await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

  return { person, identity, asset, assetFace };
};
```

Then add these tests to `describe('getAccessiblePeopleFaceStatistics')`:

```ts
it('counts linked-library identity faces from multiple libraries through one timeline-visible space', async () => {
  const { ctx, sut } = setup();
  const { user: owner } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  try {
    const { space } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const { library: library1 } = await ctx.newLibrary({ ownerId: owner.id });
    const { library: library2 } = await ctx.newLibrary({ ownerId: owner.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library1.id, addedById: owner.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library2.id, addedById: owner.id });

    const first = await newLibraryIdentityFace(ctx, sut, { ownerId: owner.id, libraryId: library1.id, name: 'Alice' });
    const second = await newLibraryIdentityFace(ctx, sut, {
      ownerId: owner.id,
      libraryId: library2.id,
      personId: first.person.id,
      identityId: first.identity.id,
    });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: first.identity.id,
        name: 'Alice',
        representativeFaceId: first.assetFace.id,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await linkSpaceFace(ctx, spacePerson.id, first.assetFace.id);
    await linkSpaceFace(ctx, spacePerson.id, second.assetFace.id);

    await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
      detectedFaceCount: 2,
      assignedVisibleFaceCount: 2,
      namedVisiblePersonCount: 1,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
    await expect(sut.getAccessiblePeopleStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
      total: 1,
      hidden: 0,
      detectedFaceCount: 2,
    });
  } finally {
    await ctx.database.deleteFrom('user').where('id', 'in', [owner.id, member.id]).execute();
  }
});

it('does not classify linked-library identity faces as assigned without a published space person', async () => {
  const { ctx, sut } = setup();
  const { user: owner } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  try {
    const { space } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const { library: library1 } = await ctx.newLibrary({ ownerId: owner.id });
    const { library: library2 } = await ctx.newLibrary({ ownerId: owner.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library1.id, addedById: owner.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library2.id, addedById: owner.id });

    const first = await newLibraryIdentityFace(ctx, sut, {
      ownerId: owner.id,
      libraryId: library1.id,
      name: 'Private Alice',
    });
    await newLibraryIdentityFace(ctx, sut, {
      ownerId: owner.id,
      libraryId: library2.id,
      personId: first.person.id,
      identityId: first.identity.id,
    });

    await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
      detectedFaceCount: 2,
      assignedVisibleFaceCount: 0,
      namedVisiblePersonCount: 0,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 2,
    });
    await expect(sut.getAccessiblePeopleStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
      total: 0,
      hidden: 0,
      detectedFaceCount: 2,
    });
  } finally {
    await ctx.database.deleteFrom('user').where('id', 'in', [owner.id, member.id]).execute();
  }
});

it('excludes linked-library space faces from global stats when the member hides the space from timeline', async () => {
  const { ctx, sut } = setup();
  const { user: owner } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  try {
    const { space } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });
    const { library: library1 } = await ctx.newLibrary({ ownerId: owner.id });
    const { library: library2 } = await ctx.newLibrary({ ownerId: owner.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library1.id, addedById: owner.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library2.id, addedById: owner.id });
    const first = await newLibraryIdentityFace(ctx, sut, {
      ownerId: owner.id,
      libraryId: library1.id,
      name: 'Alice',
    });
    const second = await newLibraryIdentityFace(ctx, sut, {
      ownerId: owner.id,
      libraryId: library2.id,
      personId: first.person.id,
      identityId: first.identity.id,
    });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: first.identity.id,
        name: 'Alice',
        representativeFaceId: first.assetFace.id,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await linkSpaceFace(ctx, spacePerson.id, first.assetFace.id);
    await linkSpaceFace(ctx, spacePerson.id, second.assetFace.id);

    await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
      detectedFaceCount: 0,
      assignedVisibleFaceCount: 0,
      namedVisiblePersonCount: 0,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
    await expect(sut.getAccessiblePeopleStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
      total: 0,
      hidden: 0,
      detectedFaceCount: 0,
    });
  } finally {
    await ctx.database.deleteFrom('user').where('id', 'in', [owner.id, member.id]).execute();
  }
});
```

- [ ] **Step 5: Run global read-side tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/face-identity.repository.spec.ts -t "multiple libraries|hides the space from timeline"
```

Expected: PASS if current global accessible scope is correct. If it fails, fix `FaceIdentityRepository.getAccessiblePeopleFaceStatistics` scope before committing Task 1.

- [ ] **Step 6: Commit Task 1**

```bash
git add server/test/medium/specs/repositories/shared-space.repository.spec.ts server/test/medium/specs/repositories/face-identity.repository.spec.ts
git commit -m "test: cover multi-library space face statistics"
```

---

## Task 2: Add Repository Assignment Repair Primitives

**Files:**

- Modify `server/test/medium/specs/repositories/shared-space.repository.spec.ts`.
- Modify `server/src/repositories/shared-space.repository.ts`.

- [ ] **Step 1: Write failing repository method tests**

In `server/test/medium/specs/repositories/shared-space.repository.spec.ts`, add a new block before `describe('getPeopleFaceStatisticsBySpaceId')`:

```ts
describe('selected-space face assignment repair helpers', () => {
  it('reads only assignments for the selected space and face', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
    const target = await sut.createPerson({
      spaceId: space.id,
      identityId: null,
      name: '',
      representativeFaceId: null,
    });
    const other = await sut.createPerson({
      spaceId: otherSpace.id,
      identityId: null,
      name: '',
      representativeFaceId: null,
    });
    await sut.addPersonFaces(
      [
        { personId: target.id, assetFaceId: assetFace.id },
        { personId: other.id, assetFaceId: assetFace.id },
      ],
      { skipRecount: true },
    );

    await expect(sut.getPersonFaceAssignmentsForSpace(assetFace.id, space.id)).resolves.toEqual([
      { personId: target.id, identityId: null, type: 'person' },
    ]);
  });

  it('removes only selected-space assignments for one face and returns affected people', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
    const selectedPerson = await sut.createPerson({ spaceId: space.id, name: '', representativeFaceId: null });
    const otherSpacePerson = await sut.createPerson({ spaceId: otherSpace.id, name: '', representativeFaceId: null });
    await sut.addPersonFaces(
      [
        { personId: selectedPerson.id, assetFaceId: assetFace.id },
        { personId: otherSpacePerson.id, assetFaceId: assetFace.id },
      ],
      { skipRecount: true },
    );

    await expect(sut.removePersonFaceAssignmentsForSpaceFace(space.id, assetFace.id)).resolves.toEqual([
      selectedPerson.id,
    ]);
    await expect(sut.getPersonFaceAssignmentsForSpace(assetFace.id, space.id)).resolves.toEqual([]);
    await expect(sut.getPersonFaceAssignmentsForSpace(assetFace.id, otherSpace.id)).resolves.toEqual([
      { personId: otherSpacePerson.id, identityId: null, type: 'person' },
    ]);
  });

  it('deletes only orphaned people from the provided selected-space person ids', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
    const orphan = await sut.createPerson({ spaceId: space.id, name: '', representativeFaceId: null });
    const nonOrphan = await sut.createPerson({ spaceId: space.id, name: '', representativeFaceId: null });
    const otherSpaceOrphan = await sut.createPerson({ spaceId: otherSpace.id, name: '', representativeFaceId: null });
    await sut.addPersonFaces([{ personId: nonOrphan.id, assetFaceId: assetFace.id }], { skipRecount: true });

    await sut.deleteOrphanedPersonsByIds(space.id, [orphan.id, nonOrphan.id, otherSpaceOrphan.id]);

    await expect(sut.getPersonById(orphan.id)).resolves.toBeUndefined();
    await expect(sut.getPersonById(nonOrphan.id)).resolves.toBeDefined();
    await expect(sut.getPersonById(otherSpaceOrphan.id)).resolves.toBeDefined();
  });
});
```

- [ ] **Step 2: Run repository method tests to verify red**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/shared-space.repository.spec.ts -t "selected-space face assignment repair helpers"
```

Expected: FAIL with TypeScript errors or runtime errors stating `getPersonFaceAssignmentsForSpace`, `removePersonFaceAssignmentsForSpaceFace`, or `deleteOrphanedPersonsByIds` is not a function.

- [ ] **Step 3: Add repository type and methods**

In `server/src/repositories/shared-space.repository.ts`, add this export near `PetFaceForMatching`:

```ts
export type SpaceFaceAssignment = {
  personId: string;
  identityId: string | null;
  type: string;
};
```

Add these methods immediately after `isPersonFaceAssigned`:

```ts
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getPersonFaceAssignmentsForSpace(assetFaceId: string, spaceId: string): Promise<SpaceFaceAssignment[]> {
    return this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('shared_space_person', 'shared_space_person.id', 'shared_space_person_face.personId')
      .select([
        'shared_space_person_face.personId',
        'shared_space_person.identityId',
        'shared_space_person.type',
      ])
      .where('shared_space_person_face.assetFaceId', '=', assetFaceId)
      .where('shared_space_person.spaceId', '=', spaceId)
      .orderBy('shared_space_person_face.personId')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async removePersonFaceAssignmentsForSpaceFace(spaceId: string, assetFaceId: string): Promise<string[]> {
    const assignments = await this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('shared_space_person', 'shared_space_person.id', 'shared_space_person_face.personId')
      .select('shared_space_person_face.personId')
      .where('shared_space_person_face.assetFaceId', '=', assetFaceId)
      .where('shared_space_person.spaceId', '=', spaceId)
      .execute();
    if (assignments.length === 0) {
      return [];
    }

    await this.db
      .deleteFrom('shared_space_person_face')
      .where('assetFaceId', '=', assetFaceId)
      .where(
        'personId',
        'in',
        assignments.map((assignment) => assignment.personId),
      )
      .execute();

    return assignments.map((assignment) => assignment.personId);
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async deleteOrphanedPersonsByIds(spaceId: string, personIds: string[]) {
    if (personIds.length === 0) {
      return;
    }

    await this.db
      .deleteFrom('shared_space_person')
      .where('spaceId', '=', spaceId)
      .where('id', 'in', personIds)
      .where(
        'id',
        'not in',
        this.db.selectFrom('shared_space_person_face').select('shared_space_person_face.personId'),
      )
      .execute();
  }
```

- [ ] **Step 4: Run repository method tests to verify green**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/shared-space.repository.spec.ts -t "selected-space face assignment repair helpers"
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add server/src/repositories/shared-space.repository.ts server/test/medium/specs/repositories/shared-space.repository.spec.ts
git commit -m "feat: add space face assignment repair helpers"
```

---

## Task 3: Add Real DB Service Integration Tests (Red)

**Files:**

- Add `server/test/medium/specs/services/shared-space-face-identity-repair.spec.ts`.

- [ ] **Step 1: Create failing medium service spec**

Create `server/test/medium/specs/services/shared-space-face-identity-repair.spec.ts` with:

```ts
import { Kysely } from 'kysely';
import { AssetVisibility, JobName, JobStatus, SharedSpaceRole } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { FaceIdentityRepository } from 'src/repositories/face-identity.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { DB } from 'src/schema';
import { SharedSpaceService } from 'src/services/shared-space.service';
import { newMediumService } from 'test/medium.factory';
import { newEmbedding } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';
import { Mocked } from 'vitest';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx, sut } = newMediumService(SharedSpaceService, {
    database: db || defaultDatabase,
    real: [
      AssetRepository,
      SharedSpaceRepository,
      FaceIdentityRepository,
      PersonRepository,
      ConfigRepository,
      SystemMetadataRepository,
    ],
    mock: [LoggingRepository, JobRepository],
  });
  const jobs = ctx.getMock<JobRepository, Mocked<JobRepository>>(JobRepository);
  jobs.queue.mockResolvedValue();
  jobs.queueAll.mockResolvedValue();
  return {
    ctx,
    sut,
    faceIdentityRepository: ctx.get(FaceIdentityRepository),
    sharedSpaceRepository: ctx.get(SharedSpaceRepository),
    jobs,
  };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

const createIdentityFace = async (
  ctx: ReturnType<typeof setup>['ctx'],
  faceIdentityRepository: FaceIdentityRepository,
  input: {
    ownerId: string;
    libraryId: string;
    personId?: string;
    identityId?: string;
    name?: string;
  },
) => {
  const { result: person } = input.personId
    ? {
        result: await ctx.database
          .selectFrom('person')
          .selectAll()
          .where('id', '=', input.personId)
          .executeTakeFirstOrThrow(),
      }
    : await ctx.newPerson({ ownerId: input.ownerId, name: input.name ?? 'Alice' });
  const identity =
    input.identityId === undefined
      ? await faceIdentityRepository.ensurePersonIdentity(person.id)
      : { id: input.identityId, type: 'person' };
  const { asset } = await ctx.newAsset({
    ownerId: input.ownerId,
    libraryId: input.libraryId,
    visibility: AssetVisibility.Timeline,
  });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  await ctx.database.insertInto('face_search').values({ faceId: assetFace.id, embedding: newEmbedding() }).execute();
  await faceIdentityRepository.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

  return { person, identity, asset, assetFace };
};

describe('SharedSpaceService linked-library face identity repair', () => {
  it('library sync creates one identity-backed space person across multiple linked libraries', async () => {
    const { ctx, sut, faceIdentityRepository, sharedSpaceRepository, jobs } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { library: library1 } = await ctx.newLibrary({ ownerId: user.id });
    const { library: library2 } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library1.id, addedById: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library2.id, addedById: user.id });

    const first = await createIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library1.id,
      name: 'Alice',
    });
    const second = await createIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library2.id,
      personId: first.person.id,
      identityId: first.identity.id,
    });

    await expect(sut.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library1.id })).resolves.toBe(
      JobStatus.Success,
    );
    await expect(sut.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library2.id })).resolves.toBe(
      JobStatus.Success,
    );

    const people = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .where('identityId', '=', first.identity.id)
      .execute();
    expect(people).toHaveLength(1);
    await expect(sharedSpaceRepository.getPersonFaceAssignmentsForSpace(first.assetFace.id, space.id)).resolves.toEqual(
      [{ personId: people[0].id, identityId: first.identity.id, type: 'person' }],
    );
    await expect(
      sharedSpaceRepository.getPersonFaceAssignmentsForSpace(second.assetFace.id, space.id),
    ).resolves.toEqual([{ personId: people[0].id, identityId: first.identity.id, type: 'person' }]);
    await expect(
      sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }),
    ).resolves.toMatchObject({
      detectedFaceCount: 2,
      assignedVisibleFaceCount: 2,
      unassignedFaceCount: 0,
    });
    expect(jobs.queue).toHaveBeenCalledWith({ name: JobName.SharedSpacePersonDedup, data: { spaceId: space.id } });
    expect(jobs.queue).toHaveBeenCalledWith({
      name: JobName.SharedSpaceIdentityReconciliation,
      data: { spaceId: space.id },
    });
  });

  it('full-space rematch repairs stale selected-space face assignments from linked libraries', async () => {
    const { ctx, sut, faceIdentityRepository, sharedSpaceRepository } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
    const face = await createIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library.id,
      name: 'Alice',
    });
    const stalePerson = await sharedSpaceRepository.createPerson({
      spaceId: space.id,
      name: '',
      representativeFaceId: face.assetFace.id,
      type: 'person',
    });
    await sharedSpaceRepository.addPersonFaces([{ personId: stalePerson.id, assetFaceId: face.assetFace.id }], {
      skipRecount: true,
    });

    await expect(sut.handleSharedSpaceFaceMatchAll({ spaceId: space.id })).resolves.toBe(JobStatus.Success);

    const correctPerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .where('identityId', '=', face.identity.id)
      .executeTakeFirstOrThrow();
    await expect(sharedSpaceRepository.getPersonFaceAssignmentsForSpace(face.assetFace.id, space.id)).resolves.toEqual([
      { personId: correctPerson.id, identityId: face.identity.id, type: 'person' },
    ]);
    await expect(sharedSpaceRepository.getPersonById(stalePerson.id)).resolves.toBeUndefined();
    await expect(
      sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }),
    ).resolves.toMatchObject({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 1,
      unassignedFaceCount: 0,
    });
  });

  it('library sync repairs stale selected-space face assignments from linked libraries', async () => {
    const { ctx, sut, faceIdentityRepository, sharedSpaceRepository } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
    const face = await createIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library.id,
      name: 'Alice',
    });
    const stalePerson = await sharedSpaceRepository.createPerson({
      spaceId: space.id,
      name: '',
      representativeFaceId: face.assetFace.id,
      type: 'person',
    });
    await sharedSpaceRepository.addPersonFaces([{ personId: stalePerson.id, assetFaceId: face.assetFace.id }], {
      skipRecount: true,
    });

    await expect(sut.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library.id })).resolves.toBe(
      JobStatus.Success,
    );

    const correctPerson = await ctx.database
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', space.id)
      .where('identityId', '=', face.identity.id)
      .executeTakeFirstOrThrow();
    await expect(sharedSpaceRepository.getPersonFaceAssignmentsForSpace(face.assetFace.id, space.id)).resolves.toEqual([
      { personId: correctPerson.id, identityId: face.identity.id, type: 'person' },
    ]);
    await expect(sharedSpaceRepository.getPersonById(stalePerson.id)).resolves.toBeUndefined();
    await expect(
      sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }),
    ).resolves.toMatchObject({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 1,
      unassignedFaceCount: 0,
    });
  });

  it('full-space rematch removes type-incompatible assignments without inflating stats', async () => {
    const { ctx, sut, faceIdentityRepository, sharedSpaceRepository } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const { library } = await ctx.newLibrary({ ownerId: user.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
    const face = await createIdentityFace(ctx, faceIdentityRepository, {
      ownerId: user.id,
      libraryId: library.id,
      name: 'Alice',
    });
    const petSpacePerson = await sharedSpaceRepository.createPerson({
      spaceId: space.id,
      identityId: face.identity.id,
      name: '',
      representativeFaceId: face.assetFace.id,
      type: 'pet',
    });
    await sharedSpaceRepository.addPersonFaces([{ personId: petSpacePerson.id, assetFaceId: face.assetFace.id }], {
      skipRecount: true,
    });

    await expect(sut.handleSharedSpaceFaceMatchAll({ spaceId: space.id })).resolves.toBe(JobStatus.Success);

    await expect(sharedSpaceRepository.getPersonFaceAssignmentsForSpace(face.assetFace.id, space.id)).resolves.toEqual(
      [],
    );
    await expect(sharedSpaceRepository.getPersonById(petSpacePerson.id)).resolves.toBeUndefined();
    await expect(
      sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { petsEnabled: true }),
    ).resolves.toMatchObject({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 0,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 1,
    });
  });
});
```

- [ ] **Step 2: Run medium service spec to verify red**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/services/shared-space-face-identity-repair.spec.ts
```

Expected: FAIL on stale linked-library sync, stale full-space rematch, and type-incompatible assignment repair because production repair logic has not been added yet.

- [ ] **Step 3: Leave the red integration spec uncommitted until Task 4 is green**

Do not commit after the red run. Task 4 commits this test file together with the minimal production repair code that makes it pass.

---

## Task 4: Repair Identity-Backed Face Assignments In The Matching Service

**Files:**

- Modify `server/src/services/shared-space.service.spec.ts`.
- Modify `server/src/services/shared-space.service.ts`.

- [ ] **Step 1: Add default mock setup for new repository methods**

In `server/src/services/shared-space.service.spec.ts`, inside `beforeEach`, after `mocks.sharedSpace.isAssetInSpace.mockResolvedValue(true);`, add:

```ts
mocks.sharedSpace.getPersonFaceAssignmentsForSpace.mockResolvedValue([]);
mocks.sharedSpace.removePersonFaceAssignmentsForSpaceFace.mockResolvedValue([]);
mocks.sharedSpace.deleteOrphanedPersonsByIds.mockResolvedValue(void 0);
```

- [ ] **Step 2: Replace stale-row preservation test with repair tests**

In `server/src/services/shared-space.service.spec.ts`, replace the test named `should not touch pre-existing stale rows (isPersonFaceAssigned short-circuit)` with:

```ts
it('should repair an identity-backed face assigned to a stale selected-space person', async () => {
  const spaceId = newUuid();
  const assetId = newUuid();
  const faceId = newUuid();
  const identityId = newUuid();
  const stalePersonId = newUuid();
  const correctPersonId = newUuid();
  const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true });

  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
    { id: faceId, assetId, personId: newUuid(), identityId, type: 'person', embedding: '[1,2,3]' },
  ]);
  mocks.sharedSpace.getPersonFaceAssignmentsForSpace.mockResolvedValue([
    { personId: stalePersonId, identityId: null, type: 'person' },
  ]);
  mocks.sharedSpace.getSpacePersonByIdentity.mockResolvedValue(
    factory.sharedSpacePerson({ id: correctPersonId, spaceId, identityId, type: 'person' }),
  );
  mocks.sharedSpace.removePersonFaceAssignmentsForSpaceFace.mockResolvedValue([stalePersonId]);
  mocks.sharedSpace.addPersonFaces.mockResolvedValue([{ personId: correctPersonId, assetFaceId: faceId }] as any);
  mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

  const result = await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

  expect(result).toBe(JobStatus.Success);
  expect(mocks.sharedSpace.removePersonFaceAssignmentsForSpaceFace).toHaveBeenCalledWith(spaceId, faceId);
  expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith([{ personId: correctPersonId, assetFaceId: faceId }], {
    skipRecount: true,
  });
  expect(mocks.sharedSpace.recountPersons).toHaveBeenCalledWith([stalePersonId, correctPersonId]);
  expect(mocks.sharedSpace.deleteOrphanedPersonsByIds).toHaveBeenCalledWith(spaceId, [stalePersonId]);
  expect(mocks.job.queue).toHaveBeenCalledWith({
    name: JobName.SharedSpaceIdentityReconciliation,
    data: { spaceId, spacePersonId: correctPersonId },
  });
});

it('should leave an already correct identity-backed face assignment unchanged', async () => {
  const spaceId = newUuid();
  const assetId = newUuid();
  const faceId = newUuid();
  const identityId = newUuid();
  const spacePersonId = newUuid();
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
  mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
    { id: faceId, assetId, personId: newUuid(), identityId, type: 'person', embedding: '[1,2,3]' },
  ]);
  mocks.sharedSpace.getPersonFaceAssignmentsForSpace.mockResolvedValue([
    { personId: spacePersonId, identityId, type: 'person' },
  ]);
  mocks.sharedSpace.getSpacePersonByIdentity.mockResolvedValue(
    factory.sharedSpacePerson({ id: spacePersonId, spaceId, identityId, type: 'person' }),
  );
  mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

  await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

  expect(mocks.sharedSpace.removePersonFaceAssignmentsForSpaceFace).not.toHaveBeenCalled();
  expect(mocks.sharedSpace.addPersonFaces).not.toHaveBeenCalled();
  expect(mocks.sharedSpace.recountPersons).not.toHaveBeenCalled();
});

it('should attach a missing selected-space link for an identity-backed face', async () => {
  const spaceId = newUuid();
  const assetId = newUuid();
  const faceId = newUuid();
  const identityId = newUuid();
  const spacePersonId = newUuid();
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
  mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
    { id: faceId, assetId, personId: newUuid(), identityId, type: 'person', embedding: '[1,2,3]' },
  ]);
  mocks.sharedSpace.getPersonFaceAssignmentsForSpace.mockResolvedValue([]);
  mocks.sharedSpace.getSpacePersonByIdentity.mockResolvedValue(
    factory.sharedSpacePerson({ id: spacePersonId, spaceId, identityId, type: 'person' }),
  );
  mocks.sharedSpace.addPersonFaces.mockResolvedValue([{ personId: spacePersonId, assetFaceId: faceId }] as any);
  mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

  await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

  expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith([{ personId: spacePersonId, assetFaceId: faceId }], {
    skipRecount: true,
  });
  expect(mocks.sharedSpace.recountPersons).toHaveBeenCalledWith([spacePersonId]);
});

it('should replace a wrong identity selected-space face assignment', async () => {
  const spaceId = newUuid();
  const assetId = newUuid();
  const faceId = newUuid();
  const correctIdentityId = newUuid();
  const wrongIdentityId = newUuid();
  const wrongPersonId = newUuid();
  const correctPersonId = newUuid();
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
  mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
    { id: faceId, assetId, personId: newUuid(), identityId: correctIdentityId, type: 'person', embedding: '[1,2,3]' },
  ]);
  mocks.sharedSpace.getPersonFaceAssignmentsForSpace.mockResolvedValue([
    { personId: wrongPersonId, identityId: wrongIdentityId, type: 'person' },
  ]);
  mocks.sharedSpace.getSpacePersonByIdentity.mockResolvedValue(
    factory.sharedSpacePerson({ id: correctPersonId, spaceId, identityId: correctIdentityId, type: 'person' }),
  );
  mocks.sharedSpace.removePersonFaceAssignmentsForSpaceFace.mockResolvedValue([wrongPersonId]);
  mocks.sharedSpace.addPersonFaces.mockResolvedValue([{ personId: correctPersonId, assetFaceId: faceId }] as any);
  mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

  await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

  expect(mocks.sharedSpace.removePersonFaceAssignmentsForSpaceFace).toHaveBeenCalledWith(spaceId, faceId);
  expect(mocks.sharedSpace.addPersonFaces).toHaveBeenCalledWith([{ personId: correctPersonId, assetFaceId: faceId }], {
    skipRecount: true,
  });
  expect(mocks.sharedSpace.recountPersons).toHaveBeenCalledWith([wrongPersonId, correctPersonId]);
  expect(mocks.sharedSpace.deleteOrphanedPersonsByIds).toHaveBeenCalledWith(spaceId, [wrongPersonId]);
});

it('should remove a type-incompatible identity assignment without attaching to the wrong type', async () => {
  const spaceId = newUuid();
  const assetId = newUuid();
  const faceId = newUuid();
  const identityId = newUuid();
  const petSpacePersonId = newUuid();
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
  mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
    { id: faceId, assetId, personId: newUuid(), identityId, type: 'person', embedding: '[1,2,3]' },
  ]);
  mocks.sharedSpace.getPersonFaceAssignmentsForSpace.mockResolvedValue([
    { personId: petSpacePersonId, identityId, type: 'pet' },
  ]);
  mocks.sharedSpace.getSpacePersonByIdentity.mockResolvedValue(
    factory.sharedSpacePerson({ id: petSpacePersonId, spaceId, identityId, type: 'pet' }),
  );
  mocks.sharedSpace.removePersonFaceAssignmentsForSpaceFace.mockResolvedValue([petSpacePersonId]);
  mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

  await sut.handleSharedSpaceFaceMatch({ spaceId, assetId });

  expect(mocks.sharedSpace.removePersonFaceAssignmentsForSpaceFace).toHaveBeenCalledWith(spaceId, faceId);
  expect(mocks.sharedSpace.addPersonFaces).not.toHaveBeenCalled();
  expect(mocks.sharedSpace.recountPersons).toHaveBeenCalledWith([petSpacePersonId]);
  expect(mocks.sharedSpace.deleteOrphanedPersonsByIds).toHaveBeenCalledWith(spaceId, [petSpacePersonId]);
});
```

- [ ] **Step 3: Run service repair tests to verify red**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/services/shared-space.service.spec.ts -t "stale selected-space|already correct identity-backed|missing selected-space|wrong identity|type-incompatible"
```

Expected: FAIL. The stale, missing, and wrong-identity tests fail because `processSpaceFaceMatch` still uses `isPersonFaceAssigned` as a broad short-circuit and never removes selected-space stale rows.

- [ ] **Step 4: Import the repository assignment type**

In `server/src/services/shared-space.service.ts`, add a type-only import near the other imports:

```ts
import type { SpaceFaceAssignment } from 'src/repositories/shared-space.repository';
```

- [ ] **Step 5: Add service helpers for identity assignment repair**

In `server/src/services/shared-space.service.ts`, add these private helpers before `processSpaceFaceMatch`:

```ts
  private async resolveIdentitySpacePersonForFace(input: {
    spaceId: string;
    faceId: string;
    personId: string;
    identityId: string;
    type: string;
  }): Promise<SpacePersonMatchResult | undefined> {
    const existingByIdentity = await this.sharedSpaceRepository.getSpacePersonByIdentity(
      input.spaceId,
      input.identityId,
    );
    if (existingByIdentity) {
      return existingByIdentity.type === input.type ? existingByIdentity : undefined;
    }

    const representativeFaceId = await this.getNewSpacePersonRepresentativeFaceId({
      spaceId: input.spaceId,
      fallbackFaceId: input.faceId,
      personalPersonId: input.personId,
    });

    return this.sharedSpaceRepository.createPerson({
      spaceId: input.spaceId,
      identityId: input.identityId,
      name: '',
      representativeFaceId,
      type: input.type,
    });
  }

  private isCorrectSpaceFaceAssignment(input: {
    assignments: SpaceFaceAssignment[];
    targetPersonId: string;
    identityId: string;
    type: string;
  }) {
    return (
      input.assignments.length === 1 &&
      input.assignments[0].personId === input.targetPersonId &&
      input.assignments[0].identityId === input.identityId &&
      input.assignments[0].type === input.type
    );
  }

  private async removeStaleSpaceFaceAssignments(input: {
    spaceId: string;
    faceId: string;
    assignments: SpaceFaceAssignment[];
    recountPersonIds: Set<string>;
    stalePersonIds: Set<string>;
  }) {
    if (input.assignments.length === 0) {
      return;
    }

    const removedPersonIds = await this.sharedSpaceRepository.removePersonFaceAssignmentsForSpaceFace(
      input.spaceId,
      input.faceId,
    );
    for (const personId of removedPersonIds) {
      input.recountPersonIds.add(personId);
      input.stalePersonIds.add(personId);
    }
  }
```

- [ ] **Step 6: Update `processSpaceFaceMatch` for identity-backed human faces**

In `server/src/services/shared-space.service.ts`, replace the top of the human face loop with this structure:

```ts
    const recountPersonIds = new Set<string>();
    const stalePersonIds = new Set<string>();

    const faces = await this.sharedSpaceRepository.getAssetFacesForMatching(assetId);
    for (const face of faces) {
      const assignments = await this.sharedSpaceRepository.getPersonFaceAssignmentsForSpace(face.id, spaceId);

      // Strict gate: only faces native recognition has already assigned to a global
      // person are eligible to join a space-person. This guarantees every face in a
      // space-person belongs to a density-validated native cluster and eliminates the
      // single-face chaining bug reported in #272.
      if (!face.personId) {
        continue;
      }

      if (face.identityId === null) {
        continue;
      }

      let spacePerson: SpacePersonMatchResult | undefined;
      if (face.identityId) {
        const type = face.type ?? 'person';
        spacePerson = await this.resolveIdentitySpacePersonForFace({
          spaceId,
          faceId: face.id,
          personId: face.personId,
          identityId: face.identityId,
          type,
        });

        if (!spacePerson) {
          await this.removeStaleSpaceFaceAssignments({
            spaceId,
            faceId: face.id,
            assignments,
            recountPersonIds,
            stalePersonIds,
          });
          continue;
        }

        if (
          this.isCorrectSpaceFaceAssignment({
            assignments,
            targetPersonId: spacePerson.id,
            identityId: face.identityId,
            type,
          })
        ) {
          continue;
        }

        await this.removeStaleSpaceFaceAssignments({
          spaceId,
          faceId: face.id,
          assignments,
          recountPersonIds,
          stalePersonIds,
        });
      } else {
        if (assignments.length > 0) {
          continue;
        }
        if (!face.embedding) {
          continue;
        }
        if (maxDistance === undefined) {
          const { machineLearning } = await this.getConfig({ withCache: true });
          maxDistance = machineLearning.facialRecognition.maxDistance;
        }
        spacePerson = await this.findOrCreateSpacePersonForLegacyFace({
          spaceId,
          faceId: face.id,
          personId: face.personId,
          embedding: face.embedding,
          maxDistance,
        });
      }

      await this.sharedSpaceRepository.addPersonFaces([{ personId: spacePerson.id, assetFaceId: face.id }], {
        skipRecount: true,
      });
```

Keep the existing inherited metadata block immediately after this insertion, then record the current target for recounting and reconciliation:

```ts
recountPersonIds.add(spacePerson.id);
affectedPersonIds.add(spacePerson.id);
```

- [ ] **Step 7: Update pet face matching to use the same selected-space assignment check**

In `server/src/services/shared-space.service.ts`, replace the start of the pet face loop with:

```ts
    const petFaces = await this.sharedSpaceRepository.getPetFacesForAsset(assetId);
    for (const petFace of petFaces) {
      const assignments = await this.sharedSpaceRepository.getPersonFaceAssignmentsForSpace(petFace.id, spaceId);

      if (!petFace.personId) {
        continue;
      }

      let spacePerson: SpacePersonMatchResult | undefined;
      if (petFace.identityId) {
        spacePerson = await this.resolveIdentitySpacePersonForFace({
          spaceId,
          faceId: petFace.id,
          personId: petFace.personId,
          identityId: petFace.identityId,
          type: 'pet',
        });

        if (!spacePerson) {
          await this.removeStaleSpaceFaceAssignments({
            spaceId,
            faceId: petFace.id,
            assignments,
            recountPersonIds,
            stalePersonIds,
          });
          continue;
        }

        if (
          this.isCorrectSpaceFaceAssignment({
            assignments,
            targetPersonId: spacePerson.id,
            identityId: petFace.identityId,
            type: 'pet',
          })
        ) {
          continue;
        }

        await this.removeStaleSpaceFaceAssignments({
          spaceId,
          faceId: petFace.id,
          assignments,
          recountPersonIds,
          stalePersonIds,
        });
      } else {
        if (assignments.length > 0) {
          continue;
        }
        const existingSpacePerson = await this.sharedSpaceRepository.findSpacePersonByLinkedPersonId(
          spaceId,
          petFace.personId,
        );
        const representativeFaceId = existingSpacePerson
          ? petFace.id
          : await this.getNewSpacePersonRepresentativeFaceId({
              spaceId,
              fallbackFaceId: petFace.id,
              personalPersonId: petFace.personId,
            });
        spacePerson =
          existingSpacePerson ??
          (await this.sharedSpaceRepository.createPerson({
            spaceId,
            name: '',
            representativeFaceId,
            type: 'pet',
          }));
      }
```

Keep the existing `addPersonFaces` and metadata inheritance block after this replacement, then record the current target for recounting and reconciliation:

```ts
recountPersonIds.add(spacePerson.id);
affectedPersonIds.add(spacePerson.id);
```

- [ ] **Step 8: Delete stale orphans after recount**

In `processSpaceFaceMatch`, replace the final recount block with:

```ts
if (recountPersonIds.size > 0) {
  await this.sharedSpaceRepository.recountPersons([...recountPersonIds]);
}
if (stalePersonIds.size > 0) {
  await this.sharedSpaceRepository.deleteOrphanedPersonsByIds(spaceId, [...stalePersonIds]);
}
return [...affectedPersonIds];
```

- [ ] **Step 9: Remove the now-duplicated identity create helper body**

In `findOrCreateSpacePersonForFace`, replace the body with a compatibility wrapper:

```ts
const spacePerson = await this.resolveIdentitySpacePersonForFace(input);
if (!spacePerson) {
  throw new Error(`Identity ${input.identityId} in space ${input.spaceId} has incompatible type`);
}
return spacePerson;
```

This keeps any remaining callers type-safe while the new loop uses the non-throwing helper.

- [ ] **Step 10: Run service repair tests to verify green**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/services/shared-space.service.spec.ts -t "stale selected-space|already correct identity-backed|missing selected-space|wrong identity|type-incompatible"
```

Expected: PASS.

- [ ] **Step 11: Run adjacent face-match unit suite**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/services/shared-space.service.spec.ts -t "handleSharedSpaceFaceMatch|handleSharedSpaceLibraryFaceSync"
```

Expected: PASS. If legacy tests fail because they still expect `isPersonFaceAssigned`, update assertions to the new selected-space assignment method while preserving the legacy no-op behavior for faces without identity links.

- [ ] **Step 12: Run real DB integration spec to verify green**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/services/shared-space-face-identity-repair.spec.ts
```

Expected: PASS.

- [ ] **Step 13: Commit Task 4**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts server/test/medium/specs/services/shared-space-face-identity-repair.spec.ts
git commit -m "fix: repair stale space face identity links"
```

---

## Task 5: Add Scope Boundary And Cross-User Edge Coverage

**Files:**

- Modify `server/test/medium/specs/repositories/shared-space.repository.spec.ts`.
- Modify `server/test/medium/specs/repositories/face-identity.repository.spec.ts`.
- Modify `server/test/medium/specs/services/shared-space-face-identity-repair.spec.ts`.

- [ ] **Step 1: Add selected-space scope boundary tests**

In `server/test/medium/specs/repositories/shared-space.repository.spec.ts`, add these tests to `describe('getPeopleFaceStatisticsBySpaceId')`:

```ts
it('getPeopleFaceStatisticsBySpaceId includes archived linked-library faces while global scope can differ', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { library } = await ctx.newLibrary({ ownerId: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
  const face = await createIdentityBackedFace(ctx, {
    ownerId: user.id,
    libraryId: library.id,
    visibility: AssetVisibility.Archive,
    name: 'Archived Alice',
  });
  const spacePerson = await createSpaceIdentityPerson(sut, {
    spaceId: space.id,
    identityId: face.identityId,
    representativeFaceId: face.assetFace.id,
    name: 'Archived Alice',
  });
  await sut.addPersonFaces([{ personId: spacePerson.id, assetFaceId: face.assetFace.id }], { skipRecount: true });

  expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }), {
    detectedFaceCount: 1,
    assignedVisibleFaceCount: 1,
    namedVisiblePersonCount: 1,
    assignedHiddenFaceCount: 0,
    unassignedFaceCount: 0,
  });
});

it('getPeopleFaceStatisticsBySpaceId still counts a linked library when a member hides the space from global timeline', async () => {
  const { ctx, sut } = setup();
  const { user: owner } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: owner.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'owner' });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: 'viewer' });
  await ctx.database
    .updateTable('shared_space_member')
    .set({ showInTimeline: false })
    .where('spaceId', '=', space.id)
    .where('userId', '=', member.id)
    .execute();
  const { library } = await ctx.newLibrary({ ownerId: owner.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: owner.id });
  const face = await createIdentityBackedFace(ctx, { ownerId: owner.id, libraryId: library.id, name: 'Alice' });
  const spacePerson = await createSpaceIdentityPerson(sut, {
    spaceId: space.id,
    identityId: face.identityId,
    representativeFaceId: face.assetFace.id,
    name: 'Alice',
  });
  await sut.addPersonFaces([{ personId: spacePerson.id, assetFaceId: face.assetFace.id }], { skipRecount: true });

  expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }), {
    detectedFaceCount: 1,
    assignedVisibleFaceCount: 1,
    namedVisiblePersonCount: 1,
    assignedHiddenFaceCount: 0,
    unassignedFaceCount: 0,
  });
});

it('getPeopleFaceStatisticsBySpaceId ignores assignments for an unlinked library', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { library } = await ctx.newLibrary({ ownerId: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
  const face = await createIdentityBackedFace(ctx, { ownerId: user.id, libraryId: library.id, name: 'Alice' });
  const spacePerson = await createSpaceIdentityPerson(sut, {
    spaceId: space.id,
    identityId: face.identityId,
    representativeFaceId: face.assetFace.id,
    name: 'Alice',
  });
  await sut.addPersonFaces([{ personId: spacePerson.id, assetFaceId: face.assetFace.id }], { skipRecount: true });

  await ctx.database
    .deleteFrom('shared_space_library')
    .where('spaceId', '=', space.id)
    .where('libraryId', '=', library.id)
    .execute();

  expectStats(await sut.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }), {
    detectedFaceCount: 0,
    assignedVisibleFaceCount: 0,
    namedVisiblePersonCount: 0,
    assignedHiddenFaceCount: 0,
    unassignedFaceCount: 0,
  });
});

it('getPeopleFaceStatisticsBySpaceId keeps two spaces linking the same library isolated', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space: space1 } = await ctx.newSharedSpace({ createdById: user.id });
  const { space: space2 } = await ctx.newSharedSpace({ createdById: user.id });
  const { library } = await ctx.newLibrary({ ownerId: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space1.id, libraryId: library.id, addedById: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space2.id, libraryId: library.id, addedById: user.id });
  const face = await createIdentityBackedFace(ctx, { ownerId: user.id, libraryId: library.id, name: 'Alice' });
  const space1Person = await createSpaceIdentityPerson(sut, {
    spaceId: space1.id,
    identityId: face.identityId,
    representativeFaceId: face.assetFace.id,
    name: 'Alice',
  });
  const space2Person = await createSpaceIdentityPerson(sut, {
    spaceId: space2.id,
    identityId: face.identityId,
    representativeFaceId: face.assetFace.id,
    name: 'Alice',
  });
  await sut.addPersonFaces(
    [
      { personId: space1Person.id, assetFaceId: face.assetFace.id },
      { personId: space2Person.id, assetFaceId: face.assetFace.id },
    ],
    { skipRecount: true },
  );

  await expect(sut.getPersonFaceAssignmentsForSpace(face.assetFace.id, space1.id)).resolves.toEqual([
    { personId: space1Person.id, identityId: face.identityId, type: 'person' },
  ]);
  await expect(sut.getPersonFaceAssignmentsForSpace(face.assetFace.id, space2.id)).resolves.toEqual([
    { personId: space2Person.id, identityId: face.identityId, type: 'person' },
  ]);
});
```

- [ ] **Step 2: Add relink rebuild service test**

In `server/test/medium/specs/services/shared-space-face-identity-repair.spec.ts`, add this test to the existing `describe('SharedSpaceService linked-library face identity repair')` block:

```ts
it('relinking a library rebuilds identity-backed assignments through library sync', async () => {
  const { ctx, sut, faceIdentityRepository, sharedSpaceRepository } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
  const { library } = await ctx.newLibrary({ ownerId: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
  const face = await createIdentityFace(ctx, faceIdentityRepository, {
    ownerId: user.id,
    libraryId: library.id,
    name: 'Alice',
  });

  await expect(sut.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library.id })).resolves.toBe(
    JobStatus.Success,
  );
  await ctx.database
    .deleteFrom('shared_space_library')
    .where('spaceId', '=', space.id)
    .where('libraryId', '=', library.id)
    .execute();
  await sharedSpaceRepository.removePersonFacesByLibrary(space.id, library.id);
  await sharedSpaceRepository.deleteOrphanedPersons(space.id);
  await expect(
    sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }),
  ).resolves.toMatchObject({
    detectedFaceCount: 0,
    assignedVisibleFaceCount: 0,
    unassignedFaceCount: 0,
  });

  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
  await expect(sut.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library.id })).resolves.toBe(
    JobStatus.Success,
  );

  const rebuiltPerson = await ctx.database
    .selectFrom('shared_space_person')
    .selectAll()
    .where('spaceId', '=', space.id)
    .where('identityId', '=', face.identity.id)
    .executeTakeFirstOrThrow();
  await expect(sharedSpaceRepository.getPersonFaceAssignmentsForSpace(face.assetFace.id, space.id)).resolves.toEqual([
    { personId: rebuiltPerson.id, identityId: face.identity.id, type: 'person' },
  ]);
  await expect(
    sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(space.id, { minimumFaceCount: 1 }),
  ).resolves.toMatchObject({
    detectedFaceCount: 1,
    assignedVisibleFaceCount: 1,
    unassignedFaceCount: 0,
  });
});
```

- [ ] **Step 3: Add global cross-user access test**

In `server/test/medium/specs/repositories/face-identity.repository.spec.ts`, add:

```ts
it('includes multiple linked-library owners for a member and excludes strangers', async () => {
  const { ctx, sut } = setup();
  const { user: ownerA } = await ctx.newUser();
  const { user: ownerB } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { user: stranger } = await ctx.newUser();
  try {
    const { space } = await ctx.newSharedSpace({ createdById: ownerA.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: ownerA.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: ownerB.id, role: SharedSpaceRole.Editor });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const { library: libraryA } = await ctx.newLibrary({ ownerId: ownerA.id });
    const { library: libraryB } = await ctx.newLibrary({ ownerId: ownerB.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: libraryA.id, addedById: ownerA.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: libraryB.id, addedById: ownerB.id });
    await newLibraryIdentityFace(ctx, sut, { ownerId: ownerA.id, libraryId: libraryA.id, name: 'Owner A' });
    await newLibraryIdentityFace(ctx, sut, { ownerId: ownerB.id, libraryId: libraryB.id, name: 'Owner B' });

    await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toMatchObject({
      detectedFaceCount: 2,
      assignedVisibleFaceCount: 2,
      unassignedFaceCount: 0,
    });
    await expect(sut.getAccessiblePeopleFaceStatistics(stranger.id, { minimumFaceCount: 1 })).resolves.toEqual({
      detectedFaceCount: 0,
      assignedVisibleFaceCount: 0,
      namedVisiblePersonCount: 0,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
  } finally {
    await ctx.database.deleteFrom('user').where('id', 'in', [ownerA.id, ownerB.id, member.id, stranger.id]).execute();
  }
});
```

- [ ] **Step 4: Run scope tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/shared-space.repository.spec.ts test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/services/shared-space-face-identity-repair.spec.ts -t "archived linked-library|hides the space from global timeline|unlinked library|same library isolated|relinking a library|multiple linked-library owners"
```

Expected: PASS. If a scope expectation fails, decide whether the code or the assertion conflicts with the documented product behavior before changing production SQL.

- [ ] **Step 5: Commit Task 5**

```bash
git add server/test/medium/specs/repositories/shared-space.repository.spec.ts server/test/medium/specs/repositories/face-identity.repository.spec.ts server/test/medium/specs/services/shared-space-face-identity-repair.spec.ts
git commit -m "test: cover linked-library people scope boundaries"
```

---

## Task 6: Update Developer Documentation

**Files:**

- Modify `docs/docs/developer/face-identity-backfill.md`.

- [ ] **Step 1: Add linked-library repair documentation**

In `docs/docs/developer/face-identity-backfill.md`, add this section after `## Identity Link Trigger`:

```md
## Shared Space Face Link Repair

Global People and Space People do not read the same assignment table. Global People uses `face_identity_face` links in the viewer's accessible timeline scope. A selected Shared Space uses `shared_space_person_face` links for the selected space's direct assets and linked-library assets.

When an identity-backed face is processed by `SharedSpaceFaceMatch`, `SharedSpaceLibraryFaceSync`, or `SharedSpaceFaceMatchAll`, Gallery repairs the selected-space face link if it is missing, points at a space person with no identity, points at a different identity, or points at a type-incompatible space person. The repair deletes only the selected face's selected-space assignment rows, inserts the identity-correct assignment when a compatible space person exists or can be created, recounts affected space people, and removes stale selected-space people that became orphaned.

The repair is intentionally selected-space scoped. The same asset face can be linked into multiple spaces, and repairing one space must not rewrite another space's person rows.

For existing drift, queue `SharedSpaceFaceMatchAll` for the affected space. The existing operator route is to toggle face recognition off and back on for that space; enabling face recognition queues the full-space rematch. Linking or relinking an external library queues `SharedSpaceLibraryFaceSync` for that library, and adding individual assets queues `SharedSpaceFaceMatch` for those assets.

Archived assets are a known scope difference. Selected Space People currently counts linked-library assets whose visibility is archive or timeline, while Global People uses timeline-visible assets. Matching detected-face totals are only expected when the compared scopes have the same visibility and membership rules.
```

- [ ] **Step 2: Run docs format check**

Run:

```bash
pnpm --dir docs prettier --check docs/developer/face-identity-backfill.md
```

Expected: PASS.

- [ ] **Step 3: Commit Task 6**

```bash
git add docs/docs/developer/face-identity-backfill.md
git commit -m "docs: document shared-space face link repair"
```

---

## Task 7: Refresh Generated SQL Snapshots

**Files:**

- Modify `server/src/queries/shared.space.repository.sql`.

- [ ] **Step 1: Build server before SQL snapshot generation**

Run:

```bash
pnpm --dir server build
```

Expected: PASS.

- [ ] **Step 2: Generate SQL snapshots**

Run:

```bash
pnpm --dir server sync:sql
```

Expected: `server/src/queries/shared.space.repository.sql` is updated with SQL for `getPersonFaceAssignmentsForSpace`, `removePersonFaceAssignmentsForSpaceFace`, and `deleteOrphanedPersonsByIds`.

- [ ] **Step 3: Inspect generated SQL diff**

Run:

```bash
git diff -- server/src/queries/shared.space.repository.sql
```

Expected: diff contains only new or updated `SharedSpaceRepository` generated SQL blocks for methods changed in this plan.

- [ ] **Step 4: Commit Task 7**

```bash
git add server/src/queries/shared.space.repository.sql
git commit -m "chore: refresh shared-space repository SQL"
```

---

## Task 8: Final Verification

**Files:**

- No intended file edits.

- [ ] **Step 1: Run focused service unit tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/services/shared-space.service.spec.ts -t "handleSharedSpaceFaceMatch|handleSharedSpaceLibraryFaceSync"
```

Expected: PASS.

- [ ] **Step 2: Run focused medium repository tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/shared-space.repository.spec.ts test/medium/specs/repositories/face-identity.repository.spec.ts -t "getPeopleFaceStatisticsBySpaceId|getAccessiblePeopleFaceStatistics|selected-space face assignment repair helpers|linked-library"
```

Expected: PASS.

- [ ] **Step 3: Run medium service integration tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/services/shared-space-face-identity-repair.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Run type check**

Run:

```bash
pnpm --dir server check
```

Expected: PASS.

- [ ] **Step 5: Run final diff review**

Run:

```bash
git diff --stat HEAD~8..HEAD
git diff HEAD~8..HEAD -- server/src/services/shared-space.service.ts server/src/repositories/shared-space.repository.ts docs/docs/developer/face-identity-backfill.md
```

Expected:

- Production changes are limited to shared-space repository and service repair logic.
- Test changes cover multiple linked libraries, stale assignment repair, missing assignment repair, wrong identity repair, type mismatch, scope boundaries, and real DB job paths.
- Documentation explains global-vs-space backing tables, repair triggers, and archive scope differences.

- [ ] **Step 6: Report verification evidence**

In the final handoff, list the exact commands run and whether each passed. Include any command that could not be run and the reason.
