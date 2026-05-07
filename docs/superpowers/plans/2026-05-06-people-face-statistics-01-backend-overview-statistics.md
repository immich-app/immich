# People Face Statistics Phase 1: Backend Overview Statistics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every code task. Use superpowers:verification-before-completion before claiming this phase is done. This plan is Phase 1 only and must not implement lazy face details, frontend headers, or person-detail statistics. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend overview statistics for global people and shared-space people, including `detectedFaceCount` for all detected in-scope faces.

**Architecture:** Extend the existing statistics contracts instead of changing list endpoints. Keep people totals on the existing `total`/`hidden` shape, add a separate `detectedFaceCount` aggregate, and compute all counts from repository-level authorized scopes with `DISTINCT` face, asset, and identity handling.

**Tech Stack:** NestJS controllers/services, Zod DTOs, Kysely/Postgres aggregates, `@immich/sql-tools` generated SQL snapshots, Vitest small and medium tests, generated OpenAPI TypeScript SDK.

---

## Contract Decision

`total` means all eligible people in scope, including visible and hidden people. `hidden` is a subset of `total`, and the visible header count is derived as `total - hidden`. The new header face count is explicit: `detectedFaceCount` is all detected in-scope faces, including hidden-assigned and unassigned faces.

## Scope

This phase owns:

- `GET /people/statistics`
- `GET /shared-spaces/:id/people/statistics`
- Global personal-only people overview aggregates.
- Global identity-grouped people overview aggregates when `withSharedSpaces=true`.
- Shared-space people overview aggregates for the selected space.
- OpenAPI and generated TypeScript SDK contract updates.

This phase does not own:

- `GET /people/face-statistics`
- `GET /shared-spaces/:id/people/face-statistics`
- Frontend overview rendering.
- Frontend lazy info UI.
- `GET /people/:personId/statistics`
- `GET /shared-spaces/:spaceId/people/:personId/statistics`

## Supported Filters

Global overview supports:

- `withSharedSpaces`: same branch selector as `GET /people`.
- `withHidden`: accepted for parity with `GET /people`, but overview returns both `total` and `hidden`, so it does not change the aggregate.
- `page` and `size`: accepted for DTO parity, ignored by aggregate totals.

Global overview rejects these list filters until the statistics aggregate can support them without misleading totals:

- `closestPersonId`
- `closestAssetId`

Global overview does not accept search-name filtering from the separate people search workflow; Phase 3 must hide or relabel the face count while that unsupported UI filter is active.

Shared-space overview supports the filters already used by `GET /shared-spaces/:id/people/statistics`:

- `name`
- `named`
- `takenAfter`
- `takenBefore`

Shared-space overview accepts `withHidden`, `limit`, and `offset` through `SpacePeopleQueryDto` for route parity, but aggregate totals remain independent of hidden-row inclusion and pagination.

## File Map

- Modify `server/src/dtos/person.dto.ts`
  - Add `PeopleStatisticsResponseDto` with `total`, `hidden`, and `detectedFaceCount`.
- Modify `server/src/dtos/shared-space-person.dto.ts`
  - Add `detectedFaceCount` to `SharedSpacePeopleStatisticsResponseDto`.
- Modify `server/src/controllers/person.controller.ts`
  - Add `GET /people/statistics` before parameterized `:id` routes.
- Modify `server/src/controllers/person.controller.spec.ts`
  - Add route/DTO contract coverage for `GET /people/statistics`.
- Modify `server/src/controllers/shared-space.controller.spec.ts`
  - Add route/DTO contract coverage for shared-space statistics including `detectedFaceCount`.
- Modify `server/src/services/person.service.ts`
  - Add `getPeopleStatistics(auth, query)` and branch between personal-only and identity-grouped scope.
- Modify `server/src/services/person.service.spec.ts`
  - Add red tests for service branching and minimum-face-count forwarding.
- Modify `server/src/services/shared-space.service.ts`
  - Return `detectedFaceCount` from existing shared-space statistics flow.
- Modify `server/src/services/shared-space.service.spec.ts`
  - Add red tests for disabled spaces, filter forwarding, and membership protection.
- Modify `server/src/repositories/person.repository.ts`
  - Add `getPeopleOverviewStatistics(userId)` for personal-only scope.
- Modify `server/test/medium/specs/repositories/person.repository.spec.ts`
  - Add personal-only aggregate tests for visible/hidden/unassigned/deleted cases.
- Modify `server/src/repositories/face-identity.repository.ts`
  - Add `getAccessiblePeopleStatistics(userId, minimumFaceCount)` for identity-grouped global scope.
- Modify `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
  - Add identity-dedupe, overlap-dedupe, linked-library, hidden, unassigned, and access-scope tests.
- Modify `server/test/medium/specs/repositories/face-identity-query-shape.spec.ts`
  - Assert overview statistics do not use vector similarity.
- Modify `server/src/repositories/shared-space.repository.ts`
  - Extend `countPersonsBySpaceId` to also return `detectedFaceCount`.
- Modify `server/test/medium/specs/repositories/shared-space.repository.spec.ts`
  - Add selected-space, linked-library, direct-plus-linked dedupe, filter, and non-visible asset tests.
- Modify `server/src/queries/person.repository.sql`
- Modify `server/src/queries/face.identity.repository.sql`
- Modify `server/src/queries/shared.space.repository.sql`
  - Generated by `pnpm --dir server build && pnpm --dir server sync:sql`.
- Modify `open-api/immich-openapi-specs.json`
- Modify `open-api/typescript-sdk/src/fetch-client.ts`
  - Generated by `make open-api-typescript`.

## TDD Rules

- Start each task by adding the failing test.
- Run the focused test and confirm it fails for the expected missing-route, missing-method, or missing-field reason.
- Implement only enough production code for that task.
- Run the focused test again.
- Do not commit until the entire Phase 1 plan passes; the design spec asks for one completed phase commit.

---

### Task 1: Add Overview DTO And Route Contracts

**Files:**

- Modify `server/src/dtos/person.dto.ts`
- Modify `server/src/dtos/shared-space-person.dto.ts`
- Modify `server/src/controllers/person.controller.ts`
- Modify `server/src/controllers/person.controller.spec.ts`
- Modify `server/src/controllers/shared-space.controller.spec.ts`

- [ ] **Step 1: Write failing global controller tests**

In `server/src/controllers/person.controller.spec.ts`, add this block near the existing `GET /people` tests:

```ts
describe('GET /people/statistics', () => {
  it('should be an authenticated route', async () => {
    await request(ctx.getHttpServer()).get('/people/statistics');
    expect(ctx.authenticate).toHaveBeenCalled();
  });

  it('should return people overview statistics', async () => {
    service.getPeopleStatistics.mockResolvedValue({
      total: 7,
      hidden: 2,
      detectedFaceCount: 23,
    });

    const { status, body } = await request(ctx.getHttpServer())
      .get('/people/statistics')
      .query({ withSharedSpaces: true })
      .set('Authorization', `Bearer token`);

    expect(status).toBe(200);
    expect(service.getPeopleStatistics).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ withSharedSpaces: true }),
    );
    expect(body).toEqual({
      total: 7,
      hidden: 2,
      detectedFaceCount: 23,
    });
  });
});
```

- [ ] **Step 2: Write failing shared-space controller test**

In `server/src/controllers/shared-space.controller.spec.ts`, add:

```ts
describe('GET /shared-spaces/:id/people/statistics', () => {
  it('should serialize detected face count', async () => {
    const spaceId = factory.uuid();
    service.getSpacePeopleStatistics.mockResolvedValue({
      total: 5,
      hidden: 1,
      detectedFaceCount: 19,
    });

    const { status, body } = await request(ctx.getHttpServer())
      .get(`/shared-spaces/${spaceId}/people/statistics`)
      .query({ name: 'Ali' })
      .set('Authorization', `Bearer token`);

    expect(status).toBe(200);
    expect(service.getSpacePeopleStatistics).toHaveBeenCalledWith(
      undefined,
      spaceId,
      expect.objectContaining({ name: 'Ali' }),
    );
    expect(body).toEqual({
      total: 5,
      hidden: 1,
      detectedFaceCount: 19,
    });
  });
});
```

- [ ] **Step 3: Run contract tests and verify red**

Run:

```bash
pnpm --dir server test -- src/controllers/person.controller.spec.ts src/controllers/shared-space.controller.spec.ts -t "statistics"
```

Expected: FAIL because `PersonService.getPeopleStatistics` and/or the `GET /people/statistics` route do not exist, and `detectedFaceCount` is not in the shared-space DTO contract.

- [ ] **Step 4: Add DTOs**

In `server/src/dtos/person.dto.ts`, add this schema after `PersonStatisticsResponseSchema` or before `PeopleResponseSchema`:

```ts
const PeopleStatisticsResponseSchema = z
  .object({
    total: z.int().min(0).describe('Total number of people'),
    hidden: z.int().min(0).describe('Number of hidden people'),
    detectedFaceCount: z.int().min(0).describe('Number of detected faces in the accessible people scope'),
  })
  .meta({ id: 'PeopleStatisticsResponseDto' });

export class PeopleStatisticsResponseDto extends createZodDto(PeopleStatisticsResponseSchema) {}
```

In `server/src/dtos/shared-space-person.dto.ts`, extend `SharedSpacePeopleStatisticsResponseSchema`:

```ts
const SharedSpacePeopleStatisticsResponseSchema = z
  .object({
    total: z.int().min(0).describe('Total number of people'),
    hidden: z.int().min(0).describe('Number of hidden people'),
    detectedFaceCount: z.int().min(0).describe('Number of detected faces in the shared-space people scope'),
  })
  .meta({ id: 'SharedSpacePeopleStatisticsResponseDto' });
```

- [ ] **Step 5: Add global route**

In `server/src/controllers/person.controller.ts`, import `PeopleStatisticsResponseDto` and add this route before `@Get(':id/faces')`:

```ts
@Get('statistics')
@Authenticated({ permission: Permission.PersonRead })
@Endpoint({
  summary: 'Get people statistics',
  description: 'Retrieve people and detected-face counts for the authenticated user people scope.',
  history: new HistoryBuilder().added('v2').stable('v2'),
})
getPeopleStatistics(@Auth() auth: AuthDto, @Query() options: PersonSearchDto): Promise<PeopleStatisticsResponseDto> {
  return this.service.getPeopleStatistics(auth, options);
}
```

Route order matters: keep this static route above `@Get(':id')` so `/people/statistics` cannot be captured as a person ID.

- [ ] **Step 6: Run contract tests and verify green**

Run:

```bash
pnpm --dir server test -- src/controllers/person.controller.spec.ts src/controllers/shared-space.controller.spec.ts -t "statistics"
```

Expected: PASS.

---

### Task 2: Add Service Wiring

**Files:**

- Modify `server/src/services/person.service.ts`
- Modify `server/src/services/person.service.spec.ts`
- Modify `server/src/services/shared-space.service.ts`
- Modify `server/src/services/shared-space.service.spec.ts`

- [ ] **Step 1: Write failing global service tests**

In `server/src/services/person.service.spec.ts`, add these tests in the `getAll` area or a new `describe('getPeopleStatistics')` block:

```ts
describe('getPeopleStatistics', () => {
  it('uses identity-grouped global scope when withSharedSpaces is true', async () => {
    const auth = AuthFactory.create();
    (mocks.faceIdentity as any).getAccessiblePeopleStatistics ??= vi.fn();
    (mocks.faceIdentity as any).getAccessiblePeopleStatistics.mockResolvedValue({
      total: 3,
      hidden: 1,
      detectedFaceCount: 11,
    });

    await expect(sut.getPeopleStatistics(auth, { withSharedSpaces: true, page: 4, size: 10 } as any)).resolves.toEqual({
      total: 3,
      hidden: 1,
      detectedFaceCount: 11,
    });

    expect((mocks.faceIdentity as any).getAccessiblePeopleStatistics).toHaveBeenCalledWith(auth.user.id, {
      minimumFaceCount: 3,
    });
    expect(mocks.person.getPeopleOverviewStatistics).not.toHaveBeenCalled();
  });

  it('uses personal-only scope when withSharedSpaces is omitted', async () => {
    const auth = AuthFactory.create();
    mocks.person.getPeopleOverviewStatistics.mockResolvedValue({
      total: 2,
      hidden: 0,
      detectedFaceCount: 5,
    });

    await expect(sut.getPeopleStatistics(auth, { page: 1, size: 50 } as any)).resolves.toEqual({
      total: 2,
      hidden: 0,
      detectedFaceCount: 5,
    });

    expect(mocks.person.getPeopleOverviewStatistics).toHaveBeenCalledWith(auth.user.id);
  });

  it('rejects closest-person filters instead of returning misleading unfiltered totals', async () => {
    const auth = AuthFactory.create();

    await expect(
      sut.getPeopleStatistics(auth, { closestPersonId: newUuid(), page: 1, size: 50 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mocks.person.getPeopleOverviewStatistics).not.toHaveBeenCalled();
    expect((mocks.faceIdentity as any).getAccessiblePeopleStatistics).not.toHaveBeenCalled();
  });
});
```

Add mock initialization in `beforeEach` if needed:

```ts
(mocks.faceIdentity as any).getAccessiblePeopleStatistics ??= vi.fn();
(mocks.person as any).getPeopleOverviewStatistics ??= vi.fn();
```

- [ ] **Step 2: Write failing shared-space service tests**

In `server/src/services/shared-space.service.spec.ts`, extend the existing `getSpacePeopleStatistics` test:

```ts
mocks.sharedSpace.countPersonsBySpaceId.mockResolvedValue({
  total: 152,
  hidden: 3,
  detectedFaceCount: 1201,
});

await expect(
  sut.getSpacePeopleStatistics(auth, spaceId, { name: 'Ali', takenAfter, limit: 10, offset: 20 } as any),
).resolves.toEqual({
  total: 152,
  hidden: 3,
  detectedFaceCount: 1201,
});
```

Add a disabled-space test:

```ts
it('returns zero overview statistics when face recognition is disabled for the space', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();

  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false }));

  await expect(sut.getSpacePeopleStatistics(auth, spaceId)).resolves.toEqual({
    total: 0,
    hidden: 0,
    detectedFaceCount: 0,
  });

  expect(mocks.sharedSpace.countPersonsBySpaceId).not.toHaveBeenCalled();
});

it('rejects non-members before reading shared-space overview statistics', async () => {
  mocks.sharedSpace.getMember.mockResolvedValue(void 0);

  await expect(sut.getSpacePeopleStatistics(factory.auth(), 'space-1')).rejects.toThrow('Not a member');

  expect(mocks.sharedSpace.getById).not.toHaveBeenCalled();
  expect(mocks.sharedSpace.countPersonsBySpaceId).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Run service tests and verify red**

Run:

```bash
pnpm --dir server test -- src/services/person.service.spec.ts src/services/shared-space.service.spec.ts -t "getPeopleStatistics|getSpacePeopleStatistics"
```

Expected: FAIL because service/repository methods or `detectedFaceCount` fields are missing.

- [ ] **Step 4: Implement global service method**

In `server/src/services/person.service.ts`, import `PeopleStatisticsResponseDto` and add:

```ts
async getPeopleStatistics(auth: AuthDto, dto: PersonSearchDto): Promise<PeopleStatisticsResponseDto> {
  if (dto.closestPersonId || dto.closestAssetId) {
    throw new BadRequestException('closestPersonId and closestAssetId are not supported for people statistics');
  }

  const { machineLearning } = await this.getConfig({ withCache: false });

  if (dto.withSharedSpaces) {
    return this.faceIdentityRepository.getAccessiblePeopleStatistics(auth.user.id, {
      minimumFaceCount: machineLearning.facialRecognition.minFaces,
    });
  }

  return this.personRepository.getPeopleOverviewStatistics(auth.user.id);
}
```

- [ ] **Step 5: Update shared-space service zero state**

In `server/src/services/shared-space.service.ts`, update the disabled branch:

```ts
if (!space?.faceRecognitionEnabled) {
  return { total: 0, hidden: 0, detectedFaceCount: 0 };
}
```

Keep the existing filter forwarding to `countPersonsBySpaceId`:

```ts
return this.sharedSpaceRepository.countPersonsBySpaceId(spaceId, {
  petsEnabled: space.petsEnabled,
  named: query?.named,
  name: query?.name,
  takenAfter: query?.takenAfter,
  takenBefore: query?.takenBefore,
});
```

- [ ] **Step 6: Run service tests and verify green**

Run:

```bash
pnpm --dir server test -- src/services/person.service.spec.ts src/services/shared-space.service.spec.ts -t "getPeopleStatistics|getSpacePeopleStatistics"
```

Expected: PASS.

---

### Task 3: Implement Personal-Only Overview Aggregate

**Files:**

- Modify `server/src/repositories/person.repository.ts`
- Modify `server/test/medium/specs/repositories/person.repository.spec.ts`
- Generated later: `server/src/queries/person.repository.sql`

- [ ] **Step 1: Write failing personal-only repository tests**

In `server/test/medium/specs/repositories/person.repository.spec.ts`, extend the existing enum import to `import { AssetFileType, AssetVisibility } from 'src/enum';`, then add:

```ts
describe('getPeopleOverviewStatistics', () => {
  it('counts personal people and all detected timeline faces in owned assets', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { person: visiblePerson } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', isHidden: false });
    const { person: hiddenPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Hidden Alice', isHidden: true });
    const { asset } = await ctx.newAsset({ ownerId: user.id });

    await ctx.newAssetFace({ assetId: asset.id, personId: visiblePerson.id });
    await ctx.newAssetFace({ assetId: asset.id, personId: hiddenPerson.id });
    await ctx.newAssetFace({ assetId: asset.id, personId: null });

    await expect(sut.getPeopleOverviewStatistics(user.id)).resolves.toEqual({
      total: 2,
      hidden: 1,
      detectedFaceCount: 3,
    });
  });

  it('reports zero visible people for an all-hidden personal library while still counting detected faces', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Hidden Alice', isHidden: true });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

    const result = await sut.getPeopleOverviewStatistics(user.id);

    expect(result).toEqual({
      total: 1,
      hidden: 1,
      detectedFaceCount: 1,
    });
    expect(result.total - result.hidden).toBe(0);
  });

  it('excludes deleted, offline, and non-timeline assets and non-visible faces from personal detected face counts', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
    const { asset: activeAsset } = await ctx.newAsset({ ownerId: user.id });
    const { asset: deletedAsset } = await ctx.newAsset({ ownerId: user.id });
    const { asset: offlineAsset } = await ctx.newAsset({ ownerId: user.id, isOffline: true });
    const { asset: lockedAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
    const { asset: archiveAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive });

    await ctx.newAssetFace({ assetId: activeAsset.id, personId: person.id, isVisible: true });
    await ctx.newAssetFace({ assetId: activeAsset.id, personId: person.id, isVisible: false });
    await ctx.newAssetFace({ assetId: activeAsset.id, personId: person.id, deletedAt: new Date() });
    await ctx.newAssetFace({ assetId: deletedAsset.id, personId: person.id });
    await ctx.newAssetFace({ assetId: offlineAsset.id, personId: person.id });
    await ctx.newAssetFace({ assetId: lockedAsset.id, personId: person.id });
    await ctx.newAssetFace({ assetId: archiveAsset.id, personId: person.id });
    await ctx.softDeleteAsset(deletedAsset.id);

    await expect(sut.getPeopleOverviewStatistics(user.id)).resolves.toEqual({
      total: 1,
      hidden: 0,
      detectedFaceCount: 1,
    });
  });

  it('returns zeroes for an empty personal library', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();

    await expect(sut.getPeopleOverviewStatistics(user.id)).resolves.toEqual({
      total: 0,
      hidden: 0,
      detectedFaceCount: 0,
    });
  });
});
```

- [ ] **Step 2: Run personal-only repository tests and verify red**

Run:

```bash
pnpm --dir server test:medium -- --run test/medium/specs/repositories/person.repository.spec.ts -t "getPeopleOverviewStatistics"
```

Expected: FAIL because `getPeopleOverviewStatistics` is not implemented.

- [ ] **Step 3: Add repository return type and method**

In `server/src/repositories/person.repository.ts`, add:

```ts
export interface PeopleOverviewStatistics {
  total: number;
  hidden: number;
  detectedFaceCount: number;
}
```

Then add this method near `getNumberOfPeople`:

```ts
@GenerateSql({ params: [DummyValue.UUID] })
async getPeopleOverviewStatistics(userId: string): Promise<PeopleOverviewStatistics> {
  const people = await this.getNumberOfPeople(userId);
  const result = await this.db
    .selectFrom('asset_face')
    .innerJoin('asset', (join) =>
      join
        .onRef('asset.id', '=', 'asset_face.assetId')
        .on('asset.ownerId', '=', userId)
        .on('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
        .on('asset.isOffline', '=', false)
        .on('asset.deletedAt', 'is', null),
    )
    .select((eb) => eb.fn.count(eb.fn('distinct', ['asset_face.id'])).as('detectedFaceCount'))
    .where('asset_face.deletedAt', 'is', null)
    .where('asset_face.isVisible', 'is', true)
    .executeTakeFirst();

  return {
    total: Number(people.total ?? 0),
    hidden: Number(people.hidden ?? 0),
    detectedFaceCount: Number(result?.detectedFaceCount ?? 0),
  };
}
```

- [ ] **Step 4: Run personal-only repository tests and verify green**

Run:

```bash
pnpm --dir server test:medium -- --run test/medium/specs/repositories/person.repository.spec.ts -t "getPeopleOverviewStatistics"
```

Expected: PASS.

---

### Task 4: Implement Identity-Grouped Global Overview Aggregate

**Files:**

- Modify `server/src/repositories/face-identity.repository.ts`
- Modify `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
- Modify `server/test/medium/specs/repositories/face-identity-query-shape.spec.ts`
- Generated later: `server/src/queries/face.identity.repository.sql`

- [ ] **Step 1: Write failing global identity aggregate tests**

In `server/test/medium/specs/repositories/face-identity.repository.spec.ts`, add a `describe('getAccessiblePeopleStatistics')` block:

```ts
describe('getAccessiblePeopleStatistics', () => {
  it('counts visible identities, hidden identities, hidden faces, and unassigned faces in global scope', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { person: visiblePerson } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', isHidden: false });
    const { person: hiddenPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Hidden Alice', isHidden: true });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { assetFace: visibleFace } = await ctx.newAssetFace({ assetId: asset.id, personId: visiblePerson.id });
    const { assetFace: hiddenFace } = await ctx.newAssetFace({ assetId: asset.id, personId: hiddenPerson.id });
    await ctx.newAssetFace({ assetId: asset.id, personId: null });

    const visibleIdentity = await sut.ensurePersonIdentity(visiblePerson.id);
    const hiddenIdentity = await sut.ensurePersonIdentity(hiddenPerson.id);
    await sut.linkFace({ assetFaceId: visibleFace.id, identityId: visibleIdentity.id, source: 'owner-person' });
    await sut.linkFace({ assetFaceId: hiddenFace.id, identityId: hiddenIdentity.id, source: 'owner-person' });

    await expect(sut.getAccessiblePeopleStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
      total: 2,
      hidden: 1,
      detectedFaceCount: 3,
    });
  });

  it('dedupes an identity represented by personal and space-person rows', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id });
    const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
    const identity = await sut.ensurePersonIdentity(person.id);
    await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: identity.id,
        name: 'Shared Alice',
        representativeFaceId: assetFace.id,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: assetFace.id })
      .execute();

    await expect(sut.getAccessiblePeopleStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
      total: 1,
      hidden: 0,
      detectedFaceCount: 1,
    });
  });

  it('dedupes detected faces reachable through owned assets and timeline shared spaces', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id });
    const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
    const identity = await sut.ensurePersonIdentity(person.id);
    await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

    await expect(sut.getAccessiblePeopleStatistics(user.id, { minimumFaceCount: 1 })).resolves.toMatchObject({
      total: 1,
      hidden: 0,
      detectedFaceCount: 1,
    });
  });

  it('includes linked-library faces only through timeline-enabled member spaces', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { user: owner } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id });
    const { library } = await ctx.newLibrary({ ownerId: owner.id });
    await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: owner.id });
    const { person } = await ctx.newPerson({ ownerId: owner.id, name: 'Linked Alice' });
    const { asset } = await ctx.newAsset({ ownerId: owner.id, libraryId: library.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const identity = await sut.ensurePersonIdentity(person.id);
    await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
    const spacePerson = await ctx.database
      .insertInto('shared_space_person')
      .values({
        spaceId: space.id,
        identityId: identity.id,
        name: 'Linked Alice',
        representativeFaceId: assetFace.id,
        type: 'person',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await ctx.database
      .insertInto('shared_space_person_face')
      .values({ personId: spacePerson.id, assetFaceId: assetFace.id })
      .execute();

    await expect(sut.getAccessiblePeopleStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
      total: 1,
      hidden: 0,
      detectedFaceCount: 1,
    });

    await ctx.database
      .updateTable('shared_space_member')
      .set({ showInTimeline: false })
      .where('spaceId', '=', space.id)
      .where('userId', '=', user.id)
      .execute();

    await expect(sut.getAccessiblePeopleStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
      total: 0,
      hidden: 0,
      detectedFaceCount: 0,
    });
  });

  it('dedupes a linked-library face reachable through multiple timeline spaces', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { user: owner } = await ctx.newUser();
    const { space: spaceA } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
    const { space: spaceB } = await ctx.newSharedSpace({ createdById: owner.id, faceRecognitionEnabled: true });
    await ctx.newSharedSpaceMember({ spaceId: spaceA.id, userId: user.id });
    await ctx.newSharedSpaceMember({ spaceId: spaceB.id, userId: user.id });
    const { library } = await ctx.newLibrary({ ownerId: owner.id });
    await ctx.newSharedSpaceLibrary({ spaceId: spaceA.id, libraryId: library.id, addedById: owner.id });
    await ctx.newSharedSpaceLibrary({ spaceId: spaceB.id, libraryId: library.id, addedById: owner.id });
    const { person } = await ctx.newPerson({ ownerId: owner.id, name: 'Linked Alice' });
    const { asset } = await ctx.newAsset({ ownerId: owner.id, libraryId: library.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    const identity = await sut.ensurePersonIdentity(person.id);
    await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

    for (const space of [spaceA, spaceB]) {
      const spacePerson = await ctx.database
        .insertInto('shared_space_person')
        .values({
          spaceId: space.id,
          identityId: identity.id,
          name: 'Linked Alice',
          representativeFaceId: assetFace.id,
          type: 'person',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await ctx.database
        .insertInto('shared_space_person_face')
        .values({ personId: spacePerson.id, assetFaceId: assetFace.id })
        .execute();
    }

    await expect(sut.getAccessiblePeopleStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
      total: 1,
      hidden: 0,
      detectedFaceCount: 1,
    });
  });
});
```

- [ ] **Step 2: Add query-shape red test**

In `server/test/medium/specs/repositories/face-identity-query-shape.spec.ts`, extend the vector-similarity guard to include the new method:

```ts
const identityOnlyText = [
  /async getAccessiblePeopleIdentityPage[\s\S]*?async getAccessiblePeopleCounts/.exec(sqlText)?.[0] ?? '',
  /async getAccessiblePeopleStatistics[\s\S]*?async hydrateAccessiblePeople/.exec(sqlText)?.[0] ?? '',
  /async hydrateAccessiblePeople[\s\S]*?private mapAccessiblePerson/.exec(sqlText)?.[0] ?? '',
  /async getAccessiblePersonFilterSuggestions[\s\S]*?async getAccessiblePeople/.exec(sqlText)?.[0] ?? '',
  /async searchAccessiblePeople[\s\S]*?async getAccessiblePersonFilterSuggestions/.exec(sqlText)?.[0] ?? '',
  /private async getFilteredIdentityPeople[\s\S]*?private async getFilteredRatings/.exec(sqlText)?.[0] ?? '',
  /identity-filter-suggestions[\s\S]*?async getFilterSuggestions/.exec(sqlText)?.[0] ?? '',
].join('\n');
```

- [ ] **Step 3: Run global identity aggregate tests and verify red**

Run:

```bash
pnpm --dir server test:medium -- --run test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/repositories/face-identity-query-shape.spec.ts -t "getAccessiblePeopleStatistics|vector similarity"
```

Expected: FAIL because `getAccessiblePeopleStatistics` does not exist.

- [ ] **Step 4: Implement identity-grouped aggregate**

In `server/src/repositories/face-identity.repository.ts`, add:

```ts
type AccessiblePeopleStatisticsOptions = {
  minimumFaceCount: number;
};

type AccessiblePeopleStatisticsRow = {
  total: string | number | null;
  hidden: string | number | null;
  detectedFaceCount: string | number | null;
};
```

Add this method before `hydrateAccessiblePeople`:

```ts
@GenerateSql({ params: [DummyValue.UUID, { minimumFaceCount: 3 }] })
async getAccessiblePeopleStatistics(
  userId: string,
  options: AccessiblePeopleStatisticsOptions,
): Promise<{ total: number; hidden: number; detectedFaceCount: number }> {
  const result = await sql<AccessiblePeopleStatisticsRow>`
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
      WHERE asset_face."deletedAt" IS NULL
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
    ),
    accessible_identity_faces AS (
      SELECT
        face_identity_face."identityId",
        accessible_detected_faces."assetId"
      FROM accessible_detected_faces
      INNER JOIN face_identity_face ON face_identity_face."assetFaceId" = accessible_detected_faces."assetFaceId"
    ),
    identity_counts AS (
      SELECT
        accessible_identity_faces."identityId",
        COUNT(DISTINCT accessible_identity_faces."assetId") AS "visibleAssetCount"
      FROM accessible_identity_faces
      GROUP BY accessible_identity_faces."identityId"
    ),
    accessible_profiles AS (
      SELECT person."identityId", person."isHidden", person.name
      FROM person
      WHERE person."ownerId" = ${userId}
        AND person."identityId" IS NOT NULL
        AND EXISTS (SELECT 1 FROM accessible_identity_faces WHERE accessible_identity_faces."identityId" = person."identityId")
      UNION ALL
      SELECT
        shared_space_person."identityId",
        shared_space_person."isHidden",
        COALESCE(NULLIF(shared_space_person_alias.alias, ''), shared_space_person.name, '') AS name
      FROM shared_space_person
      INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_person."spaceId"
      LEFT JOIN shared_space_person_alias
        ON shared_space_person_alias."personId" = shared_space_person.id
        AND shared_space_person_alias."userId" = ${userId}
      WHERE shared_space_person."identityId" IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM shared_space_person_face
          INNER JOIN asset_face AS profile_face
            ON profile_face.id = shared_space_person_face."assetFaceId"
          WHERE shared_space_person_face."personId" = shared_space_person.id
            AND profile_face."deletedAt" IS NULL
            AND profile_face."isVisible" = true
        )
        AND EXISTS (
          SELECT 1 FROM accessible_identity_faces WHERE accessible_identity_faces."identityId" = shared_space_person."identityId"
        )
    ),
    identity_visibility AS (
      SELECT
        "identityId",
        bool_or("isHidden" = false) AS "hasVisibleProfile",
        bool_or(NULLIF(name, '') IS NOT NULL) AS "hasNamedProfile"
      FROM accessible_profiles
      GROUP BY "identityId"
    ),
    eligible_identities AS (
      SELECT identity_visibility.*
      FROM identity_visibility
      INNER JOIN identity_counts ON identity_counts."identityId" = identity_visibility."identityId"
      WHERE identity_visibility."hasNamedProfile" = true
        OR identity_counts."visibleAssetCount" >= ${options.minimumFaceCount}
    )
    SELECT
      (SELECT COUNT(*) FROM eligible_identities) AS total,
      (SELECT COUNT(*) FROM eligible_identities WHERE "hasVisibleProfile" = false) AS hidden,
      (SELECT COUNT(DISTINCT "assetFaceId") FROM accessible_detected_faces) AS "detectedFaceCount"
  `.execute(this.db);

  const row = result.rows[0];
  return {
    total: Number(row?.total ?? 0),
    hidden: Number(row?.hidden ?? 0),
    detectedFaceCount: Number(row?.detectedFaceCount ?? 0),
  };
}
```

- [ ] **Step 5: Run global identity aggregate tests and verify green**

Run:

```bash
pnpm --dir server test:medium -- --run test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/repositories/face-identity-query-shape.spec.ts -t "getAccessiblePeopleStatistics|vector similarity"
```

Expected: PASS.

---

### Task 5: Implement Shared-Space Overview Aggregate

**Files:**

- Modify `server/src/repositories/shared-space.repository.ts`
- Modify `server/test/medium/specs/repositories/shared-space.repository.spec.ts`
- Generated later: `server/src/queries/shared.space.repository.sql`

- [ ] **Step 1: Write failing shared-space aggregate tests**

In `server/test/medium/specs/repositories/shared-space.repository.spec.ts`, add `FaceIdentityRepository` to the repository imports, then extend `describe('countPersonsBySpaceId')` with:

```ts
it('returns zeroes for an empty shared space', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });

  await expect(sut.countPersonsBySpaceId(space.id, { petsEnabled: true })).resolves.toEqual({
    total: 0,
    hidden: 0,
    detectedFaceCount: 0,
  });
});

it('does not count faces or people from another shared space', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space: targetSpace } = await ctx.newSharedSpace({ createdById: user.id });
  const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
  const { asset: targetAsset } = await ctx.newAsset({ ownerId: user.id });
  const { asset: otherAsset } = await ctx.newAsset({ ownerId: user.id });
  await ctx.newSharedSpaceAsset({ spaceId: targetSpace.id, assetId: targetAsset.id, addedById: user.id });
  await ctx.newSharedSpaceAsset({ spaceId: otherSpace.id, assetId: otherAsset.id, addedById: user.id });
  const { assetFace: targetFace } = await ctx.newAssetFace({ assetId: targetAsset.id });
  const { assetFace: otherFace } = await ctx.newAssetFace({ assetId: otherAsset.id });
  const targetPerson = await sut.createPerson({
    spaceId: targetSpace.id,
    name: 'Target',
    representativeFaceId: targetFace.id,
    type: 'person',
  });
  const otherPerson = await sut.createPerson({
    spaceId: otherSpace.id,
    name: 'Other',
    representativeFaceId: otherFace.id,
    type: 'person',
  });
  await sut.addPersonFaces([
    { personId: targetPerson.id, assetFaceId: targetFace.id },
    { personId: otherPerson.id, assetFaceId: otherFace.id },
  ]);

  await expect(sut.countPersonsBySpaceId(targetSpace.id, { petsEnabled: true })).resolves.toEqual({
    total: 1,
    hidden: 0,
    detectedFaceCount: 1,
  });
});

it('counts selected-space detected faces including linked-library assets', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { library } = await ctx.newLibrary({ ownerId: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
  const { asset: directAsset } = await ctx.newAsset({ ownerId: user.id });
  const { asset: linkedAsset } = await ctx.newAsset({ ownerId: user.id, libraryId: library.id });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: directAsset.id, addedById: user.id });
  const directFace = await ctx.newAssetFace({ assetId: directAsset.id });
  const linkedFace = await ctx.newAssetFace({ assetId: linkedAsset.id });
  const directPerson = await sut.createPerson({
    spaceId: space.id,
    name: 'Direct',
    representativeFaceId: directFace.assetFace.id,
    type: 'person',
  });
  const linkedPerson = await sut.createPerson({
    spaceId: space.id,
    name: 'Linked',
    representativeFaceId: linkedFace.assetFace.id,
    type: 'person',
  });
  await sut.addPersonFaces([
    { personId: directPerson.id, assetFaceId: directFace.assetFace.id },
    { personId: linkedPerson.id, assetFaceId: linkedFace.assetFace.id },
  ]);

  await expect(sut.countPersonsBySpaceId(space.id, { petsEnabled: true })).resolves.toEqual({
    total: 2,
    hidden: 0,
    detectedFaceCount: 2,
  });
});

it('counts one space person when multiple space assets resolve to the same identity', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { person: personalPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Alice' });
  const { asset: firstAsset } = await ctx.newAsset({ ownerId: user.id });
  const { asset: secondAsset } = await ctx.newAsset({ ownerId: user.id });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: firstAsset.id, addedById: user.id });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: secondAsset.id, addedById: user.id });
  const { assetFace: firstFace } = await ctx.newAssetFace({ assetId: firstAsset.id, personId: personalPerson.id });
  const { assetFace: secondFace } = await ctx.newAssetFace({ assetId: secondAsset.id, personId: personalPerson.id });
  const identity = await ctx.get(FaceIdentityRepository).ensurePersonIdentity(personalPerson.id);
  const spacePerson = await sut.createPerson({
    spaceId: space.id,
    identityId: identity.id,
    name: 'Alice',
    representativeFaceId: firstFace.id,
    type: 'person',
  });
  await sut.addPersonFaces([
    { personId: spacePerson.id, assetFaceId: firstFace.id },
    { personId: spacePerson.id, assetFaceId: secondFace.id },
  ]);

  await expect(sut.countPersonsBySpaceId(space.id, { petsEnabled: true })).resolves.toEqual({
    total: 1,
    hidden: 0,
    detectedFaceCount: 2,
  });
});

it('dedupes a face reachable as both direct space asset and linked-library asset', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { library } = await ctx.newLibrary({ ownerId: user.id });
  await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: user.id });
  const { asset } = await ctx.newAsset({ ownerId: user.id, libraryId: library.id });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
  const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
  const person = await sut.createPerson({
    spaceId: space.id,
    name: 'Alice',
    representativeFaceId: assetFace.id,
    type: 'person',
  });
  await sut.addPersonFaces([{ personId: person.id, assetFaceId: assetFace.id }]);

  await expect(sut.countPersonsBySpaceId(space.id, { petsEnabled: true })).resolves.toMatchObject({
    total: 1,
    hidden: 0,
    detectedFaceCount: 1,
  });
});

it('excludes deleted, offline, locked, and non-visible shared-space faces', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { asset: activeAsset } = await ctx.newAsset({ ownerId: user.id });
  const { asset: deletedAsset } = await ctx.newAsset({ ownerId: user.id });
  const { asset: offlineAsset } = await ctx.newAsset({ ownerId: user.id, isOffline: true });
  const { asset: lockedAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });
  for (const asset of [activeAsset, deletedAsset, offlineAsset, lockedAsset]) {
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
  }
  const { assetFace: visibleFace } = await ctx.newAssetFace({ assetId: activeAsset.id });
  await ctx.newAssetFace({ assetId: activeAsset.id, isVisible: false });
  await ctx.newAssetFace({ assetId: activeAsset.id, deletedAt: new Date() });
  await ctx.newAssetFace({ assetId: deletedAsset.id });
  await ctx.newAssetFace({ assetId: offlineAsset.id });
  await ctx.newAssetFace({ assetId: lockedAsset.id });
  const person = await sut.createPerson({
    spaceId: space.id,
    name: 'Alice',
    representativeFaceId: visibleFace.id,
    type: 'person',
  });
  await sut.addPersonFaces([{ personId: person.id, assetFaceId: visibleFace.id }]);
  await ctx.softDeleteAsset(deletedAsset.id);

  await expect(sut.countPersonsBySpaceId(space.id, { petsEnabled: true })).resolves.toEqual({
    total: 1,
    hidden: 0,
    detectedFaceCount: 1,
  });
});

it('applies name filters to assigned face counts without counting unassigned faces as name matches', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { asset } = await ctx.newAsset({ ownerId: user.id });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
  const { assetFace: aliceFace } = await ctx.newAssetFace({ assetId: asset.id });
  await ctx.newAssetFace({ assetId: asset.id });
  const alice = await sut.createPerson({
    spaceId: space.id,
    name: 'Alice',
    representativeFaceId: aliceFace.id,
    type: 'person',
  });
  await sut.addPersonFaces([{ personId: alice.id, assetFaceId: aliceFace.id }]);

  await expect(sut.countPersonsBySpaceId(space.id, { petsEnabled: true, name: 'Ali' })).resolves.toEqual({
    total: 1,
    hidden: 0,
    detectedFaceCount: 1,
  });
});

it('applies taken-date filters to detected faces while still counting unassigned matching-date faces', async () => {
  const { ctx, sut } = setup();
  const { user } = await ctx.newUser();
  const { space } = await ctx.newSharedSpace({ createdById: user.id });
  const { asset: matchingAsset } = await ctx.newAsset({
    ownerId: user.id,
    fileCreatedAt: new Date('2026-05-02T00:00:00.000Z'),
  });
  const { asset: oldAsset } = await ctx.newAsset({
    ownerId: user.id,
    fileCreatedAt: new Date('2026-04-02T00:00:00.000Z'),
  });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: matchingAsset.id, addedById: user.id });
  await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: oldAsset.id, addedById: user.id });
  const { assetFace: assignedMatchingFace } = await ctx.newAssetFace({ assetId: matchingAsset.id });
  await ctx.newAssetFace({ assetId: matchingAsset.id, personId: null });
  await ctx.newAssetFace({ assetId: oldAsset.id, personId: null });
  const person = await sut.createPerson({
    spaceId: space.id,
    name: 'Alice',
    representativeFaceId: assignedMatchingFace.id,
    type: 'person',
  });
  await sut.addPersonFaces([{ personId: person.id, assetFaceId: assignedMatchingFace.id }]);

  await expect(
    sut.countPersonsBySpaceId(space.id, { petsEnabled: true, takenAfter: new Date('2026-05-01T00:00:00.000Z') }),
  ).resolves.toEqual({
    total: 1,
    hidden: 0,
    detectedFaceCount: 2,
  });
});
```

- [ ] **Step 2: Run shared-space aggregate tests and verify red**

Run:

```bash
pnpm --dir server test:medium -- --run test/medium/specs/repositories/shared-space.repository.spec.ts -t "countPersonsBySpaceId"
```

Expected: FAIL because `detectedFaceCount` is missing or filter handling does not match.

- [ ] **Step 3: Extend aggregate implementation**

In `server/src/repositories/shared-space.repository.ts`, keep the existing `visibleSpaceAssetVisibilities` helper and update `countPersonsBySpaceId` to compute both person counts and detected faces. The implementation should use:

```ts
const hasPersonFilter = !!options.named || !!namePattern;
const filteredPeople = this.db
  .selectFrom('shared_space_person')
  .select([
    'shared_space_person.id as personId',
    sql<string>`COALESCE("shared_space_person"."identityId"::text, "shared_space_person"."id"::text)`.as('personKey'),
    'shared_space_person.isHidden',
  ])
  .where('shared_space_person.spaceId', '=', spaceId)
  .$if(!options.petsEnabled, (qb) => qb.where('shared_space_person.type', '!=', 'pet'))
  .$if(!!options.named, (qb) => qb.where('shared_space_person.name', '!=', ''))
  .$if(!!namePattern, (qb) => qb.where(() => sql`"shared_space_person"."name" ILIKE ${namePattern} ESCAPE '\\'`))
  .$if(!!options.takenAfter || !!options.takenBefore, (qb) =>
    qb.where((eb) =>
      eb.exists(
        eb
          .selectFrom('shared_space_person_face as spf2')
          .innerJoin('asset_face as af2', 'af2.id', 'spf2.assetFaceId')
          .innerJoin('asset', 'asset.id', 'af2.assetId')
          .whereRef('spf2.personId', '=', 'shared_space_person.id')
          .where('asset.deletedAt', 'is', null)
          .where('asset.isOffline', '=', false)
          .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
          .where((spaceEb) =>
            spaceEb.or([
              spaceEb.exists(
                spaceEb
                  .selectFrom('shared_space_asset')
                  .whereRef('shared_space_asset.assetId', '=', 'asset.id')
                  .where('shared_space_asset.spaceId', '=', spaceId),
              ),
              spaceEb.exists(
                spaceEb
                  .selectFrom('shared_space_library')
                  .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
                  .where('shared_space_library.spaceId', '=', spaceId),
              ),
            ]),
          )
          .$if(!!options.takenAfter, (qb2) => qb2.where('asset.fileCreatedAt', '>=', options.takenAfter!))
          .$if(!!options.takenBefore, (qb2) => qb2.where('asset.fileCreatedAt', '<', options.takenBefore!)),
      ),
    ),
  );
```

Then use CTEs or subqueries equivalent to:

```sql
space_assets AS (
  SELECT asset.id
  FROM shared_space_asset
  INNER JOIN asset ON asset.id = shared_space_asset."assetId"
  WHERE shared_space_asset."spaceId" = :spaceId
    AND asset."deletedAt" IS NULL
    AND asset."isOffline" = false
    AND asset.visibility IN ('archive', 'timeline')
    AND (:takenAfter IS NULL OR asset."fileCreatedAt" >= :takenAfter)
    AND (:takenBefore IS NULL OR asset."fileCreatedAt" < :takenBefore)
  UNION
  SELECT asset.id
  FROM shared_space_library
  INNER JOIN asset ON asset."libraryId" = shared_space_library."libraryId"
  WHERE shared_space_library."spaceId" = :spaceId
    AND asset."deletedAt" IS NULL
    AND asset."isOffline" = false
    AND asset.visibility IN ('archive', 'timeline')
    AND (:takenAfter IS NULL OR asset."fileCreatedAt" >= :takenAfter)
    AND (:takenBefore IS NULL OR asset."fileCreatedAt" < :takenBefore)
),
detected_faces AS (
  SELECT DISTINCT asset_face.id
  FROM asset_face
  INNER JOIN space_assets ON space_assets.id = asset_face."assetId"
  WHERE asset_face."deletedAt" IS NULL
    AND asset_face."isVisible" = true
),
eligible_detected_faces AS (
  SELECT detected_faces.id
  FROM detected_faces
  WHERE :hasPersonFilter = false
  UNION
  SELECT detected_faces.id
  FROM detected_faces
  INNER JOIN shared_space_person_face ON shared_space_person_face."assetFaceId" = detected_faces.id
  INNER JOIN filtered_people ON filtered_people."personId" = shared_space_person_face."personId"
)
```

Set `:hasPersonFilter` from `hasPersonFilter`, meaning only `name` and `named`. Do not treat `takenAfter` or `takenBefore` as person filters; they narrow `space_assets` so unassigned detected faces on matching-date assets still count.

For the person counts, group by `personKey` so two rows with the same non-null `identityId` count once, and compute hidden as "all matching profiles for the person key are hidden":

```sql
person_visibility AS (
  SELECT
    "personKey",
    bool_or("isHidden" = false) AS "hasVisibleProfile"
  FROM filtered_people
  GROUP BY "personKey"
)
SELECT
  (SELECT COUNT(*) FROM person_visibility) AS total,
  (SELECT COUNT(*) FROM person_visibility WHERE "hasVisibleProfile" = false) AS hidden
```

Keep `detectedFaceCount` as `COUNT(DISTINCT eligible_detected_faces.id)`.

- [ ] **Step 4: Run shared-space aggregate tests and verify green**

Run:

```bash
pnpm --dir server test:medium -- --run test/medium/specs/repositories/shared-space.repository.spec.ts -t "countPersonsBySpaceId"
```

Expected: PASS.

---

### Task 6: Generate SQL/OpenAPI And Run Phase Verification

**Files:**

- Modify generated SQL snapshots:
  - `server/src/queries/person.repository.sql`
  - `server/src/queries/face.identity.repository.sql`
  - `server/src/queries/shared.space.repository.sql`
- Modify generated API files:
  - `open-api/immich-openapi-specs.json`
  - `open-api/typescript-sdk/src/fetch-client.ts`

- [ ] **Step 1: Generate SQL snapshots**

Run:

```bash
pnpm --dir server build
pnpm --dir server sync:sql
```

Expected: PASS and generated SQL snapshots include the new overview aggregate methods.

- [ ] **Step 2: Generate OpenAPI TypeScript SDK**

Run:

```bash
make open-api-typescript
```

Expected: PASS and `PeopleStatisticsResponseDto` plus `detectedFaceCount` appear in the generated SDK.

- [ ] **Step 3: Run focused server unit tests**

Run:

```bash
pnpm --dir server test -- src/controllers/person.controller.spec.ts src/controllers/shared-space.controller.spec.ts src/services/person.service.spec.ts src/services/shared-space.service.spec.ts -t "statistics|getPeopleStatistics|getSpacePeopleStatistics"
```

Expected: PASS.

- [ ] **Step 4: Run focused medium repository tests**

Run:

```bash
pnpm --dir server test:medium -- --run test/medium/specs/repositories/person.repository.spec.ts test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/repositories/shared-space.repository.spec.ts test/medium/specs/repositories/face-identity-query-shape.spec.ts -t "getPeopleOverviewStatistics|getAccessiblePeopleStatistics|countPersonsBySpaceId|vector similarity"
```

Expected: PASS.

- [ ] **Step 5: Run phase-wide medium tests**

Run:

```bash
pnpm --dir server test:medium -- --run test/medium/specs/repositories/person.repository.spec.ts test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/repositories/shared-space.repository.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Use CI for slow verification**

Prefer CI for full lint/build after the focused suite is green. If running locally is necessary, use:

```bash
pnpm --dir server check
pnpm --dir server lint
```

Expected: PASS. If local lint/build is too slow, push the completed Phase 1 branch and let CI run the full server checks.

- [ ] **Step 7: Commit completed Phase 1**

Only after all Phase 1 focused tests and generation steps pass:

```bash
git add server/src/dtos/person.dto.ts \
  server/src/dtos/shared-space-person.dto.ts \
  server/src/controllers/person.controller.ts \
  server/src/controllers/person.controller.spec.ts \
  server/src/controllers/shared-space.controller.spec.ts \
  server/src/services/person.service.ts \
  server/src/services/person.service.spec.ts \
  server/src/services/shared-space.service.ts \
  server/src/services/shared-space.service.spec.ts \
  server/src/repositories/person.repository.ts \
  server/src/repositories/face-identity.repository.ts \
  server/src/repositories/shared-space.repository.ts \
  server/test/medium/specs/repositories/person.repository.spec.ts \
  server/test/medium/specs/repositories/face-identity.repository.spec.ts \
  server/test/medium/specs/repositories/face-identity-query-shape.spec.ts \
  server/test/medium/specs/repositories/shared-space.repository.spec.ts \
  server/src/queries/person.repository.sql \
  server/src/queries/face.identity.repository.sql \
  server/src/queries/shared.space.repository.sql \
  open-api/immich-openapi-specs.json \
  open-api/typescript-sdk/src/fetch-client.ts
git commit -m "feat: add people overview face statistics"
```

## Spec Coverage Matrix

| Phase 1 requirement                                                             | Covered by                                                                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Global overview counts total people, hidden people, and detected in-scope faces | Task 3 personal aggregate tests; Task 4 identity-grouped aggregate tests                                      |
| Hidden people do not inflate visible header counts but their faces count        | Task 3 all-hidden test; Task 4 hidden identity test                                                           |
| Unassigned detected faces count in primary overview totals                      | Task 3 personal unassigned test; Task 4 global unassigned test; Task 5 date-filter unassigned test            |
| Shared-space overview counts only selected space                                | Task 5 selected-space and empty-space tests                                                                   |
| Linked/external-library photos count in authorized scope                        | Task 4 linked-library global tests; Task 5 linked-library shared-space test                                   |
| Face dedupe across owned/shared/direct/linked access paths                      | Task 4 owned-plus-shared and multi-space linked-library tests; Task 5 direct-plus-linked test                 |
| Resolved identity dedupe across personal/shared profiles                        | Task 4 personal-plus-space identity test                                                                      |
| Shared-space person dedupe across multiple assets for one identity              | Task 5 multiple-assets same-identity test                                                                     |
| Non-members cannot read shared-space overview statistics                        | Task 2 non-member service test                                                                                |
| Deleted, offline, locked, and non-visible data excluded                         | Task 3 personal exclusion test; Task 5 shared-space exclusion test                                            |
| Aggregate counts are independent of pagination                                  | Task 2 service tests pass `page`/`size` and `limit`/`offset` without forwarding them to aggregates            |
| Empty library and empty shared space return zeroes                              | Task 3 empty-library test; Task 5 empty-space test                                                            |
| Unsupported filters do not produce misleading totals                            | Task 2 rejects closest global filters; Phase 3 is explicitly responsible for search-name UI hiding/relabeling |

## Edge Cases Covered

- Empty personal library returns zero people, zero hidden, zero detected faces.
- Empty shared space returns zero people, zero hidden, zero detected faces.
- Hidden people do not disappear from `detectedFaceCount`, and all-hidden scopes derive zero visible people.
- Unassigned faces count in unfiltered overview `detectedFaceCount`.
- Unassigned faces count for date-filtered shared-space scopes when the matching asset is in scope.
- Non-visible or soft-deleted faces are excluded.
- Deleted, offline, locked, and out-of-scope visibility assets are excluded according to the page scope.
- Shared-space linked-library assets count only inside authorized selected/timeline scopes.
- The same face reachable through owned asset plus shared space counts once.
- The same face reachable through multiple timeline shared spaces counts once.
- The same face reachable through direct shared-space asset plus linked library counts once.
- Personal and shared-space rows for the same resolved identity count one people identity.
- Shared-space rows with the same resolved identity count one people identity.
- Pagination parameters do not change aggregate totals.
- Non-members cannot read shared-space overview statistics because service still calls `requireMembership`.
- Unsupported global closest-person filters are rejected instead of silently returning broad totals.

## Phase Acceptance Checklist

- [ ] `GET /people/statistics` returns `{ total, hidden, detectedFaceCount }`.
- [ ] `GET /shared-spaces/:id/people/statistics` returns `{ total, hidden, detectedFaceCount }`.
- [ ] Header face-count semantics are backend-ready: all detected in-scope faces, not assigned-visible only.
- [ ] Global aggregates include user-owned, timeline shared-space, and linked-library assets only when authorized.
- [ ] Shared-space aggregates include direct and linked-library assets for the selected space only.
- [ ] Face, asset, and resolved identity dedupe are covered by tests.
- [ ] Unsupported global closest-person filters are rejected, and search-name UI handling is documented for Phase 3.
- [ ] Focused server and medium tests pass.
- [ ] SQL snapshots and OpenAPI TypeScript SDK are regenerated.
