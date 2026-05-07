# People Face Statistics Phase 2: Lazy Detailed Face Statistics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every code task. Use superpowers:verification-before-completion before claiming this phase is done. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lazy backend detailed face-statistics endpoints that split detected faces into assigned-visible, assigned-hidden, and unassigned counts for global people and shared-space people scopes.

**Architecture:** Keep overview endpoints as the only initial-load API. Add separate lazy detail endpoints that reuse the same authorized asset scopes and filter semantics as Phase 1 overview statistics, then classify each distinct detected face after scope filtering. The response invariant must always hold: `detectedFaceCount === assignedVisibleFaceCount + assignedHiddenFaceCount + unassignedFaceCount`.

**Tech Stack:** NestJS controllers/services, Zod DTOs, Kysely/Postgres aggregate queries, `@immich/sql-tools` generated SQL snapshots, Vitest small and medium tests, generated OpenAPI TypeScript SDK.

---

## Phase Boundary

This phase owns:

- `GET /people/face-statistics`
- `GET /shared-spaces/:id/people/face-statistics`
- Global personal-only detailed face aggregate.
- Global identity-grouped detailed face aggregate when `withSharedSpaces=true`.
- Shared-space detailed face aggregate for the selected space.
- OpenAPI and generated SDK contract updates for the new endpoints.

This phase does not own:

- Frontend overview header rendering.
- Frontend lazy popover/dialog/sheet UI.
- `GET /people/:personId/statistics`
- `GET /shared-spaces/:spaceId/people/:personId/statistics`

## Contract

Add one reusable response DTO:

```ts
type PeopleFaceStatistics = {
  detectedFaceCount: number;
  assignedVisibleFaceCount: number;
  assignedHiddenFaceCount: number;
  unassignedFaceCount: number;
};
```

Classification rules:

- `detectedFaceCount`: every distinct visible, non-deleted face in the authorized asset scope.
- `assignedVisibleFaceCount`: detected faces assigned to an eligible visible person identity/profile in the current scope.
- `assignedHiddenFaceCount`: detected faces assigned to an eligible hidden person identity/profile in the current scope and not also assigned to a visible profile.
- `unassignedFaceCount`: detected faces not assigned to an eligible visible or hidden person in the current scope.
- If one resolved identity has both visible and hidden accessible profiles, classify its faces as visible-assigned. This matches Phase 1 `hidden` semantics, where an identity is hidden only when all eligible accessible profiles are hidden.
- Low-evidence unnamed identities that do not satisfy the people-page eligibility rules are not visible/hidden people for this response; classify their faces as unassigned.

## Supported Filters

Global detailed statistics support:

- `withSharedSpaces`: same branch selector as `GET /people` and `GET /people/statistics`.
- `withHidden`: accepted for DTO parity but does not change the split because hidden is returned separately.
- `page` and `size`: accepted for DTO parity but ignored by aggregate totals.

Global detailed statistics reject:

- `closestPersonId`
- `closestAssetId`

Shared-space detailed statistics support:

- `name`
- `named`
- `takenAfter`
- `takenBefore`

Shared-space detailed statistics accept `withHidden`, `limit`, and `offset` through `SpacePeopleQueryDto` for route parity, but aggregate totals remain independent of hidden-row inclusion and pagination.

For shared-space `name` or `named` filters, count only faces assigned to matching selected-space people. Do not include unrelated unassigned faces under a person-name filter, because that would present broad-scope unassigned faces as if they matched the filtered people list.

For shared-space taken-date filters, count all matching-date detected faces in the selected-space asset scope, including unassigned faces.

## File Map

- Modify `server/src/dtos/person.dto.ts`
  - Add and export `PeopleFaceStatisticsResponseDto`.
- Modify `server/src/controllers/person.controller.ts`
  - Add `GET /people/face-statistics` before parameterized `:id` routes.
- Modify `server/src/controllers/person.controller.spec.ts`
  - Add route/DTO contract tests for `GET /people/face-statistics`.
- Modify `server/src/controllers/shared-space.controller.ts`
  - Add `GET /shared-spaces/:id/people/face-statistics` before `:id/people/:personId` routes.
- Modify `server/src/controllers/shared-space.controller.spec.ts`
  - Add route/DTO contract tests for shared-space detailed face statistics.
- Modify `server/src/services/person.service.ts`
  - Add `getPeopleFaceStatistics(auth, query)` and branch between personal-only and identity-grouped scopes.
- Modify `server/src/services/person.service.spec.ts`
  - Add service red tests for branching, minimum-face-count forwarding, and unsupported similarity filters.
- Modify `server/src/services/shared-space.service.ts`
  - Add `getSpacePeopleFaceStatistics(auth, spaceId, query)`.
- Modify `server/src/services/shared-space.service.spec.ts`
  - Add service red tests for membership protection, disabled face recognition, and filter forwarding.
- Modify `server/src/repositories/person.repository.ts`
  - Add `PeopleFaceStatistics` type and `getPeopleFaceStatistics(userId)`.
- Modify `server/test/medium/specs/repositories/person.repository.spec.ts`
  - Add personal-only detailed aggregate tests.
- Modify `server/src/repositories/face-identity.repository.ts`
  - Add `getAccessiblePeopleFaceStatistics(userId, { minimumFaceCount })`.
- Modify `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
  - Add identity-grouped detailed aggregate tests.
- Modify `server/test/medium/specs/repositories/face-identity-query-shape.spec.ts`
  - Assert detailed stats do not use vector similarity.
- Modify `server/src/repositories/shared-space.repository.ts`
  - Add `getPeopleFaceStatisticsBySpaceId(spaceId, options)`.
- Modify `server/test/medium/specs/repositories/shared-space.repository.spec.ts`
  - Add selected-space detailed aggregate tests.
- Modify generated SQL snapshots:
  - `server/src/queries/person.repository.sql`
  - `server/src/queries/face.identity.repository.sql`
  - `server/src/queries/shared.space.repository.sql`
- Modify generated OpenAPI artifacts:
  - `mobile/openapi`
  - `open-api/immich-openapi-specs.json`
  - `open-api/typescript-sdk`

## TDD Rules

- Start each task by adding the failing test.
- Run the focused test and confirm it fails for the expected missing-route, missing-method, or missing-field reason.
- Implement only enough production code for that task.
- Run the focused test again.
- Add edge-case tests before broadening query behavior.
- Cross-endpoint invariant tests are behavioral tests. Add them inside Tasks 3-5 before repository implementation, not after production code is green.
- Do not implement frontend UI in this phase.

---

## Task 1: Add Route And DTO Contracts

**Files:**

- Modify `server/src/dtos/person.dto.ts`
- Modify `server/src/controllers/person.controller.ts`
- Modify `server/src/controllers/shared-space.controller.ts`
- Modify `server/src/controllers/person.controller.spec.ts`
- Modify `server/src/controllers/shared-space.controller.spec.ts`

- [ ] **Step 1: Write failing global controller tests**

Add this block near the existing `GET /people/statistics` tests in `server/src/controllers/person.controller.spec.ts`:

```ts
describe('GET /people/face-statistics', () => {
  it('should be an authenticated route', async () => {
    await request(ctx.getHttpServer()).get('/people/face-statistics');
    expect(ctx.authenticate).toHaveBeenCalled();
  });

  it('should return lazy people face statistics', async () => {
    (service as any).getPeopleFaceStatistics.mockResolvedValue({
      detectedFaceCount: 23,
      assignedVisibleFaceCount: 18,
      assignedHiddenFaceCount: 3,
      unassignedFaceCount: 2,
    });

    const { status, body } = await request(ctx.getHttpServer())
      .get('/people/face-statistics')
      .query({ withSharedSpaces: true })
      .set('Authorization', `Bearer token`);

    expect(status).toBe(200);
    expect((service as any).getPeopleFaceStatistics).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ withSharedSpaces: true }),
    );
    expect(body).toEqual({
      detectedFaceCount: 23,
      assignedVisibleFaceCount: 18,
      assignedHiddenFaceCount: 3,
      unassignedFaceCount: 2,
    });
  });
});
```

- [ ] **Step 2: Write failing shared-space controller tests**

Add this block near the existing `GET /shared-spaces/:id/people/statistics` tests in `server/src/controllers/shared-space.controller.spec.ts`:

```ts
describe('GET /shared-spaces/:id/people/face-statistics', () => {
  it('should serialize lazy shared-space face statistics', async () => {
    const spaceId = factory.uuid();
    (service as any).getSpacePeopleFaceStatistics.mockResolvedValue({
      detectedFaceCount: 19,
      assignedVisibleFaceCount: 15,
      assignedHiddenFaceCount: 1,
      unassignedFaceCount: 3,
    });

    const { status, body } = await request(ctx.getHttpServer())
      .get(`/shared-spaces/${spaceId}/people/face-statistics`)
      .query({ name: 'Ali' })
      .set('Authorization', `Bearer token`);

    expect(status).toBe(200);
    expect((service as any).getSpacePeopleFaceStatistics).toHaveBeenCalledWith(
      undefined,
      spaceId,
      expect.objectContaining({ name: 'Ali' }),
    );
    expect(body).toEqual({
      detectedFaceCount: 19,
      assignedVisibleFaceCount: 15,
      assignedHiddenFaceCount: 1,
      unassignedFaceCount: 3,
    });
  });
});
```

- [ ] **Step 3: Run controller tests and verify red**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/controllers/person.controller.spec.ts src/controllers/shared-space.controller.spec.ts -t "face-statistics"
```

Expected: FAIL because `getPeopleFaceStatistics`, `getSpacePeopleFaceStatistics`, and the new routes do not exist.

- [ ] **Step 4: Add DTO and routes**

In `server/src/dtos/person.dto.ts`, add this schema after `PeopleStatisticsResponseDto`:

```ts
const PeopleFaceStatisticsResponseSchema = z
  .object({
    detectedFaceCount: z.int().min(0).describe('Number of detected faces in the accessible people scope'),
    assignedVisibleFaceCount: z.int().min(0).describe('Number of detected faces assigned to visible people'),
    assignedHiddenFaceCount: z.int().min(0).describe('Number of detected faces assigned to hidden people'),
    unassignedFaceCount: z.int().min(0).describe('Number of detected faces not assigned to people in this scope'),
  })
  .meta({ id: 'PeopleFaceStatisticsResponseDto' });

export class PeopleFaceStatisticsResponseDto extends createZodDto(PeopleFaceStatisticsResponseSchema) {}
```

In `server/src/controllers/person.controller.ts`, import `PeopleFaceStatisticsResponseDto` and add this route immediately after `getPeopleStatistics`:

```ts
  @Get('face-statistics')
  @Authenticated({ permission: Permission.PersonRead })
  @Endpoint({
    summary: 'Get people face statistics',
    description: 'Retrieve lazy detailed face counts for the authenticated user people scope.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  getPeopleFaceStatistics(
    @Auth() auth: AuthDto,
    @Query() options: PersonSearchDto,
  ): Promise<PeopleFaceStatisticsResponseDto> {
    return this.service.getPeopleFaceStatistics(auth, options);
  }
```

In `server/src/controllers/shared-space.controller.ts`, import `PeopleFaceStatisticsResponseDto` from `src/dtos/person.dto` and add this route immediately after `getSpacePeopleStatistics`:

```ts
  @Get(':id/people/face-statistics')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'Get people face statistics in a shared space',
    description: 'Retrieve lazy detailed face counts for a shared space.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  getSpacePeopleFaceStatistics(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() query: SpacePeopleQueryDto,
  ): Promise<PeopleFaceStatisticsResponseDto> {
    return this.service.getSpacePeopleFaceStatistics(auth, id, query);
  }
```

- [ ] **Step 5: Run controller tests and verify green**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/controllers/person.controller.spec.ts src/controllers/shared-space.controller.spec.ts -t "face-statistics"
```

Expected: PASS.

---

## Task 2: Add Service Branching And Access Guards

**Files:**

- Modify `server/src/services/person.service.ts`
- Modify `server/src/services/person.service.spec.ts`
- Modify `server/src/services/shared-space.service.ts`
- Modify `server/src/services/shared-space.service.spec.ts`

- [ ] **Step 1: Write failing person service tests**

Add this block near `describe('getPeopleStatistics')` in `server/src/services/person.service.spec.ts`:

```ts
describe('getPeopleFaceStatistics', () => {
  it('uses identity-grouped global scope when withSharedSpaces is true', async () => {
    const auth = AuthFactory.create();
    (mocks.faceIdentity as any).getAccessiblePeopleFaceStatistics.mockResolvedValue({
      detectedFaceCount: 11,
      assignedVisibleFaceCount: 8,
      assignedHiddenFaceCount: 1,
      unassignedFaceCount: 2,
    });

    await expect(
      sut.getPeopleFaceStatistics(auth, { withSharedSpaces: true, page: 4, size: 10 } as any),
    ).resolves.toEqual({
      detectedFaceCount: 11,
      assignedVisibleFaceCount: 8,
      assignedHiddenFaceCount: 1,
      unassignedFaceCount: 2,
    });

    expect((mocks.faceIdentity as any).getAccessiblePeopleFaceStatistics).toHaveBeenCalledWith(auth.user.id, {
      minimumFaceCount: 3,
    });
    expect((mocks.person as any).getPeopleFaceStatistics).not.toHaveBeenCalled();
  });

  it('uses personal-only scope when withSharedSpaces is omitted', async () => {
    const auth = AuthFactory.create();
    (mocks.person as any).getPeopleFaceStatistics.mockResolvedValue({
      detectedFaceCount: 5,
      assignedVisibleFaceCount: 4,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 1,
    });

    await expect(sut.getPeopleFaceStatistics(auth, { page: 1, size: 50 } as any)).resolves.toEqual({
      detectedFaceCount: 5,
      assignedVisibleFaceCount: 4,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 1,
    });

    expect((mocks.person as any).getPeopleFaceStatistics).toHaveBeenCalledWith(auth.user.id);
    expect((mocks.faceIdentity as any).getAccessiblePeopleFaceStatistics).not.toHaveBeenCalled();
  });

  it('rejects closest-person filters instead of returning misleading lazy details', async () => {
    const auth = AuthFactory.create();

    await expect(
      sut.getPeopleFaceStatistics(auth, { closestPersonId: newUuid(), page: 1, size: 50 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect((mocks.person as any).getPeopleFaceStatistics).not.toHaveBeenCalled();
    expect((mocks.faceIdentity as any).getAccessiblePeopleFaceStatistics).not.toHaveBeenCalled();
  });

  it('rejects closest-asset filters instead of returning misleading lazy details', async () => {
    const auth = AuthFactory.create();

    await expect(
      sut.getPeopleFaceStatistics(auth, { closestAssetId: newUuid(), page: 1, size: 50 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect((mocks.person as any).getPeopleFaceStatistics).not.toHaveBeenCalled();
    expect((mocks.faceIdentity as any).getAccessiblePeopleFaceStatistics).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Write failing shared-space service tests**

Add this block near `describe('getSpacePeopleStatistics')` in `server/src/services/shared-space.service.spec.ts`:

```ts
describe('getSpacePeopleFaceStatistics', () => {
  it('returns detailed face counts for space people and forwards supported filters', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();
    const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: true, petsEnabled: false });
    const takenAfter = new Date('2025-06-01');

    mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
    mocks.sharedSpace.getById.mockResolvedValue(space);
    (mocks.sharedSpace as any).getPeopleFaceStatisticsBySpaceId.mockResolvedValue({
      detectedFaceCount: 1201,
      assignedVisibleFaceCount: 1180,
      assignedHiddenFaceCount: 3,
      unassignedFaceCount: 18,
    });

    const result = await sut.getSpacePeopleFaceStatistics(auth, spaceId, {
      name: 'Ali',
      takenAfter,
      limit: 10,
      offset: 20,
    } as never);

    expect(result).toEqual({
      detectedFaceCount: 1201,
      assignedVisibleFaceCount: 1180,
      assignedHiddenFaceCount: 3,
      unassignedFaceCount: 18,
    });
    expect((mocks.sharedSpace as any).getPeopleFaceStatisticsBySpaceId).toHaveBeenCalledWith(spaceId, {
      petsEnabled: false,
      named: undefined,
      name: 'Ali',
      takenAfter,
      takenBefore: undefined,
    });
  });

  it('returns zero detailed statistics when face recognition is disabled for the space', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();

    mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));
    mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false }));

    await expect(sut.getSpacePeopleFaceStatistics(auth, spaceId)).resolves.toEqual({
      detectedFaceCount: 0,
      assignedVisibleFaceCount: 0,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });

    expect((mocks.sharedSpace as any).getPeopleFaceStatisticsBySpaceId).not.toHaveBeenCalled();
  });

  it('rejects non-members before reading shared-space detailed face statistics', async () => {
    mocks.sharedSpace.getMember.mockResolvedValue(void 0);

    await expect(sut.getSpacePeopleFaceStatistics(factory.auth(), 'space-1')).rejects.toThrow('Not a member');

    expect(mocks.sharedSpace.getById).not.toHaveBeenCalled();
    expect((mocks.sharedSpace as any).getPeopleFaceStatisticsBySpaceId).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run service tests and verify red**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/services/person.service.spec.ts src/services/shared-space.service.spec.ts -t "getPeopleFaceStatistics|getSpacePeopleFaceStatistics"
```

Expected: FAIL because service methods and repository mocks do not exist.

- [ ] **Step 4: Add service methods**

In `server/src/services/person.service.ts`, import `PeopleFaceStatisticsResponseDto` and add:

```ts
  async getPeopleFaceStatistics(auth: AuthDto, dto: PersonSearchDto): Promise<PeopleFaceStatisticsResponseDto> {
    if (dto.closestPersonId || dto.closestAssetId) {
      throw new BadRequestException('closestPersonId and closestAssetId are not supported for people face statistics');
    }

    const { machineLearning } = await this.getConfig({ withCache: false });

    if (dto.withSharedSpaces) {
      return this.faceIdentityRepository.getAccessiblePeopleFaceStatistics(auth.user.id, {
        minimumFaceCount: machineLearning.facialRecognition.minFaces,
      });
    }

    return this.personRepository.getPeopleFaceStatistics(auth.user.id);
  }
```

In `server/src/services/shared-space.service.ts`, import `PeopleFaceStatisticsResponseDto` and add:

```ts
  async getSpacePeopleFaceStatistics(
    auth: AuthDto,
    spaceId: string,
    query?: SpacePeopleQueryDto,
  ): Promise<PeopleFaceStatisticsResponseDto> {
    await this.requireMembership(auth, spaceId);

    const space = await this.sharedSpaceRepository.getById(spaceId);
    if (!space?.faceRecognitionEnabled) {
      return {
        detectedFaceCount: 0,
        assignedVisibleFaceCount: 0,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      };
    }

    return this.sharedSpaceRepository.getPeopleFaceStatisticsBySpaceId(spaceId, {
      petsEnabled: space.petsEnabled,
      named: query?.named,
      name: query?.name,
      takenAfter: query?.takenAfter,
      takenBefore: query?.takenBefore,
    });
  }
```

- [ ] **Step 5: Run service tests and verify green**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/services/person.service.spec.ts src/services/shared-space.service.spec.ts -t "getPeopleFaceStatistics|getSpacePeopleFaceStatistics"
```

Expected: PASS.

---

## Task 3: Add Personal-Only Detailed Aggregate

**Files:**

- Modify `server/src/repositories/person.repository.ts`
- Modify `server/test/medium/specs/repositories/person.repository.spec.ts`

- [ ] **Step 1: Write failing repository tests**

Add this block near `describe('getPeopleOverviewStatistics')` in `server/test/medium/specs/repositories/person.repository.spec.ts`:

```ts
describe('getPeopleFaceStatistics', () => {
  it('splits owned timeline faces into visible, hidden, and unassigned buckets', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { user: otherUser } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    const { asset: otherAsset } = await ctx.newAsset({ ownerId: otherUser.id, visibility: AssetVisibility.Timeline });
    const { person: visiblePerson } = await ctx.newPerson({ ownerId: user.id, isHidden: false });
    const { person: hiddenPerson } = await ctx.newPerson({ ownerId: user.id, isHidden: true });
    const { person: otherPerson } = await ctx.newPerson({ ownerId: otherUser.id, isHidden: false });

    await ctx.newAssetFace({ assetId: asset.id, personId: visiblePerson.id });
    await ctx.newAssetFace({ assetId: asset.id, personId: hiddenPerson.id });
    await ctx.newAssetFace({ assetId: asset.id, personId: null });
    await ctx.newAssetFace({ assetId: otherAsset.id, personId: otherPerson.id });

    await expect(sut.getPeopleFaceStatistics(user.id)).resolves.toEqual({
      detectedFaceCount: 3,
      assignedVisibleFaceCount: 1,
      assignedHiddenFaceCount: 1,
      unassignedFaceCount: 1,
    });

    const overview = await sut.getPeopleOverviewStatistics(user.id);
    const details = await sut.getPeopleFaceStatistics(user.id);

    expect(details.detectedFaceCount).toBe(overview.detectedFaceCount);
    expect(details.detectedFaceCount).toBe(
      details.assignedVisibleFaceCount + details.assignedHiddenFaceCount + details.unassignedFaceCount,
    );
  });

  it('returns all personal faces as unassigned when no eligible people are assigned and is deterministic', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });

    await ctx.newAssetFace({ assetId: asset.id, personId: null });
    await ctx.newAssetFace({ assetId: asset.id, personId: null });

    const first = await sut.getPeopleFaceStatistics(user.id);
    const second = await sut.getPeopleFaceStatistics(user.id);

    await expect(sut.getPeopleOverviewStatistics(user.id)).resolves.toEqual({
      total: 0,
      hidden: 0,
      detectedFaceCount: 2,
    });
    expect(first).toEqual({
      detectedFaceCount: 2,
      assignedVisibleFaceCount: 0,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 2,
    });
    expect(second).toEqual(first);
  });

  it('returns zeroes for an empty personal library', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();

    await expect(sut.getPeopleFaceStatistics(user.id)).resolves.toEqual({
      detectedFaceCount: 0,
      assignedVisibleFaceCount: 0,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
  });

  it('excludes deleted, offline, locked, archived, hidden-face, and deleted-face rows', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { person } = await ctx.newPerson({ ownerId: user.id, isHidden: false });
    const { asset: validAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });

    await ctx.newAssetFace({ assetId: validAsset.id, personId: person.id });

    const invalidAssets = await Promise.all([
      ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline, deletedAt: new Date() }),
      ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline, isOffline: true }),
      ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked }),
      ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive }),
    ]);

    for (const { asset } of invalidAssets) {
      await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
    }
    await ctx.newAssetFace({ assetId: validAsset.id, personId: person.id, isVisible: false });
    await ctx.newAssetFace({ assetId: validAsset.id, personId: person.id, deletedAt: new Date() });

    await expect(sut.getPeopleFaceStatistics(user.id)).resolves.toEqual({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 1,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
  });

  it('treats faces assigned to inaccessible people as unassigned within personal scope', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { user: otherUser } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    const { person: otherPerson } = await ctx.newPerson({ ownerId: otherUser.id, isHidden: false });

    await ctx.newAssetFace({ assetId: asset.id, personId: otherPerson.id });

    await expect(sut.getPeopleFaceStatistics(user.id)).resolves.toEqual({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 0,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 1,
    });
  });
});
```

- [ ] **Step 2: Run personal repository tests and verify red**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/person.repository.spec.ts -t "getPeopleFaceStatistics"
```

Expected: FAIL because `getPeopleFaceStatistics` does not exist.

- [ ] **Step 3: Implement the personal aggregate**

In `server/src/repositories/person.repository.ts`, add:

```ts
export interface PeopleFaceStatistics {
  detectedFaceCount: number;
  assignedVisibleFaceCount: number;
  assignedHiddenFaceCount: number;
  unassignedFaceCount: number;
}
```

Add this method near `getPeopleOverviewStatistics`:

```ts
  @GenerateSql({ params: [DummyValue.UUID] })
  async getPeopleFaceStatistics(userId: string): Promise<PeopleFaceStatistics> {
    const result = await sql<PeopleFaceStatistics>`
      WITH "detected_faces" AS (
        SELECT
          "asset_face"."id" AS "assetFaceId",
          "person"."isHidden" AS "isHidden"
        FROM "asset_face"
        INNER JOIN "asset" ON "asset"."id" = "asset_face"."assetId"
        LEFT JOIN "person"
          ON "person"."id" = "asset_face"."personId"
          AND "person"."ownerId" = ${userId}
        WHERE "asset"."ownerId" = ${userId}
          AND "asset"."deletedAt" IS NULL
          AND "asset"."isOffline" = false
          AND "asset"."visibility" = ${AssetVisibility.Timeline}
          AND "asset_face"."deletedAt" IS NULL
          AND "asset_face"."isVisible" = true
      )
      SELECT
        COUNT(DISTINCT "assetFaceId")::int AS "detectedFaceCount",
        COUNT(DISTINCT "assetFaceId") FILTER (WHERE "isHidden" = false)::int AS "assignedVisibleFaceCount",
        COUNT(DISTINCT "assetFaceId") FILTER (WHERE "isHidden" = true)::int AS "assignedHiddenFaceCount",
        COUNT(DISTINCT "assetFaceId") FILTER (WHERE "isHidden" IS NULL)::int AS "unassignedFaceCount"
      FROM "detected_faces"
    `.execute(this.db);

    const row = result.rows[0];
    return {
      detectedFaceCount: Number(row?.detectedFaceCount ?? 0),
      assignedVisibleFaceCount: Number(row?.assignedVisibleFaceCount ?? 0),
      assignedHiddenFaceCount: Number(row?.assignedHiddenFaceCount ?? 0),
      unassignedFaceCount: Number(row?.unassignedFaceCount ?? 0),
    };
  }
```

- [ ] **Step 4: Run personal repository tests and verify green**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/person.repository.spec.ts -t "getPeopleFaceStatistics"
```

Expected: PASS.

---

## Task 4: Add Global Identity-Grouped Detailed Aggregate

**Files:**

- Modify `server/src/repositories/face-identity.repository.ts`
- Modify `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
- Modify `server/test/medium/specs/repositories/face-identity-query-shape.spec.ts`

- [ ] **Step 1: Write failing identity repository tests**

Add this block near `describe('getAccessiblePeopleStatistics')` in `server/test/medium/specs/repositories/face-identity.repository.spec.ts`:

```ts
describe('getAccessiblePeopleFaceStatistics', () => {
  it('splits owned global faces into visible, hidden, and unassigned buckets', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();

    try {
      const { person: visiblePerson } = await ctx.newPerson({ ownerId: user.id, name: 'Visible' });
      const { asset: visibleAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { assetFace: visibleFace } = await ctx.newAssetFace({
        assetId: visibleAsset.id,
        personId: visiblePerson.id,
      });
      const visibleIdentity = await sut.ensurePersonIdentity(visiblePerson.id);
      await sut.linkFace({ assetFaceId: visibleFace.id, identityId: visibleIdentity.id, source: 'owner-person' });

      const { person: hiddenPerson } = await ctx.newPerson({ ownerId: user.id, name: 'Hidden', isHidden: true });
      const { asset: hiddenAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { assetFace: hiddenFace } = await ctx.newAssetFace({ assetId: hiddenAsset.id, personId: hiddenPerson.id });
      const hiddenIdentity = await sut.ensurePersonIdentity(hiddenPerson.id);
      await sut.linkFace({ assetFaceId: hiddenFace.id, identityId: hiddenIdentity.id, source: 'owner-person' });

      const { asset: unassignedAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newAssetFace({ assetId: unassignedAsset.id });

      const result = await sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 1 });
      expect(result).toEqual({
        detectedFaceCount: 3,
        assignedVisibleFaceCount: 1,
        assignedHiddenFaceCount: 1,
        unassignedFaceCount: 1,
      });
      const overview = await sut.getAccessiblePeopleStatistics(user.id, { minimumFaceCount: 1 });
      expect(result.detectedFaceCount).toBe(overview.detectedFaceCount);
      expect(result.detectedFaceCount).toBe(
        result.assignedVisibleFaceCount + result.assignedHiddenFaceCount + result.unassignedFaceCount,
      );
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('classifies identity faces as visible when any accessible eligible profile is visible', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();

    try {
      const { space } = await ctx.newSharedSpace({ createdById: user.id, faceRecognitionEnabled: true });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: user.id, role: SharedSpaceRole.Owner });
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Visible Personal', isHidden: false });
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: user.id });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
      const identity = await sut.ensurePersonIdentity(person.id);
      await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
      const hiddenSpacePerson = await ctx.database
        .insertInto('shared_space_person')
        .values({
          spaceId: space.id,
          identityId: identity.id,
          name: 'Hidden Space',
          isHidden: true,
          representativeFaceId: assetFace.id,
          type: 'person',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await linkSpaceFace(ctx, hiddenSpacePerson.id, assetFace.id);

      await expect(sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
        detectedFaceCount: 1,
        assignedVisibleFaceCount: 1,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('treats low-evidence unnamed identities as unassigned for people-page scope', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();

    try {
      const { person } = await ctx.newPerson({ ownerId: user.id, name: '' });
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
      const identity = await sut.ensurePersonIdentity(person.id);
      await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

      await expect(sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 3 })).resolves.toEqual({
        detectedFaceCount: 1,
        assignedVisibleFaceCount: 0,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 1,
      });
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('returns all accessible identity-scope faces as unassigned when no identity is linked and is deterministic', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();

    try {
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      await ctx.newAssetFace({ assetId: asset.id });
      await ctx.newAssetFace({ assetId: asset.id });

      const first = await sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 1 });
      const second = await sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 1 });

      expect(first).toEqual({
        detectedFaceCount: 2,
        assignedVisibleFaceCount: 0,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 2,
      });
      expect(second).toEqual(first);
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('excludes invalid global assets and face rows from identity-scope details', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();

    try {
      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Valid' });
      const { asset: validAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
      const { assetFace: validFace } = await ctx.newAssetFace({ assetId: validAsset.id, personId: person.id });
      const identity = await sut.ensurePersonIdentity(person.id);
      await sut.linkFace({ assetFaceId: validFace.id, identityId: identity.id, source: 'owner-person' });

      const invalidAssets = await Promise.all([
        ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline, deletedAt: new Date() }),
        ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline, isOffline: true }),
        ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked }),
        ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive }),
      ]);
      for (const { asset } of invalidAssets) {
        const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
        await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });
      }
      const { assetFace: hiddenFace } = await ctx.newAssetFace({
        assetId: validAsset.id,
        personId: person.id,
        isVisible: false,
      });
      const { assetFace: deletedFace } = await ctx.newAssetFace({
        assetId: validAsset.id,
        personId: person.id,
        deletedAt: new Date(),
      });
      await sut.linkFace({ assetFaceId: hiddenFace.id, identityId: identity.id, source: 'owner-person' });
      await sut.linkFace({ assetFaceId: deletedFace.id, identityId: identity.id, source: 'owner-person' });

      await expect(sut.getAccessiblePeopleFaceStatistics(user.id, { minimumFaceCount: 1 })).resolves.toEqual({
        detectedFaceCount: 1,
        assignedVisibleFaceCount: 1,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });
    } finally {
      await ctx.database.deleteFrom('user').where('id', '=', user.id).execute();
    }
  });

  it('includes linked-library faces only through timeline-enabled member spaces and dedupes overlaps', async () => {
    const { ctx, sut } = setup();
    const { user: source } = await ctx.newUser();
    const { user: member } = await ctx.newUser();

    try {
      const { library } = await ctx.newLibrary({ ownerId: source.id });
      const { person } = await ctx.newPerson({ ownerId: source.id, name: 'Library Person' });
      const { asset } = await ctx.newAsset({
        ownerId: source.id,
        libraryId: library.id,
        visibility: AssetVisibility.Timeline,
      });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
      const identity = await sut.ensurePersonIdentity(person.id);
      await sut.linkFace({ assetFaceId: assetFace.id, identityId: identity.id, source: 'owner-person' });

      const { space } = await ctx.newSharedSpace({ createdById: source.id, faceRecognitionEnabled: true });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: source.id });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: source.id });
      const spacePerson = await ctx.database
        .insertInto('shared_space_person')
        .values({
          spaceId: space.id,
          identityId: identity.id,
          name: 'Library Person',
          representativeFaceId: assetFace.id,
          type: 'person',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await linkSpaceFace(ctx, spacePerson.id, assetFace.id);

      await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
        detectedFaceCount: 1,
        assignedVisibleFaceCount: 1,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });

      await setMemberTimeline(ctx, { spaceId: space.id, userId: member.id, showInTimeline: false });

      await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
        detectedFaceCount: 0,
        assignedVisibleFaceCount: 0,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });
    } finally {
      await ctx.database.deleteFrom('user').where('id', 'in', [source.id, member.id]).execute();
    }
  });

  it('removes shared-space library faces after membership is removed while preserving owned global faces', async () => {
    const { ctx, sut } = setup();
    const { user: source } = await ctx.newUser();
    const { user: member } = await ctx.newUser();

    try {
      const { person: ownedPerson } = await ctx.newPerson({ ownerId: member.id, name: 'Owned' });
      const { asset: ownedAsset } = await ctx.newAsset({ ownerId: member.id, visibility: AssetVisibility.Timeline });
      const { assetFace: ownedFace } = await ctx.newAssetFace({ assetId: ownedAsset.id, personId: ownedPerson.id });
      const ownedIdentity = await sut.ensurePersonIdentity(ownedPerson.id);
      await sut.linkFace({ assetFaceId: ownedFace.id, identityId: ownedIdentity.id, source: 'owner-person' });

      const { library } = await ctx.newLibrary({ ownerId: source.id });
      const { person: sharedPerson } = await ctx.newPerson({ ownerId: source.id, name: 'Shared' });
      const { asset: sharedAsset } = await ctx.newAsset({
        ownerId: source.id,
        libraryId: library.id,
        visibility: AssetVisibility.Timeline,
      });
      const { assetFace: sharedFace } = await ctx.newAssetFace({ assetId: sharedAsset.id, personId: sharedPerson.id });
      const sharedIdentity = await sut.ensurePersonIdentity(sharedPerson.id);
      await sut.linkFace({ assetFaceId: sharedFace.id, identityId: sharedIdentity.id, source: 'owner-person' });

      const { space } = await ctx.newSharedSpace({ createdById: source.id, faceRecognitionEnabled: true });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: source.id, role: SharedSpaceRole.Owner });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: SharedSpaceRole.Viewer });
      await ctx.newSharedSpaceLibrary({ spaceId: space.id, libraryId: library.id, addedById: source.id });
      const spacePerson = await ctx.database
        .insertInto('shared_space_person')
        .values({
          spaceId: space.id,
          identityId: sharedIdentity.id,
          name: 'Shared',
          representativeFaceId: sharedFace.id,
          type: 'person',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await linkSpaceFace(ctx, spacePerson.id, sharedFace.id);

      await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
        detectedFaceCount: 2,
        assignedVisibleFaceCount: 2,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });

      await ctx.database
        .deleteFrom('shared_space_member')
        .where('spaceId', '=', space.id)
        .where('userId', '=', member.id)
        .execute();

      await expect(sut.getAccessiblePeopleFaceStatistics(member.id, { minimumFaceCount: 1 })).resolves.toEqual({
        detectedFaceCount: 1,
        assignedVisibleFaceCount: 1,
        assignedHiddenFaceCount: 0,
        unassignedFaceCount: 0,
      });
    } finally {
      await ctx.database.deleteFrom('user').where('id', 'in', [source.id, member.id]).execute();
    }
  });
});
```

- [ ] **Step 2: Add query-shape red test**

In `server/test/medium/specs/repositories/face-identity-query-shape.spec.ts`, update `identityOnlyText` to include the detailed method once it exists:

```ts
/async getAccessiblePeopleFaceStatistics[\s\S]*?async getAccessiblePersonByProfileId/.exec(sqlText)?.[0] ?? '',
```

This test should fail before implementation because the method text is absent from the inspected query text once the assertion below is added:

```ts
expect(identityOnlyText).toContain('getAccessiblePeopleFaceStatistics');
```

- [ ] **Step 3: Run identity repository tests and verify red**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/repositories/face-identity-query-shape.spec.ts -t "getAccessiblePeopleFaceStatistics|vector similarity"
```

Expected: FAIL because `getAccessiblePeopleFaceStatistics` does not exist.

- [ ] **Step 4: Implement identity-grouped detailed aggregate**

In `server/src/repositories/face-identity.repository.ts`, import the `PeopleFaceStatistics` type with a type-only import from `src/repositories/person.repository` or define an equivalent local return type, then add this method after `getAccessiblePeopleStatistics`:

```ts
  @GenerateSql({ params: [DummyValue.UUID, { minimumFaceCount: 3 }] })
  async getAccessiblePeopleFaceStatistics(
    userId: string,
    options: { minimumFaceCount?: number },
  ): Promise<PeopleFaceStatistics> {
    const minimumFaceCount = options.minimumFaceCount ?? 1;
    const result = await sql<PeopleFaceStatistics>`
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
      accessible_faces AS (
        SELECT
          accessible_detected_faces."assetFaceId",
          accessible_detected_faces."assetId",
          face_identity_face."identityId"
        FROM accessible_detected_faces
        LEFT JOIN face_identity_face
          ON face_identity_face."assetFaceId" = accessible_detected_faces."assetFaceId"
      ),
      identity_counts AS (
        SELECT
          accessible_faces."identityId",
          COUNT(DISTINCT accessible_faces."assetId") AS "visibleAssetCount"
        FROM accessible_faces
        WHERE accessible_faces."identityId" IS NOT NULL
        GROUP BY accessible_faces."identityId"
      ),
      accessible_profiles AS (
        SELECT person."identityId", person."isHidden", person.name
        FROM person
        WHERE person."ownerId" = ${userId}
          AND person."identityId" IS NOT NULL
          AND EXISTS (SELECT 1 FROM accessible_faces WHERE accessible_faces."identityId" = person."identityId")
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
          AND EXISTS (SELECT 1 FROM accessible_faces WHERE accessible_faces."identityId" = shared_space_person."identityId")
      ),
      identity_visibility AS (
        SELECT
          "identityId",
          bool_or("isHidden" = false) AS "hasVisibleProfile",
          bool_or("isHidden" = true) AS "hasHiddenProfile",
          bool_or(NULLIF(name, '') IS NOT NULL) AS "hasNamedProfile"
        FROM accessible_profiles
        GROUP BY "identityId"
      ),
      eligible_identities AS (
        SELECT
          identity_visibility."identityId",
          identity_visibility."hasVisibleProfile",
          identity_visibility."hasHiddenProfile"
        FROM identity_visibility
        INNER JOIN identity_counts ON identity_counts."identityId" = identity_visibility."identityId"
        WHERE identity_visibility."hasNamedProfile" = true
          OR identity_counts."visibleAssetCount" >= ${minimumFaceCount}
      ),
      classified_faces AS (
        SELECT DISTINCT
          accessible_faces."assetFaceId",
          CASE
            WHEN eligible_identities."hasVisibleProfile" = true THEN 'visible'
            WHEN eligible_identities."hasHiddenProfile" = true THEN 'hidden'
            ELSE 'unassigned'
          END AS bucket
        FROM accessible_faces
        LEFT JOIN eligible_identities ON eligible_identities."identityId" = accessible_faces."identityId"
      )
      SELECT
        COUNT(*)::int AS "detectedFaceCount",
        COUNT(*) FILTER (WHERE bucket = 'visible')::int AS "assignedVisibleFaceCount",
        COUNT(*) FILTER (WHERE bucket = 'hidden')::int AS "assignedHiddenFaceCount",
        COUNT(*) FILTER (WHERE bucket = 'unassigned')::int AS "unassignedFaceCount"
      FROM classified_faces
    `.execute(this.db);

    const row = result.rows[0];
    return {
      detectedFaceCount: Number(row?.detectedFaceCount ?? 0),
      assignedVisibleFaceCount: Number(row?.assignedVisibleFaceCount ?? 0),
      assignedHiddenFaceCount: Number(row?.assignedHiddenFaceCount ?? 0),
      unassignedFaceCount: Number(row?.unassignedFaceCount ?? 0),
    };
  }
```

- [ ] **Step 5: Run identity repository tests and verify green**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/repositories/face-identity-query-shape.spec.ts -t "getAccessiblePeopleFaceStatistics|vector similarity"
```

Expected: PASS.

---

## Task 5: Add Shared-Space Detailed Aggregate

**Files:**

- Modify `server/src/repositories/shared-space.repository.ts`
- Modify `server/test/medium/specs/repositories/shared-space.repository.spec.ts`

- [ ] **Step 1: Write failing shared-space repository tests**

Add this block near `describe('countPersonsBySpaceId')` in `server/test/medium/specs/repositories/shared-space.repository.spec.ts`:

```ts
describe('getPeopleFaceStatisticsBySpaceId', () => {
  it('splits selected-space faces into visible, hidden, and unassigned buckets', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
    const { assetFace: visibleFace } = await ctx.newAssetFace({ assetId: asset.id });
    const { assetFace: hiddenFace } = await ctx.newAssetFace({ assetId: asset.id });
    await ctx.newAssetFace({ assetId: asset.id });
    const visiblePerson = await sut.createPerson({
      spaceId: space.id,
      name: 'Visible',
      representativeFaceId: visibleFace.id,
    });
    const hiddenPerson = await sut.createPerson({
      spaceId: space.id,
      name: 'Hidden',
      isHidden: true,
      representativeFaceId: hiddenFace.id,
    });
    await sut.addPersonFaces(
      [
        { personId: visiblePerson.id, assetFaceId: visibleFace.id },
        { personId: hiddenPerson.id, assetFaceId: hiddenFace.id },
      ],
      { skipRecount: true },
    );

    const result = await sut.getPeopleFaceStatisticsBySpaceId(space.id, {});

    expect(result).toEqual({
      detectedFaceCount: 3,
      assignedVisibleFaceCount: 1,
      assignedHiddenFaceCount: 1,
      unassignedFaceCount: 1,
    });
    const overview = await sut.countPersonsBySpaceId(space.id, {});
    expect(result.detectedFaceCount).toBe(Number(overview.detectedFaceCount));
    expect(result.detectedFaceCount).toBe(
      result.assignedVisibleFaceCount + result.assignedHiddenFaceCount + result.unassignedFaceCount,
    );
  });

  it('returns zeroes for an empty shared space', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });

    await expect(sut.getPeopleFaceStatisticsBySpaceId(space.id, {})).resolves.toEqual({
      detectedFaceCount: 0,
      assignedVisibleFaceCount: 0,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
  });

  it('isolates detailed counts to the selected shared space', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space: targetSpace } = await ctx.newSharedSpace({ createdById: user.id });
    const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset: targetAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    const { asset: otherAsset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    await ctx.newSharedSpaceAsset({ spaceId: targetSpace.id, assetId: targetAsset.id });
    await ctx.newSharedSpaceAsset({ spaceId: otherSpace.id, assetId: otherAsset.id });
    const { assetFace: targetFace } = await ctx.newAssetFace({ assetId: targetAsset.id });
    const { assetFace: otherFace } = await ctx.newAssetFace({ assetId: otherAsset.id });
    const targetPerson = await sut.createPerson({
      spaceId: targetSpace.id,
      name: 'Target',
      representativeFaceId: targetFace.id,
    });
    const otherPerson = await sut.createPerson({
      spaceId: otherSpace.id,
      name: 'Other',
      representativeFaceId: otherFace.id,
    });
    await sut.addPersonFaces(
      [
        { personId: targetPerson.id, assetFaceId: targetFace.id },
        { personId: otherPerson.id, assetFaceId: otherFace.id },
      ],
      { skipRecount: true },
    );

    await expect(sut.getPeopleFaceStatisticsBySpaceId(targetSpace.id, {})).resolves.toEqual({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 1,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
  });

  it('counts direct and linked-library faces once in the selected space', async () => {
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
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
    const { assetFace } = await ctx.newAssetFace({ assetId: asset.id });
    const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: assetFace.id });
    await sut.addPersonFaces([{ personId: person.id, assetFaceId: assetFace.id }], { skipRecount: true });

    await expect(sut.getPeopleFaceStatisticsBySpaceId(space.id, {})).resolves.toEqual({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 1,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
  });

  it('excludes invalid selected-space assets and face rows', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const assets = await Promise.all([
      ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline }),
      ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline, deletedAt: new Date() }),
      ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline, isOffline: true }),
      ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked }),
      ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline }),
      ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline }),
    ]);
    for (const { asset } of assets) {
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
    }
    const { assetFace: validFace } = await ctx.newAssetFace({ assetId: assets[0].asset.id });
    await ctx.newAssetFace({ assetId: assets[1].asset.id });
    await ctx.newAssetFace({ assetId: assets[2].asset.id });
    await ctx.newAssetFace({ assetId: assets[3].asset.id });
    await ctx.newAssetFace({ assetId: assets[4].asset.id, isVisible: false });
    await ctx.newAssetFace({ assetId: assets[5].asset.id, deletedAt: new Date() });
    const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: validFace.id });
    await sut.addPersonFaces([{ personId: person.id, assetFaceId: validFace.id }], { skipRecount: true });

    await expect(sut.getPeopleFaceStatisticsBySpaceId(space.id, {})).resolves.toEqual({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 1,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
  });

  it('counts only assigned matching-person faces for a name filter', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
    const { assetFace: aliceFace } = await ctx.newAssetFace({ assetId: asset.id });
    const { assetFace: hiddenAliceFace } = await ctx.newAssetFace({ assetId: asset.id });
    const { assetFace: bobFace } = await ctx.newAssetFace({ assetId: asset.id });
    await ctx.newAssetFace({ assetId: asset.id });
    const alice = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: aliceFace.id });
    const hiddenAlice = await sut.createPerson({
      spaceId: space.id,
      name: 'Alicia',
      isHidden: true,
      representativeFaceId: hiddenAliceFace.id,
    });
    const bob = await sut.createPerson({ spaceId: space.id, name: 'Bob', representativeFaceId: bobFace.id });
    await sut.addPersonFaces(
      [
        { personId: alice.id, assetFaceId: aliceFace.id },
        { personId: hiddenAlice.id, assetFaceId: hiddenAliceFace.id },
        { personId: bob.id, assetFaceId: bobFace.id },
      ],
      { skipRecount: true },
    );

    await expect(sut.getPeopleFaceStatisticsBySpaceId(space.id, { name: 'Ali' })).resolves.toEqual({
      detectedFaceCount: 2,
      assignedVisibleFaceCount: 1,
      assignedHiddenFaceCount: 1,
      unassignedFaceCount: 0,
    });
  });

  it('counts only assigned named-person faces for a named filter', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
    const { assetFace: namedFace } = await ctx.newAssetFace({ assetId: asset.id });
    const { assetFace: unnamedFace } = await ctx.newAssetFace({ assetId: asset.id });
    await ctx.newAssetFace({ assetId: asset.id });
    const named = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: namedFace.id });
    const unnamed = await sut.createPerson({ spaceId: space.id, name: '', representativeFaceId: unnamedFace.id });
    await sut.addPersonFaces(
      [
        { personId: named.id, assetFaceId: namedFace.id },
        { personId: unnamed.id, assetFaceId: unnamedFace.id },
      ],
      { skipRecount: true },
    );

    await expect(sut.getPeopleFaceStatisticsBySpaceId(space.id, { named: true })).resolves.toEqual({
      detectedFaceCount: 1,
      assignedVisibleFaceCount: 1,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
  });

  it('counts assigned and unassigned faces on assets matching a taken-date filter', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset: matchingAsset } = await ctx.newAsset({
      ownerId: user.id,
      visibility: AssetVisibility.Timeline,
      fileCreatedAt: new Date('2024-03-15T12:00:00.000Z'),
      localDateTime: new Date('2024-03-15T12:00:00.000Z'),
    });
    const { asset: nonMatchingAsset } = await ctx.newAsset({
      ownerId: user.id,
      visibility: AssetVisibility.Timeline,
      fileCreatedAt: new Date('2024-04-15T12:00:00.000Z'),
      localDateTime: new Date('2024-04-15T12:00:00.000Z'),
    });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: matchingAsset.id });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: nonMatchingAsset.id });
    const { assetFace: assignedFace } = await ctx.newAssetFace({ assetId: matchingAsset.id });
    await ctx.newAssetFace({ assetId: matchingAsset.id });
    const { assetFace: nonMatchingFace } = await ctx.newAssetFace({ assetId: nonMatchingAsset.id });
    const person = await sut.createPerson({ spaceId: space.id, name: 'Alice', representativeFaceId: assignedFace.id });
    await sut.addPersonFaces(
      [
        { personId: person.id, assetFaceId: assignedFace.id },
        { personId: person.id, assetFaceId: nonMatchingFace.id },
      ],
      { skipRecount: true },
    );

    await expect(
      sut.getPeopleFaceStatisticsBySpaceId(space.id, {
        takenAfter: new Date('2024-03-01T00:00:00.000Z'),
        takenBefore: new Date('2024-04-01T00:00:00.000Z'),
      }),
    ).resolves.toEqual({
      detectedFaceCount: 2,
      assignedVisibleFaceCount: 1,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 1,
    });
  });

  it('ignores stale off-scope face links when applying taken-date filters', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space: targetSpace } = await ctx.newSharedSpace({ createdById: user.id });
    const { space: otherSpace } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset: targetAsset } = await ctx.newAsset({
      ownerId: user.id,
      visibility: AssetVisibility.Timeline,
      fileCreatedAt: new Date('2024-02-15T12:00:00.000Z'),
      localDateTime: new Date('2024-02-15T12:00:00.000Z'),
    });
    const { asset: offScopeMatchingDateAsset } = await ctx.newAsset({
      ownerId: user.id,
      visibility: AssetVisibility.Timeline,
      fileCreatedAt: new Date('2024-03-15T12:00:00.000Z'),
      localDateTime: new Date('2024-03-15T12:00:00.000Z'),
    });
    await ctx.newSharedSpaceAsset({ spaceId: targetSpace.id, assetId: targetAsset.id });
    await ctx.newSharedSpaceAsset({ spaceId: otherSpace.id, assetId: offScopeMatchingDateAsset.id });
    const { assetFace: targetFace } = await ctx.newAssetFace({ assetId: targetAsset.id });
    const { assetFace: offScopeMatchingDateFace } = await ctx.newAssetFace({ assetId: offScopeMatchingDateAsset.id });
    const person = await sut.createPerson({
      spaceId: targetSpace.id,
      name: 'Alice',
      representativeFaceId: targetFace.id,
    });
    await sut.addPersonFaces(
      [
        { personId: person.id, assetFaceId: targetFace.id },
        { personId: person.id, assetFaceId: offScopeMatchingDateFace.id },
      ],
      { skipRecount: true },
    );

    await expect(
      sut.getPeopleFaceStatisticsBySpaceId(targetSpace.id, {
        takenAfter: new Date('2024-03-01T00:00:00.000Z'),
        takenBefore: new Date('2024-04-01T00:00:00.000Z'),
      }),
    ).resolves.toEqual({
      detectedFaceCount: 0,
      assignedVisibleFaceCount: 0,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 0,
    });
  });

  it('excludes pet-assigned faces when pets are disabled', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { space } = await ctx.newSharedSpace({ createdById: user.id });
    const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Timeline });
    await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id });
    const { assetFace: personFace } = await ctx.newAssetFace({ assetId: asset.id });
    const { assetFace: petFace } = await ctx.newAssetFace({ assetId: asset.id });
    await ctx.newAssetFace({ assetId: asset.id });
    const person = await sut.createPerson({
      spaceId: space.id,
      name: 'Alice',
      representativeFaceId: personFace.id,
      type: 'person',
    });
    const pet = await sut.createPerson({
      spaceId: space.id,
      name: 'Milo',
      representativeFaceId: petFace.id,
      type: 'pet',
    });
    await sut.addPersonFaces(
      [
        { personId: person.id, assetFaceId: personFace.id },
        { personId: pet.id, assetFaceId: petFace.id },
      ],
      { skipRecount: true },
    );

    await expect(sut.getPeopleFaceStatisticsBySpaceId(space.id, { petsEnabled: false })).resolves.toEqual({
      detectedFaceCount: 2,
      assignedVisibleFaceCount: 1,
      assignedHiddenFaceCount: 0,
      unassignedFaceCount: 1,
    });
  });
});
```

- [ ] **Step 2: Run shared-space repository tests and verify red**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/shared-space.repository.spec.ts -t "getPeopleFaceStatisticsBySpaceId"
```

Expected: FAIL because `getPeopleFaceStatisticsBySpaceId` does not exist.

- [ ] **Step 3: Implement shared-space detailed aggregate**

In `server/src/repositories/shared-space.repository.ts`, import `PeopleFaceStatistics` with a type-only import from `src/repositories/person.repository` and add this method near `countPersonsBySpaceId`:

```ts
  @GenerateSql({
    params: [DummyValue.UUID, { petsEnabled: true, named: false, name: 'Alice' }],
  })
  async getPeopleFaceStatisticsBySpaceId(
    spaceId: string,
    options: {
      petsEnabled?: boolean;
      named?: boolean;
      name?: string;
      takenAfter?: Date;
      takenBefore?: Date;
    },
  ): Promise<PeopleFaceStatistics> {
    const escapedName = options.name
      ?.replaceAll('\\', String.raw`\\`)
      .replaceAll('%', String.raw`\%`)
      .replaceAll('_', String.raw`\_`);
    const namePattern = escapedName ? `%${escapedName}%` : undefined;
    const visibilityFilter = sql`"asset"."visibility" IN (${sql.join(visibleSpaceAssetVisibilities)})`;
    const takenAfterFilter = options.takenAfter ? sql`AND "asset"."fileCreatedAt" >= ${options.takenAfter}` : sql``;
    const takenBeforeFilter = options.takenBefore ? sql`AND "asset"."fileCreatedAt" < ${options.takenBefore}` : sql``;
    const petPersonFilter = !options.petsEnabled ? sql`AND "shared_space_person"."type" != 'pet'` : sql``;
    const namedPersonFilter = options.named ? sql`AND "shared_space_person"."name" != ''` : sql``;
    const namePersonFilter = namePattern
      ? sql`AND "shared_space_person"."name" ILIKE ${namePattern} ESCAPE '\\'`
      : sql``;
    const hasPersonFilter = !!options.named || !!namePattern;

    const result = await sql<PeopleFaceStatistics>`
      WITH "asset_scope" AS (
        SELECT "asset"."id" AS "assetId"
        FROM "shared_space_asset"
        INNER JOIN "asset" ON "asset"."id" = "shared_space_asset"."assetId"
        WHERE "shared_space_asset"."spaceId" = ${spaceId}
          AND "asset"."deletedAt" IS NULL
          AND "asset"."isOffline" = false
          AND ${visibilityFilter}
          ${takenAfterFilter}
          ${takenBeforeFilter}
        UNION
        SELECT "asset"."id" AS "assetId"
        FROM "shared_space_library"
        INNER JOIN "asset" ON "asset"."libraryId" = "shared_space_library"."libraryId"
        WHERE "shared_space_library"."spaceId" = ${spaceId}
          AND "asset"."deletedAt" IS NULL
          AND "asset"."isOffline" = false
          AND ${visibilityFilter}
          ${takenAfterFilter}
          ${takenBeforeFilter}
      ),
      "detected_faces" AS (
        SELECT DISTINCT "asset_face"."id" AS "assetFaceId"
        FROM "asset_scope"
        INNER JOIN "asset_face" ON "asset_face"."assetId" = "asset_scope"."assetId"
        WHERE "asset_face"."deletedAt" IS NULL
          AND "asset_face"."isVisible" = true
      ),
      "all_assignments" AS (
        SELECT
          "detected_faces"."assetFaceId",
          bool_or("shared_space_person"."type" = 'pet') AS "hasPetPerson"
        FROM "detected_faces"
        LEFT JOIN "shared_space_person_face"
          ON "shared_space_person_face"."assetFaceId" = "detected_faces"."assetFaceId"
        LEFT JOIN "shared_space_person"
          ON "shared_space_person"."id" = "shared_space_person_face"."personId"
          AND "shared_space_person"."spaceId" = ${spaceId}
        GROUP BY "detected_faces"."assetFaceId"
      ),
      "matching_assignments" AS (
        SELECT
          "detected_faces"."assetFaceId",
          bool_or("shared_space_person"."isHidden" = false) AS "hasVisiblePerson",
          bool_or("shared_space_person"."isHidden" = true) AS "hasHiddenPerson"
        FROM "detected_faces"
        LEFT JOIN "shared_space_person_face"
          ON "shared_space_person_face"."assetFaceId" = "detected_faces"."assetFaceId"
        LEFT JOIN "shared_space_person"
          ON "shared_space_person"."id" = "shared_space_person_face"."personId"
          AND "shared_space_person"."spaceId" = ${spaceId}
          ${petPersonFilter}
          ${namedPersonFilter}
          ${namePersonFilter}
        GROUP BY "detected_faces"."assetFaceId"
      ),
      "classified_faces" AS (
        SELECT
          "matching_assignments"."assetFaceId",
          CASE
            WHEN "hasVisiblePerson" = true THEN 'visible'
            WHEN "hasHiddenPerson" = true THEN 'hidden'
            ELSE 'unassigned'
          END AS bucket
        FROM "matching_assignments"
        INNER JOIN "all_assignments"
          ON "all_assignments"."assetFaceId" = "matching_assignments"."assetFaceId"
        WHERE ${
          hasPersonFilter
            ? sql`"hasVisiblePerson" = true OR "hasHiddenPerson" = true`
            : !options.petsEnabled
              ? sql`COALESCE("all_assignments"."hasPetPerson", false) = false`
              : sql`true`
        }
      )
      SELECT
        COUNT(*)::int AS "detectedFaceCount",
        COUNT(*) FILTER (WHERE bucket = 'visible')::int AS "assignedVisibleFaceCount",
        COUNT(*) FILTER (WHERE bucket = 'hidden')::int AS "assignedHiddenFaceCount",
        COUNT(*) FILTER (WHERE bucket = 'unassigned')::int AS "unassignedFaceCount"
      FROM "classified_faces"
    `.execute(this.db);

    const row = result.rows[0];
    return {
      detectedFaceCount: Number(row?.detectedFaceCount ?? 0),
      assignedVisibleFaceCount: Number(row?.assignedVisibleFaceCount ?? 0),
      assignedHiddenFaceCount: Number(row?.assignedHiddenFaceCount ?? 0),
      unassignedFaceCount: Number(row?.unassignedFaceCount ?? 0),
    };
  }
```

Implementation caution: keep `all_assignments` separate from `matching_assignments`. Pet exclusion needs to know whether a selected-space pet assignment exists before the non-pet classification filter is applied, while genuinely unassigned faces must still remain countable when pets are disabled.

- [ ] **Step 4: Run shared-space repository tests and verify green**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/shared-space.repository.spec.ts -t "getPeopleFaceStatisticsBySpaceId"
```

Expected: PASS.

---

## Task 6: Cross-Endpoint Invariant And Generation

**Files:**

- Modify generated SQL snapshots:
  - `server/src/queries/person.repository.sql`
  - `server/src/queries/face.identity.repository.sql`
  - `server/src/queries/shared.space.repository.sql`
- Modify generated OpenAPI artifacts:
  - `mobile/openapi`
  - `open-api/immich-openapi-specs.json`
  - `open-api/typescript-sdk`

- [ ] **Step 1: Verify invariant assertions were added red-first**

Before running final verification, confirm each new repository `describe` block already contains an assertion that compares detailed `detectedFaceCount` to the corresponding Phase 1 overview endpoint for the same fixture. These assertions belong in Tasks 3-5 before repository implementation. Do not add them for the first time after production code is already green.

```ts
const overview = await sut.getPeopleOverviewStatistics(user.id);
const details = await sut.getPeopleFaceStatistics(user.id);

expect(details.detectedFaceCount).toBe(overview.detectedFaceCount);
expect(details.detectedFaceCount).toBe(
  details.assignedVisibleFaceCount + details.assignedHiddenFaceCount + details.unassignedFaceCount,
);
```

For identity-grouped tests, compare `getAccessiblePeopleStatistics` with `getAccessiblePeopleFaceStatistics`. For shared-space tests, compare `countPersonsBySpaceId` with `getPeopleFaceStatisticsBySpaceId`.

- [ ] **Step 2: Run the full focused test set**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/controllers/person.controller.spec.ts src/controllers/shared-space.controller.spec.ts src/services/person.service.spec.ts src/services/shared-space.service.spec.ts -t "face-statistics|getPeopleFaceStatistics|getSpacePeopleFaceStatistics"

pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/person.repository.spec.ts test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/repositories/shared-space.repository.spec.ts test/medium/specs/repositories/face-identity-query-shape.spec.ts -t "getPeopleFaceStatistics|getAccessiblePeopleFaceStatistics|getPeopleFaceStatisticsBySpaceId|vector similarity"
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript check**

Run:

```bash
pnpm --dir server check
```

Expected: PASS.

- [ ] **Step 4: Generate SQL snapshots**

If doing generation locally, run:

```bash
pnpm --dir server build
pnpm --dir server sync:sql
```

Expected: generated SQL changes are limited to:

- `server/src/queries/person.repository.sql`
- `server/src/queries/face.identity.repository.sql`
- `server/src/queries/shared.space.repository.sql`

If deferring slow generation to CI, leave this step for CI and expect the SQL freshness check to report any missing generated snapshot diffs.

- [ ] **Step 5: Generate OpenAPI/SDK artifacts**

If doing generation locally, run:

```bash
make open-api
```

Expected: generated OpenAPI changes include the two new `face-statistics` endpoints and the `PeopleFaceStatisticsResponseDto` schema. The changed files may include `mobile/openapi`, `open-api/typescript-sdk`, and `open-api/immich-openapi-specs.json`, matching the CI OpenAPI freshness check.

If deferring slow generation to CI, leave this step for CI and expect the OpenAPI freshness check to report any missing generated artifact diffs.

## Edge-Case Coverage Checklist

- [ ] Global personal-only details split visible, hidden, and unassigned faces.
- [ ] Global personal-only details exclude other owners, offline assets, deleted assets, archive/locked assets, non-visible faces, and deleted faces.
- [ ] Global personal-only details treat inaccessible assigned people as unassigned rather than leaking hidden/visible state.
- [ ] Global personal-only details return zeroes for an empty library.
- [ ] Global personal-only details return all detected faces as unassigned when no eligible people are assigned.
- [ ] Global identity-grouped details split visible, hidden, and unassigned faces.
- [ ] Global identity-grouped details count an identity with any visible profile as visible-assigned.
- [ ] Global identity-grouped details treat low-evidence unnamed identities below `minimumFaceCount` as unassigned.
- [ ] Global identity-grouped details exclude invalid assets and invalid face rows.
- [ ] Global identity-grouped details include linked/external-library faces only through timeline-enabled member spaces.
- [ ] Global identity-grouped details dedupe faces reachable through owned assets, shared-space assets, and linked libraries.
- [ ] Global identity-grouped details remove shared-space/library faces after membership removal while preserving owned personal faces.
- [ ] Global identity-grouped details return all detected faces as unassigned when no identity is linked.
- [ ] Shared-space details split selected-space visible, hidden, and unassigned faces.
- [ ] Shared-space details return zeroes for an empty space.
- [ ] Shared-space details include direct and linked-library faces in the selected space.
- [ ] Shared-space details dedupe direct-plus-linked-library faces.
- [ ] Shared-space details isolate the selected space from other spaces.
- [ ] Shared-space details support `name`, `named`, `takenAfter`, and `takenBefore`.
- [ ] Shared-space name/named filters do not count unrelated unassigned faces.
- [ ] Shared-space taken-date filters count unassigned faces on matching-date assets.
- [ ] Shared-space taken-date filters ignore stale person-face links to assets outside the selected space.
- [ ] Shared-space pet-disabled scopes exclude pet-assigned faces while preserving genuinely unassigned faces.
- [ ] Shared-space details exclude deleted/offline/locked/non-visible face rows according to current page visibility rules.
- [ ] Shared-space details return zeroes when face recognition is disabled.
- [ ] Non-members cannot read shared-space detailed statistics.
- [ ] Every detailed response satisfies the sum invariant.
- [ ] Repeating the same detailed query is deterministic and has no side effects.
- [ ] Detailed endpoints do not use vector similarity.

## Verification Commands

Focused local verification:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs src/controllers/person.controller.spec.ts src/controllers/shared-space.controller.spec.ts src/services/person.service.spec.ts src/services/shared-space.service.spec.ts -t "face-statistics|getPeopleFaceStatistics|getSpacePeopleFaceStatistics"

pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/person.repository.spec.ts test/medium/specs/repositories/face-identity.repository.spec.ts test/medium/specs/repositories/shared-space.repository.spec.ts test/medium/specs/repositories/face-identity-query-shape.spec.ts -t "getPeopleFaceStatistics|getAccessiblePeopleFaceStatistics|getPeopleFaceStatisticsBySpaceId|vector similarity"

pnpm --dir server check
```

Slow/local-or-CI verification:

```bash
pnpm --dir server build
pnpm --dir server sync:sql
make open-api
```

## Self-Review Notes

- Spec coverage: This plan covers Phase 2 only: lazy detailed global and shared-space face-statistics endpoints and their backend aggregates. It intentionally leaves frontend overview rendering for Phase 3 and lazy info UI for Phase 4.
- Filter honesty: Global similarity filters are rejected. Shared-space supported filters are forwarded and tested. Pagination/hidden-row toggles remain accepted but do not alter aggregate details.
- Access safety: All repository tests build counts from authorized asset scopes before classification. Shared-space service tests verify non-members are rejected before repository reads.
- Dedupe safety: Tests cover direct-plus-linked and global overlap paths. Queries use `DISTINCT` face IDs.
- Generated artifacts: SQL/OpenAPI generation is listed as local-or-CI work because these checks are slow and CI already verifies freshness.
