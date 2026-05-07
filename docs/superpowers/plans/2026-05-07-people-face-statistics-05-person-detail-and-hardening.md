# People Face Statistics Phase 5: Person Detail And Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every code task. Use superpowers:verification-before-completion before claiming this phase is done. This plan combines the original design's Phase 5 person-detail statistics and Phase 6 edge-case hardening. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add asset and face counts to global person detail and shared-space person detail statistics, then close the remaining API, edge-case, and generated-contract gaps for people face statistics.

**Architecture:** Extend the existing `PersonStatisticsResponseDto` from `{ assets }` to `{ assets, faces }`, keeping person-detail statistics separate from overview and lazy diagnostic face-statistics endpoints. Global person detail resolves the route profile to the viewer's accessible identity scope when possible, while legacy personal people keep the existing personal-only fallback. Shared-space person detail uses a new space-scoped endpoint and repository aggregate that counts only visible, non-deleted faces/assets in the selected authorized space, including linked-library assets attached to that space.

**Tech Stack:** NestJS controllers/services, Zod DTOs, Kysely/Postgres aggregates, `@immich/sql-tools` SQL snapshots, generated OpenAPI TypeScript and mobile SDKs, Svelte 5/SvelteKit page loads, Vitest small and medium tests, Testing Library for Svelte.

---

## Phase Boundary

This phase owns:

- Extending `GET /people/:personId/statistics` to return `{ assets, faces }`.
- Adding `GET /shared-spaces/:spaceId/people/:personId/statistics` returning `{ assets, faces }`.
- Global person-detail page load and UI usage of the extended statistics response.
- Shared-space person-detail page load and UI usage of the new statistics endpoint.
- Medium repository tests for person-detail global identity scope, space scope, linked-library scope, leave-space behavior, zero counts, and non-visible assets.
- Generated SQL snapshots and OpenAPI/SDK artifacts for the changed contracts.
- Final focused verification for the full people face-statistics feature surface.

This phase does not own:

- New overview header UX beyond fixes required by verification.
- New lazy diagnostic rows beyond the Phase 4 detected/visible/hidden/unassigned split.
- An admin diagnostics dashboard.
- Local lint/build as a final confidence gate; CI should handle broad lint/build. Generation commands are allowed where they are required to refresh SQL/OpenAPI artifacts.

## Contracts

Global and shared-space person-detail statistics use the same response:

```ts
type PersonStatisticsResponseDto = {
  assets: number;
  faces: number;
};
```

Global person detail:

- If the route ID is an owned personal person with no identity, count visible timeline assets and visible faces assigned to that personal person.
- If the route ID resolves to an accessible identity, count distinct accessible assets and visible faces linked to that identity in the viewer's global scope.
- Global scope includes the viewer's own visible timeline assets plus shared-space assets and linked-library assets from spaces visible in the viewer's timeline.
- Leaving a space removes that space's assets and linked-library assets from the global identity statistics while preserving the viewer's own assets.

Shared-space person detail:

- The route is `GET /shared-spaces/:spaceId/people/:personId/statistics`.
- The caller must be a member of the selected space.
- The selected person must belong to the selected space and pass the same pet visibility rule as `getSpacePerson`.
- Count distinct visible, non-deleted assets and visible faces in the selected shared-space asset scope.
- Selected shared-space asset scope is direct assets in the space plus linked-library assets attached to that space.
- Do not count assets or faces from other spaces, inaccessible spaces, offline assets, deleted assets, or non-timeline space-invisible assets.

Frontend:

- Global person detail always uses `getPersonStatistics({ id })` for the final asset and face counts. Do not skip the statistics request just because `getPerson()` includes `numberOfAssets`; that field has no face count.
- Shared-space person detail uses `getSpacePersonStatistics({ id: spaceId, personId })`.
- UI should show both counts near the existing person header metadata:

```text
7 assets
10 faces
```

Use the existing `assets_count` key and add a pluralized `faces_count` key:

```json
"faces_count": "{count, plural, one {# face} other {# faces}}"
```

## File Map

Backend contract and service files:

- Modify `server/src/dtos/person.dto.ts`.
- Modify `server/src/controllers/person.controller.spec.ts`.
- Modify `server/src/services/person.service.ts`.
- Modify `server/src/services/person.service.spec.ts`.
- Modify `server/src/controllers/shared-space.controller.ts`.
- Modify `server/src/controllers/shared-space.controller.spec.ts`.
- Modify `server/src/services/shared-space.service.ts`.
- Modify `server/src/services/shared-space.service.spec.ts`.

Backend repository files:

- Modify `server/src/repositories/person.repository.ts`.
- Modify `server/src/repositories/face-identity.repository.ts`.
- Modify `server/src/repositories/shared-space.repository.ts`.
- Modify `server/test/medium/specs/repositories/person.repository.spec.ts`.
- Modify `server/test/medium/specs/repositories/face-identity.repository.spec.ts`.
- Modify `server/test/medium/specs/repositories/shared-space.repository.spec.ts`.
- Modify `server/test/medium/specs/repositories/face-identity-query-shape.spec.ts`.

Frontend files:

- Modify `i18n/en.json`.
- Modify `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.ts`.
- Modify `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`.
- Modify `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts`.
- Modify `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts`.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.ts`.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`.
- Add `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts`.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts`.

Generated artifacts:

- Modify `server/src/queries/person.repository.sql`.
- Modify `server/src/queries/face.identity.repository.sql`.
- Modify `server/src/queries/shared.space.repository.sql`.
- Modify `open-api/immich-openapi-specs.json`.
- Modify `open-api/typescript-sdk/src/fetch-client.ts`.
- Modify `open-api/typescript-sdk/build/fetch-client.js`.
- Modify `open-api/typescript-sdk/build/fetch-client.d.ts`.
- Modify `mobile/openapi` generated files if `make open-api-typescript` or the repo's OpenAPI target updates them.

## TDD Rules

- Every behavior change starts with a failing test.
- Run the focused command and verify the failure is the expected missing-field, missing-route, missing-method, or wrong-count failure.
- Implement only enough code to pass that test.
- Add edge-case medium tests before broadening repository SQL.
- Generate API/SDK artifacts before any frontend task that imports a new generated client method.
- Keep SQL snapshot generation in the hardening task, after production repository contracts are green.
- Do not run local lint/build as final validation. CI should run broad lint/build.

## Subagent Work Slices

Use one fresh implementer subagent per task. Do not run implementation subagents in parallel unless write scopes are disjoint.

- Worker A owns DTO/controller contracts.
- Worker B owns global person-detail backend service and repositories.
- Worker C owns shared-space person-detail backend service, repositories, controller route, and the TypeScript client generation required before frontend imports.
- Worker D owns web global and shared-space person-detail page-load/UI changes.
- Worker E owns SQL snapshots, generated-contract drift verification, and final hardening verification.

Tell every worker they are not alone in the codebase, must not revert edits made by others, and must adjust their work to compatible changes made by other workers.

---

## Task 1: Extend Person Statistics Contracts

**Files:**

- Modify `server/src/dtos/person.dto.ts`.
- Modify `server/src/controllers/person.controller.spec.ts`.

- [ ] **Step 1: Write failing global controller serialization test**

In `server/src/controllers/person.controller.spec.ts`, extend the existing `describe('GET /people/:id/statistics')` block with:

```ts
it('should return person asset and face statistics', async () => {
  const personId = factory.uuid();
  service.getStatistics.mockResolvedValue({ assets: 7, faces: 10 });

  const { status, body } = await request(ctx.getHttpServer())
    .get(`/people/${personId}/statistics`)
    .set('Authorization', `Bearer token`);

  expect(status).toBe(200);
  expect(service.getStatistics).toHaveBeenCalledWith(undefined, personId);
  expect(body).toEqual({ assets: 7, faces: 10 });
});
```

Expected red failure before DTO/service updates: response serialization does not include `faces`, or the mocked type rejects `{ faces }`.

- [ ] **Step 2: Run global controller test and verify red**

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/controllers/person.controller.spec.ts -t "GET /people/:id/statistics"
```

Expected: FAIL for missing `faces` support.

- [ ] **Step 3: Extend the DTO**

In `server/src/dtos/person.dto.ts`, change `PersonStatisticsResponseSchema` to:

```ts
const PersonStatisticsResponseSchema = z
  .object({
    assets: z.int().min(0).describe('Number of assets'),
    faces: z.int().min(0).describe('Number of faces assigned to this person in the current accessible scope'),
  })
  .meta({ id: 'PersonStatisticsResponseDto' });
```

- [ ] **Step 4: Run global controller test and verify green**

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/controllers/person.controller.spec.ts -t "GET /people/:id/statistics"
```

Expected: PASS for the global controller statistics case.

- [ ] **Step 5: Continue to Task 2 without committing**

Do not commit the DTO-only change by itself. `PersonStatisticsResponseDto` now requires `faces`, so the service and repository contracts must be updated in Task 2 before the branch returns to a type-consistent state.

## Task 2: Implement Global Person Detail Statistics

**Files:**

- Modify `server/src/services/person.service.ts`.
- Modify `server/src/services/person.service.spec.ts`.
- Modify `server/src/repositories/person.repository.ts`.
- Modify `server/src/repositories/face-identity.repository.ts`.
- Modify `server/test/medium/specs/repositories/person.repository.spec.ts`.
- Modify `server/test/medium/specs/repositories/face-identity.repository.spec.ts`.

- [ ] **Step 1: Write failing service tests for legacy and identity scopes**

In `server/src/services/person.service.spec.ts`, replace the current `getStatistics` success test with:

```ts
it('returns personal person asset and face counts for a legacy owned person', async () => {
  const auth = AuthFactory.create();
  const person = PersonFactory.create({ identityId: null });

  mocks.person.getById.mockResolvedValue(person);
  mocks.person.getStatistics.mockResolvedValue({ assets: 3, faces: 4 });
  mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.id]));

  await expect(sut.getStatistics(auth, person.id)).resolves.toEqual({ assets: 3, faces: 4 });
  expect(mocks.person.getStatistics).toHaveBeenCalledWith(person.id);
  expect(mocks.faceIdentity.getAccessiblePersonStatistics).not.toHaveBeenCalled();
});
```

Add an identity-backed owned person test:

```ts
it('returns accessible identity statistics for an owned identity-backed person', async () => {
  const auth = AuthFactory.create();
  const person = PersonFactory.create({ identityId: 'identity-1' });

  mocks.person.getById.mockResolvedValue(person);
  mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.id]));
  mocks.faceIdentity.getAccessiblePersonStatistics.mockResolvedValue({ assets: 7, faces: 9 });

  await expect(sut.getStatistics(auth, person.id)).resolves.toEqual({ assets: 7, faces: 9 });
  expect(mocks.faceIdentity.getAccessiblePersonStatistics).toHaveBeenCalledWith(auth.user.id, 'identity-1');
  expect(mocks.person.getStatistics).not.toHaveBeenCalled();
});
```

Add an accessible space-profile route ID test:

```ts
it('returns accessible identity statistics for an accessible space-person route id', async () => {
  const auth = AuthFactory.create();
  const personId = newUuid();

  mocks.person.getById.mockResolvedValue(undefined);
  mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set());
  mocks.faceIdentity.getAccessibleProfileIdentityId.mockResolvedValue('identity-from-space');
  mocks.faceIdentity.getAccessiblePersonStatistics.mockResolvedValue({ assets: 11, faces: 13 });

  await expect(sut.getStatistics(auth, personId)).resolves.toEqual({ assets: 11, faces: 13 });
  expect(mocks.faceIdentity.getAccessibleProfileIdentityId).toHaveBeenCalledWith(auth.user.id, personId);
  expect(mocks.faceIdentity.getAccessiblePersonStatistics).toHaveBeenCalledWith(auth.user.id, 'identity-from-space');
});

it('rejects an inaccessible space-person route id before reading statistics', async () => {
  const auth = AuthFactory.create();
  const personId = newUuid();

  mocks.person.getById.mockResolvedValue(undefined);
  mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set());
  mocks.faceIdentity.getAccessibleProfileIdentityId.mockResolvedValue(undefined);

  await expect(sut.getStatistics(auth, personId)).rejects.toThrow('Not found or no person.read access');
  expect(mocks.faceIdentity.getAccessiblePersonStatistics).not.toHaveBeenCalled();
});
```

Expected red failure: mocked repository methods and service branching do not exist, and `faces` is not returned.

- [ ] **Step 2: Run service tests and verify red**

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/services/person.service.spec.ts -t "getStatistics"
```

- [ ] **Step 3: Write failing personal repository medium tests**

In `server/test/medium/specs/repositories/person.repository.spec.ts`, add a new `describe('getStatistics')` block before `describe('representative face picker queries')`:

```ts
it('counts distinct visible timeline assets and visible faces for a personal person', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
  const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
  const { assetFace: firstFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  await ctx.newAssetFace({ assetId: asset.id, personId: person.id, isVisible: false });

  await expect(sut.getStatistics(person.id)).resolves.toEqual({ assets: 1, faces: 2 });
  expect(firstFace.personId).toBe(person.id);
});

it('returns zero asset and face counts for a personal person with no accessible faces', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Empty' });

  await expect(sut.getStatistics(person.id)).resolves.toEqual({ assets: 0, faces: 0 });
});
```

Keep the assertions exactly on `{ assets, faces }`.

- [ ] **Step 4: Write failing identity repository medium tests**

In `server/test/medium/specs/repositories/face-identity.repository.spec.ts`, add `describe('getAccessiblePersonStatistics')` with these cases:

```ts
it('counts owned and timeline shared-space identity faces once each', async () => {
  const { ctx, sut } = setup();
  const { user: owner } = await ctx.newUser();
  const { user: partner } = await ctx.newUser();
  const { person } = await ctx.newPerson({ ownerId: owner.id, name: 'Alice' });
  const identity = await sut.ensurePersonIdentity(person.id);

  const { asset: ownedAsset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
  const { assetFace: ownedFace } = await ctx.newAssetFace({ assetId: ownedAsset.id, personId: person.id });
  await sut.linkFace({ assetFaceId: ownedFace.id, identityId: identity.id, source: 'owner-person' });

  const { space } = await ctx.newSharedSpace({ createdById: partner.id, faceRecognitionEnabled: true });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: partner.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Viewer });
  await setMemberTimeline(ctx, { spaceId: space.id, userId: owner.id, showInTimeline: true });
  const { asset: sharedAsset } = await ctx.newAsset({ ownerId: partner.id, visibility: AssetVisibility.Timeline });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: sharedAsset.id, addedById: partner.id });
  const { assetFace: sharedFace } = await ctx.newAssetFace({ assetId: sharedAsset.id });
  await sut.linkFace({ assetFaceId: sharedFace.id, identityId: identity.id, source: 'shared-space-evidence' });

  await expect(sut.getAccessiblePersonStatistics(owner.id, identity.id)).resolves.toEqual({ assets: 2, faces: 2 });
});

it('counts linked-library identity faces only through timeline-enabled member spaces', async () => {
  const { ctx, sut } = setup();
  const { user: source } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { library } = await ctx.newLibrary({ ownerId: source.id });
  const { person } = await ctx.newPerson({ ownerId: source.id, name: 'Library Person' });
  const identity = await sut.ensurePersonIdentity(person.id);
  const { space } = await ctx.newSharedSpace({ createdById: source.id, faceRecognitionEnabled: true });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
  await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: true });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: source.id });
  const { asset } = await ctx.newAsset({
    ownerId: source.id,
    libraryId: library.id,
    visibility: AssetVisibility.Timeline,
  });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

  await expect(sut.getAccessiblePersonStatistics(member.id, identity.id)).resolves.toEqual({ assets: 1, faces: 1 });

  await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });

  await expect(sut.getAccessiblePersonStatistics(member.id, identity.id)).resolves.toEqual({ assets: 0, faces: 0 });
});

it('removes inaccessible space assets after the user leaves a space while keeping owned assets', async () => {
  const { ctx, sut } = setup();
  const { user: owner } = await ctx.newUser();
  const { user: partner } = await ctx.newUser();
  const { person } = await ctx.newPerson({ ownerId: owner.id, name: 'Alice' });
  const identity = await sut.ensurePersonIdentity(person.id);

  const { asset: ownedAsset } = await ctx.newAsset({ ownerId: owner.id, visibility: AssetVisibility.Timeline });
  const { assetFace: ownedFace } = await ctx.newAssetFace({ assetId: ownedAsset.id, personId: person.id });
  await sut.linkFace({ assetFaceId: ownedFace.id, identityId: identity.id, source: 'owner-person' });

  const { space } = await ctx.newSharedSpace({ createdById: partner.id, faceRecognitionEnabled: true });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: partner.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: SharedSpaceRole.Viewer });
  await setMemberTimeline(ctx, { spaceId: space.id, userId: owner.id, showInTimeline: true });
  const { asset: sharedAsset } = await ctx.newAsset({ ownerId: partner.id, visibility: AssetVisibility.Timeline });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: sharedAsset.id, addedById: partner.id });
  const { assetFace: sharedFace } = await ctx.newAssetFace({ assetId: sharedAsset.id });
  await sut.linkFace({ assetFaceId: sharedFace.id, identityId: identity.id, source: 'shared-space-evidence' });

  await expect(sut.getAccessiblePersonStatistics(owner.id, identity.id)).resolves.toEqual({ assets: 2, faces: 2 });

  await ctx.database
    .deleteFrom('shared_space_member')
    .where('spaceId', '=', space.id)
    .where('userId', '=', owner.id)
    .execute();

  await expect(sut.getAccessiblePersonStatistics(owner.id, identity.id)).resolves.toEqual({ assets: 1, faces: 1 });
});

it('keeps global person detail statistics stable after identity backfill reruns', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Backfilled Person' });
  const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
  const identity = await sut.ensurePersonIdentity(person.id);
  await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

  await expect(sut.getAccessiblePersonStatistics(user.id, identity.id)).resolves.toEqual({ assets: 1, faces: 1 });

  await sut.backfillPersonalIdentities({ limit: 100 });
  await sut.backfillSpacePersonIdentities({ limit: 100 });
  await sut.backfillPersonalIdentities({ limit: 100 });
  await sut.backfillSpacePersonIdentities({ limit: 100 });

  await expect(sut.getAccessiblePersonStatistics(user.id, identity.id)).resolves.toEqual({ assets: 1, faces: 1 });
});

it('resolves a timeline-enabled shared-space profile id to the accessible identity id', async () => {
  const { ctx, sut } = setup();
  const { user: source } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { person } = await ctx.newPerson({ ownerId: source.id, name: 'Library Person' });
  const identity = await sut.ensurePersonIdentity(person.id);
  const { space } = await ctx.newSharedSpace({ createdById: source.id, faceRecognitionEnabled: true });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
  await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: true });
  const spacePerson = await ctx.database
    .insertInto('shared_space_person')
    .values({ spaceId: space.id, identityId: identity.id, name: 'Library Person', type: 'person' })
    .returningAll()
    .executeTakeFirstOrThrow();

  await expect(sut.getAccessibleProfileIdentityId(member.id, spacePerson.id)).resolves.toBe(identity.id);

  await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });

  await expect(sut.getAccessibleProfileIdentityId(member.id, spacePerson.id)).resolves.toBeUndefined();
});

it('does not resolve hidden or faceless shared-space profile ids to accessible global statistics', async () => {
  const { ctx, sut } = setup();
  const { user: source } = await ctx.newUser();
  const { user: member } = await ctx.newUser();
  const { person } = await ctx.newPerson({ ownerId: source.id, name: 'Library Person' });
  const identity = await sut.ensurePersonIdentity(person.id);
  const { space } = await ctx.newSharedSpace({ createdById: source.id, faceRecognitionEnabled: true });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
  await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
  await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: true });
  const { asset } = await ctx.newAsset({ ownerId: source.id, visibility: AssetVisibility.Timeline });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: source.id });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });

  const hiddenProfile = await ctx.database
    .insertInto('shared_space_person')
    .values({ spaceId: space.id, identityId: identity.id, name: 'Hidden', type: 'person', isHidden: true })
    .returningAll()
    .executeTakeFirstOrThrow();
  await linkSpaceFace(ctx, hiddenProfile.id, assetFace.id);

  const facelessProfile = await ctx.database
    .insertInto('shared_space_person')
    .values({ spaceId: space.id, identityId: identity.id, name: 'Faceless', type: 'person', isHidden: false })
    .returningAll()
    .executeTakeFirstOrThrow();

  await expect(sut.getAccessibleProfileIdentityId(member.id, hiddenProfile.id)).resolves.toBeUndefined();
  await expect(sut.getAccessibleProfileIdentityId(member.id, facelessProfile.id)).resolves.toBeUndefined();
});
```

- [ ] **Step 5: Run repository tests and verify red**

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs test/medium/specs/repositories/person.repository.spec.ts test/medium/specs/repositories/face-identity.repository.spec.ts -t "getStatistics|getAccessiblePersonStatistics|leaves a space"
```

Expected: FAIL because `faces`, `getAccessiblePersonStatistics`, and `getAccessibleProfileIdentityId` are missing.

- [ ] **Step 6: Implement repository contracts**

In `server/src/repositories/person.repository.ts`, change:

```ts
export interface PersonStatistics {
  assets: number;
  faces: number;
}
```

Update `getStatistics(personId)` so it counts distinct assets and faces:

```ts
@GenerateSql({ params: [DummyValue.UUID] })
async getStatistics(personId: string): Promise<PersonStatistics> {
  const result = await this.db
    .selectFrom('asset_face')
    .innerJoin('asset', 'asset.id', 'asset_face.assetId')
    .select((eb) => eb.fn.count(eb.fn('distinct', ['asset.id'])).as('assets'))
    .select((eb) => eb.fn.count(eb.fn('distinct', ['asset_face.id'])).as('faces'))
    .where('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
    .where('asset.deletedAt', 'is', null)
    .where('asset.isOffline', '=', false)
    .where('asset_face.deletedAt', 'is', null)
    .where('asset_face.isVisible', 'is', true)
    .where('asset_face.personId', '=', personId)
    .executeTakeFirst();

  return {
    assets: Number(result?.assets ?? 0),
    faces: Number(result?.faces ?? 0),
  };
}
```

In `server/src/repositories/face-identity.repository.ts`, add:

```ts
import type { PeopleFaceStatistics, PersonStatistics } from 'src/repositories/person.repository';
```

by extending the existing `person.repository` type import.

Then add:

```ts
@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
async getAccessibleProfileIdentityId(userId: string, profileId: string): Promise<string | undefined> {
  const result = await sql<{ identityId: string }>`
    SELECT shared_space_person."identityId"
    FROM shared_space_person
    INNER JOIN shared_space_member
      ON shared_space_member."spaceId" = shared_space_person."spaceId"
      AND shared_space_member."userId" = ${userId}
      AND shared_space_member."showInTimeline" = true
    WHERE shared_space_person.id = ${profileId}
      AND shared_space_person."identityId" IS NOT NULL
      AND shared_space_person."isHidden" = false
      AND EXISTS (
        SELECT 1
        FROM shared_space_person_face
        INNER JOIN asset_face AS profile_face
          ON profile_face.id = shared_space_person_face."assetFaceId"
        WHERE shared_space_person_face."personId" = shared_space_person.id
          AND profile_face."deletedAt" IS NULL
          AND profile_face."isVisible" = true
      )
    LIMIT 1
  `.execute(this.db);

  return result.rows[0]?.identityId ?? undefined;
}
```

Add `getAccessiblePersonStatistics(userId, identityId)` using the same accessible asset scope shape as `getAccessiblePeopleFaceStatistics`, restricted to one identity:

```ts
@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
async getAccessiblePersonStatistics(userId: string, identityId: string): Promise<PersonStatistics> {
  const result = await sql<PersonStatistics>`
    WITH timeline_spaces AS (
      SELECT "spaceId"
      FROM shared_space_member
      WHERE "userId" = ${userId}
        AND "showInTimeline" = true
    ),
    accessible_detected_faces AS (
      SELECT DISTINCT
        asset_face.id AS "assetFaceId",
        asset_face."assetId"
      FROM asset_face
      INNER JOIN asset ON asset.id = asset_face."assetId"
      INNER JOIN face_identity_face ON face_identity_face."assetFaceId" = asset_face.id
      WHERE face_identity_face."identityId" = ${identityId}
        AND asset_face."deletedAt" IS NULL
        AND asset_face."isVisible" = true
        AND asset."deletedAt" IS NULL
        AND asset."isOffline" = false
        AND asset.visibility = ${AssetVisibility.Timeline}
        AND (
          asset."ownerId" = ${userId}
          OR EXISTS (
            SELECT 1
            FROM shared_space_asset
            INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_asset."spaceId"
            WHERE shared_space_asset."assetId" = asset.id
          )
          OR EXISTS (
            SELECT 1
            FROM shared_space_library
            INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_library."spaceId"
            WHERE shared_space_library."libraryId" = asset."libraryId"
          )
        )
    )
    SELECT
      COUNT(DISTINCT "assetId")::int AS "assets",
      COUNT(DISTINCT "assetFaceId")::int AS "faces"
    FROM accessible_detected_faces
  `.execute(this.db);

  const row = result.rows[0];
  return {
    assets: Number(row?.assets ?? 0),
    faces: Number(row?.faces ?? 0),
  };
}
```

- [ ] **Step 7: Implement service branching**

In `server/src/services/person.service.ts`, replace `getStatistics` with:

```ts
async getStatistics(auth: AuthDto, id: string): Promise<PersonStatisticsResponseDto> {
  const allowedIds = await this.checkAccess({ auth, permission: Permission.PersonRead, ids: [id] });
  if (allowedIds.has(id)) {
    const person = await this.findOrFail(id);
    if (person.identityId) {
      return this.faceIdentityRepository.getAccessiblePersonStatistics(auth.user.id, person.identityId);
    }

    return this.personRepository.getStatistics(id);
  }

  const identityId = await this.faceIdentityRepository.getAccessibleProfileIdentityId(auth.user.id, id);
  if (identityId) {
    return this.faceIdentityRepository.getAccessiblePersonStatistics(auth.user.id, identityId);
  }

  throw new BadRequestException(`Not found or no ${Permission.PersonRead} access`);
}
```

In `server/src/services/person.service.spec.ts` `beforeEach`, add:

```ts
(mocks.faceIdentity as any).getAccessiblePersonStatistics ??= vi.fn();
(mocks.faceIdentity as any).getAccessibleProfileIdentityId ??= vi.fn();
(mocks.faceIdentity as any).getAccessibleProfileIdentityId.mockResolvedValue(undefined);
```

- [ ] **Step 8: Run focused backend global tests and verify green**

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/services/person.service.spec.ts test/medium/specs/repositories/person.repository.spec.ts test/medium/specs/repositories/face-identity.repository.spec.ts -t "getStatistics|getAccessiblePersonStatistics|leaves a space"
```

- [ ] **Step 9: Commit global backend person statistics**

```bash
git add server/src/dtos/person.dto.ts server/src/controllers/person.controller.spec.ts server/src/services/person.service.ts server/src/services/person.service.spec.ts server/src/repositories/person.repository.ts server/src/repositories/face-identity.repository.ts server/test/medium/specs/repositories/person.repository.spec.ts server/test/medium/specs/repositories/face-identity.repository.spec.ts
git commit -m "feat: add global person detail face statistics"
```

## Task 3: Implement Shared-Space Person Detail Statistics

**Files:**

- Modify `server/src/controllers/shared-space.controller.ts`.
- Modify `server/src/controllers/shared-space.controller.spec.ts`.
- Modify `server/src/services/shared-space.service.ts`.
- Modify `server/src/services/shared-space.service.spec.ts`.
- Modify `server/src/repositories/shared-space.repository.ts`.
- Modify `server/test/medium/specs/repositories/shared-space.repository.spec.ts`.

- [ ] **Step 1: Write failing shared-space controller route tests**

In `server/src/controllers/shared-space.controller.spec.ts`, add:

```ts
describe('GET /shared-spaces/:id/people/:personId/statistics', () => {
  it('should be an authenticated route', async () => {
    await request(ctx.getHttpServer()).get(`/shared-spaces/${factory.uuid()}/people/${factory.uuid()}/statistics`);
    expect(ctx.authenticate).toHaveBeenCalled();
  });

  it('should return space person asset and face statistics', async () => {
    const spaceId = factory.uuid();
    const personId = factory.uuid();
    service.getSpacePersonStatistics.mockResolvedValue({ assets: 5, faces: 8 });

    const { status, body } = await request(ctx.getHttpServer())
      .get(`/shared-spaces/${spaceId}/people/${personId}/statistics`)
      .set('Authorization', `Bearer token`);

    expect(status).toBe(200);
    expect(service.getSpacePersonStatistics).toHaveBeenCalledWith(undefined, spaceId, personId);
    expect(body).toEqual({ assets: 5, faces: 8 });
  });
});
```

Expected red failure: `getSpacePersonStatistics` and the route do not exist.

- [ ] **Step 2: Write failing shared-space service tests**

In `server/src/services/shared-space.service.spec.ts`, add `describe('getSpacePersonStatistics')` near `getSpacePerson`:

```ts
describe('getSpacePersonStatistics', () => {
  it('returns space person asset and face statistics for a member', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();
    const personId = newUuid();
    const space = factory.sharedSpace({ id: spaceId, petsEnabled: true });
    const person = factory.sharedSpacePerson({ id: personId, spaceId, type: 'person' });

    mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId }));
    mocks.sharedSpace.getPersonById.mockResolvedValue(person);
    mocks.sharedSpace.getById.mockResolvedValue(space);
    mocks.sharedSpace.getSpacePersonStatistics.mockResolvedValue({ assets: 5, faces: 8 });

    await expect(sut.getSpacePersonStatistics(auth, spaceId, personId)).resolves.toEqual({ assets: 5, faces: 8 });
    expect(mocks.sharedSpace.getSpacePersonStatistics).toHaveBeenCalledWith(spaceId, personId);
  });

  it('rejects non-members before reading statistics', async () => {
    mocks.sharedSpace.getMember.mockResolvedValue(undefined);

    await expect(sut.getSpacePersonStatistics(factory.auth(), 'space-1', 'person-1')).rejects.toThrow('Not a member');
    expect(mocks.sharedSpace.getSpacePersonStatistics).not.toHaveBeenCalled();
  });

  it('rejects a person from another space before reading statistics', async () => {
    mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId: 'space-1' }));
    mocks.sharedSpace.getPersonById.mockResolvedValue(
      factory.sharedSpacePerson({ id: 'person-1', spaceId: 'space-2' }),
    );

    await expect(sut.getSpacePersonStatistics(factory.auth(), 'space-1', 'person-1')).rejects.toThrow(
      'Person not found',
    );
    expect(mocks.sharedSpace.getSpacePersonStatistics).not.toHaveBeenCalled();
  });

  it('rejects pet statistics when pets are disabled for the space', async () => {
    mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ spaceId: 'space-1' }));
    mocks.sharedSpace.getPersonById.mockResolvedValue(
      factory.sharedSpacePerson({ id: 'pet-1', spaceId: 'space-1', type: 'pet' }),
    );
    mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: 'space-1', petsEnabled: false }));

    await expect(sut.getSpacePersonStatistics(factory.auth(), 'space-1', 'pet-1')).rejects.toThrow('Person not found');
    expect(mocks.sharedSpace.getSpacePersonStatistics).not.toHaveBeenCalled();
  });
});
```

Expected red failure: service/repository mock methods do not exist.

- [ ] **Step 3: Run shared-space controller and service tests and verify red**

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/controllers/shared-space.controller.spec.ts src/services/shared-space.service.spec.ts -t "getSpacePersonStatistics|GET /shared-spaces/:id/people/:personId/statistics"
```

- [ ] **Step 4: Write failing shared-space repository medium tests**

In `server/test/medium/specs/repositories/shared-space.repository.spec.ts`, add `describe('getSpacePersonStatistics')`:

```ts
it('counts direct shared-space assets and visible faces for the selected person', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: null });
  const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
  const { assetFace: firstFace } = await ctx.newAssetFace({ assetId: asset.id });
  const { assetFace: secondFace } = await ctx.newAssetFace({ assetId: asset.id });
  await sut.addPersonFaces(
    [
      { personId: person.id, assetFaceId: firstFace.id },
      { personId: person.id, assetFaceId: secondFace.id },
    ],
    { skipRecount: true },
  );

  await expect(sut.getSpacePersonStatistics(space.id, person.id)).resolves.toEqual({ assets: 1, faces: 2 });
});

it('counts linked-library assets only when the library is linked to the selected space', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
  const { library } = await ctx.newLibrary({ ownerId: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });

  const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: null });
  const { asset: linkedAsset } = await ctx.newAsset({
    ownerId: user.id,
    libraryId: library.id,
    visibility: AssetVisibility.Timeline,
  });
  const { assetFace: linkedFace } = await ctx.newAssetFace({ assetId: linkedAsset.id });
  await sut.addPersonFaces([{ personId: person.id, assetFaceId: linkedFace.id }], { skipRecount: true });

  await expect(sut.getSpacePersonStatistics(space.id, person.id)).resolves.toEqual({ assets: 1, faces: 1 });
  await expect(sut.getSpacePersonStatistics(otherSpace.id, person.id)).resolves.toEqual({ assets: 0, faces: 0 });
});

it('counts a selected-space face once when it is reachable directly and through a linked library', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { library } = await ctx.newLibrary({ ownerId: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
  const { asset } = await ctx.newAsset({
    ownerId: user.id,
    libraryId: library.id,
    visibility: AssetVisibility.Timeline,
  });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
  const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: assetFace.id });
  await sut.addPersonFaces([{ personId: person.id, assetFaceId: assetFace.id }], { skipRecount: true });

  await expect(sut.getSpacePersonStatistics(space.id, person.id)).resolves.toEqual({ assets: 1, faces: 1 });
});

it('keeps space person detail statistics stable across asset and face materialization order', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { asset: assetBeforePerson } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: assetBeforePerson.id, addedById: user.id });
  const { assetFace: faceBeforePerson } = await ctx.newAssetFace({ assetId: assetBeforePerson.id });
  const personCreatedAfterAsset = await sut.createPerson({
    spaceId: space.id,
    name: 'After Asset',
    representativeFaceId: faceBeforePerson.id,
  });
  await sut.addPersonFaces([{ personId: personCreatedAfterAsset.id, assetFaceId: faceBeforePerson.id }], {
    skipRecount: true,
  });

  const personCreatedBeforeAsset = await sut.createPerson({
    spaceId: space.id,
    name: 'Before Asset',
    representativeFaceId: null,
  });
  const { asset: assetAfterPerson } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
  const { assetFace: faceAfterPerson } = await ctx.newAssetFace({ assetId: assetAfterPerson.id });
  await sut.addPersonFaces([{ personId: personCreatedBeforeAsset.id, assetFaceId: faceAfterPerson.id }], {
    skipRecount: true,
  });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: assetAfterPerson.id, addedById: user.id });

  await expect(sut.getSpacePersonStatistics(space.id, personCreatedAfterAsset.id)).resolves.toEqual({
    assets: 1,
    faces: 1,
  });
  await expect(sut.getSpacePersonStatistics(space.id, personCreatedBeforeAsset.id)).resolves.toEqual({
    assets: 1,
    faces: 1,
  });
});
```

Keep both assertions on exact `{ assets, faces }`.

- [ ] **Step 5: Run shared-space repository tests and verify red**

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs test/medium/specs/repositories/shared-space.repository.spec.ts -t "getSpacePersonStatistics|linked-library assets"
```

- [ ] **Step 6: Add the shared-space controller route**

In `server/src/controllers/shared-space.controller.ts`, import `PersonStatisticsResponseDto` from `src/dtos/person.dto` alongside `PeopleFaceStatisticsResponseDto`.

Add this route before `@Get(':id/people/:personId')` so `statistics` is not captured as a person ID:

```ts
@Get(':id/people/:personId/statistics')
@Authenticated({ permission: Permission.SharedSpaceRead })
@Endpoint({
  summary: 'Get space person statistics',
  description: 'Retrieve asset and face statistics for a person in a shared space.',
  history: new HistoryBuilder().added('v2').stable('v2'),
})
getSpacePersonStatistics(
  @Auth() auth: AuthDto,
  @Param('id') id: string,
  @Param('personId') personId: string,
): Promise<PersonStatisticsResponseDto> {
  return this.service.getSpacePersonStatistics(auth, id, personId);
}
```

- [ ] **Step 7: Implement the shared-space repository aggregate**

In `server/src/repositories/shared-space.repository.ts`, add:

```ts
@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
async getSpacePersonStatistics(spaceId: string, personId: string): Promise<PersonStatistics> {
  const result = await sql<PersonStatistics>`
    WITH target_person AS (
      SELECT id, "identityId"
      FROM shared_space_person
      WHERE id = ${personId}
        AND "spaceId" = ${spaceId}
    ),
    asset_scope AS (
      SELECT asset.id AS "assetId"
      FROM shared_space_asset
      INNER JOIN asset ON asset.id = shared_space_asset."assetId"
      WHERE shared_space_asset."spaceId" = ${spaceId}
        AND asset."deletedAt" IS NULL
        AND asset."isOffline" = false
        AND asset.visibility IN (${sql.join(visibleSpaceAssetVisibilities)})
      UNION
      SELECT asset.id AS "assetId"
      FROM shared_space_library
      INNER JOIN asset ON asset."libraryId" = shared_space_library."libraryId"
      WHERE shared_space_library."spaceId" = ${spaceId}
        AND asset."deletedAt" IS NULL
        AND asset."isOffline" = false
        AND asset.visibility IN (${sql.join(visibleSpaceAssetVisibilities)})
    ),
    selected_faces AS (
      SELECT DISTINCT
        asset_face.id AS "assetFaceId",
        asset_face."assetId"
      FROM target_person
      INNER JOIN asset_scope ON true
      INNER JOIN asset_face ON asset_face."assetId" = asset_scope."assetId"
      LEFT JOIN shared_space_person_face
        ON shared_space_person_face."assetFaceId" = asset_face.id
      LEFT JOIN face_identity_face
        ON face_identity_face."assetFaceId" = asset_face.id
      WHERE asset_face."deletedAt" IS NULL
        AND asset_face."isVisible" = true
        AND (
          shared_space_person_face."personId" = target_person.id
          OR (
            target_person."identityId" IS NOT NULL
            AND face_identity_face."identityId" = target_person."identityId"
          )
        )
    )
    SELECT
      COUNT(DISTINCT "assetId")::int AS "assets",
      COUNT(DISTINCT "assetFaceId")::int AS "faces"
    FROM selected_faces
  `.execute(this.db);

  const row = result.rows[0];
  return {
    assets: Number(row?.assets ?? 0),
    faces: Number(row?.faces ?? 0),
  };
}
```

Extend the existing `person.repository` type import in `server/src/repositories/shared-space.repository.ts`:

```ts
import type { PeopleFaceStatistics, PersonStatistics } from 'src/repositories/person.repository';
```

- [ ] **Step 8: Implement the shared-space service method**

In `server/src/services/shared-space.service.ts`, add:

```ts
async getSpacePersonStatistics(auth: AuthDto, spaceId: string, personId: string): Promise<PersonStatisticsResponseDto> {
  await this.requireMembership(auth, spaceId);

  const person = await this.sharedSpaceRepository.getPersonById(personId);
  if (!person || person.spaceId !== spaceId) {
    throw new BadRequestException('Person not found');
  }

  const space = await this.sharedSpaceRepository.getById(spaceId);
  if (!space?.petsEnabled && person.type === 'pet') {
    throw new BadRequestException('Person not found');
  }

  return this.sharedSpaceRepository.getSpacePersonStatistics(spaceId, personId);
}
```

Import `PersonStatisticsResponseDto` from `src/dtos/person.dto`.

In `server/src/services/shared-space.service.spec.ts` setup, add:

```ts
(mocks.sharedSpace as any).getSpacePersonStatistics ??= vi.fn();
```

- [ ] **Step 9: Run shared-space backend tests and verify green**

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/controllers/shared-space.controller.spec.ts src/services/shared-space.service.spec.ts test/medium/specs/repositories/shared-space.repository.spec.ts -t "getSpacePersonStatistics|linked-library assets|GET /shared-spaces/:id/people/:personId/statistics"
```

- [ ] **Step 10: Regenerate TypeScript client contracts before web implementation**

The web task imports a new SDK method, so generate the OpenAPI TypeScript SDK before starting frontend work:

```bash
make open-api-typescript
rg -n "PersonStatisticsResponseDto|getSpacePersonStatistics" open-api open-api/typescript-sdk
```

Expected:

- `PersonStatisticsResponseDto` includes `assets` and `faces`.
- `open-api/typescript-sdk/src/fetch-client.ts` exports `getSpacePersonStatistics`.
- `web/src/lib/__mocks__/sdk.mock.ts` can mock `getSpacePersonStatistics` because it reflects `@immich/sdk` exports.

- [ ] **Step 11: Commit shared-space backend and client contract changes**

```bash
git add server/src/controllers/shared-space.controller.ts server/src/controllers/shared-space.controller.spec.ts server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts server/src/repositories/shared-space.repository.ts server/test/medium/specs/repositories/shared-space.repository.spec.ts open-api open-api/typescript-sdk
git commit -m "feat: add space person detail statistics"
```

## Task 4: Wire Global Person Detail UI

**Files:**

- Modify `i18n/en.json`.
- Modify `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.ts`.
- Modify `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`.
- Modify `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts`.
- Modify `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts`.

- [ ] **Step 1: Write failing global person page-load tests**

In `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts`, update the existing tests:

```ts
it('loads person statistics even when the person response provides an identity-wide asset count', async () => {
  const url = new URL('https://gallery.test/people/space-person-1');
  sdkMock.getPerson.mockResolvedValue(
    makePerson({
      id: 'space-person-1',
      numberOfAssets: 7,
      filterId: 'space-person:space-person-1',
      primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' },
    }),
  );
  sdkMock.getPersonStatistics.mockResolvedValue({ assets: 7, faces: 10 });

  const result = await load({ params: { personId: 'space-person-1' }, url } as never);

  expect(authenticate).toHaveBeenCalledWith(url);
  expect(sdkMock.getPerson).toHaveBeenCalledWith({ id: 'space-person-1' });
  expect(sdkMock.getPersonStatistics).toHaveBeenCalledWith({ id: 'space-person-1' });
  expect(result.statistics).toEqual({ assets: 7, faces: 10 });
});
```

Update the legacy fallback test to:

```ts
sdkMock.getPersonStatistics.mockResolvedValue({ assets: 5, faces: 6 });
expect(result.statistics).toEqual({ assets: 5, faces: 6 });
```

Expected red failure: `+page.ts` skips `getPersonStatistics` when `numberOfAssets` is present and returns no face count.

- [ ] **Step 2: Write failing global person detail component test**

In `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts`, add:

```ts
it('renders asset and face counts in the person header', () => {
  renderPage({
    person: makePerson({ name: 'Alice' }),
    statistics: { assets: 7, faces: 10 },
  });

  expect(screen.getByText('7 assets')).toBeInTheDocument();
  expect(screen.getByText('10 faces')).toBeInTheDocument();
});
```

Update the local `renderPage` helper from `function renderPage(person = makePerson())` to:

```ts
function renderPage({
  person = makePerson(),
  statistics = { assets: 5, faces: 6 },
}: {
  person?: PersonResponseDto;
  statistics?: { assets: number; faces: number };
} = {}) {
  authManager.setUser(userAdminFactory.build({ id: 'current-user-id' }));
  authManager.setPreferences(preferencesFactory.build());

  const props = {
    data: {
      person,
      statistics,
      meta: { title: person.name || 'Person' },
    },
  };

  return render(TestWrapper as Component<{ component: typeof PersonDetailPage; componentProps: typeof props }>, {
    component: PersonDetailPage,
    componentProps: props,
  });
}
```

- [ ] **Step 3: Run global web tests and verify red**

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts' 'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts' -t "statistics|asset and face counts"
```

- [ ] **Step 4: Update page load**

In `web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.ts`, replace:

```ts
const statistics =
  person.numberOfAssets === undefined
    ? await getPersonStatistics({ id: params.personId })
    : { assets: person.numberOfAssets };
```

with:

```ts
const statistics = await getPersonStatistics({ id: params.personId });
```

- [ ] **Step 5: Add translation key and render faces**

In `i18n/en.json`, add near `faces`:

```json
"faces_count": "{count, plural, one {# face} other {# faces}}"
```

In global person detail `+page.svelte`, render the face count immediately below the existing asset count:

```svelte
<p class="text-sm text-gray-500 dark:text-gray-400">
  {$t('assets_count', { values: { count: numberOfAssets } })}
</p>
<p class="text-sm text-gray-500 dark:text-gray-400">
  {$t('faces_count', { values: { count: data.statistics.faces } })}
</p>
```

Keep `numberOfAssets` for the timeline-updated asset count, but keep face count from `data.statistics.faces` because face changes are not tracked by the timeline manager.

- [ ] **Step 6: Run global web tests and verify green**

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts' 'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts' -t "statistics|asset and face counts"
```

- [ ] **Step 7: Commit global person detail UI**

```bash
git add i18n/en.json 'web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.ts' 'web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts' 'web/src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts'
git commit -m "feat: show global person face statistics"
```

## Task 5: Wire Shared-Space Person Detail UI

**Files:**

- Modify `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.ts`.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`.
- Add `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts`.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts`.

- [ ] **Step 1: Add failing shared-space page-load tests**

Create `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts` with:

```ts
const { authenticate } = vi.hoisted(() => ({ authenticate: vi.fn() }));
vi.mock('$lib/utils/auth', () => ({ authenticate }));

import { QueryParameter } from '$lib/constants';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { load } from './+page';

describe('space person detail page load', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sdkMock.getSpace.mockResolvedValue({ id: 'space-1', name: 'Family' } as never);
    sdkMock.getMembers.mockResolvedValue([]);
    sdkMock.getSpacePerson.mockResolvedValue({ id: 'person-1', name: 'Alice', assetCount: 5, faceCount: 10 } as never);
    sdkMock.getSpacePersonStatistics.mockResolvedValue({ assets: 5, faces: 10 });
  });

  it('loads space person statistics for the selected space and person', async () => {
    const url = new URL('https://gallery.test/spaces/space-1/people/person-1');

    const result = await load({ params: { spaceId: 'space-1', personId: 'person-1' }, url } as never);

    expect(authenticate).toHaveBeenCalledWith(url);
    expect(sdkMock.getSpacePersonStatistics).toHaveBeenCalledWith({ id: 'space-1', personId: 'person-1' });
    expect(result.statistics).toEqual({ assets: 5, faces: 10 });
  });

  it('keeps safe previous route behavior unchanged', async () => {
    const url = new URL(
      `https://gallery.test/spaces/space-1/people/person-1?${QueryParameter.PREVIOUS_ROUTE}=/spaces/space-1/people`,
    );

    const result = await load({ params: { spaceId: 'space-1', personId: 'person-1' }, url } as never);

    expect(result.previousRoute).toBe('/spaces/space-1/people');
  });
});
```

Expected red failure: `getSpacePersonStatistics` is not imported or returned.

- [ ] **Step 2: Add failing shared-space component test**

In `space-person-detail-page.spec.ts`, update `renderPage` to accept `statistics`:

```ts
function renderPage({
  members = [makeMember()],
  person = makePerson(),
  statistics = { assets: person.assetCount, faces: person.faceCount },
  action = null,
  previousRoute = null,
}: {
  members?: SharedSpaceMemberResponseDto[];
  person?: SharedSpacePersonResponseDto;
  statistics?: { assets: number; faces: number };
  action?: string | null;
  previousRoute?: string | null;
} = {}) {
  // existing setup
  const props = {
    data: {
      space: makeSpace(),
      members,
      person,
      statistics,
      action,
      previousRoute,
      meta: { title: 'Alice - Test Space' },
    },
  };
  // existing render
}
```

Add:

```ts
it('renders space-scoped asset and face counts in the person header', () => {
  renderPage({
    person: makePerson({ assetCount: 999, faceCount: 999 }),
    statistics: { assets: 5, faces: 10 },
  });

  expect(screen.getByText('5 assets')).toBeInTheDocument();
  expect(screen.getByText('10 faces')).toBeInTheDocument();
  expect(screen.queryByText('999 assets')).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run shared-space web tests and verify red**

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts' 'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts' -t "statistics|asset and face counts"
```

- [ ] **Step 4: Update shared-space page load**

In shared-space person detail `+page.ts`, import `getSpacePersonStatistics`:

```ts
import { getMembers, getSpace, getSpacePerson, getSpacePersonStatistics } from '@immich/sdk';
```

Add it to the `Promise.all`:

```ts
const [space, members, person, statistics] = await Promise.all([
  getSpace({ id: params.spaceId }),
  getMembers({ id: params.spaceId }),
  getSpacePerson({ id: params.spaceId, personId: params.personId }),
  getSpacePersonStatistics({ id: params.spaceId, personId: params.personId }),
]);
```

Return `statistics` in the load result.

- [ ] **Step 5: Render shared-space statistics**

In shared-space person detail `+page.svelte`, replace:

```svelte
{$t('assets_count', { values: { count: person.assetCount } })}
```

with:

```svelte
{$t('assets_count', { values: { count: data.statistics.assets } })}
```

Add immediately below:

```svelte
<p class="text-sm text-gray-500 dark:text-gray-400">
  {$t('faces_count', { values: { count: data.statistics.faces } })}
</p>
```

- [ ] **Step 6: Run shared-space web tests and verify green**

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts' 'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts' -t "statistics|asset and face counts"
```

- [ ] **Step 7: Commit shared-space person detail UI**

```bash
git add 'web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.ts' 'web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts' 'web/src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts'
git commit -m "feat: show space person face statistics"
```

## Task 6: Hardening, Generated Artifacts, And Final Verification

**Files:**

- Modify `server/test/medium/specs/repositories/face-identity-query-shape.spec.ts`.
- Modify generated SQL files under `server/src/queries/`.
- Modify generated OpenAPI/SDK files under `open-api/` and `mobile/openapi/`.

- [ ] **Step 1: Add query-shape coverage for person-detail statistics**

In `server/test/medium/specs/repositories/face-identity-query-shape.spec.ts`, add assertions that generated SQL for `FaceIdentityRepository.getAccessiblePersonStatistics` does not include vector similarity operations. Use the same assertion helper already used for `getAccessiblePeopleStatistics` and `getAccessiblePeopleFaceStatistics`.

Add the method name to the existing no-vector-similarity set:

```ts
expect(sqlByMethod.get('FaceIdentityRepository.getAccessiblePersonStatistics')).not.toMatch(/<=>|cosine|embedding/i);
```

Expected red failure before SQL generation: the method snapshot is missing.

- [ ] **Step 2: Run query-shape test and verify red**

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs test/medium/specs/repositories/face-identity-query-shape.spec.ts -t "statistics"
```

- [ ] **Step 3: Regenerate SQL snapshots**

Run the repo's SQL generation commands:

```bash
pnpm --dir server build
pnpm --dir server sync:sql
```

Expected result:

- `server/src/queries/person.repository.sql` includes `PersonRepository.getStatistics` returning `assets` and `faces`.
- `server/src/queries/face.identity.repository.sql` includes `FaceIdentityRepository.getAccessibleProfileIdentityId` and `FaceIdentityRepository.getAccessiblePersonStatistics`.
- `server/src/queries/shared.space.repository.sql` includes `SharedSpaceRepository.getSpacePersonStatistics`.

- [ ] **Step 4: Re-run OpenAPI and SDK generation to verify no contract drift**

Run:

```bash
make open-api-typescript
```

Expected result:

- The generator exits 0.
- `PersonStatisticsResponseDto` still includes `faces`.
- TypeScript SDK still exports `getSpacePersonStatistics`.
- Shared-space API docs still include `GET /shared-spaces/{id}/people/{personId}/statistics`.
- `git status --short mobile/openapi` is checked after generation, and every changed file under `mobile/openapi` is staged with the generated-contract commit.
- Any new diff from this rerun is treated as generated drift and staged in Step 10 after inspection.

- [ ] **Step 5: Run query-shape test and verify green**

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs test/medium/specs/repositories/face-identity-query-shape.spec.ts -t "statistics"
```

- [ ] **Step 6: Run focused backend verification**

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs \
  src/controllers/person.controller.spec.ts \
  src/controllers/shared-space.controller.spec.ts \
  src/services/person.service.spec.ts \
  src/services/shared-space.service.spec.ts \
  test/medium/specs/repositories/person.repository.spec.ts \
  test/medium/specs/repositories/face-identity.repository.spec.ts \
  test/medium/specs/repositories/shared-space.repository.spec.ts \
  test/medium/specs/repositories/face-identity-query-shape.spec.ts
```

Expected: all tests in the focused backend statistics files pass. Do not use a final `-t` filter here; it can silently skip case-sensitive method-name coverage such as `getAccessiblePersonStatistics`.

- [ ] **Step 7: Run focused frontend verification**

```bash
pnpm --dir web exec vitest --run \
  'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts' \
  'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts' \
  'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts' \
  'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts' \
  src/lib/utils/people-statistics.spec.ts \
  'src/routes/(user)/people/page-load.spec.ts' \
  'src/routes/(user)/people/people-page.spec.ts' \
  'src/routes/(user)/spaces/[spaceId]/people/page-load.spec.ts' \
  src/lib/components/spaces/space-people-page.spec.ts \
  src/lib/components/layouts/user-page-layout.spec.ts \
  src/lib/components/people/people-face-statistics-info.spec.ts
```

Expected: all focused frontend statistics and person-detail tests pass.

- [ ] **Step 8: Run type and Svelte checks**

```bash
pnpm --dir web check:typescript
pnpm --dir web check:svelte
```

Expected: both exit 0.

- [ ] **Step 9: Run generated-contract and whitespace checks**

```bash
rg -n "PersonStatisticsResponseDto|getSpacePersonStatistics|getPeopleFaceStatistics|getSpacePeopleFaceStatistics" open-api open-api/typescript-sdk mobile/openapi server/src web/src
git diff --check
```

Expected:

- Search output shows `PersonStatisticsResponseDto` with `assets` and `faces`.
- Search output shows `getSpacePersonStatistics` in generated SDK artifacts and web route usage.
- Detailed face-statistics production usage remains limited to lazy Phase 4 loaders.
- `git diff --check` exits 0.

- [ ] **Step 10: Commit hardening and generated artifacts**

```bash
git add server/src/queries/person.repository.sql server/src/queries/face.identity.repository.sql server/src/queries/shared.space.repository.sql open-api mobile/openapi server/test/medium/specs/repositories/face-identity-query-shape.spec.ts
git commit -m "chore: refresh person statistics generated contracts"
```

If OpenAPI generation also changes SDK tests or generated build files outside the paths above, stage those generated files in the same commit after verifying they are generator output.

- [ ] **Step 11: Request final code review**

Dispatch a reviewer over the full Phase 5 range. Ask them to verify:

- global person statistics resolve accessible identity scope and legacy personal scope correctly
- shared-space person statistics are member-protected and space-scoped
- linked-library and leave-space scenarios have explicit regression tests
- generated SDK/OpenAPI artifacts match the server DTOs
- frontend pages show honest asset and face counts
- no detailed face-statistics endpoint is called on initial overview page render

- [ ] **Step 12: Fix any Critical or Important review findings with TDD**

For each reviewer finding:

1. Write a failing regression test.
2. Run the focused test and verify red.
3. Implement the smallest fix.
4. Run the focused test and verify green.
5. Re-run the relevant focused verification command.
6. Commit the fix.

- [ ] **Step 13: Final completion verification**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs \
  src/controllers/person.controller.spec.ts \
  src/controllers/shared-space.controller.spec.ts \
  src/services/person.service.spec.ts \
  src/services/shared-space.service.spec.ts \
  test/medium/specs/repositories/person.repository.spec.ts \
  test/medium/specs/repositories/face-identity.repository.spec.ts \
  test/medium/specs/repositories/shared-space.repository.spec.ts \
  test/medium/specs/repositories/face-identity-query-shape.spec.ts

pnpm --dir web exec vitest --run \
  'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts' \
  'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/person-detail-page.spec.ts' \
  'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/page-load.spec.ts' \
  'src/routes/(user)/spaces/[spaceId]/people/[personId]/[[photos=photos]]/[[assetId=id]]/space-person-detail-page.spec.ts' \
  src/lib/utils/people-statistics.spec.ts \
  'src/routes/(user)/people/page-load.spec.ts' \
  'src/routes/(user)/people/people-page.spec.ts' \
  'src/routes/(user)/spaces/[spaceId]/people/page-load.spec.ts' \
  src/lib/components/spaces/space-people-page.spec.ts \
  src/lib/components/layouts/user-page-layout.spec.ts \
  src/lib/components/people/people-face-statistics-info.spec.ts

pnpm --dir web check:typescript
pnpm --dir web check:svelte
git diff --check
```

Expected: all commands exit 0. Do not claim Phase 5 is complete until these fresh commands pass.

## Completion Criteria

- `GET /people/:personId/statistics` returns `{ assets, faces }`.
- `GET /shared-spaces/:spaceId/people/:personId/statistics` exists and returns `{ assets, faces }`.
- Global person detail page shows asset and face counts from backend statistics.
- Shared-space person detail page shows asset and face counts from backend statistics.
- Global identity-backed person statistics include only accessible owned/timeline shared-space/linked-library assets.
- Leaving a shared space removes that space's assets from global person statistics while keeping owned assets.
- Shared-space person statistics reject non-members and out-of-space people before reading aggregates.
- Linked-library assets count only in the selected authorized space.
- Generated SQL and OpenAPI/SDK artifacts match the server contracts.
- Focused backend and frontend statistics tests pass.
- TypeScript, Svelte diagnostics, and whitespace checks pass.
