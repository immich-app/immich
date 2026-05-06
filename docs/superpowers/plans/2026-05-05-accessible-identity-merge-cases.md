# Accessible Identity Merge Cases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement strict identity reconciliation so shared-space access, uploads, same-space dedup, and mixed manual merges produce one accessible visible identity without leaking inaccessible assets.

**Architecture:** Add a facial-recognition queue job for shared-space identity reconciliation. The job compares explicit space people against a member's local people, merges only one clear compatible candidate, and skips ambiguity or same-scope conflicts. Keep physical row merges for personal-to-person and same-space space-person-to-space-person, and use scoped identity repair for mixed profile merges.

**Tech Stack:** NestJS services and repositories, BullMQ job names, Kysely repositories, Vitest unit/medium tests, Svelte component tests with Testing Library.

---

## Reference

Spec: `docs/superpowers/specs/2026-05-05-accessible-identity-merge-cases-design.md`

Existing core files:

- `server/src/services/shared-space.service.ts`: shared-space membership, face matching, dedup, metadata backfill jobs.
- `server/src/services/person.service.ts`: personal recognition and scoped identity repair.
- `server/src/repositories/face-identity.repository.ts`: identity creation, scoped repair resolution, identity merge.
- `server/src/repositories/shared-space.repository.ts`: space people, face evidence, shared-space members.
- `server/src/repositories/search.repository.ts`: owner-local face embedding search.
- `server/src/types.ts`: job payload types.
- `server/src/enum.ts`: `JobName`.
- `server/src/repositories/job.repository.ts`: BullMQ job ids and dedup options.
- `web/src/lib/modals/PersonMergeSuggestionModal.svelte`: remaining modal path that uses legacy personal merge.
- `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`: existing scoped merge logic for personal detail page.
- `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`: existing scoped merge logic for space person detail page.

---

## Coverage Matrix

The implementation must preserve existing regression coverage and add the missing cases below.

Existing tests to keep green:

- `server/src/services/person.service.spec.ts`
  - `should merge a newly created person identity into an accessible shared identity match`
  - `should create and merge a local person from accessible shared-space evidence even when owner search only finds itself`
  - `should not create a local person from inaccessible shared-space evidence after access is removed`
  - `should keep resolving a local person after shared-space access is removed`
  - `should stop resolving a shared-space profile id after shared-space access is removed`
- `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts`
  - `uses same-person repair when merging a personal person with a space-primary candidate`
  - `loads the global person timeline with shared-space assets included`
  - `uses the shared-space thumbnail for a space-primary identity-wide person page`
- `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts`
  - `uses same-person repair for a space person merged with a personal candidate`
- `server/test/medium/specs/services/people-identity-rbac.spec.ts`
  - Existing timeline-disabled, scoped-token, filter suggestion, search suggestion, and cross-scope repair tests.

New tests required by this plan:

- Personal upload after shared access merges an existing local matched profile into the strict accessible shared identity.
- Personal upload accessible-identity matching returns no automatic candidate when two accessible shared identities are within threshold.
- Personal upload accessible-identity matching ignores timeline-disabled spaces, while explicit space pages still resolve those people.
- Add-member reconciliation after both users already have local profiles.
- New space evidence reconciliation after both users are already members.
- Strict skip behavior for ambiguous matches, hidden profiles, type mismatches, same-scope conflicts, and two space people claiming the same local candidate in one pass.
- Reconciliation idempotency after a previous merge.
- Concurrent reconciliation for the same identity pair is safe and leaves one visible identity.
- Same-space physical dedup for identity-backed space people.
- Mixed merge modal fallback that still uses legacy personal merge for personal-only profiles.
- Medium lifecycle tests for member leave, rejoin, `showInTimeline` disable/enable, asset removal, and stale face evidence.
- Repository preflight tests for same-owner and same-space merge conflicts.

---

## File Structure

Modify:

- `server/src/services/person.service.ts`
  - Merge existing local upload matches into strict accessible shared identities after the local identity is known.
- `server/src/services/person.service.spec.ts`
  - Replace the obsolete existing-local no-merge expectation with strict merge coverage.
- `server/src/enum.ts`
  - Add `JobName.SharedSpaceIdentityReconciliation`.
- `server/src/types.ts`
  - Add `ISharedSpaceIdentityReconciliationJob`.
  - Add the job payload to `JobItem`.
- `server/src/repositories/job.repository.ts`
  - Add deterministic `jobId` for reconciliation jobs.
- `server/src/repositories/face-identity.repository.ts`
  - Extract merge-conflict counting so automatic reconciliation can preflight strict merges before moving face links.
- `server/src/services/shared-space.service.ts`
  - Queue reconciliation on member join and new space evidence.
  - Add job handler and strict reconciliation helpers.
  - Update same-space dedup to include identity-backed space people by physically merging space profiles before identity merge.
- `server/src/services/shared-space.service.spec.ts`
  - Add TDD unit tests for queueing, strict matching, ambiguity, hidden/type conflicts, idempotency, new evidence, and identity-backed dedup.
- `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
  - Add tests for strict accessible identity matching and conflict preflight semantics.
- `server/test/medium/specs/services/people-identity-rbac.spec.ts`
  - Add service-level coverage for `/people` identity grouping and access contraction.
- `web/src/lib/utils/scoped-person-ref.ts`
  - Add shared conversion helpers for personal and space primary profiles.
- `web/src/lib/modals/PersonMergeSuggestionModal.svelte`
  - Use `mergeScopedPeople` when either side resolves to a space-person scoped profile.
- `web/src/lib/modals/person-merge-suggestion-modal.spec.ts`
  - Add modal tests for personal-only and mixed profile merge calls.
- Existing page files should reuse `scoped-person-ref.ts` after modal behavior is green.

Do not modify generated SDK files manually.

---

## Task 0: Baseline Regression Coverage Audit

**Files:**

- Test only: `server/src/services/person.service.spec.ts`
- Test only: `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts`
- Test only: `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts`
- Test only: `server/test/medium/specs/services/people-identity-rbac.spec.ts`

- [ ] **Step 1: Verify existing upload and access-loss regression tests**

Run:

```bash
pnpm --dir server test src/services/person.service.spec.ts -- --run -t "accessible shared identity|shared-space access is removed|accessible shared-space profile id|owner search only finds itself|inaccessible shared-space evidence"
```

Expected: PASS. These tests cover the already-fixed upload-after-access cases and local-profile survival after access is removed.

- [ ] **Step 2: Verify existing scoped merge page tests**

Run:

```bash
pnpm --dir web test 'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts' 'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts' -- --run -t "same-person repair|shared-space thumbnail|shared-space assets"
```

Expected: PASS. These tests cover existing personal-detail and space-detail scoped merge behavior.

- [ ] **Step 3: Verify existing identity RBAC medium tests**

Run:

```bash
pnpm --dir server test:medium test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "timeline-disabled|identity-grouped scoped person tokens|global filter suggestions|global search suggestions|same-person repair"
```

Expected: PASS. These tests cover global access gates, scoped tokens, filter/search suggestions, and existing manual scoped repair.

- [ ] **Step 4: Stop on regression**

If any command in this task fails, fix that regression before starting Task 1. Do not add reconciliation production code on top of failing baseline coverage.

---

## Task 1: Tighten Personal Upload Accessible Identity Merging

**Files:**

- Modify: `server/src/services/person.service.spec.ts`
- Modify: `server/src/services/person.service.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`
- Test: `server/test/medium/specs/repositories/face-identity.repository.spec.ts`

- [ ] **Step 1: Replace the obsolete existing-local no-merge test with a RED merge test**

In `server/src/services/person.service.spec.ts`, replace the test named `should not merge an existing matched person identity into an accessible shared identity` with:

```ts
it('should merge an existing matched local person identity into an accessible shared identity', async () => {
  const asset = AssetFactory.create();
  const [noPerson, matchedFace] = [
    AssetFaceFactory.create({ assetId: asset.id }),
    AssetFaceFactory.from().person().build(),
  ];
  const faces = [
    { ...noPerson, distance: 0 },
    { ...matchedFace, distance: 0.2 },
  ] as FaceSearchResult[];
  const sourceIdentityId = 'source-identity';
  const targetIdentityId = 'target-identity';

  mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } });
  mocks.search.searchFaces.mockResolvedValue(faces);
  mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(noPerson, asset));
  mocks.faceIdentity.ensurePersonIdentity.mockResolvedValue({ id: sourceIdentityId } as any);
  (mocks.faceIdentity as any).findClosestAccessibleIdentityForFace.mockResolvedValue({
    identityId: targetIdentityId,
    distance: 0.2,
  });
  mocks.faceIdentity.mergeIdentities.mockResolvedValue({
    personalProfileConflictCount: 0,
    spaceProfileConflictCount: 0,
  });

  await sut.handleRecognizeFaces({ id: noPerson.id });

  expect((mocks.faceIdentity as any).findClosestAccessibleIdentityForFace).toHaveBeenCalledWith({
    userId: asset.ownerId,
    embedding: '[1, 2, 3, 4]',
    maxDistance: 0.5,
    type: 'person',
    excludeIdentityId: sourceIdentityId,
  });
  expect(mocks.faceIdentity.mergeIdentities).toHaveBeenCalledWith({
    targetIdentityId,
    sourceIdentityIds: [sourceIdentityId],
    source: 'shared-space-evidence',
  });
});
```

Keep the existing `should not merge an already assigned person identity into an accessible shared identity` test unchanged. That test covers a re-run for a face that already entered the job with `personId`; join/rejoin reconciliation covers old assigned local profiles.

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
pnpm --dir server test src/services/person.service.spec.ts -- --run -t "should merge an existing matched local person identity into an accessible shared identity"
```

Expected: FAIL because `handleRecognizeFaces` only calls `mergeWithAccessibleSharedIdentity` when the backing local person was newly created in the same recognition job.

- [ ] **Step 3: Add RED repository tests for strict accessible identity matching**

In `server/test/medium/specs/repositories/face-identity.repository.spec.ts`, import `AssetVisibility` and `newEmbedding` if they are not already imported:

```ts
import { AssetVisibility, SharedSpaceRole } from 'src/enum';
import { newEmbedding } from 'test/small.factory';
```

Add this helper inside the `describe(FaceIdentityRepository.name, () => { ... })` block:

```ts
const createAccessibleSpaceIdentity = async (
  ctx: ReturnType<typeof setup>['ctx'],
  sut: FaceIdentityRepository,
  input: { memberUserId: string; ownerUserId: string; showInTimeline?: boolean; embedding: string },
) => {
  const { space } = await ctx.newSharedSpace({ createdById: input.ownerUserId, faceRecognitionEnabled: true });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: input.ownerUserId, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: input.memberUserId, role: SharedSpaceRole.Viewer });
  await ctx.database
    .updateTable('shared_space_member')
    .set({ showInTimeline: input.showInTimeline ?? true })
    .where('spaceId', '=', space.id)
    .where('userId', '=', input.memberUserId)
    .execute();
  const { person } = await ctx.newPerson({ ownerId: input.ownerUserId });
  const identity = await sut.ensurePersonIdentity(person.id);
  const { asset } = await ctx.newAsset({ ownerId: input.ownerUserId, visibility: AssetVisibility.Timeline });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: input.ownerUserId });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  await ctx.database.insertInto('face_search').values({ faceId: assetFace.id, embedding: input.embedding }).execute();
  await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
  const spacePerson = await ctx.database
    .insertInto('shared_space_person')
    .values({
      spaceId: space.id,
      identityId: identity.id,
      representativeFaceId: assetFace.id,
      type: 'person',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  await linkSpaceFace(ctx, spacePerson.id, assetFace.id);

  return { space, spacePerson, identity };
};
```

Then add:

```ts
it('returns no accessible identity match when multiple shared identities are within threshold', async () => {
  const { ctx, sut } = setup();
  const { user: member } = await ctx.newUser();
  const { user: ownerA } = await ctx.newUser();
  const { user: ownerB } = await ctx.newUser();
  const embedding = newEmbedding();
  try {
    await createAccessibleSpaceIdentity(ctx, sut, {
      memberUserId: member.id,
      ownerUserId: ownerA.id,
      embedding,
    });
    await createAccessibleSpaceIdentity(ctx, sut, {
      memberUserId: member.id,
      ownerUserId: ownerB.id,
      embedding,
    });

    await expect(
      sut.findClosestAccessibleIdentityForFace({
        userId: member.id,
        embedding,
        maxDistance: 0.5,
        type: 'person',
        excludeIdentityId: null,
      }),
    ).resolves.toBeUndefined();
  } finally {
    await ctx.database.deleteFrom('user').where('id', 'in', [member.id, ownerA.id, ownerB.id]).execute();
  }
});

it('does not use timeline-disabled spaces for global accessible identity matching', async () => {
  const { ctx, sut } = setup();
  const { user: member } = await ctx.newUser();
  const { user: owner } = await ctx.newUser();
  const embedding = newEmbedding();
  try {
    await createAccessibleSpaceIdentity(ctx, sut, {
      memberUserId: member.id,
      ownerUserId: owner.id,
      showInTimeline: false,
      embedding,
    });

    await expect(
      sut.findClosestAccessibleIdentityForFace({
        userId: member.id,
        embedding,
        maxDistance: 0.5,
        type: 'person',
        excludeIdentityId: null,
      }),
    ).resolves.toBeUndefined();
  } finally {
    await ctx.database.deleteFrom('user').where('id', 'in', [member.id, owner.id]).execute();
  }
});
```

- [ ] **Step 4: Run repository tests to verify RED**

Run:

```bash
pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts -- --run -t "accessible identity match"
```

Expected: the ambiguous-match test FAILS because `findClosestAccessibleIdentityForFace` currently orders by distance and returns one row with `LIMIT 1`.

- [ ] **Step 5: Implement strict accessible matching**

In `server/src/repositories/face-identity.repository.ts`, change `findClosestAccessibleIdentityForFace` to search enough rows to detect ambiguity:

```ts
        SELECT "identityId", type, distance
        FROM identity_matches
        WHERE distance <= ${input.maxDistance}
        ORDER BY distance
        LIMIT 2
      `.execute(trx);

      return result.rows.length === 1 ? result.rows[0] : undefined;
```

Do not change the existing access predicates: the `shared_space_member."showInTimeline" = true`, hidden-profile, visibility, type, owner-conflict, and same-space source-conflict predicates are required for personal-upload scope.

- [ ] **Step 6: Merge existing local upload matches after the source identity is known**

In `server/src/services/person.service.ts`, keep the early accessible match lookup for the no-local-person path, then remove the `personId === createdPersonId` guard around the final merge:

```ts
const accessibleIdentityMatch = personId
  ? undefined
  : await this.findClosestAccessibleSharedIdentity({
      userId: face.asset.ownerId,
      embedding: face.faceSearch.embedding,
      maxDistance: machineLearning.facialRecognition.maxDistance,
    });
```

Replace the final assignment block with:

```ts
if (personId) {
  this.logger.debug(`Assigning face ${id} to person ${personId}`);
  await this.personRepository.reassignFaces({ faceIds: [id], newPersonId: personId });
  const sourceIdentityId = await this.replaceFaceIdentity(personId, id, 'owner-person');
  await this.mergeWithAccessibleSharedIdentity({
    userId: face.asset.ownerId,
    embedding: face.faceSearch.embedding,
    maxDistance: machineLearning.facialRecognition.maxDistance,
    sourceIdentityId,
    match: personId === createdPersonId ? accessibleIdentityMatch : undefined,
  });
}
```

This keeps the no-local-profile optimization while making the existing-local-profile path query strict accessible shared identities with `excludeIdentityId` after `replaceFaceIdentity` returns the source identity id.

- [ ] **Step 7: Run focused tests to verify GREEN**

Run:

```bash
pnpm --dir server test src/services/person.service.spec.ts -- --run -t "accessible shared identity"
pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts -- --run -t "accessible identity match"
```

Expected: both commands PASS. The old existing-local no-merge behavior must no longer exist; the old already-assigned no-merge test still passes.

- [ ] **Step 8: Commit**

```bash
git add server/src/services/person.service.ts server/src/services/person.service.spec.ts server/src/repositories/face-identity.repository.ts server/test/medium/specs/repositories/face-identity.repository.spec.ts
git commit -m "fix: merge existing local uploads with accessible identities"
```

---

## Task 2: Add Reconciliation Job Wiring

**Files:**

- Modify: `server/src/enum.ts`
- Modify: `server/src/types.ts`
- Modify: `server/src/repositories/job.repository.ts`
- Modify: `server/src/services/shared-space.service.ts`
- Test: `server/src/services/shared-space.service.spec.ts`

- [ ] **Step 1: Write the failing add-member queue test**

Add this test inside `describe('addMember')` in `server/src/services/shared-space.service.spec.ts`:

```ts
it('should queue identity reconciliation for the joined member', async () => {
  const auth = factory.auth();
  const spaceId = 'space-1';
  const userId = 'new-user';

  mocks.sharedSpace.getMember.mockResolvedValueOnce(makeMemberResult({ role: SharedSpaceRole.Owner }));
  mocks.sharedSpace.getMember.mockResolvedValueOnce(void 0);
  mocks.sharedSpace.addMember.mockResolvedValue(factory.sharedSpaceMember({ spaceId, userId }));
  mocks.sharedSpace.getMember.mockResolvedValueOnce(makeMemberResult({ spaceId, userId }));
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  await sut.addMember(auth, spaceId, { userId });

  expect(mocks.job.queue).toHaveBeenCalledWith({
    name: 'SharedSpaceIdentityReconciliation',
    data: { spaceId, userId },
  });
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "should queue identity reconciliation for the joined member"
```

Expected: FAIL because no matching reconciliation job is queued. Using the string literal keeps the RED test compiling before the enum member exists.

- [ ] **Step 3: Add the job name and payload type**

In `server/src/enum.ts`, add the new job beside the existing shared-space face recognition jobs:

```ts
SharedSpaceIdentityReconciliation = 'SharedSpaceIdentityReconciliation',
```

In `server/src/types.ts`, add:

```ts
export interface ISharedSpaceIdentityReconciliationJob extends IBaseJob {
  spaceId: string;
  userId?: string;
  spacePersonId?: string;
}
```

Then add the payload to the shared-space face recognition section of `JobItem`:

```ts
| { name: JobName.SharedSpaceIdentityReconciliation; data: ISharedSpaceIdentityReconciliationJob }
```

- [ ] **Step 4: Add BullMQ job deduplication**

In `server/src/repositories/job.repository.ts`, add a case in `getJobOptions`:

```ts
case JobName.SharedSpaceIdentityReconciliation: {
  const data = item.data as { spaceId: string; userId?: string; spacePersonId?: string };
  return {
    jobId: `space-identity-reconcile-${data.spaceId}-${data.userId ?? 'all-members'}-${data.spacePersonId ?? 'all-people'}`,
    removeOnFail: true,
  };
}
```

- [ ] **Step 5: Add queue helper and handler skeleton**

In `server/src/services/shared-space.service.ts`, add:

```ts
private async queueSpaceIdentityReconciliation(input: {
  spaceId: string;
  userId?: string;
  spacePersonId?: string;
}): Promise<void> {
  await this.jobRepository.queue({
    name: JobName.SharedSpaceIdentityReconciliation,
    data: input,
  });
}

@OnJob({ name: JobName.SharedSpaceIdentityReconciliation, queue: QueueName.FacialRecognition })
async handleSharedSpaceIdentityReconciliation(
  job: JobOf<JobName.SharedSpaceIdentityReconciliation>,
): Promise<JobStatus> {
  return this.reconcileSharedSpaceIdentities(job);
}

private async reconcileSharedSpaceIdentities(
  job: JobOf<JobName.SharedSpaceIdentityReconciliation>,
): Promise<JobStatus> {
  const space = await this.sharedSpaceRepository.getById(job.spaceId);
  if (!space || !space.faceRecognitionEnabled) {
    return JobStatus.Skipped;
  }

  return JobStatus.Success;
}
```

Call the helper in `addMember` after `queueSpacePersonMetadataBackfill()`:

```ts
await this.queueSpaceIdentityReconciliation({ spaceId, userId: dto.userId });
```

- [ ] **Step 6: Run the focused test to verify GREEN**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "should queue identity reconciliation for the joined member"
```

Expected: PASS.

- [ ] **Step 7: Run nearest suite**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "addMember"
```

Expected: all `addMember` tests pass.

- [ ] **Step 8: Commit**

```bash
git add server/src/enum.ts server/src/types.ts server/src/repositories/job.repository.ts server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: queue shared-space identity reconciliation"
```

---

## Task 3: Implement Strict Member Reconciliation

**Files:**

- Modify: `server/src/services/shared-space.service.ts`
- Modify: `server/src/services/shared-space.service.spec.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`
- Test: `server/src/services/shared-space.service.spec.ts`

- [ ] **Step 1: Write the failing strict merge test**

Add this test in a new `describe('handleSharedSpaceIdentityReconciliation')` block:

```ts
it('should merge one strict local member match into an accessible space identity', async () => {
  const space = factory.sharedSpace({ id: 'space-1', faceRecognitionEnabled: true });

  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId: space.id, userId: 'member-1' }));
  mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValue([
    {
      id: 'space-person-1',
      name: '',
      type: 'person',
      identityId: 'space-identity',
      isHidden: false,
      faceCount: 1,
      representativeFaceId: 'space-face-1',
      representativeFaceSource: 'auto',
      embedding: '[1,2,3]',
    },
  ]);
  mocks.search.searchFaces.mockResolvedValue([{ id: 'local-face-1', personId: 'local-person-1', distance: 0.2 }]);
  mocks.person.getById.mockResolvedValue(
    factory.person({ id: 'local-person-1', ownerId: 'member-1', type: 'person', isHidden: false }),
  );
  mocks.faceIdentity.ensurePersonIdentity.mockResolvedValue({ id: 'local-identity', type: 'person' } as any);
  (mocks.faceIdentity as any).getMergeConflicts = vi.fn().mockResolvedValue({
    personalProfileConflictCount: 0,
    spaceProfileConflictCount: 0,
  });

  await expect(sut.handleSharedSpaceIdentityReconciliation({ spaceId: space.id, userId: 'member-1' })).resolves.toBe(
    JobStatus.Success,
  );

  expect(mocks.search.searchFaces).toHaveBeenCalledWith(
    expect.objectContaining({
      userIds: ['member-1'],
      embedding: '[1,2,3]',
      hasPerson: true,
      numResults: 2,
    }),
  );
  expect(mocks.faceIdentity.mergeIdentities).toHaveBeenCalledWith({
    targetIdentityId: 'space-identity',
    sourceIdentityIds: ['local-identity'],
    source: 'shared-space-evidence',
  });
  expect(mocks.job.queue).toHaveBeenCalledWith({
    name: JobName.SharedSpacePersonMetadataBackfill,
    data: { identityId: 'space-identity' },
  });
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "should merge one strict local member match into an accessible space identity"
```

Expected: FAIL because the handler returns success without searching or merging.

- [ ] **Step 3: Write failing repository preflight tests**

Add these tests to `server/test/medium/specs/repositories/face-identity.repository.spec.ts`:

```ts
it('counts same-owner personal conflicts before identity merge', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  try {
    const { person: targetPerson } = await ctx.newPerson({ ownerId: user.id });
    const { person: sourcePerson } = await ctx.newPerson({ ownerId: user.id });
    const targetIdentity = await sut.ensurePersonIdentity(targetPerson.id);
    const sourceIdentity = await sut.ensurePersonIdentity(sourcePerson.id);

    await expect(
      (sut as any).getMergeConflicts({
        targetIdentityId: targetIdentity.id,
        sourceIdentityIds: [sourceIdentity.id],
      }),
    ).resolves.toEqual({ personalProfileConflictCount: 1, spaceProfileConflictCount: 0 });
  } finally {
    await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
  }
});

it('counts same-space profile conflicts before identity merge', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  try {
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
    const targetSpacePerson = await newSpacePerson(ctx, space.id);
    const sourceSpacePerson = await newSpacePerson(ctx, space.id);
    const targetIdentity = await sut.ensureSpacePersonIdentity(targetSpacePerson.id);
    const sourceIdentity = await sut.ensureSpacePersonIdentity(sourceSpacePerson.id);

    await expect(
      (sut as any).getMergeConflicts({
        targetIdentityId: targetIdentity.id,
        sourceIdentityIds: [sourceIdentity.id],
      }),
    ).resolves.toEqual({ personalProfileConflictCount: 0, spaceProfileConflictCount: 1 });
  } finally {
    await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
  }
});
```

- [ ] **Step 4: Run repository preflight tests to verify RED**

Run:

```bash
pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts -- --run -t "conflicts before identity merge"
```

Expected: FAIL because `getMergeConflicts` is not implemented.

- [ ] **Step 5: Add merge conflict preflight method**

In `server/src/repositories/face-identity.repository.ts`, extract the existing conflict queries from `mergeIdentities` into a transaction-aware private helper and public preflight method:

```ts
private async countMergeConflicts(
  db: Kysely<DB> | Transaction<DB>,
  input: {
    targetIdentityId: string;
    sourceIdentityIds: string[];
  },
): Promise<MergeIdentitiesResult> {
  const sourceIdentityIds = [...new Set(input.sourceIdentityIds)].filter((id) => id !== input.targetIdentityId);
  if (sourceIdentityIds.length === 0) {
    return { personalProfileConflictCount: 0, spaceProfileConflictCount: 0 };
  }

  const [personalConflicts, spaceConflicts] = await Promise.all([
    db
      .selectFrom('person as source_person')
      .innerJoin('person as target_person', (join) =>
        join
          .onRef('target_person.ownerId', '=', 'source_person.ownerId')
          .on('target_person.identityId', '=', input.targetIdentityId),
      )
      .select('source_person.id')
      .where('source_person.identityId', 'in', sourceIdentityIds)
      .execute(),
    db
      .selectFrom('shared_space_person as source_person')
      .innerJoin('shared_space_person as target_person', (join) =>
        join
          .onRef('target_person.spaceId', '=', 'source_person.spaceId')
          .on('target_person.identityId', '=', input.targetIdentityId),
      )
      .select('source_person.id')
      .where('source_person.identityId', 'in', sourceIdentityIds)
      .execute(),
  ]);

  return {
    personalProfileConflictCount: personalConflicts.length,
    spaceProfileConflictCount: spaceConflicts.length,
  };
}

async getMergeConflicts(input: {
  targetIdentityId: string;
  sourceIdentityIds: string[];
}): Promise<MergeIdentitiesResult> {
  return this.countMergeConflicts(this.db, input);
}
```

Update the Kysely import to include `Transaction`. Then update `mergeIdentities` inside its transaction:

```ts
const { personalProfileConflictCount, spaceProfileConflictCount } = await this.countMergeConflicts(trx, {
  targetIdentityId: input.targetIdentityId,
  sourceIdentityIds,
});
```

Use those counts in the returned `MergeIdentitiesResult`; do not keep duplicate conflict query blocks in `mergeIdentities`.

- [ ] **Step 6: Implement strict reconciliation helpers**

In `server/src/services/shared-space.service.ts`, add the helper type near the other local types, outside `SharedSpaceService`, then implement the service helpers:

```ts
type SharedSpaceIdentityReconciliationClaim = {
  spacePersonId: string;
  targetIdentityId: string;
  sourceIdentityId: string;
};

private async reconcileSharedSpaceIdentities(
  job: JobOf<JobName.SharedSpaceIdentityReconciliation>,
): Promise<JobStatus> {
  const space = await this.sharedSpaceRepository.getById(job.spaceId);
  if (!space || !space.faceRecognitionEnabled) {
    return JobStatus.Skipped;
  }

  const { machineLearning } = await this.getConfig({ withCache: true });
  const maxDistance = machineLearning.facialRecognition.maxDistance;

  const members = job.userId
    ? [await this.sharedSpaceRepository.getMember(job.spaceId, job.userId)].filter(Boolean)
    : await this.sharedSpaceRepository.getMembers(job.spaceId);

  const spacePeople = (await this.sharedSpaceRepository.getSpacePersonsWithEmbeddings(job.spaceId)).filter(
    (person) => (!job.spacePersonId || person.id === job.spacePersonId) && person.identityId && !person.isHidden,
  );

  for (const member of members) {
    const claims: SharedSpaceIdentityReconciliationClaim[] = [];
    for (const spacePerson of spacePeople) {
      const claim = await this.findStrictSpacePersonLocalIdentityClaim({
        memberUserId: member.userId,
        spacePerson,
        maxDistance,
      });
      if (claim) {
        claims.push(claim);
      }
    }

    for (const claim of this.filterUnambiguousReconciliationClaims(claims)) {
      await this.applySharedSpaceIdentityReconciliationClaim(claim);
    }
  }

  return JobStatus.Success;
}

private filterUnambiguousReconciliationClaims(
  claims: SharedSpaceIdentityReconciliationClaim[],
): SharedSpaceIdentityReconciliationClaim[] {
  const sourceCounts = new Map<string, number>();
  const targetCounts = new Map<string, number>();
  for (const claim of claims) {
    sourceCounts.set(claim.sourceIdentityId, (sourceCounts.get(claim.sourceIdentityId) ?? 0) + 1);
    targetCounts.set(claim.targetIdentityId, (targetCounts.get(claim.targetIdentityId) ?? 0) + 1);
  }

  return claims.filter(
    (claim) => sourceCounts.get(claim.sourceIdentityId) === 1 && targetCounts.get(claim.targetIdentityId) === 1,
  );
}

private async findStrictSpacePersonLocalIdentityClaim(input: {
  memberUserId: string;
  spacePerson: {
    id: string;
    identityId?: string | null;
    type: string;
    embedding: string;
    isHidden: boolean;
  };
  maxDistance: number;
}): Promise<SharedSpaceIdentityReconciliationClaim | undefined> {
  const targetIdentityId = input.spacePerson.identityId;
  if (!targetIdentityId || input.spacePerson.isHidden) {
    return;
  }

  const matches = await this.searchRepository.searchFaces({
    userIds: [input.memberUserId],
    embedding: input.spacePerson.embedding,
    maxDistance: input.maxDistance,
    numResults: 2,
    hasPerson: true,
  });

  const candidates: Array<{ identityId: string }> = [];
  for (const match of matches) {
    if (!match.personId) {
      continue;
    }

    const person = await this.personRepository.getById(match.personId);
    if (!person || person.isHidden || person.type !== input.spacePerson.type) {
      continue;
    }

    const identity = await this.faceIdentityRepository.ensurePersonIdentity(person.id);
    if (identity.id === targetIdentityId) {
      return;
    }

    candidates.push({ identityId: identity.id });
  }

  if (candidates.length !== 1) {
    return;
  }

  return {
    spacePersonId: input.spacePerson.id,
    targetIdentityId,
    sourceIdentityId: candidates[0].identityId,
  };
}

private async applySharedSpaceIdentityReconciliationClaim(
  claim: SharedSpaceIdentityReconciliationClaim,
): Promise<void> {
  const conflicts = await this.faceIdentityRepository.getMergeConflicts({
    targetIdentityId: claim.targetIdentityId,
    sourceIdentityIds: [claim.sourceIdentityId],
  });
  if (conflicts.personalProfileConflictCount > 0 || conflicts.spaceProfileConflictCount > 0) {
    this.logger.warn(
      `Skipping shared-space identity reconciliation for space person ${claim.spacePersonId}: merge conflicts`,
    );
    return;
  }

  await this.faceIdentityRepository.mergeIdentities({
    targetIdentityId: claim.targetIdentityId,
    sourceIdentityIds: [claim.sourceIdentityId],
    source: 'shared-space-evidence',
  });
  await this.queueSpacePersonMetadataBackfill(claim.targetIdentityId);
}
```

- [ ] **Step 7: Run the focused tests to verify GREEN**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "should merge one strict local member match into an accessible space identity"
pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts -- --run -t "conflicts before identity merge"
```

Expected: both commands PASS.

- [ ] **Step 8: Add RED tests for strict skip behavior and idempotency**

Add these tests in the same `describe` block:

```ts
it('should skip automatic merge when two local candidates match within threshold', async () => {
  await setupStrictReconciliationFixture();
  mocks.search.searchFaces.mockResolvedValue([
    { id: 'local-face-1', personId: 'local-person-1', distance: 0.2 },
    { id: 'local-face-2', personId: 'local-person-2', distance: 0.21 },
  ]);
  mocks.person.getById
    .mockResolvedValueOnce(factory.person({ id: 'local-person-1', ownerId: 'member-1', type: 'person' }))
    .mockResolvedValueOnce(factory.person({ id: 'local-person-2', ownerId: 'member-1', type: 'person' }));
  mocks.faceIdentity.ensurePersonIdentity
    .mockResolvedValueOnce({ id: 'local-identity-1', type: 'person' } as any)
    .mockResolvedValueOnce({ id: 'local-identity-2', type: 'person' } as any);

  await sut.handleSharedSpaceIdentityReconciliation({ spaceId: 'space-1', userId: 'member-1' });

  expect(mocks.faceIdentity.mergeIdentities).not.toHaveBeenCalled();
});

it('should skip automatic merge for hidden local people', async () => {
  await setupStrictReconciliationFixture({ localPerson: { isHidden: true } });

  await sut.handleSharedSpaceIdentityReconciliation({ spaceId: 'space-1', userId: 'member-1' });

  expect(mocks.faceIdentity.mergeIdentities).not.toHaveBeenCalled();
});

it('should skip automatic merge for hidden space people', async () => {
  await setupStrictReconciliationFixture({ spacePerson: { isHidden: true } });

  await sut.handleSharedSpaceIdentityReconciliation({ spaceId: 'space-1', userId: 'member-1' });

  expect(mocks.search.searchFaces).not.toHaveBeenCalled();
  expect(mocks.faceIdentity.mergeIdentities).not.toHaveBeenCalled();
});

it('should skip automatic merge for type mismatches', async () => {
  await setupStrictReconciliationFixture({ localPerson: { type: 'pet' } });

  await sut.handleSharedSpaceIdentityReconciliation({ spaceId: 'space-1', userId: 'member-1' });

  expect(mocks.faceIdentity.mergeIdentities).not.toHaveBeenCalled();
});

it('should skip automatic merge when identity conflict preflight reports a same-scope conflict', async () => {
  await setupStrictReconciliationFixture();
  (mocks.faceIdentity as any).getMergeConflicts.mockResolvedValue({
    personalProfileConflictCount: 1,
    spaceProfileConflictCount: 0,
  });

  await sut.handleSharedSpaceIdentityReconciliation({ spaceId: 'space-1', userId: 'member-1' });

  expect(mocks.faceIdentity.mergeIdentities).not.toHaveBeenCalled();
});

it('should no-op when a repeated reconciliation sees the local profile already on the target identity', async () => {
  await setupStrictReconciliationFixture();
  mocks.faceIdentity.ensurePersonIdentity.mockResolvedValue({ id: 'space-identity', type: 'person' } as any);

  await sut.handleSharedSpaceIdentityReconciliation({ spaceId: 'space-1', userId: 'member-1' });

  expect((mocks.faceIdentity as any).getMergeConflicts).not.toHaveBeenCalled();
  expect(mocks.faceIdentity.mergeIdentities).not.toHaveBeenCalled();
});

it('should skip automatic merge when two space people claim the same local identity in one pass', async () => {
  await setupStrictReconciliationFixture({
    spacePeople: [
      {
        id: 'space-person-1',
        name: '',
        type: 'person',
        identityId: 'space-identity-1',
        isHidden: false,
        faceCount: 1,
        representativeFaceId: 'space-face-1',
        representativeFaceSource: 'auto',
        embedding: '[1,2,3]',
      },
      {
        id: 'space-person-2',
        name: '',
        type: 'person',
        identityId: 'space-identity-2',
        isHidden: false,
        faceCount: 1,
        representativeFaceId: 'space-face-2',
        representativeFaceSource: 'auto',
        embedding: '[1,2,4]',
      },
    ],
  });
  mocks.search.searchFaces.mockResolvedValue([{ id: 'local-face-1', personId: 'local-person-1', distance: 0.2 }]);
  mocks.faceIdentity.ensurePersonIdentity.mockResolvedValue({ id: 'local-identity', type: 'person' } as any);

  await sut.handleSharedSpaceIdentityReconciliation({ spaceId: 'space-1', userId: 'member-1' });

  expect((mocks.faceIdentity as any).getMergeConflicts).not.toHaveBeenCalled();
  expect(mocks.faceIdentity.mergeIdentities).not.toHaveBeenCalled();
});
```

Add this local helper above the tests to keep setup explicit:

```ts
async function setupStrictReconciliationFixture(
  overrides: {
    localPerson?: Record<string, unknown>;
    spacePerson?: Record<string, unknown>;
    spacePeople?: Array<Record<string, unknown>>;
  } = {},
) {
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: 'space-1', faceRecognitionEnabled: true }));
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId: 'space-1', userId: 'member-1' }));
  mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValue(
    overrides.spacePeople ?? [
      {
        id: 'space-person-1',
        name: '',
        type: 'person',
        identityId: 'space-identity',
        isHidden: false,
        faceCount: 1,
        representativeFaceId: 'space-face-1',
        representativeFaceSource: 'auto',
        embedding: '[1,2,3]',
        ...overrides.spacePerson,
      },
    ],
  );
  mocks.search.searchFaces.mockResolvedValue([{ id: 'local-face-1', personId: 'local-person-1', distance: 0.2 }]);
  mocks.person.getById.mockResolvedValue(
    factory.person({
      id: 'local-person-1',
      ownerId: 'member-1',
      type: 'person',
      isHidden: false,
      ...overrides.localPerson,
    }),
  );
  mocks.faceIdentity.ensurePersonIdentity.mockResolvedValue({ id: 'local-identity', type: 'person' } as any);
  (mocks.faceIdentity as any).getMergeConflicts = vi.fn().mockResolvedValue({
    personalProfileConflictCount: 0,
    spaceProfileConflictCount: 0,
  });
}
```

- [ ] **Step 9: Run skip tests to verify RED**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "skip automatic merge"
```

Expected: at least one new test fails until the helper handles all skip cases.

- [ ] **Step 10: Complete skip handling and verify GREEN**

Implement the missing branches in `findStrictSpacePersonLocalIdentityClaim`, `filterUnambiguousReconciliationClaims`, and `applySharedSpaceIdentityReconciliationClaim`, then run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "handleSharedSpaceIdentityReconciliation"
```

Expected: all reconciliation handler tests pass.

- [ ] **Step 11: Commit**

```bash
git add server/src/repositories/face-identity.repository.ts server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: reconcile shared-space identities for joined members"
```

---

## Task 4: Queue Reconciliation From New Space Evidence

**Files:**

- Modify: `server/src/services/shared-space.service.ts`
- Modify: `server/src/services/shared-space.service.spec.ts`

- [ ] **Step 1: Write failing tests for face-match triggers**

Add this helper near the existing face-match tests:

```ts
function mockOneAffectedSpacePerson() {
  mocks.sharedSpace.isAssetInSpace.mockResolvedValue(true);
  mocks.sharedSpace.getAssetFacesForMatching.mockResolvedValue([
    {
      id: 'face-1',
      assetId: 'asset-1',
      personId: 'owner-person-1',
      identityId: 'identity-1',
      type: 'person',
      embedding: '[1,2,3]',
    },
  ] as any);
  mocks.sharedSpace.isPersonFaceAssigned.mockResolvedValue(false);
  mocks.sharedSpace.getSpacePersonByIdentity.mockResolvedValue({
    id: 'space-person-1',
    identityId: 'identity-1',
  } as any);
  mocks.sharedSpace.getSpaceAssetAdder.mockResolvedValue({ addedById: 'member-1' });
  mocks.sharedSpace.addPersonFaces.mockResolvedValue(undefined as any);
}
```

Add tests in `describe('handleSharedSpaceFaceMatch')` and `describe('handleSharedSpaceFaceMatchAll')`:

```ts
it('should queue identity reconciliation for affected space people after matching one asset', async () => {
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: 'space-1', faceRecognitionEnabled: true }));
  mockOneAffectedSpacePerson();

  await sut.handleSharedSpaceFaceMatch({ spaceId: 'space-1', assetId: 'asset-1' });

  expect(mocks.job.queue).toHaveBeenCalledWith({
    name: JobName.SharedSpaceIdentityReconciliation,
    data: { spaceId: 'space-1', spacePersonId: 'space-person-1' },
  });
});

it('should queue full-space identity reconciliation after matching all assets', async () => {
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: 'space-1', faceRecognitionEnabled: true }));
  mocks.sharedSpace.getAssetIdsWithFaces.mockResolvedValue([{ assetId: 'asset-1' }] as any);
  mockOneAffectedSpacePerson();

  await sut.handleSharedSpaceFaceMatchAll({ spaceId: 'space-1' });

  expect(mocks.job.queue).toHaveBeenCalledWith({
    name: JobName.SharedSpaceIdentityReconciliation,
    data: { spaceId: 'space-1' },
  });
});

it('should queue full-space identity reconciliation after linked library face sync changes space evidence', async () => {
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: 'space-1', faceRecognitionEnabled: true }));
  mocks.sharedSpace.hasLibraryLink.mockResolvedValue(true);
  mocks.asset.getByLibraryIdWithFaces.mockResolvedValueOnce([{ id: 'asset-1' }]).mockResolvedValueOnce([]);
  mockOneAffectedSpacePerson();
  mocks.sharedSpace.getPetFacesForAsset.mockResolvedValue([]);

  await sut.handleSharedSpaceLibraryFaceSync({ spaceId: 'space-1', libraryId: 'library-1' });

  expect(mocks.job.queue).toHaveBeenCalledWith({
    name: JobName.SharedSpaceIdentityReconciliation,
    data: { spaceId: 'space-1' },
  });
});
```

- [ ] **Step 2: Run trigger tests to verify RED**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "identity reconciliation.*after (matching|linked library)"
```

Expected: FAIL because `processSpaceFaceMatch` does not return affected people and no reconciliation job is queued.

- [ ] **Step 3: Return affected people from face matching**

Change:

```ts
private async processSpaceFaceMatch(spaceId: string, assetId: string): Promise<void>
```

to:

```ts
private async processSpaceFaceMatch(spaceId: string, assetId: string): Promise<string[]>
```

Return `[]` for early exits and return `[...affectedPersonIds]` at the end.

- [ ] **Step 4: Queue reconciliation from handlers**

In `handleSharedSpaceFaceMatch`, collect the return value:

```ts
const affectedPersonIds = await this.processSpaceFaceMatch(spaceId, assetId);
for (const spacePersonId of affectedPersonIds) {
  await this.queueSpaceIdentityReconciliation({ spaceId, spacePersonId });
}
```

In `handleSharedSpaceFaceMatchAll`, track whether any batch returned affected people. If yes, queue:

```ts
await this.queueSpaceIdentityReconciliation({ spaceId });
```

Do the same after `handleSharedSpaceLibraryFaceSync` processes at least one affected person.

- [ ] **Step 5: Run trigger tests to verify GREEN**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "identity reconciliation.*after (matching|linked library)"
```

Expected: PASS.

- [ ] **Step 6: Run affected face matching suites**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "handleSharedSpaceFaceMatch"
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "handleSharedSpaceFaceMatchAll"
```

Expected: all matching tests pass.

- [ ] **Step 7: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: reconcile shared identities after space evidence changes"
```

---

## Task 5: Extend Same-Space Dedup To Identity-Backed People

**Files:**

- Modify: `server/src/services/shared-space.service.ts`
- Modify: `server/src/services/shared-space.service.spec.ts`

- [ ] **Step 1: Write failing identity-backed dedup test**

Add this test under `describe('handleSharedSpacePersonDedup')`:

```ts
it('should physically merge strict identity-backed space people before merging supporting identities', async () => {
  const spaceId = 'space-1';
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
  mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValueOnce([
    {
      id: 'target-space-person',
      name: '',
      type: 'person',
      identityId: 'target-identity',
      isHidden: false,
      faceCount: 2,
      representativeFaceId: 'face-target',
      representativeFaceSource: 'auto',
      embedding: '[1,2,3]',
    },
    {
      id: 'source-space-person',
      name: '',
      type: 'person',
      identityId: 'source-identity',
      isHidden: false,
      faceCount: 1,
      representativeFaceId: 'face-source',
      representativeFaceSource: 'auto',
      embedding: '[1,2,4]',
    },
  ] as any);
  mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValueOnce([
    {
      id: 'target-space-person',
      name: '',
      type: 'person',
      identityId: 'target-identity',
      isHidden: false,
      faceCount: 3,
      representativeFaceId: 'face-target',
      representativeFaceSource: 'auto',
      embedding: '[1,2,3]',
    },
  ] as any);
  mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([
    { personId: 'source-space-person', name: '', distance: 0.2, identityId: 'source-identity', type: 'person' },
  ]);
  mocks.sharedSpace.getPersonById.mockResolvedValue({
    id: 'target-space-person',
    spaceId,
    identityId: 'target-identity',
  } as any);
  mocks.sharedSpace.getIdentityEvidenceForSpacePerson.mockResolvedValue([
    { identityId: 'target-identity', type: 'person', supportingFaceCount: 2 },
    { identityId: 'source-identity', type: 'person', supportingFaceCount: 1 },
  ] as any);

  await sut.handleSharedSpacePersonDedup({ spaceId });

  expect(mocks.sharedSpace.reassignPersonFacesSafe).toHaveBeenCalledWith('source-space-person', 'target-space-person');
  expect(mocks.sharedSpace.migrateAliases).toHaveBeenCalledWith('source-space-person', 'target-space-person');
  expect(mocks.sharedSpace.deletePerson).toHaveBeenCalledWith('source-space-person');
  expect(mocks.faceIdentity.mergeIdentities).toHaveBeenCalledWith({
    targetIdentityId: 'target-identity',
    sourceIdentityIds: ['source-identity'],
    source: 'shared-space-evidence',
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "physically merge strict identity-backed space people"
```

Expected: FAIL because identity-backed people are skipped.

- [ ] **Step 3: Update dedup matching**

In `handleSharedSpacePersonDedup`:

- Remove the early skip for `person.identityId`.
- Remove the early skip for `matchPerson.identityId`.
- Skip hidden people for automatic dedup.
- Replace the existing `should make merged result visible if either person is visible` expectation with a skip-hidden expectation; automatic dedup must not unhide a profile as a side effect.
- Request `numResults: 2` from `findClosestSpacePerson`.
- If the returned compatible match count is not exactly one, continue without merging.
- Keep target/source selection by `faceCount`.
- Physically merge first with `reassignPersonFacesSafe`, `migrateAliases`, and `deletePerson`.
- Then call `mergeIdentitiesForSpacePersonEvidence` with `[target.identityId, source.identityId]`.

- [ ] **Step 4: Add RED tests for ambiguity and hidden space people**

Add:

```ts
it('should skip identity-backed dedup when more than one compatible space match exists', async () => {
  await setupIdentityBackedDedupFixture();
  mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([
    { personId: 'source-space-person', name: '', distance: 0.2, identityId: 'source-identity', type: 'person' },
    { personId: 'third-space-person', name: '', distance: 0.21, identityId: 'third-identity', type: 'person' },
  ]);

  await sut.handleSharedSpacePersonDedup({ spaceId: 'space-1' });

  expect(mocks.sharedSpace.reassignPersonFacesSafe).not.toHaveBeenCalled();
  expect(mocks.faceIdentity.mergeIdentities).not.toHaveBeenCalled();
});

it('should skip automatic dedup for hidden space people', async () => {
  await setupIdentityBackedDedupFixture({ sourceHidden: true });

  await sut.handleSharedSpacePersonDedup({ spaceId: 'space-1' });

  expect(mocks.sharedSpace.reassignPersonFacesSafe).not.toHaveBeenCalled();
});

it('should keep hidden identity-less space people out of automatic dedup', async () => {
  await setupIdentityBackedDedupFixture({ sourceIdentityId: null, targetIdentityId: null, sourceHidden: true });

  await sut.handleSharedSpacePersonDedup({ spaceId: 'space-1' });

  expect(mocks.sharedSpace.reassignPersonFacesSafe).not.toHaveBeenCalled();
  expect(mocks.sharedSpace.updatePerson).not.toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({ isHidden: false }),
  );
});
```

Place `setupIdentityBackedDedupFixture` near the new tests:

```ts
async function setupIdentityBackedDedupFixture(
  input: {
    sourceHidden?: boolean;
    sourceIdentityId?: string | null;
    targetIdentityId?: string | null;
  } = {},
) {
  const spaceId = 'space-1';
  const targetIdentityId = input.targetIdentityId === undefined ? 'target-identity' : input.targetIdentityId;
  const sourceIdentityId = input.sourceIdentityId === undefined ? 'source-identity' : input.sourceIdentityId;

  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true }));
  mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValueOnce([
    {
      id: 'target-space-person',
      name: '',
      type: 'person',
      identityId: targetIdentityId,
      isHidden: false,
      faceCount: 2,
      representativeFaceId: 'face-target',
      representativeFaceSource: 'auto',
      embedding: '[1,2,3]',
    },
    {
      id: 'source-space-person',
      name: '',
      type: 'person',
      identityId: sourceIdentityId,
      isHidden: input.sourceHidden ?? false,
      faceCount: 1,
      representativeFaceId: 'face-source',
      representativeFaceSource: 'auto',
      embedding: '[1,2,4]',
    },
  ] as any);
  mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValueOnce([
    {
      id: 'target-space-person',
      name: '',
      type: 'person',
      identityId: targetIdentityId,
      isHidden: false,
      faceCount: 3,
      representativeFaceId: 'face-target',
      representativeFaceSource: 'auto',
      embedding: '[1,2,3]',
    },
  ] as any);
  mocks.sharedSpace.findClosestSpacePerson.mockResolvedValue([
    { personId: 'source-space-person', name: '', distance: 0.2, identityId: sourceIdentityId, type: 'person' },
  ]);
  mocks.sharedSpace.getPersonById.mockResolvedValue({
    id: 'target-space-person',
    spaceId,
    identityId: targetIdentityId,
  } as any);
  mocks.sharedSpace.getIdentityEvidenceForSpacePerson.mockResolvedValue(
    [targetIdentityId, sourceIdentityId]
      .filter((identityId): identityId is string => !!identityId)
      .map((identityId) => ({ identityId, type: 'person', supportingFaceCount: 1 })),
  );
  mocks.sharedSpace.reassignPersonFacesSafe.mockResolvedValue(void 0 as any);
  mocks.sharedSpace.migrateAliases.mockResolvedValue(void 0 as any);
  mocks.sharedSpace.deletePerson.mockResolvedValue(void 0 as any);
}
```

- [ ] **Step 5: Run dedup tests to verify GREEN**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "handleSharedSpacePersonDedup"
```

Expected: all dedup tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat: dedupe identity-backed space people"
```

---

## Task 6: Fix Mixed Manual Merge Modal Path

**Files:**

- Create: `web/src/lib/utils/scoped-person-ref.ts`
- Modify: `web/src/lib/modals/PersonMergeSuggestionModal.svelte`
- Modify: `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Test: `web/src/lib/modals/person-merge-suggestion-modal.spec.ts`

- [ ] **Step 1: Write failing modal tests**

Create `web/src/lib/modals/person-merge-suggestion-modal.spec.ts`:

```ts
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import PersonMergeSuggestionModal from '$lib/modals/PersonMergeSuggestionModal.svelte';
import { Type, type PersonResponseDto } from '@immich/sdk';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

function person(overrides: Partial<PersonResponseDto> = {}): PersonResponseDto {
  return {
    id: 'person-1',
    name: 'Person',
    birthDate: null,
    thumbnailPath: '',
    isHidden: false,
    isFavorite: false,
    type: 'person',
    species: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('PersonMergeSuggestionModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('uses scoped identity repair when either side is a space primary profile', async () => {
    render(PersonMergeSuggestionModal, {
      personToMerge: person({
        id: 'space-visible-person',
        primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' },
      }),
      personToBeMergedInto: person({ id: 'person-target' }),
      potentialMergePeople: [],
      onClose: vi.fn(),
    });

    await userEvent.click(screen.getByText('yes'));

    expect(sdkMock.mergeScopedPeople).toHaveBeenCalledWith({
      mergeScopedPeopleDto: {
        target: { type: 'person', id: 'person-target' },
        sources: [{ type: 'space-person', id: 'space-person-1', spaceId: 'space-1' }],
      },
    });
    expect(sdkMock.mergePerson).not.toHaveBeenCalled();
  });

  it('keeps legacy personal merge when both sides are personal profiles', async () => {
    render(PersonMergeSuggestionModal, {
      personToMerge: person({ id: 'person-source' }),
      personToBeMergedInto: person({ id: 'person-target' }),
      potentialMergePeople: [],
      onClose: vi.fn(),
    });

    await userEvent.click(screen.getByText('yes'));

    expect(sdkMock.mergePerson).toHaveBeenCalledWith({
      id: 'person-target',
      mergePersonDto: { ids: ['person-source'] },
    });
    expect(sdkMock.mergeScopedPeople).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run modal tests to verify RED**

Run:

```bash
pnpm --dir web test src/lib/modals/person-merge-suggestion-modal.spec.ts -- --run
```

Expected: FAIL because the modal always calls `mergePerson`.

- [ ] **Step 3: Add shared scoped-ref helper**

Create `web/src/lib/utils/scoped-person-ref.ts`:

```ts
import { Type2 as ScopedPersonProfileType, type PersonResponseDto, type ScopedPersonProfileRefDto } from '@immich/sdk';

export const toScopedPersonRef = (person: PersonResponseDto): ScopedPersonProfileRefDto => {
  if (person.primaryProfile?.type === 'space-person' && person.primaryProfile.spaceId) {
    return {
      type: ScopedPersonProfileType.SpacePerson,
      id: person.primaryProfile.id,
      spaceId: person.primaryProfile.spaceId,
    };
  }

  if (person.primaryProfile?.type === 'user-person') {
    return { type: ScopedPersonProfileType.Person, id: person.primaryProfile.id };
  }

  return { type: ScopedPersonProfileType.Person, id: person.id };
};

export const isSpaceScopedPerson = (person: PersonResponseDto) =>
  toScopedPersonRef(person).type === ScopedPersonProfileType.SpacePerson;
```

- [ ] **Step 4: Update modal submit path**

In `web/src/lib/modals/PersonMergeSuggestionModal.svelte`, import `mergeScopedPeople` and helper functions:

```ts
import { toScopedPersonRef, isSpaceScopedPerson } from '$lib/utils/scoped-person-ref';
import { mergePerson, mergeScopedPeople, type PersonResponseDto } from '@immich/sdk';
```

Replace the submit call with:

```ts
if (isSpaceScopedPerson(personToMerge) || isSpaceScopedPerson(personToBeMergedInto)) {
  await mergeScopedPeople({
    mergeScopedPeopleDto: {
      target: toScopedPersonRef(personToBeMergedInto),
      sources: [toScopedPersonRef(personToMerge)],
    },
  });
} else {
  await mergePerson({
    id: personToBeMergedInto.id,
    mergePersonDto: { ids: [personToMerge.id] },
  });
}
```

- [ ] **Step 5: Reuse the helper in existing pages**

In `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`, replace the local `toScopedPersonRef` and `isSpaceScoped` functions with imports from `$lib/utils/scoped-person-ref`.

In `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`, keep the existing fallback-space logic for `SharedSpacePersonResponseDto`; use the shared helper only for `PersonResponseDto` candidates.

- [ ] **Step 6: Run web focused tests to verify GREEN**

Run:

```bash
pnpm --dir web test src/lib/modals/person-merge-suggestion-modal.spec.ts 'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts' 'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts' -- --run
```

Expected: all focused web tests pass.

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/utils/scoped-person-ref.ts web/src/lib/modals/PersonMergeSuggestionModal.svelte web/src/lib/modals/person-merge-suggestion-modal.spec.ts 'web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte'
git commit -m "fix: use scoped repair for mixed person merge modal"
```

---

## Task 7: Medium Access And Lifecycle Coverage

**Files:**

- Modify: `server/test/medium/specs/services/people-identity-rbac.spec.ts`

- [ ] **Step 1: Add service medium test for join-after-duplicates**

Add this helper in `server/test/medium/specs/services/people-identity-rbac.spec.ts` near the existing identity fixture helpers:

```ts
const setupJoinAfterDuplicatesFixture = async (
  input: { showInTimeline?: boolean; memberBeforeSpaceEvidence?: boolean } = {},
) => {
  const { ctx, sut: personService, faceIdentityRepository } = setup();
  const { ctx: sharedSpaceCtx, sut: sharedSpaceService } = setupSharedSpace();
  const { sut: searchService } = setupSearch();
  const sharedSpaceRepository = sharedSpaceCtx.get(SharedSpaceRepository);
  const { user: owner } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const embedding = newEmbedding();

  const { person: ownerPerson } = await ctx.newPerson({ ownerId: owner.id, name: 'Owner Shared Name' });
  const { asset: spaceAsset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
  const { assetFace: ownerFace } = await ctx.newAssetFace({ assetId: spaceAsset.id, personId: ownerPerson.id });
  await ctx.database.insertInto('face_search').values({ faceId: ownerFace.id, embedding }).execute();
  const ownerIdentity = await faceIdentityRepository.ensurePersonIdentity(ownerPerson.id);
  await faceIdentityRepository.linkFace({
    assetFaceId: ownerFace.id,
    identityId: ownerIdentity.id,
    source: 'owner-person',
  });

  const { person: memberPerson } = await ctx.newPerson({ ownerId: member.id, name: 'Member Private Name' });
  const { asset: memberAsset } = await ctx.newAsset({ ownerId: member.id, visibility: AssetVisibility.Timeline });
  const { assetFace: memberFace } = await ctx.newAssetFace({ assetId: memberAsset.id, personId: memberPerson.id });
  await ctx.database.insertInto('face_search').values({ faceId: memberFace.id, embedding }).execute();
  const memberIdentity = await faceIdentityRepository.ensurePersonIdentity(memberPerson.id);
  await faceIdentityRepository.linkFace({
    assetFaceId: memberFace.id,
    identityId: memberIdentity.id,
    source: 'owner-person',
  });

  const { space } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
  if (input.memberBeforeSpaceEvidence) {
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
  }

  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: spaceAsset.id, addedById: owner.id });
  const spacePerson = await ctx.database
    .insertInto('shared_space_person')
    .values({
      spaceId: space.id,
      identityId: ownerIdentity.id,
      name: 'Owner Shared Name',
      representativeFaceId: ownerFace.id,
      type: 'person',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  await ctx.database
    .insertInto('shared_space_person_face')
    .values({ personId: spacePerson.id, assetFaceId: ownerFace.id })
    .execute();

  if (!input.memberBeforeSpaceEvidence) {
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
  }
  await setSpaceTimeline(ctx, {
    spaceId: space.id,
    userId: member.id,
    showInTimeline: input.showInTimeline ?? true,
  });

  return {
    ctx,
    personService,
    sharedSpaceService,
    sharedSpaceRepository,
    searchService,
    faceIdentityRepository,
    owner,
    member,
    memberAuth: authFor(member),
    space,
    spaceAsset,
    memberAsset,
    ownerPerson,
    memberPerson,
    spacePerson,
    ownerIdentity,
    memberIdentity,
  };
};
```

Then add:

```ts
it('join-after-duplicates reconciles strict local and space identities', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture();

  await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
    spaceId: fixture.space.id,
    userId: fixture.member.id,
  });

  const people = await fixture.personService.getAll(fixture.memberAuth, {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  expect(people.people.filter((person) => person.type === 'person')).toHaveLength(1);
  expect(people.people[0]).toEqual(expect.objectContaining({ numberOfAssets: 2 }));
});

it('new-space-evidence reconciliation links an existing member local identity', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture({ memberBeforeSpaceEvidence: true });

  await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
    spaceId: fixture.space.id,
    spacePersonId: fixture.spacePerson.id,
  });

  const people = await fixture.personService.getAll(fixture.memberAuth, {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  expect(people.people.filter((person) => person.type === 'person')).toHaveLength(1);
  expect(people.people[0].numberOfAssets).toBe(2);
});
```

- [ ] **Step 2: Run the medium test**

Run the exact test name:

```bash
pnpm --dir server test:medium test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "join-after-duplicates|new-space-evidence"
```

Expected: PASS after Tasks 1-5. If this fails, fix the implementation or the fixture before adding the lifecycle tests.

- [ ] **Step 3: Add lifecycle medium tests**

Add these tests in `server/test/medium/specs/services/people-identity-rbac.spec.ts`:

```ts
it('removes shared-space assets from the accessible identity after the member leaves', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture();

  await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
    spaceId: fixture.space.id,
    userId: fixture.member.id,
  });
  await fixture.ctx.database
    .deleteFrom('shared_space_member')
    .where('spaceId', '=', fixture.space.id)
    .where('userId', '=', fixture.member.id)
    .execute();

  const result = await fixture.personService.getAll(fixture.memberAuth, {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  expect(result.people).toEqual([
    expect.objectContaining({
      primaryProfile: expect.objectContaining({ id: fixture.memberPerson.id }),
      numberOfAssets: 1,
    }),
  ]);
});

it('handles concurrent reconciliation attempts without duplicate visible identities', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture();

  const results = await Promise.allSettled([
    fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
      spaceId: fixture.space.id,
      userId: fixture.member.id,
    }),
    fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
      spaceId: fixture.space.id,
      userId: fixture.member.id,
    }),
  ]);

  expect(results.every((result) => result.status === 'fulfilled')).toBe(true);

  const people = await fixture.personService.getAll(fixture.memberAuth, {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  expect(people.people.filter((person) => person.type === 'person')).toHaveLength(1);
  expect(people.people[0].numberOfAssets).toBe(2);
});

it('keeps timeline-disabled space evidence out of global people while explicit space people still resolve', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture({ showInTimeline: false });

  const globalPeople = await fixture.personService.getAll(fixture.memberAuth, {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  expect(globalPeople.people.some((person) => person.primaryProfile?.type === 'space-person')).toBe(false);

  const explicitSpacePeople = await fixture.sharedSpaceService.getSpacePeople(fixture.memberAuth, fixture.space.id);
  expect(explicitSpacePeople).toEqual([
    expect.objectContaining({ id: fixture.spacePerson.id, name: 'Owner Shared Name' }),
  ]);
});

it('restores identity grouping after the member rejoins the shared space', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture();
  await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
    spaceId: fixture.space.id,
    userId: fixture.member.id,
  });
  await fixture.ctx.database
    .deleteFrom('shared_space_member')
    .where('spaceId', '=', fixture.space.id)
    .where('userId', '=', fixture.member.id)
    .execute();
  await fixture.ctx.newSharedSpaceMember({
    spaceId: fixture.space.id,
    userId: fixture.member.id,
    role: SharedSpaceRole.Viewer,
  });

  const result = await fixture.personService.getAll(fixture.memberAuth, {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  expect(result.people.filter((person) => person.type === 'person')).toHaveLength(1);
  expect(result.people[0].numberOfAssets).toBe(2);
});

it('restores global contribution after showInTimeline is re-enabled', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture({ showInTimeline: false });
  await setSpaceTimeline(fixture.ctx, {
    spaceId: fixture.space.id,
    userId: fixture.member.id,
    showInTimeline: true,
  });
  await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
    spaceId: fixture.space.id,
    userId: fixture.member.id,
  });

  const result = await fixture.personService.getAll(fixture.memberAuth, {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  expect(result.people.filter((person) => person.type === 'person')).toHaveLength(1);
  expect(result.people[0].numberOfAssets).toBe(2);
});

it('removes a removed shared-space asset from visible identity counts without splitting identities', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture();
  await fixture.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
    spaceId: fixture.space.id,
    userId: fixture.member.id,
  });
  await fixture.ctx.database
    .deleteFrom('shared_space_asset')
    .where('spaceId', '=', fixture.space.id)
    .where('assetId', '=', fixture.spaceAsset.id)
    .execute();

  const result = await fixture.personService.getAll(fixture.memberAuth, {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  const filters = await fixture.searchService.getFilterSuggestions(fixture.memberAuth, { withSharedSpaces: true });
  expect(result.people.filter((person) => person.type === 'person')).toHaveLength(1);
  expect(result.people[0].numberOfAssets).toBe(1);
  expect(filters.people).not.toContainEqual(expect.objectContaining({ id: `space-person:${fixture.spacePerson.id}` }));
});

it('does not surface a stale space person after its backing face is removed', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture();
  await fixture.ctx.database
    .deleteFrom('shared_space_person_face')
    .where('personId', '=', fixture.spacePerson.id)
    .execute();

  const result = await fixture.personService.getAll(fixture.memberAuth, {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  expect(result.people.some((person) => person.primaryProfile?.id === fixture.spacePerson.id)).toBe(false);
});
```

- [ ] **Step 4: Run medium tests to verify GREEN**

Run:

```bash
pnpm --dir server test:medium test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "join-after-duplicates|new-space-evidence|concurrent reconciliation|accessible identity|showInTimeline|removed shared-space asset|stale space person"
```

Expected: all identity-related medium tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/test/medium/specs/services/people-identity-rbac.spec.ts
git commit -m "test: cover shared identity access lifecycle"
```

---

## Task 8: Final Verification

**Files:**

- All files changed by Tasks 1-7.

- [ ] **Step 1: Run focused server tests**

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts src/services/person.service.spec.ts -- --run
```

Expected: PASS.

- [ ] **Step 2: Run focused medium tests**

```bash
pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/services/people-identity-rbac.spec.ts test/medium/specs/repositories/shared-space-face-matching.spec.ts -- --run
```

Expected: PASS.

- [ ] **Step 3: Run focused web tests**

```bash
pnpm --dir web test src/lib/modals/person-merge-suggestion-modal.spec.ts 'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts' 'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts' -- --run
```

Expected: PASS.

- [ ] **Step 4: Run code checks**

```bash
pnpm --dir server run format
pnpm --dir server run lint
pnpm --dir server run check
pnpm --dir web run format
pnpm --dir web run lint
pnpm --dir web run check:svelte
pnpm --dir web run check:typescript
```

Expected: all commands exit 0.

- [ ] **Step 5: Review generated SQL impact**

If any new `@GenerateSql` decorators are added or generated SQL files change, run the repository SQL sync command used by this repo and review the generated diff. Keep only SQL changes for touched repository methods.

- [ ] **Step 6: Final git review**

```bash
git status --short --branch
git log --oneline -8
git diff origin/fix/accessible-shared-identity...HEAD --stat
```

Expected: clean worktree after the final commit; commits are focused and no unrelated files are changed.
