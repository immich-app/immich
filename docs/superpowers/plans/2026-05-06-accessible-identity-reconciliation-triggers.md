# Accessible Identity Reconciliation Triggers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make shared-space identity access converge across member joins, post-join uploads, explicit space adds, global people, explore, and access loss without creating duplicates or hiding owned personal profiles.

**Architecture:** Keep `face_identity` as the internal sameness key and keep `person`/`shared_space_person` scoped. Add a shared reconciliation policy module for strict claim filtering and target selection, then wire existing `PersonService`, `SharedSpaceService`, and `FaceIdentityRepository` paths through that policy. Fix global people/explore primary-profile routing so global surfaces open identity-wide detail while explicit space routes remain space-scoped.

**Tech Stack:** NestJS services, Kysely repositories, `@GenerateSql` SQL snapshots, Vitest unit and medium tests, Svelte 5 route/component tests.

---

## Reference

Design spec: `docs/superpowers/specs/2026-05-06-accessible-identity-reconciliation-triggers-design.md`

Earlier related design: `docs/superpowers/specs/2026-05-05-accessible-identity-merge-cases-design.md`

Existing partial implementation to preserve:

- `server/src/services/person.service.ts`
  - Personal recognition already calls `findClosestAccessibleIdentityForFace()` for post-upload shared identity matching.
- `server/src/services/shared-space.service.ts`
  - Member join already queues `SharedSpaceFaceMatchAll` before `SharedSpaceIdentityReconciliation`.
  - Shared-space face matching already queues scoped identity reconciliation for affected space people.
- `server/src/repositories/face-identity.repository.ts`
  - `getAccessiblePeople()` and search/filter resolver paths already group by accessible identity.
  - `findClosestAccessibleIdentityForFace()` already returns no match when multiple accessible identities are within threshold.

This plan finishes the remaining correctness work and expands the test suite so future changes cannot regress the 3-user permutations.

---

## Scope

In scope:

- Strict automatic reconciliation policy shared by upload, join, and space-evidence flows.
- Missing red tests for the current broken behavior.
- Global people/explore primary profile stability for users with owned assets.
- Late member permutations with and without a local profile.
- Post-join private upload and post-join upload added to the space.
- Linked shared-space libraries as an equivalent source of space evidence for join, upload, and leave/access-loss behavior.
- Ambiguity, conflict, hidden, type, race, and access-loss coverage.
- Manual same-person repair for personal-profile plus space-profile merges, including RBAC and UI dispatch.
- Global people/explore/global-search routing to identity-wide person detail.
- SQL snapshot regeneration for changed `@GenerateSql` repository methods.

Out of scope:

- New database tables.
- Suggested-duplicates UI.
- Fuzzy automatic merge.
- Name-only automatic merge.
- Raw `face_identity.id` exposure.
- Changing space asset retention rules.
- Running local lint; CI owns lint for this branch because local lint is too slow.

---

## File Map

Create:

- `server/src/services/accessible-identity-reconciliation.ts`
  - Pure policy module for strict claim filtering, skip reasons, and deterministic target selection.
- `server/src/services/accessible-identity-reconciliation.spec.ts`
  - Unit tests for the central policy. This avoids retesting the same ambiguity logic only through `SharedSpaceService`.
- `web/src/lib/utils/global-person-route.ts`
  - Shared global-surface route and thumbnail helpers for identity-grouped people.
- `web/src/lib/utils/global-person-route.spec.ts`
  - Unit tests for global person routing and thumbnail URLs.

Modify:

- `server/src/services/shared-space.service.ts`
  - Replace local claim filtering/target selection helpers with calls to the central policy module.
  - Keep job handlers and repository reads in this service.
- `server/src/services/shared-space.service.spec.ts`
  - Keep existing reconciliation tests green and add missing skip/target-selection tests around the service boundary.
- `server/src/services/person.service.ts`
  - Route personal upload merge decisions through the central policy after source identity is known.
  - Keep manual scoped repair for personal-profile plus space-profile merges behind accessibility and conflict checks.
- `server/src/services/person.service.spec.ts`
  - Add focused upload tests for strict match, ambiguity, merge failure, and no duplicate after a newly created local profile.
- `server/src/controllers/person.controller.spec.ts`
  - Keep `/people/same-person` DTO coverage for personal and space profile references, and reject raw identity refs.
- `server/src/repositories/face-identity.repository.ts`
  - Split display metadata ranking from global primary profile ranking so viewer-owned personal profiles stay primary even when a space profile has a better name.
  - Keep scoped repair resolution limited to accessible, repairable profiles without same-owner or same-space conflicts.
- `server/src/queries/face.identity.repository.sql`
  - Regenerated from `FaceIdentityRepository` query changes.
- `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
  - Add repository-level ambiguity and owned-primary query tests.
- `server/test/medium/specs/services/people-identity-rbac.spec.ts`
  - Add 3-user join/upload permutations, no-local/no-upload late join, post-join private upload, post-join add-to-space, linked-library source evidence, stale global row, representative-face repair, and scoped repair RBAC coverage.
- `web/src/lib/modals/PersonMergeSuggestionModal.svelte`
  - Use scoped repair when a merge suggestion crosses personal and space profiles, while preserving legacy personal-only merge behavior.
- `web/src/lib/modals/person-merge-suggestion-modal.spec.ts`
  - Cover scoped repair dispatch and legacy personal merge dispatch.
- `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
  - Use scoped repair from global person detail when a selected merge candidate is space-scoped.
- `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts`
  - Cover personal target plus space candidate, including auto-swap.
- `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
  - Use scoped repair from space person detail when a selected merge candidate is personal-scoped, and keep same-space merge for same-space candidates.
- `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts`
  - Cover space target plus personal candidate and same-space merge dispatch.
- `web/src/routes/(user)/explore/+page.svelte`
  - Use the shared global route/thumbnail helper.
- `web/src/routes/(user)/explore/explore-page.spec.ts`
  - Keep the identity-wide detail route and accessible thumbnail assertions.
- `web/src/routes/(user)/people/+page.svelte`
  - Use identity-wide global detail routes for global people rows, including space-primary rows.
- `web/src/routes/(user)/people/people-page.spec.ts`
  - Update space-primary global people navigation expectations.
- `web/src/lib/managers/global-search-manager.svelte.ts`
  - Route global person search results to identity-wide person detail.
- `web/src/lib/managers/global-search-manager.svelte.spec.ts`
  - Update space-primary global search navigation expectations.

No OpenAPI regeneration is expected. If implementation changes public DTO fields or controller signatures, stop and add an OpenAPI task before continuing.

---

## TDD Tracking Rule

Every production change below has a matching red test step before implementation. Record the red command and failure in the task notes while executing. Do not make production changes for a behavior until its red test has failed for the expected reason.

Use focused local tests. Do not run full local lint; rely on CI lint per user preference.

---

### Task 0: Baseline Targeted Regression Check

**Files:**

- Test only: `server/src/services/shared-space.service.spec.ts`
- Test only: `server/src/services/person.service.spec.ts`
- Test only: `server/test/medium/specs/services/people-identity-rbac.spec.ts`
- Test only: `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
- Test only: `web/src/routes/(user)/explore/explore-page.spec.ts`
- Test only: `web/src/routes/(user)/people/people-page.spec.ts`
- Test only: `web/src/lib/managers/global-search-manager.svelte.spec.ts`

- [ ] **Step 1: Run focused backend unit baseline**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts src/services/person.service.spec.ts -- --run -t "SharedSpaceIdentityReconciliation|accessible shared identity|findClosestAccessibleIdentityForFace"
```

Expected: PASS. Existing reconciliation and upload coverage is green before new red tests are added.

- [ ] **Step 2: Run focused backend medium baseline**

Run:

```bash
pnpm --dir server test:medium test/medium/specs/services/people-identity-rbac.spec.ts test/medium/specs/repositories/face-identity.repository.spec.ts -- --run -t "join-after-duplicates|late member join|new-space-evidence|timeline-disabled|multiple shared identities|access is removed|stale space person|linked-library"
```

Expected: PASS. Existing join/materialization/access contraction coverage is green before expanding it.

- [ ] **Step 3: Run focused web baseline**

Run:

```bash
pnpm --dir web test 'src/routes/(user)/explore/explore-page.spec.ts' 'src/routes/(user)/people/people-page.spec.ts' src/lib/managers/global-search-manager.svelte.spec.ts -- --run -t "space-primary|identity-wide|person route|shared-space thumbnail"
```

Expected: PASS. Existing global people/explore/global-search route behavior is known before changing it.

- [ ] **Step 4: Commit nothing**

Do not commit after Task 0. This task only verifies the starting point.

---

### Task 1: Add Central Strict Reconciliation Policy

**Files:**

- Create: `server/src/services/accessible-identity-reconciliation.ts`
- Create: `server/src/services/accessible-identity-reconciliation.spec.ts`

- [ ] **Step 1: Write RED policy tests**

Create `server/src/services/accessible-identity-reconciliation.spec.ts`:

```ts
import {
  buildAutomaticReconciliationClaim,
  chooseAutomaticTargetIdentity,
  filterUnambiguousReconciliationClaims,
  type AutomaticReconciliationCandidate,
  type ReconciliationClaim,
} from 'src/services/accessible-identity-reconciliation';

const baseCandidate = (
  overrides: Partial<AutomaticReconciliationCandidate> = {},
): AutomaticReconciliationCandidate => ({
  bridge: 'member-join',
  localIdentityId: 'local-identity',
  spaceIdentityId: 'space-identity',
  sourceIdentityId: 'local-identity',
  targetIdentityId: 'space-identity',
  sourceProfileKey: 'user:member-1:local-person',
  targetProfileKey: 'space:space-1:space-person',
  distance: 0.2,
  hasAccessBridge: true,
  compatibleType: true,
  hasEmbedding: true,
  hiddenOrIgnored: false,
  alreadySameIdentity: false,
  sameOwnerConflict: false,
  sameSpaceConflict: false,
  ...overrides,
});

describe('accessible identity reconciliation policy', () => {
  it('builds one strict automatic claim when the candidate is compatible', () => {
    expect(buildAutomaticReconciliationClaim(baseCandidate())).toEqual({
      bridge: 'member-join',
      sourceIdentityId: 'local-identity',
      targetIdentityId: 'space-identity',
      sourceProfileKey: 'user:member-1:local-person',
      targetProfileKey: 'space:space-1:space-person',
      distance: 0.2,
    });
  });

  it.each([
    ['missing access bridge', { hasAccessBridge: false }],
    ['missing embedding', { hasEmbedding: false }],
    ['type mismatch', { compatibleType: false }],
    ['hidden profile', { hiddenOrIgnored: true }],
    ['already same identity', { alreadySameIdentity: true }],
    ['same owner conflict', { sameOwnerConflict: true }],
    ['same space conflict', { sameSpaceConflict: true }],
  ])('skips %s', (_name, overrides) => {
    expect(buildAutomaticReconciliationClaim(baseCandidate(overrides))).toBeUndefined();
  });

  it('keeps only one-to-one claims in a pass', () => {
    const claims: ReconciliationClaim[] = [
      {
        bridge: 'member-join',
        sourceIdentityId: 'source-1',
        targetIdentityId: 'target-1',
        sourceProfileKey: 'source-profile-1',
        targetProfileKey: 'target-profile-1',
      },
      {
        bridge: 'member-join',
        sourceIdentityId: 'source-2',
        targetIdentityId: 'target-2',
        sourceProfileKey: 'source-profile-2',
        targetProfileKey: 'target-profile-2',
      },
      {
        bridge: 'member-join',
        sourceIdentityId: 'source-2',
        targetIdentityId: 'target-3',
        sourceProfileKey: 'source-profile-2',
        targetProfileKey: 'target-profile-3',
      },
      {
        bridge: 'member-join',
        sourceIdentityId: 'source-4',
        targetIdentityId: 'target-1',
        sourceProfileKey: 'source-profile-4',
        targetProfileKey: 'target-profile-1',
      },
    ];

    expect(filterUnambiguousReconciliationClaims(claims)).toEqual([]);
  });

  it('keeps distinct one-to-one claims', () => {
    const claims: ReconciliationClaim[] = [
      {
        bridge: 'space-evidence',
        sourceIdentityId: 'source-1',
        targetIdentityId: 'target-1',
        sourceProfileKey: 'source-profile-1',
        targetProfileKey: 'target-profile-1',
      },
      {
        bridge: 'space-evidence',
        sourceIdentityId: 'source-2',
        targetIdentityId: 'target-2',
        sourceProfileKey: 'source-profile-2',
        targetProfileKey: 'target-profile-2',
      },
    ];

    expect(filterUnambiguousReconciliationClaims(claims)).toEqual(claims);
  });

  it.each([
    ['member-join', 'local-identity', 'space-identity'],
    ['space-evidence', 'local-identity', 'space-identity'],
    ['personal-upload', 'local-identity', 'space-identity'],
    ['explicit-space-add', 'local-identity', 'space-identity'],
  ] as const)('chooses deterministic target for %s', (bridge, expectedSource, expectedTarget) => {
    expect(
      chooseAutomaticTargetIdentity({
        bridge,
        localIdentityId: 'local-identity',
        spaceIdentityId: 'space-identity',
      }),
    ).toEqual({ sourceIdentityId: expectedSource, targetIdentityId: expectedTarget });
  });

  it('uses stable id tie-breaker when neither side is preferred', () => {
    expect(
      chooseAutomaticTargetIdentity({
        bridge: 'manual-compatible',
        firstIdentityId: 'identity-b',
        secondIdentityId: 'identity-a',
      }),
    ).toEqual({ sourceIdentityId: 'identity-b', targetIdentityId: 'identity-a' });
  });
});
```

- [ ] **Step 2: Run the policy tests to verify RED**

Run:

```bash
pnpm --dir server test src/services/accessible-identity-reconciliation.spec.ts -- --run
```

Expected: FAIL with an import/module-not-found error for `src/services/accessible-identity-reconciliation`.

- [ ] **Step 3: Add the policy module**

Create `server/src/services/accessible-identity-reconciliation.ts`:

```ts
export type ReconciliationBridge =
  | 'member-join'
  | 'space-evidence'
  | 'personal-upload'
  | 'explicit-space-add'
  | 'manual-compatible';

export type ReconciliationClaim = {
  bridge: ReconciliationBridge;
  sourceIdentityId: string;
  targetIdentityId: string;
  sourceProfileKey?: string;
  targetProfileKey?: string;
  distance?: number;
};

export type AutomaticReconciliationCandidate = {
  bridge: ReconciliationBridge;
  localIdentityId?: string;
  spaceIdentityId?: string;
  sourceIdentityId: string;
  targetIdentityId: string;
  sourceProfileKey?: string;
  targetProfileKey?: string;
  distance?: number;
  hasAccessBridge: boolean;
  compatibleType: boolean;
  hasEmbedding: boolean;
  hiddenOrIgnored: boolean;
  alreadySameIdentity: boolean;
  sameOwnerConflict: boolean;
  sameSpaceConflict: boolean;
};

export const chooseAutomaticTargetIdentity = (
  input:
    | {
        bridge: Exclude<ReconciliationBridge, 'manual-compatible'>;
        localIdentityId: string;
        spaceIdentityId: string;
      }
    | {
        bridge: 'manual-compatible';
        firstIdentityId: string;
        secondIdentityId: string;
      },
): { sourceIdentityId: string; targetIdentityId: string } => {
  if (input.bridge === 'manual-compatible') {
    const [targetIdentityId, sourceIdentityId] = [input.firstIdentityId, input.secondIdentityId].sort();
    return { sourceIdentityId, targetIdentityId };
  }

  return {
    sourceIdentityId: input.localIdentityId,
    targetIdentityId: input.spaceIdentityId,
  };
};

export const buildAutomaticReconciliationClaim = (
  candidate: AutomaticReconciliationCandidate,
): ReconciliationClaim | undefined => {
  if (
    !candidate.hasAccessBridge ||
    !candidate.compatibleType ||
    !candidate.hasEmbedding ||
    candidate.hiddenOrIgnored ||
    candidate.alreadySameIdentity ||
    candidate.sameOwnerConflict ||
    candidate.sameSpaceConflict
  ) {
    return;
  }

  return {
    bridge: candidate.bridge,
    sourceIdentityId: candidate.sourceIdentityId,
    targetIdentityId: candidate.targetIdentityId,
    sourceProfileKey: candidate.sourceProfileKey,
    targetProfileKey: candidate.targetProfileKey,
    distance: candidate.distance,
  };
};

export const filterUnambiguousReconciliationClaims = (claims: ReconciliationClaim[]): ReconciliationClaim[] => {
  const sourceCounts = new Map<string, number>();
  const targetCounts = new Map<string, number>();

  for (const claim of claims) {
    sourceCounts.set(claim.sourceIdentityId, (sourceCounts.get(claim.sourceIdentityId) ?? 0) + 1);
    targetCounts.set(claim.targetIdentityId, (targetCounts.get(claim.targetIdentityId) ?? 0) + 1);
  }

  return claims.filter(
    (claim) => sourceCounts.get(claim.sourceIdentityId) === 1 && targetCounts.get(claim.targetIdentityId) === 1,
  );
};
```

- [ ] **Step 4: Run the policy tests to verify GREEN**

Run:

```bash
pnpm --dir server test src/services/accessible-identity-reconciliation.spec.ts -- --run
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add server/src/services/accessible-identity-reconciliation.ts server/src/services/accessible-identity-reconciliation.spec.ts
git commit -m "test(server): cover accessible identity reconciliation policy"
```

---

### Task 2: Route Shared-Space Reconciliation Through The Policy

**Files:**

- Modify: `server/src/services/shared-space.service.ts`
- Modify: `server/src/services/shared-space.service.spec.ts`
- Test: `server/src/services/accessible-identity-reconciliation.spec.ts`

- [ ] **Step 1: Add RED shared-space policy boundary tests**

In `server/src/services/shared-space.service.spec.ts`, inside `describe('handleSharedSpaceIdentityReconciliation')`, add:

```ts
it('should skip member-scoped reconciliation when membership disappeared before the job runs', async () => {
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: 'space-1', faceRecognitionEnabled: true }));
  mocks.sharedSpace.getMember.mockResolvedValue(undefined);
  mocks.sharedSpace.getSpacePersonsWithEmbeddings.mockResolvedValue([
    {
      id: 'space-person-1',
      type: 'person',
      identityId: 'space-identity',
      isHidden: false,
      embedding: '[1,2,3]',
    },
  ] as any);

  await expect(
    sut.handleSharedSpaceIdentityReconciliation({ spaceId: 'space-1', userId: 'removed-member' }),
  ).resolves.toBe(JobStatus.Success);

  expect(mocks.search.searchFaces).not.toHaveBeenCalled();
  expect(mocks.faceIdentity.mergeIdentities).not.toHaveBeenCalled();
});

it('should choose the space identity as target for a strict member-join claim', async () => {
  setupStrictReconciliationFixture(mocks);

  await sut.handleSharedSpaceIdentityReconciliation({ spaceId: 'space-1', userId: 'member-1' });

  expect(mocks.faceIdentity.mergeIdentities).toHaveBeenCalledWith({
    targetIdentityId: 'space-identity',
    sourceIdentityIds: ['local-identity'],
    source: 'shared-space-evidence',
  });
});
```

- [ ] **Step 2: Run the focused shared-space tests to verify RED where needed**

Run:

```bash
pnpm --dir server test src/services/shared-space.service.spec.ts -- --run -t "membership disappeared|space identity as target|SharedSpaceIdentityReconciliation"
```

Expected: PASS for the current behavior. The required red coverage for this refactor is the Task 1 policy module failure; this step proves the service boundary remains stable before delegating to the shared policy.

- [ ] **Step 3: Import and use the policy helpers**

In `server/src/services/shared-space.service.ts`, add imports:

```ts
import {
  buildAutomaticReconciliationClaim,
  chooseAutomaticTargetIdentity,
  filterUnambiguousReconciliationClaims,
  type ReconciliationClaim,
} from 'src/services/accessible-identity-reconciliation';
```

Replace the local `SharedSpaceIdentityReconciliationClaim` type with:

```ts
type SharedSpaceIdentityReconciliationClaim = ReconciliationClaim & {
  spacePersonId: string;
};
```

Update `filterUnambiguousReconciliationClaims()` to delegate:

```ts
private filterUnambiguousReconciliationClaims(
  claims: SharedSpaceIdentityReconciliationClaim[],
): SharedSpaceIdentityReconciliationClaim[] {
  return filterUnambiguousReconciliationClaims(claims) as SharedSpaceIdentityReconciliationClaim[];
}
```

Inside `findStrictSpacePersonLocalIdentityClaim()`, replace the return object with target selection and policy claim creation:

```ts
const { sourceIdentityId, targetIdentityId: selectedTargetIdentityId } = chooseAutomaticTargetIdentity({
  bridge: 'member-join',
  localIdentityId: candidates[0].identityId,
  spaceIdentityId: targetIdentityId,
});

const claim = buildAutomaticReconciliationClaim({
  bridge: 'member-join',
  localIdentityId: candidates[0].identityId,
  spaceIdentityId: targetIdentityId,
  sourceIdentityId,
  targetIdentityId: selectedTargetIdentityId,
  sourceProfileKey: `user:${input.memberUserId}:${candidates[0].identityId}`,
  targetProfileKey: `space-person:${input.spacePerson.id}`,
  hasAccessBridge: true,
  compatibleType: true,
  hasEmbedding: true,
  hiddenOrIgnored: false,
  alreadySameIdentity: false,
  sameOwnerConflict: false,
  sameSpaceConflict: false,
});

return claim ? { ...claim, spacePersonId: input.spacePerson.id } : undefined;
```

Keep the existing repository conflict preflight in `applySharedSpaceIdentityReconciliationClaim()`. The service cannot know same-owner/same-space conflicts until it asks `FaceIdentityRepository`.

- [ ] **Step 4: Run shared-space and policy tests**

Run:

```bash
pnpm --dir server test src/services/accessible-identity-reconciliation.spec.ts src/services/shared-space.service.spec.ts -- --run -t "accessible identity reconciliation policy|SharedSpaceIdentityReconciliation"
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add server/src/services/accessible-identity-reconciliation.ts server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "refactor(server): share strict identity reconciliation policy"
```

---

### Task 3: Preserve Viewer-Owned Primary Profiles In Global People

**Files:**

- Modify: `server/test/medium/specs/services/people-identity-rbac.spec.ts`
- Modify: `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`
- Modify: `server/src/queries/face.identity.repository.sql`

- [ ] **Step 1: Add RED medium test for owned primary profile stability**

In `server/test/medium/specs/services/people-identity-rbac.spec.ts`, near the existing late-member tests, add:

First update `setupJoinAfterDuplicatesFixture()` so the test can drain jobs from the same `SharedSpaceService` instance:

```ts
const { sut: sharedSpaceService, jobs: sharedJobs } = setupSharedSpace();
```

Return `sharedJobs` from the fixture object:

```ts
return {
  ctx,
  personService,
  sharedSpaceService,
  sharedJobs,
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
```

Then add the regression test:

```ts
it('keeps viewer-owned primary profiles when a later member joins a named shared identity', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture();
  const { ctx, faceIdentityRepository, personService, sharedJobs, sharedSpaceService, space } = fixture;
  const { user: lateMember } = await ctx.newUser();
  const embedding = newEmbedding();

  await ctx.database
    .updateTable('person')
    .set({ name: '' })
    .where('id', 'in', [fixture.ownerPerson.id, fixture.memberPerson.id])
    .execute();

  await sharedSpaceService.handleSharedSpaceIdentityReconciliation({
    spaceId: space.id,
    userId: fixture.member.id,
  });

  const { result: lateMemberPerson } = await ctx.newPerson({ ownerId: lateMember.id, name: '' });
  const { asset: lateMemberAsset } = await ctx.newAsset({
    ownerId: lateMember.id,
    visibility: AssetVisibility.Timeline,
  });
  const { result: lateMemberFace } = await ctx.newAssetFace({
    assetId: lateMemberAsset.id,
    personId: lateMemberPerson.id,
  });
  await ctx.database.insertInto('face_search').values({ faceId: lateMemberFace, embedding }).execute();
  const lateMemberIdentity = await faceIdentityRepository.ensurePersonIdentity(lateMemberPerson.id);
  await faceIdentityRepository.linkFace({
    assetFaceId: lateMemberFace,
    identityId: lateMemberIdentity.id,
    source: 'owner-person',
  });

  await ctx.database
    .updateTable('face_search')
    .set({ embedding })
    .where('faceId', '=', fixture.spacePerson.representativeFaceId as string)
    .execute();

  await sharedSpaceService.addMember(authFor(fixture.owner), space.id, {
    userId: lateMember.id,
    role: SharedSpaceRole.Viewer,
  });

  const queuedJobs = sharedJobs.queue.mock.calls.map(([job]) => job);
  for (const job of queuedJobs) {
    if (job.name === 'SharedSpaceFaceMatchAll') {
      await sharedSpaceService.handleSharedSpaceFaceMatchAll(job.data);
    }
    if (job.name === 'SharedSpaceIdentityReconciliation') {
      await sharedSpaceService.handleSharedSpaceIdentityReconciliation(job.data);
    }
  }

  await expect(
    personService.getAll(authFor(fixture.owner), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any),
  ).resolves.toEqual(
    expect.objectContaining({
      people: [expect.objectContaining({ primaryProfile: { type: 'user-person', id: fixture.ownerPerson.id } })],
    }),
  );

  await expect(
    personService.getAll(authFor(fixture.member), {
      withHidden: false,
      withSharedSpaces: true,
      page: 1,
      size: 50,
    } as any),
  ).resolves.toEqual(
    expect.objectContaining({
      people: [expect.objectContaining({ primaryProfile: { type: 'user-person', id: fixture.memberPerson.id } })],
    }),
  );
});
```

- [ ] **Step 2: Add RED repository test for display name versus primary profile**

In `server/test/medium/specs/repositories/face-identity.repository.spec.ts`, add:

```ts
it('uses viewer-owned person as primary profile even when a space profile supplies the display name', async () => {
  const { ctx, sut } = setup();
  const { user: owner } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const embedding = newEmbedding();

  try {
    const { person: memberPerson } = await ctx.newPerson({ ownerId: member.id, name: '' });
    const memberIdentity = await sut.ensurePersonIdentity(memberPerson.id);
    const { asset: memberAsset } = await ctx.newAsset({ ownerId: member.id, visibility: AssetVisibility.Timeline });
    const { assetFace: memberFace } = await ctx.newAssetFace({ assetId: memberAsset.id, personId: memberPerson.id });
    await ctx.database.insertInto('face_search').values({ faceId: memberFace.id, embedding }).execute();
    await sut.linkFace({ assetFaceId: memberFace.id, identityId: memberIdentity.id, source: 'owner-person' });

    const { space } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const { asset: spaceAsset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: spaceAsset.id, addedById: owner.id });
    const { assetFace: spaceFace } = await ctx.newAssetFace({ assetId: spaceAsset.id });
    await ctx.database.insertInto('face_search').values({ faceId: spaceFace.id, embedding }).execute();
    await sut.linkFace({ assetFaceId: spaceFace.id, identityId: memberIdentity.id, source: 'shared-space-evidence' });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: memberIdentity.id,
        name: 'Shared Display Name',
        representativeFaceId: spaceFace.id,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: spaceFace.id })
      .execute();

    const result = await sut.getAccessiblePeople(member.id, {
      withHidden: false,
      page: 1,
      size: 50,
      minimumFaceCount: 1,
    });

    expect(result.people).toEqual([
      expect.objectContaining({
        name: 'Shared Display Name',
        primaryProfile: { type: 'user-person', id: memberPerson.id },
      }),
    ]);
  } finally {
    await ctx.database.deleteFrom('user').where('id', 'in', [owner.id, member.id]).execute();
  }
});
```

- [ ] **Step 3: Run focused medium tests to verify RED**

Run:

```bash
pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "viewer-owned person as primary|viewer-owned primary profiles"
```

Expected: FAIL because the resolver currently uses one ranked profile for both display metadata and primary profile selection.

- [ ] **Step 4: Split display profile from primary profile in `hydrateAccessiblePeople()`**

In `server/src/repositories/face-identity.repository.ts`, inside `hydrateAccessiblePeople()`, keep the existing `profiles` CTE but replace `ranked_profiles` with two ranked CTEs:

```sql
primary_profiles AS (
  SELECT
    profiles.*,
    row_number() OVER (
      PARTITION BY profiles."identityId"
      ORDER BY
        profiles."profileRank",
        NULLIF(profiles.name, '') IS NULL,
        lower(profiles.name),
        profiles."updatedAt" DESC,
        profiles."profileId"
    ) AS rn
  FROM profiles
  WHERE EXISTS (
    SELECT 1
    FROM accessible_faces
    WHERE accessible_faces."identityId" = profiles."identityId"
  )
),
display_profiles AS (
  SELECT
    profiles.*,
    row_number() OVER (
      PARTITION BY profiles."identityId"
      ORDER BY
        NULLIF(profiles.name, '') IS NULL,
        profiles."profileRank",
        lower(profiles.name),
        profiles."updatedAt" DESC,
        profiles."profileId"
    ) AS rn
  FROM profiles
  WHERE EXISTS (
    SELECT 1
    FROM accessible_faces
    WHERE accessible_faces."identityId" = profiles."identityId"
  )
)
```

Update the final select to use profile fields from `primary_profiles`, and display fields from `display_profiles`:

```sql
SELECT
  primary_profiles."profileType",
  primary_profiles."profileId",
  primary_profiles."spaceId",
  COALESCE(NULLIF(display_profiles.name, ''), primary_profiles.name, '') AS name,
  COALESCE(display_profiles."birthDate", primary_profiles."birthDate") AS "birthDate",
  primary_profiles."thumbnailPath",
  primary_profiles."isHidden",
  primary_profiles."isFavorite",
  primary_profiles.color,
  primary_profiles."updatedAt",
  primary_profiles.type,
  primary_profiles.species,
  asset_counts."numberOfAssets"
FROM requested_identities
INNER JOIN primary_profiles
  ON primary_profiles."identityId" = requested_identities."identityId"
  AND primary_profiles.rn = 1
INNER JOIN display_profiles
  ON display_profiles."identityId" = requested_identities."identityId"
  AND display_profiles.rn = 1
LEFT JOIN asset_counts ON asset_counts."identityId" = requested_identities."identityId"
ORDER BY requested_identities.ord
```

Do not remove access filters from `profiles` or `accessible_faces`.

- [ ] **Step 5: Keep identity page ordering based on display metadata**

In `getAccessiblePeopleIdentityPage()`, keep `best_profiles` display-oriented:

```sql
ORDER BY
  "identityId",
  NULLIF(name, '') IS NULL,
  "profileRank",
  lower(name),
  "updatedAt" DESC,
  "profileId"
```

This method chooses which identity ids are included and how they sort. It should not force unnamed local profiles to hide accessible shared names. Primary profile selection belongs in `hydrateAccessiblePeople()`.

- [ ] **Step 6: Run focused medium tests to verify GREEN**

Run:

```bash
pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "viewer-owned person as primary|viewer-owned primary profiles|late member join|join-after-duplicates"
```

Expected: PASS.

- [ ] **Step 7: Regenerate SQL snapshots**

Run:

```bash
pnpm --dir server build
pnpm --dir server sync:sql
```

Expected: commands exit 0. `server/src/queries/face.identity.repository.sql` contains the new `primary_profiles` and `display_profiles` CTEs for `FaceIdentityRepository.hydrateAccessiblePeople`.

- [ ] **Step 8: Commit Task 3**

Run:

```bash
git add server/src/repositories/face-identity.repository.ts server/src/queries/face.identity.repository.sql server/test/medium/specs/repositories/face-identity.repository.spec.ts server/test/medium/specs/services/people-identity-rbac.spec.ts
git commit -m "fix(server): keep owned people primary after shared identity joins"
```

---

### Task 4: Cover Late Member And Post-Join Upload Permutations

**Files:**

- Modify: `server/test/medium/specs/services/people-identity-rbac.spec.ts`
- Modify: `server/src/services/person.service.spec.ts`
- Modify: `server/src/services/person.service.ts`

- [ ] **Step 1: Add RED no-local/no-upload late member test**

In `server/test/medium/specs/services/people-identity-rbac.spec.ts`, add:

```ts
it('shows a late member the accessible space person without creating a local profile', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture();
  const { ctx, personService, sharedSpaceService, space } = fixture;
  const { user: lateMember } = await ctx.newUser();

  await sharedSpaceService.addMember(authFor(fixture.owner), space.id, {
    userId: lateMember.id,
    role: SharedSpaceRole.Viewer,
  });
  await sharedSpaceService.handleSharedSpaceIdentityReconciliation({ spaceId: space.id, userId: lateMember.id });

  const result = await personService.getAll(authFor(lateMember), {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  const localRows = await ctx.database.selectFrom('person').select('id').where('ownerId', '=', lateMember.id).execute();

  expect(localRows).toEqual([]);
  expect(result.people).toEqual([
    expect.objectContaining({
      primaryProfile: { type: 'space-person', id: fixture.spacePerson.id, spaceId: space.id },
      numberOfAssets: 1,
    }),
  ]);
});
```

- [ ] **Step 2: Add RED post-join private upload test**

In the same file, add:

```ts
it('links a post-join private upload with no prior local profile without changing existing members', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture();
  const { ctx, personService, sharedSpaceService, faceIdentityRepository, space } = fixture;
  const { user: uploader } = await ctx.newUser();
  const embedding = newEmbedding();

  await sharedSpaceService.handleSharedSpaceIdentityReconciliation({ spaceId: space.id, userId: fixture.member.id });
  await sharedSpaceService.addMember(authFor(fixture.owner), space.id, {
    userId: uploader.id,
    role: SharedSpaceRole.Viewer,
  });

  await ctx.database
    .updateTable('face_search')
    .set({ embedding })
    .where('faceId', '=', fixture.spacePerson.representativeFaceId as string)
    .execute();

  const { asset } = await ctx.newAsset({ ownerId: uploader.id, visibility: AssetVisibility.Timeline });
  const { result: uploadedFaceId } = await ctx.newAssetFace({ assetId: asset.id });
  await ctx.database.insertInto('face_search').values({ faceId: uploadedFaceId, embedding }).execute();

  await personService.handleRecognizeFaces({ id: uploadedFaceId });

  const uploaderPeople = await personService.getAll(authFor(uploader), {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  const ownerPeople = await personService.getAll(authFor(fixture.owner), {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  const memberPeople = await personService.getAll(authFor(fixture.member), {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  const uploadedPerson = await ctx.database
    .selectFrom('asset_face')
    .innerJoin('person', 'person.id', 'asset_face.personId')
    .select(['person.id', 'person.identityId'])
    .where('asset_face.id', '=', uploadedFaceId)
    .executeTakeFirstOrThrow();

  expect(uploaderPeople.people).toHaveLength(1);
  expect(uploaderPeople.people[0]).toEqual(
    expect.objectContaining({
      primaryProfile: { type: 'user-person', id: uploadedPerson.id },
      numberOfAssets: 2,
    }),
  );
  expect(ownerPeople.people).toEqual([
    expect.objectContaining({ primaryProfile: { type: 'user-person', id: fixture.ownerPerson.id } }),
  ]);
  expect(memberPeople.people).toEqual([
    expect.objectContaining({ primaryProfile: { type: 'user-person', id: fixture.memberPerson.id } }),
  ]);

  const targetIdentity = await faceIdentityRepository.ensurePersonIdentity(fixture.ownerPerson.id);
  expect(uploadedPerson.identityId).toBe(targetIdentity.id);
});
```

- [ ] **Step 3: Add RED post-join add-to-space test**

In the same file, add:

```ts
it('keeps one visible person when a post-join upload is added to the space', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture();
  const { ctx, personService, sharedSpaceService, space } = fixture;
  const { user: uploader } = await ctx.newUser();
  const embedding = newEmbedding();

  await sharedSpaceService.addMember(authFor(fixture.owner), space.id, {
    userId: uploader.id,
    role: SharedSpaceRole.Viewer,
  });
  await ctx.database
    .updateTable('face_search')
    .set({ embedding })
    .where('faceId', '=', fixture.spacePerson.representativeFaceId as string)
    .execute();

  const { asset } = await ctx.newAsset({ ownerId: uploader.id, visibility: AssetVisibility.Timeline });
  const { result: uploadedFaceId } = await ctx.newAssetFace({ assetId: asset.id });
  await ctx.database.insertInto('face_search').values({ faceId: uploadedFaceId, embedding }).execute();

  await personService.handleRecognizeFaces({ id: uploadedFaceId });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: uploader.id });
  await sharedSpaceService.handleSharedSpaceFaceMatch({ spaceId: space.id, assetId: asset.id });
  await sharedSpaceService.handleSharedSpaceIdentityReconciliation({ spaceId: space.id });

  const uploaderPeople = await personService.getAll(authFor(uploader), {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);
  const spacePeople = await sharedSpaceService.getSpacePeople(authFor(uploader), space.id);

  expect(uploaderPeople.people).toHaveLength(1);
  expect(spacePeople).toHaveLength(1);
  expect(spacePeople[0]).toEqual(expect.objectContaining({ id: fixture.spacePerson.id }));
});
```

- [ ] **Step 4: Run the new medium tests to verify RED**

Run:

```bash
pnpm --dir server test:medium test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "without creating a local profile|post-join private upload|post-join upload is added to the space"
```

Expected: At least one test fails on the current broken behavior. If all three pass, keep them as regression coverage and continue to Step 7.

- [ ] **Step 5: Add focused person-service unit test for the upload path**

In `server/src/services/person.service.spec.ts`, add or update:

```ts
it('uses strict accessible shared identity matching after creating a local person for a post-join upload', async () => {
  const asset = AssetFactory.create({ ownerId: 'uploader-1', visibility: AssetVisibility.Timeline });
  const face = AssetFaceFactory.create({ id: 'face-1', assetId: asset.id, personId: null });

  mocks.systemMetadata.get.mockResolvedValue({
    machineLearning: { facialRecognition: { minFaces: 1, maxDistance: 0.5, enabled: true } },
  } as any);
  mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(face, asset));
  mocks.search.searchFaces.mockResolvedValue([{ id: 'face-1', personId: null, distance: 0 }]);
  mocks.person.create.mockResolvedValue(factory.person({ id: 'local-person-1', ownerId: asset.ownerId }));
  mocks.faceIdentity.ensurePersonIdentity.mockResolvedValue({ id: 'local-identity', type: 'person' } as any);
  mocks.faceIdentity.findClosestAccessibleIdentityForFace.mockResolvedValue({
    identityId: 'space-identity',
    type: 'person',
    distance: 0.2,
  });
  mocks.faceIdentity.mergeIdentities.mockResolvedValue({
    personalProfileConflictCount: 0,
    spaceProfileConflictCount: 0,
  });

  await sut.handleRecognizeFaces({ id: face.id });

  expect(mocks.faceIdentity.mergeIdentities).toHaveBeenCalledWith({
    targetIdentityId: 'space-identity',
    sourceIdentityIds: ['local-identity'],
    source: 'shared-space-evidence',
  });
});
```

- [ ] **Step 6: Route upload merge through the central policy**

Update `mergeWithAccessibleSharedIdentity()` in `server/src/services/person.service.ts` to use the central policy:

```ts
const claim = buildAutomaticReconciliationClaim({
  bridge: 'personal-upload',
  localIdentityId: input.sourceIdentityId,
  spaceIdentityId: match.identityId,
  sourceIdentityId: input.sourceIdentityId,
  targetIdentityId: match.identityId,
  hasAccessBridge: true,
  compatibleType: true,
  hasEmbedding: true,
  hiddenOrIgnored: false,
  alreadySameIdentity: match.identityId === input.sourceIdentityId,
  sameOwnerConflict: false,
  sameSpaceConflict: false,
  distance: match.distance,
});
if (!claim) {
  return;
}

const result = await this.faceIdentityRepository.mergeIdentities({
  targetIdentityId: claim.targetIdentityId,
  sourceIdentityIds: [claim.sourceIdentityId],
  source: 'shared-space-evidence',
});
```

Keep the existing conflict warning and metadata backfill.

- [ ] **Step 7: Run focused tests to verify GREEN**

Run:

```bash
pnpm --dir server test src/services/person.service.spec.ts -- --run -t "post-join upload|accessible shared identity"
pnpm --dir server test:medium test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "without creating a local profile|post-join private upload|post-join upload is added to the space|late member join"
```

Expected: PASS.

- [ ] **Step 8: Commit Task 4**

Run:

```bash
git add server/src/services/person.service.ts server/src/services/person.service.spec.ts server/test/medium/specs/services/people-identity-rbac.spec.ts
git commit -m "test(server): cover post-join identity upload convergence"
```

If `server/src/services/person.service.ts` did not change because tests were already green, omit it from `git add` and keep the commit message as written.

---

### Task 5: Cover Linked-Library Photo Sources

**Files:**

- Modify: `server/test/medium/specs/services/people-identity-rbac.spec.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`
- Modify: `server/src/services/shared-space.service.ts`
- Modify: `server/src/queries/face.identity.repository.sql`

In this codebase, external library photo evidence enters shared spaces through linked libraries (`shared_space_library`). Treat that path as equivalent to direct shared-space assets for reconciliation, global people, counts, thumbnails, and access loss.

- [ ] **Step 1: Extend the linked-library fixture for late-member tests**

In `server/test/medium/specs/services/people-identity-rbac.spec.ts`, update `createLinkedLibraryIdentityFixture()` so it can create the linked-library space before the tested member joins:

```ts
const createLinkedLibraryIdentityFixture = async (input?: {
  city?: string;
  personName?: string;
  memberInitiallyJoined?: boolean;
}) => {
  const { ctx, sut: personService, faceIdentityRepository } = setup();
  const { sut: sharedSpaceService, jobs: sharedJobs } = setupSharedSpace();
  const { sut: searchService } = setupSearch();
  const { user: source } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { user: nonMember } = await ctx.newUser();
  const { library } = await ctx.newLibrary({ ownerId: source.id });
  const { space } = await ctx.newSharedSpace({ createdById: source.id });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
  if (input?.memberInitiallyJoined ?? true) {
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
  }
  const face = await createIdentityBackedFace(ctx, faceIdentityRepository, {
    ownerId: source.id,
    libraryId: library.id,
    personName: input?.personName ?? 'Library Source',
  });
  if (input?.city) {
    await ctx.newExif({ assetId: face.asset.id, city: input.city, country: 'Switzerland' });
  }
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: source.id });
  await sharedSpaceService.handleSharedSpaceLibraryFaceSync({ spaceId: space.id, libraryId: library.id });
  const spacePerson = await ctx.database
    .selectFrom('shared_space_person')
    .selectAll()
    .where('spaceId', '=', space.id)
    .executeTakeFirstOrThrow();

  return {
    ctx,
    personService,
    sharedSpaceService,
    sharedJobs,
    searchService,
    source,
    member,
    nonMember,
    library,
    space,
    face,
    spacePerson,
    faceIdentityRepository,
  };
};
```

- [ ] **Step 2: Add RED linked-library post-join private upload test**

In the same file, add:

```ts
it('links a post-join private upload to a linked-library space identity and preserves owned access after leave', async () => {
  const fx = await createLinkedLibraryIdentityFixture({ personName: 'Library Source' });
  const embeddingRow = await fx.ctx.database
    .selectFrom('face_search')
    .select('embedding')
    .where('faceId', '=', fx.face.faceId)
    .executeTakeFirstOrThrow();

  const { asset } = await fx.ctx.newAsset({ ownerId: fx.member.id, visibility: AssetVisibility.Timeline });
  const { result: uploadedFaceId } = await fx.ctx.newAssetFace({ assetId: asset.id });
  await fx.ctx.database
    .insertInto('face_search')
    .values({ faceId: uploadedFaceId, embedding: embeddingRow.embedding })
    .execute();

  await fx.personService.handleRecognizeFaces({ id: uploadedFaceId });

  const uploadedPerson = await fx.ctx.database
    .selectFrom('asset_face')
    .innerJoin('person', 'person.id', 'asset_face.personId')
    .select(['person.id', 'person.identityId'])
    .where('asset_face.id', '=', uploadedFaceId)
    .executeTakeFirstOrThrow();
  const withSpace = await fx.personService.getAll(authFor(fx.member), {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);

  expect(withSpace.people).toEqual([
    expect.objectContaining({
      primaryProfile: { type: 'user-person', id: uploadedPerson.id },
      numberOfAssets: 2,
    }),
  ]);

  await fx.ctx.database
    .deleteFrom('shared_space_member')
    .where('spaceId', '=', fx.space.id)
    .where('userId', '=', fx.member.id)
    .execute();

  const afterLeave = await fx.personService.getAll(authFor(fx.member), {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);

  expect(afterLeave.people).toEqual([
    expect.objectContaining({
      primaryProfile: { type: 'user-person', id: uploadedPerson.id },
      numberOfAssets: 1,
    }),
  ]);
  expect(JSON.stringify(afterLeave)).not.toContain(fx.spacePerson.id);
});
```

- [ ] **Step 3: Add RED linked-library late-member local reconciliation test**

In the same file, add:

```ts
it('reconciles a late member local person against linked-library space evidence', async () => {
  const fx = await createLinkedLibraryIdentityFixture({ memberInitiallyJoined: false });
  const embeddingRow = await fx.ctx.database
    .selectFrom('face_search')
    .select('embedding')
    .where('faceId', '=', fx.face.faceId)
    .executeTakeFirstOrThrow();

  const { result: memberPerson } = await fx.ctx.newPerson({ ownerId: fx.member.id, name: 'Member Private Name' });
  const { asset: memberAsset } = await fx.ctx.newAsset({
    ownerId: fx.member.id,
    visibility: AssetVisibility.Timeline,
  });
  const { result: memberFace } = await fx.ctx.newAssetFace({ assetId: memberAsset.id, personId: memberPerson.id });
  await fx.ctx.database
    .insertInto('face_search')
    .values({ faceId: memberFace, embedding: embeddingRow.embedding })
    .execute();
  const memberIdentity = await fx.faceIdentityRepository.ensurePersonIdentity(memberPerson.id);
  await fx.faceIdentityRepository.linkFace({
    assetFaceId: memberFace,
    identityId: memberIdentity.id,
    source: 'owner-person',
  });

  await fx.sharedSpaceService.addMember(authFor(fx.source), fx.space.id, {
    userId: fx.member.id,
    role: SharedSpaceRole.Viewer,
  });
  await fx.sharedSpaceService.handleSharedSpaceIdentityReconciliation({
    spaceId: fx.space.id,
    userId: fx.member.id,
  });

  const result = await fx.personService.getAll(authFor(fx.member), {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);

  expect(result.people).toEqual([
    expect.objectContaining({
      primaryProfile: { type: 'user-person', id: memberPerson.id },
      numberOfAssets: 2,
    }),
  ]);
});
```

- [ ] **Step 4: Run linked-library tests to observe RED/GREEN state**

Run:

```bash
pnpm --dir server test:medium test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "linked-library space identity|linked-library space evidence|linked-library"
```

Expected: the new tests fail if linked-library evidence does not participate in the same reconciliation and accessible-people paths as direct space assets. If they pass, keep them as regression coverage and do not change production code in this task.

- [ ] **Step 5: Implement concrete linked-library fixes if the tests fail**

If the post-join private upload test fails, ensure `FaceIdentityRepository.findClosestAccessibleIdentityForFace()` treats linked-library assets as accessible evidence for timeline-enabled members by keeping this branch inside the asset access predicate:

```sql
OR EXISTS (
  SELECT 1
  FROM shared_space_library
  INNER JOIN shared_space_member
    ON shared_space_member."spaceId" = shared_space_library."spaceId"
    AND shared_space_member."userId" = ${input.userId}
    AND shared_space_member."showInTimeline" = true
  WHERE shared_space_library."libraryId" = asset."libraryId"
)
```

If global counts or primary profiles are wrong, keep the same linked-library access branch in `getAccessiblePeopleIdentityPage()`, `hydrateAccessiblePeople()`, and `getAccessiblePeopleCounts()`.

If late-member reconciliation misses existing linked-library space people, ensure `handleSharedSpaceLibraryFaceSync()` keeps this queue when it creates or updates any space people:

```ts
if (affectedAny) {
  await this.queueSpaceIdentityReconciliation({ spaceId: job.spaceId });
}
```

- [ ] **Step 6: Run linked-library tests to verify GREEN**

Run:

```bash
pnpm --dir server test:medium test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "linked-library space identity|linked-library space evidence|linked-library"
```

Expected: PASS.

- [ ] **Step 7: Regenerate SQL snapshots if repository SQL changed**

Run only when `server/src/repositories/face-identity.repository.ts` changed in this task:

```bash
pnpm --dir server build
pnpm --dir server sync:sql
```

Expected: commands exit 0. Only intentional `server/src/queries/face.identity.repository.sql` changes remain.

- [ ] **Step 8: Commit Task 5**

Run:

```bash
git add server/test/medium/specs/services/people-identity-rbac.spec.ts server/src/repositories/face-identity.repository.ts server/src/services/shared-space.service.ts server/src/queries/face.identity.repository.sql
git commit -m "test(server): cover linked library identity reconciliation"
```

If a listed production file did not change, omit it from `git add`.

---

### Task 6: Add Ambiguity, Access-Loss, And Race Edge Coverage

**Files:**

- Modify: `server/src/services/accessible-identity-reconciliation.spec.ts`
- Modify: `server/src/services/shared-space.service.spec.ts`
- Modify: `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
- Modify: `server/test/medium/specs/services/people-identity-rbac.spec.ts`
- Modify: `server/src/services/shared-space.service.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`
- Modify: `server/src/queries/face.identity.repository.sql`

- [ ] **Step 1: Expand RED policy unit tests for ambiguity and merge failure**

In `server/src/services/accessible-identity-reconciliation.spec.ts`, add:

```ts
it('counts multiple profiles on the same identity as one candidate outside claim filtering', () => {
  const claims: ReconciliationClaim[] = [
    {
      bridge: 'personal-upload',
      sourceIdentityId: 'local-identity',
      targetIdentityId: 'shared-identity',
      sourceProfileKey: 'user:u1:p1',
      targetProfileKey: 'space:s1:sp1',
    },
  ];

  expect(filterUnambiguousReconciliationClaims(claims)).toEqual(claims);
});

it('drops target-to-multiple-source claims', () => {
  const claims: ReconciliationClaim[] = [
    {
      bridge: 'space-evidence',
      sourceIdentityId: 'source-1',
      targetIdentityId: 'target',
      sourceProfileKey: 'user:u1:p1',
      targetProfileKey: 'space:s1:sp1',
    },
    {
      bridge: 'space-evidence',
      sourceIdentityId: 'source-2',
      targetIdentityId: 'target',
      sourceProfileKey: 'user:u2:p2',
      targetProfileKey: 'space:s1:sp1',
    },
  ];

  expect(filterUnambiguousReconciliationClaims(claims)).toEqual([]);
});
```

- [ ] **Step 2: Add RED repository test for two accessible profiles with one identity**

In `server/test/medium/specs/repositories/face-identity.repository.spec.ts`, add:

```ts
it('treats two accessible space profiles on the same identity as one strict upload candidate', async () => {
  const { ctx, sut } = setup();
  const { user: member } = await ctx.newUser();
  const { user: owner } = await ctx.newUser();
  const embedding = newEmbedding();

  try {
    const first = await createAccessibleSpaceIdentity(ctx, sut, {
      memberUserId: member.id,
      ownerUserId: owner.id,
      embedding,
    });
    const { space: secondSpace } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: secondSpace.id, userId: owner.id, role: SharedSpaceRole.Owner });
    await ctx.newSharedSpaceMember({ spaceId: secondSpace.id, userId: member.id, role: SharedSpaceRole.Viewer });
    const { asset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
    await ctx.newSharedSpaceAsset({ spaceId: secondSpace.id, assetId: asset.id, addedById: owner.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
    await ctx.database.insertInto('face_search').values({ faceId: assetFace.id, embedding }).execute();
    await sut.linkFace({ assetFaceId: assetFace.id, identityId: first.identity.id, source: 'owner-person' });
    const secondSpacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: secondSpace.id,
        identityId: first.identity.id,
        representativeFaceId: assetFace.id,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: secondSpacePerson.id, assetFaceId: assetFace.id })
      .execute();

    await expect(
      sut.findClosestAccessibleIdentityForFace({
        userId: member.id,
        embedding,
        maxDistance: 0.5,
        type: 'person',
        excludeIdentityId: null,
      }),
    ).resolves.toEqual(expect.objectContaining({ identityId: first.identity.id }));
  } finally {
    await ctx.database.deleteFrom('user').where('id', 'in', [member.id, owner.id]).execute();
  }
});
```

- [ ] **Step 3: Add RED medium test for access change during queued reconciliation**

In `server/test/medium/specs/services/people-identity-rbac.spec.ts`, add:

```ts
it('does not merge or surface stale space profiles when membership is removed before reconciliation runs', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture();

  await fixture.ctx.database
    .deleteFrom('shared_space_member')
    .where('spaceId', '=', fixture.space.id)
    .where('userId', '=', fixture.member.id)
    .execute();

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

  expect(result.people).toEqual([
    expect.objectContaining({
      primaryProfile: { type: 'user-person', id: fixture.memberPerson.id },
      numberOfAssets: 1,
    }),
  ]);
});
```

- [ ] **Step 4: Add RED representative-face repair coverage**

In the existing stale-space-person section of `people-identity-rbac.spec.ts`, add:

```ts
it('repairs missing space representative faces before global people hydration', async () => {
  const fixture = await setupJoinAfterDuplicatesFixture();

  await fixture.ctx.database
    .updateTable('shared_space_person')
    .set({ representativeFaceId: null, representativeFaceSource: 'auto' })
    .where('id', '=', fixture.spacePerson.id)
    .execute();
  await fixture.sharedSpaceService.handleSharedSpacePersonDedup({ spaceId: fixture.space.id });

  const result = await fixture.personService.getAll(fixture.memberAuth, {
    withHidden: false,
    withSharedSpaces: true,
    page: 1,
    size: 50,
  } as any);

  expect(result.people).toEqual([
    expect.objectContaining({
      primaryProfile: { type: 'user-person', id: fixture.memberPerson.id },
      numberOfAssets: 2,
    }),
  ]);
});
```

- [ ] **Step 5: Add RED medium matrix coverage for remaining ambiguity and ordering cases**

In `server/test/medium/specs/services/people-identity-rbac.spec.ts` and `server/test/medium/specs/repositories/face-identity.repository.spec.ts`, keep or add focused tests for the rest of the design matrix:

- same-name non-strict embedding match does not auto-merge
- two local candidates matching one space person does not auto-merge
- same-owner personal conflict and same-space profile conflict skip automatic reconciliation
- hidden, ignored, deleted, and incompatible-type candidates are skipped without throwing
- member leave and rejoin preserves owned visibility and converges back to one visible global person
- timeline-disabled space does not influence global personal-upload matching but explicit space actions still work
- space disabled, member removed, asset removed, or face deleted while a job is queued yields a skip or retryable no-op without stale visibility
- concurrent reconciliation jobs for the same identity pair no-op cleanly after one merge wins
- search suggestions, filter suggestions, album/map-style person filters, and person search group by accessible identity and do not expose raw `face_identity.id`
- stale global rows backed by inaccessible space profiles stop resolving for the viewer, while owned-profile rows still resolve

Manual ambiguity remains repairable through the scoped same-person repair flow in Task 8, not through automatic reconciliation.

- [ ] **Step 6: Run focused tests to verify RED/GREEN state**

Run:

```bash
pnpm --dir server test src/services/accessible-identity-reconciliation.spec.ts src/services/shared-space.service.spec.ts -- --run -t "multiple profiles|multiple-source|membership disappeared|no-op when a repeated reconciliation"
pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "same identity as one strict upload candidate|membership is removed before reconciliation|repairs missing space representative|concurrent reconciliation|same-name non-strict|two local candidates|same-owner conflict|same-space conflict|hidden candidate|type mismatch|leave and rejoin|asset removed|face deleted|search suggestions|filter suggestions|raw face identity|stale global row"
```

Expected: Policy tests should pass after Task 1/2. Medium tests may fail if repository query behavior or repair handling is incomplete.

- [ ] **Step 7: Implement smallest backend fixes if Step 6 fails**

If the same-identity multi-space candidate fails, update `findClosestAccessibleIdentityForFace()` so it groups by `identityId` before applying `LIMIT 2`, which it should already do. Keep the shape:

```sql
WITH identity_matches AS (
  SELECT shared_space_person."identityId" AS "identityId", MIN(face_search.embedding <=> ${input.embedding})::float8 AS distance
  FROM shared_space_person
  ...
  GROUP BY shared_space_person."identityId", shared_space_person.type
)
SELECT "identityId", type, distance
FROM identity_matches
WHERE distance <= ${input.maxDistance}
ORDER BY distance
LIMIT 2
```

If representative-face repair fails, call the existing repair methods before global people hydration or before the reconciliation path that depends on representative faces. Prefer the existing explicit job path:

```ts
await this.sharedSpaceRepository.repairInvalidRepresentativeFaces(job.spaceId);
await this.sharedSpaceRepository.repairOrphanedRepresentativeFaces(job.spaceId);
```

Do not create stale global rows for space people without backing `shared_space_person_face` rows.

- [ ] **Step 8: Run focused tests to verify GREEN**

Run:

```bash
pnpm --dir server test src/services/accessible-identity-reconciliation.spec.ts src/services/shared-space.service.spec.ts -- --run -t "accessible identity reconciliation policy|SharedSpaceIdentityReconciliation|no-op when a repeated reconciliation"
pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "same identity as one strict upload candidate|membership is removed before reconciliation|repairs missing space representative|multiple shared identities|timeline-disabled|concurrent reconciliation|same-name non-strict|two local candidates|same-owner conflict|same-space conflict|hidden candidate|type mismatch|leave and rejoin|asset removed|face deleted|search suggestions|filter suggestions|raw face identity|stale global row"
```

Expected: PASS.

- [ ] **Step 9: Regenerate SQL snapshots if repository SQL changed**

Run only if `server/src/repositories/face-identity.repository.ts` changed in this task:

```bash
pnpm --dir server build
pnpm --dir server sync:sql
```

Expected: commands exit 0. Only intentional query snapshots change.

- [ ] **Step 10: Commit Task 6**

Run:

```bash
git add server/src/services/accessible-identity-reconciliation.spec.ts server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts server/src/repositories/face-identity.repository.ts server/src/queries/face.identity.repository.sql server/test/medium/specs/repositories/face-identity.repository.spec.ts server/test/medium/specs/services/people-identity-rbac.spec.ts
git commit -m "test(server): cover identity reconciliation edge cases"
```

If a listed file did not change, omit it from `git add`.

---

### Task 7: Route Global People Surfaces To Identity-Wide Detail

**Files:**

- Create: `web/src/lib/utils/global-person-route.ts`
- Create: `web/src/lib/utils/global-person-route.spec.ts`
- Modify: `web/src/routes/(user)/explore/+page.svelte`
- Modify: `web/src/routes/(user)/explore/explore-page.spec.ts`
- Modify: `web/src/routes/(user)/people/+page.svelte`
- Modify: `web/src/routes/(user)/people/people-page.spec.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`

- [ ] **Step 1: Write RED route utility tests**

Create `web/src/lib/utils/global-person-route.spec.ts`:

```ts
import { Type, type PersonResponseDto } from '@immich/sdk';
import { getGlobalPersonHref, getGlobalPersonThumbnailUrl } from '$lib/utils/global-person-route';

const makePerson = (overrides: Partial<PersonResponseDto> = {}): PersonResponseDto =>
  ({
    id: 'identity-row-1',
    name: 'Shared Name',
    updatedAt: '2026-01-02T00:00:00.000Z',
    isHidden: false,
    isFavorite: false,
    type: 'person',
    ...overrides,
  }) as PersonResponseDto;

describe('global person route helpers', () => {
  it('routes user-primary rows to identity-wide personal detail', () => {
    expect(
      getGlobalPersonHref(makePerson({ primaryProfile: { type: Type.UserPerson, id: 'person-1' } }), '/people'),
    ).toBe('/people/person-1?previousRoute=%2Fpeople');
  });

  it('routes space-primary rows to identity-wide global detail, not explicit space detail', () => {
    expect(
      getGlobalPersonHref(
        makePerson({ primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' } }),
        '/explore',
      ),
    ).toBe('/people/space-person-1?previousRoute=%2Fexplore');
  });

  it('uses accessible shared-space thumbnail endpoint for space-primary rows', () => {
    expect(
      getGlobalPersonThumbnailUrl(
        makePerson({
          primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' },
        }),
      ),
    ).toBe('/api/shared-spaces/space-1/people/space-person-1/thumbnail?updatedAt=2026-01-02T00%3A00%3A00.000Z');
  });
});
```

- [ ] **Step 2: Run route utility test to verify RED**

Run:

```bash
pnpm --dir web test src/lib/utils/global-person-route.spec.ts -- --run
```

Expected: FAIL with module-not-found for `$lib/utils/global-person-route`.

- [ ] **Step 3: Implement route utility**

Create `web/src/lib/utils/global-person-route.ts`:

```ts
import { Route } from '$lib/route';
import { createUrl, getPeopleThumbnailUrl } from '$lib/utils';
import { type PersonResponseDto } from '@immich/sdk';

export const getGlobalPersonProfileId = (person: Pick<PersonResponseDto, 'id' | 'primaryProfile'>) =>
  person.primaryProfile?.id ?? person.id;

export const getGlobalPersonHref = (person: Pick<PersonResponseDto, 'id' | 'primaryProfile'>, previousRoute?: string) =>
  Route.viewPerson({ id: getGlobalPersonProfileId(person) }, previousRoute ? { previousRoute } : undefined);

export const getGlobalPersonThumbnailUrl = (person: Pick<PersonResponseDto, 'id' | 'primaryProfile' | 'updatedAt'>) => {
  const profile = person.primaryProfile;
  if (profile?.type === 'space-person' && profile.spaceId) {
    return createUrl(`/shared-spaces/${profile.spaceId}/people/${profile.id}/thumbnail`, {
      updatedAt: person.updatedAt,
    });
  }

  return getPeopleThumbnailUrl({ ...person, id: getGlobalPersonProfileId(person) });
};
```

- [ ] **Step 4: Run route utility test to verify GREEN**

Run:

```bash
pnpm --dir web test src/lib/utils/global-person-route.spec.ts -- --run
```

Expected: PASS.

- [ ] **Step 5: Write RED page/manager tests**

Update `web/src/routes/(user)/people/people-page.spec.ts` so the space-primary global people route expects identity-wide detail:

```ts
expect(screen.getByRole('link', { name: 'Shared Alice' })).toHaveAttribute(
  'href',
  '/people/space-person-1?previousRoute=%2Fpeople',
);
```

Update `web/src/lib/managers/global-search-manager.svelte.spec.ts` space-primary navigation expectation:

```ts
expect(goto).toHaveBeenCalledWith('/people/space-person-1');
```

Keep `web/src/routes/(user)/explore/explore-page.spec.ts` asserting:

```ts
expect(screen.getByRole('link', { name: 'Shared Alice' })).toHaveAttribute(
  'href',
  '/people/space-person-1?previousRoute=%2Fexplore',
);
expect(document.querySelector('img')).toHaveAttribute(
  'src',
  '/api/shared-spaces/space-1/people/space-person-1/thumbnail?updatedAt=2026-01-02T00%3A00%3A00.000Z',
);
```

- [ ] **Step 6: Run web tests to verify RED**

Run:

```bash
pnpm --dir web test 'src/routes/(user)/people/people-page.spec.ts' 'src/routes/(user)/explore/explore-page.spec.ts' src/lib/managers/global-search-manager.svelte.spec.ts -- --run -t "space-primary|identity-wide|person route|shared-space thumbnail"
```

Expected: `people-page.spec.ts` and `global-search-manager.svelte.spec.ts` fail because they still route space-primary global rows to explicit space detail.

- [ ] **Step 7: Update global surfaces**

In `web/src/routes/(user)/explore/+page.svelte`, replace local helpers with imports:

```ts
import { getGlobalPersonHref, getGlobalPersonThumbnailUrl } from '$lib/utils/global-person-route';
```

Use:

```svelte
<a href={getGlobalPersonHref(person, Route.explore())} class="text-center relative">
  <ImageThumbnail circle shadow url={getGlobalPersonThumbnailUrl(person)} altText={person.name} widthStyle="100%" />
</a>
```

In `web/src/routes/(user)/people/+page.svelte`, use:

```ts
import { getGlobalPersonHref, getGlobalPersonThumbnailUrl } from '$lib/utils/global-person-route';
```

Replace `getPersonHref()` and `getPersonThumbnail()` bodies with:

```ts
const getPersonHref = (person: PersonResponseDto) => getGlobalPersonHref(person, Route.people());
const getPersonThumbnail = (person: PersonResponseDto) => getGlobalPersonThumbnailUrl(person);
```

In `web/src/lib/managers/global-search-manager.svelte.ts`, replace `getPersonRoute()` with:

```ts
function getPersonRoute(person: Pick<PersonResponseDto, 'id' | 'primaryProfile' | 'filterId'>): string {
  return getGlobalPersonHref(person);
}
```

Add the import:

```ts
import { getGlobalPersonHref } from '$lib/utils/global-person-route';
```

Do not change explicit space page links under `web/src/routes/(user)/spaces/**`.

- [ ] **Step 8: Run web tests to verify GREEN**

Run:

```bash
pnpm --dir web test src/lib/utils/global-person-route.spec.ts 'src/routes/(user)/people/people-page.spec.ts' 'src/routes/(user)/explore/explore-page.spec.ts' src/lib/managers/global-search-manager.svelte.spec.ts -- --run -t "global person route|space-primary|identity-wide|person route|shared-space thumbnail"
```

Expected: PASS.

- [ ] **Step 9: Commit Task 7**

Run:

```bash
git add web/src/lib/utils/global-person-route.ts web/src/lib/utils/global-person-route.spec.ts 'web/src/routes/(user)/explore/+page.svelte' 'web/src/routes/(user)/explore/explore-page.spec.ts' 'web/src/routes/(user)/people/+page.svelte' 'web/src/routes/(user)/people/people-page.spec.ts' web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts
git commit -m "fix(web): route global people to identity-wide detail"
```

---

### Task 8: Preserve Manual Scoped Repair For Personal And Space Profiles

**Files:**

- Modify: `server/src/controllers/person.controller.spec.ts`
- Modify: `server/src/services/person.service.ts`
- Modify: `server/src/repositories/face-identity.repository.ts`
- Modify: `server/test/medium/specs/services/people-identity-rbac.spec.ts`
- Modify: `web/src/lib/modals/PersonMergeSuggestionModal.svelte`
- Modify: `web/src/lib/modals/person-merge-suggestion-modal.spec.ts`
- Modify: `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Modify: `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts`

- [ ] **Step 1: Add RED controller coverage for scoped repair DTOs**

In `server/src/controllers/person.controller.spec.ts`, keep or add coverage that `/people/same-person`:

- accepts a personal target with a space-person source including `spaceId`
- delegates to `PersonService.mergeScopedPeople()`
- rejects raw identity refs
- rejects space-person refs without `spaceId`

Run:

```bash
pnpm --dir server test src/controllers/person.controller.spec.ts -- --run -t "same-person|scoped personal and space people|raw identity|spaceId"
```

Expected: FAIL if the route or DTO validation is missing. If the tests already pass, keep them as regression coverage and continue.

- [ ] **Step 2: Add RED medium coverage for manual personal/space repair**

In `server/test/medium/specs/services/people-identity-rbac.spec.ts`, keep or add a `repair RBAC` section covering:

- viewer role cannot repair a space person into a personal profile
- owner and editor roles can repair a space person into their own accessible personal profile without throwing
- user cannot repair another user's personal profile
- admin status alone does not grant repair access to a space person
- successful repair leaves scoped profiles in their original tables and only merges identity links

Run:

```bash
pnpm --dir server test:medium test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "repair RBAC|can repair that Space Person|cannot repair|admin who is not a member"
```

Expected: FAIL if personal/space manual repair still throws or bypasses scoped-profile RBAC.

- [ ] **Step 3: Add RED web coverage for scoped repair dispatch**

Cover all user-facing manual merge entry points:

- `web/src/lib/modals/person-merge-suggestion-modal.spec.ts`
  - space-primary suggestion uses `mergeScopedPeople()`
  - personal-only suggestion still uses `mergePerson()`
- `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts`
  - personal target plus space candidate uses `mergeScopedPeople()`
  - auto-swap still keeps the page person as the repair target
- `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts`
  - space target plus personal candidate uses `mergeScopedPeople()`
  - same-space space-person merge keeps using `mergeSpacePeople()`

Run:

```bash
pnpm --dir web test src/lib/modals/person-merge-suggestion-modal.spec.ts 'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts' 'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts' -- --run -t "same-person repair|personal merge|space person merged with a personal candidate|same space|shared spaces enabled"
```

Expected: FAIL if any cross-scope merge path calls the legacy personal merge endpoint or the space-only merge endpoint.

- [ ] **Step 4: Implement scoped repair fixes if the tests fail**

Backend:

- Keep `/people/same-person` accepting only scoped profile refs: `{ type: 'person', id }` and `{ type: 'space-person', id, spaceId }`.
- In `PersonService.mergeScopedPeople()`, resolve all refs through `FaceIdentityRepository.resolveRepairRefs(actorUserId, dto)`.
- Require every attached profile on the involved identities to be repairable by the actor.
- Reject same-owner personal conflicts and same-space profile conflicts before `mergeIdentities()`.
- Call `mergeIdentities({ source: 'manual' })` only after access and conflict checks pass.
- Queue space-person metadata backfill after successful repair.

Web:

- In global person detail and merge suggestion modal, call `mergeScopedPeople()` whenever the target or any selected source is space-scoped.
- In space person detail, call `mergeSpacePeople()` only when target and all sources are space-person refs from the current space; otherwise call `mergeScopedPeople()`.
- Preserve legacy `mergePerson()` for personal-only global merges.

- [ ] **Step 5: Run scoped repair tests to verify GREEN**

Run:

```bash
pnpm --dir server test src/controllers/person.controller.spec.ts -- --run -t "same-person|scoped personal and space people|raw identity|spaceId"
pnpm --dir server test:medium test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "repair RBAC|can repair that Space Person|cannot repair|admin who is not a member"
pnpm --dir web test src/lib/modals/person-merge-suggestion-modal.spec.ts 'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts' 'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts' -- --run -t "same-person repair|personal merge|space person merged with a personal candidate|same space|shared spaces enabled"
```

Expected: PASS.

- [ ] **Step 6: Commit Task 8**

Run:

```bash
git add server/src/controllers/person.controller.spec.ts server/src/services/person.service.ts server/src/repositories/face-identity.repository.ts server/test/medium/specs/services/people-identity-rbac.spec.ts web/src/lib/modals/PersonMergeSuggestionModal.svelte web/src/lib/modals/person-merge-suggestion-modal.spec.ts 'web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts' 'web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts'
git commit -m "fix(people): preserve scoped same-person repair"
```

If a listed file did not change, omit it from `git add`.

---

### Task 9: Final Focused Verification

**Files:**

- Verify only.

- [ ] **Step 1: Run backend unit tests touched by the plan**

Run:

```bash
pnpm --dir server test src/services/accessible-identity-reconciliation.spec.ts src/services/shared-space.service.spec.ts src/services/person.service.spec.ts src/controllers/person.controller.spec.ts -- --run -t "accessible identity reconciliation policy|SharedSpaceIdentityReconciliation|post-join upload|accessible shared identity|no-op when a repeated reconciliation|same-person"
```

Expected: PASS.

- [ ] **Step 2: Run backend medium tests touched by the plan**

Run:

```bash
pnpm --dir server test:medium test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/services/people-identity-rbac.spec.ts -- --run -t "viewer-owned person as primary|viewer-owned primary profiles|without creating a local profile|post-join private upload|post-join upload is added to the space|linked-library space identity|linked-library space evidence|membership is removed before reconciliation|repairs missing space representative|late member join|join-after-duplicates|new-space-evidence|timeline-disabled|multiple shared identities|concurrent reconciliation|repair RBAC|same-name non-strict|two local candidates|same-owner conflict|same-space conflict|hidden candidate|type mismatch|leave and rejoin|asset removed|face deleted|search suggestions|filter suggestions|raw face identity|stale global row"
```

Expected: PASS.

- [ ] **Step 3: Run web tests touched by the plan**

Run:

```bash
pnpm --dir web test src/lib/utils/global-person-route.spec.ts 'src/routes/(user)/people/people-page.spec.ts' 'src/routes/(user)/explore/explore-page.spec.ts' src/lib/managers/global-search-manager.svelte.spec.ts src/lib/modals/person-merge-suggestion-modal.spec.ts 'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts' 'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts' -- --run -t "global person route|space-primary|identity-wide|person route|shared-space thumbnail|same-person repair|personal merge|space person merged with a personal candidate|same space"
```

Expected: PASS.

- [ ] **Step 4: Verify SQL snapshots and whitespace**

Run:

```bash
git diff --check
for pattern in TO''DO TB''D; do rg -n "$pattern" docs/superpowers/plans server/src server/test web/src || true; done
```

Expected:

- `git diff --check` prints no output.
- the `rg` loop prints no matches.

- [ ] **Step 5: Inspect changed files**

Run:

```bash
git status --short
git diff --stat origin/fix/accessible-shared-identity...HEAD
```

Expected: only intentional source, test, docs, and generated SQL files are changed.

- [ ] **Step 6: Commit final verification note only if files changed**

If Task 9 produced no file changes, do not commit. If SQL sync or formatting changed files, commit them:

```bash
git add server/src/queries/face.identity.repository.sql
git commit -m "chore(server): sync accessible identity sql snapshots"
```

---

## Completion Criteria

- Strict reconciliation policy has unit coverage for no bridge, zero match, one match, multiple matches, same identity through multiple profiles, source/target fan-out, hidden/ignored, type mismatch, missing embedding, existing merge no-op, and deterministic target selection.
- A/B/C late-member cases are covered with local profile, no local profile, private post-join upload, and post-join add-to-space.
- Linked-library photo sources are covered for late-member reconciliation, post-join private upload, and leave/access-loss behavior.
- Ambiguous, conflicting, hidden, deleted, incompatible-type, same-name-only, and multi-candidate cases skip automatic reconciliation.
- Search/filter suggestion paths group by accessible identity and do not expose raw `face_identity.id`.
- Existing members keep viewer-owned personal primary profiles after another member joins.
- User-owned photos remain visible after leaving a space.
- Space people remain visible in explicit space scope when backed by space assets.
- Timeline-disabled spaces do not influence global personal-upload reconciliation.
- Idempotent reruns and concurrent reconciliation jobs are verified by focused service and medium tests.
- Manual same-person repair merges personal and space profiles without throwing, preserves scoped rows, and enforces scoped-profile RBAC.
- Global people, explore, and global search route identity-grouped rows to `/people/:profileId`, not `/spaces/:spaceId/people/:personId`.
- Explicit space people routes remain space-scoped.
- Thumbnail URLs for global rows resolve through an accessible profile endpoint.
- Focused server unit, server medium, and web tests listed in Task 9 pass.
- Local lint is not required; CI owns lint verification for this branch.
