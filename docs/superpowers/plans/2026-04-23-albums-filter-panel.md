# Album Detail Filter Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the existing `FilterPanel` and `ActiveFiltersBar` to the album detail page in `VIEW`, `SELECT_THUMBNAIL`, and `SELECT_ASSETS`, with album-scoped suggestions for album modes and a separate picker-scoped filter state for add-assets.

**Architecture:** Extend the search suggestion request flow with `albumId` support, validate mixed scopes at both HTTP and service layers, and add a small repository helper that applies album scope through `album_asset` instead of owner-only filtering. On the web side, add two focused helper modules: one for album filter configs and one for album timeline option builders. The album route owns two filter states, two label caches, and explicit mode branches so `VIEW`/`SELECT_THUMBNAIL` share album filters while `SELECT_ASSETS` stays isolated.

**Tech Stack:** NestJS, Zod/NestJS-Zod, Kysely, Svelte 5, Vitest, Playwright, oazapfts TypeScript SDK

---

## File Structure

- Modify: `server/src/dtos/search.dto.ts`
  Responsibility: add `albumId` to suggestion DTOs and reject invalid mixed scopes at the HTTP boundary.

- Modify: `server/src/controllers/search.controller.spec.ts`
  Responsibility: prove `/search/suggestions` and `/search/suggestions/filters` accept valid `albumId` and reject invalid / mixed query params.

- Modify: `server/src/services/search.service.ts`
  Responsibility: enforce `Permission.AlbumRead`, reject invalid `albumId` combinations in direct service calls, and forward `albumId` to repository suggestion methods.

- Modify: `server/src/services/search.service.spec.ts`
  Responsibility: red-green coverage for album access, service-level validation, and passthrough into repository calls.

- Modify: `server/src/repositories/search.repository.ts`
  Responsibility: add reusable suggestion-scope helper using `album_asset` for album-scoped suggestions and keep shared-album results independent of owner/partner semantics.

- Modify: `server/src/repositories/search.repository.spec.ts`
  Responsibility: verify compiled SQL shape for album-scoped suggestion queries and prevent regressions back to `ownerId = ANY(...)`.

- Modify: `open-api/immich-openapi-specs.json`
  Responsibility: regenerated OpenAPI document after DTO changes.

- Modify: `open-api/typescript-sdk/src/fetch-client.ts`
  Responsibility: regenerated SDK signatures for `getSearchSuggestions` and `getFilterSuggestions`.

- Create: `web/src/lib/utils/album-filter-config.ts`
  Responsibility: build `FilterPanelConfig` for album detail scope and picker scope.

- Create: `web/src/lib/utils/album-filter-options.ts`
  Responsibility: map `FilterState` into album timeline options and picker timeline options without changing existing ordering semantics.

- Create: `web/src/lib/utils/__tests__/album-filter-config.spec.ts`
  Responsibility: prove `albumId` is sent only for album-scoped suggestions and not for picker-scoped suggestions.

- Create: `web/src/lib/utils/__tests__/album-filter-options.spec.ts`
  Responsibility: prove both option builders map every supported filter correctly and preserve the correct base options.

- Modify: `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
  Responsibility: own `albumFilters` and `pickerFilters`, wrap suggestion providers to populate separate label caches, switch configs and option builders by mode, render the filter panel and active chips in all three modes, and reset everything on album navigation.

- Create: `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.spec.ts`
  Responsibility: integration coverage for mode wiring, state separation, thumbnail-mode reuse, empty-state rendering, album-to-album reset behavior, and picker disabled-state preservation.

- Create: `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/mock-timeline.test-wrapper.svelte`
  Responsibility: lightweight route-test stub that binds a fake `timelineManager`, exposes the current `options`, and can simulate zero-result states without mounting the real timeline.

- Modify: `e2e/src/specs/web/album.e2e-spec.ts`
  Responsibility: user-visible proof that album filtering works in view mode, thumbnail mode reuses album filters, picker mode keeps a separate state, and already-in-album assets stay disabled after filtering.

## Task 1: Add `albumId` HTTP validation for suggestion endpoints

**Files:**

- Modify: `server/src/controllers/search.controller.spec.ts`
- Modify: `server/src/dtos/search.dto.ts`

- [ ] **Step 1: Write the failing controller tests**

Add these tests to `server/src/controllers/search.controller.spec.ts`:

```typescript
describe('GET /search/suggestions', () => {
  it('accepts a valid albumId query param', async () => {
    const albumId = '11111111-1111-1111-1111-111111111111';
    service.getSearchSuggestions.mockResolvedValue(['Germany']);

    const { status, body } = await request(ctx.getHttpServer())
      .get('/search/suggestions')
      .query({ type: 'country', albumId });

    expect(status).toBe(200);
    expect(body).toEqual(['Germany']);
    expect(service.getSearchSuggestions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'country', albumId }),
    );
  });

  it('rejects an invalid albumId query param', async () => {
    const { status, body } = await request(ctx.getHttpServer())
      .get('/search/suggestions')
      .query({ type: 'country', albumId: 'not-a-uuid' });

    expect(status).toBe(400);
    expect(body).toEqual(errorDto.badRequest([expect.stringContaining('[albumId]')]));
  });

  it('rejects albumId mixed with withSharedSpaces', async () => {
    const albumId = '11111111-1111-1111-1111-111111111111';

    const { status, body } = await request(ctx.getHttpServer())
      .get('/search/suggestions')
      .query({ type: 'country', albumId, withSharedSpaces: true });

    expect(status).toBe(400);
    expect(body).toEqual(errorDto.badRequest([expect.stringContaining('albumId')]));
  });

  it('rejects albumId mixed with spaceId', async () => {
    const albumId = '11111111-1111-1111-1111-111111111111';
    const spaceId = '22222222-2222-2222-2222-222222222222';

    const { status, body } = await request(ctx.getHttpServer())
      .get('/search/suggestions')
      .query({ type: 'country', albumId, spaceId });

    expect(status).toBe(400);
    expect(body).toEqual(errorDto.badRequest([expect.stringContaining('albumId')]));
  });
});

describe('GET /search/suggestions/filters', () => {
  it('accepts a valid albumId query param', async () => {
    const albumId = '11111111-1111-1111-1111-111111111111';
    service.getFilterSuggestions.mockResolvedValue({
      countries: [],
      cameraMakes: [],
      tags: [],
      people: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    });

    const { status, body } = await request(ctx.getHttpServer()).get('/search/suggestions/filters').query({ albumId });

    expect(status).toBe(200);
    expect(body).toEqual({
      countries: [],
      cameraMakes: [],
      tags: [],
      people: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    });
    expect(service.getFilterSuggestions).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ albumId }));
  });

  it('rejects albumId mixed with spaceId', async () => {
    const albumId = '11111111-1111-1111-1111-111111111111';
    const spaceId = '22222222-2222-2222-2222-222222222222';

    const { status, body } = await request(ctx.getHttpServer())
      .get('/search/suggestions/filters')
      .query({ albumId, spaceId });

    expect(status).toBe(400);
    expect(body).toEqual(errorDto.badRequest([expect.stringContaining('albumId')]));
  });

  it('rejects an invalid albumId query param', async () => {
    const { status, body } = await request(ctx.getHttpServer())
      .get('/search/suggestions/filters')
      .query({ albumId: 'not-a-uuid' });

    expect(status).toBe(400);
    expect(body).toEqual(errorDto.badRequest([expect.stringContaining('[albumId]')]));
  });

  it('rejects albumId mixed with withSharedSpaces', async () => {
    const albumId = '11111111-1111-1111-1111-111111111111';

    const { status, body } = await request(ctx.getHttpServer())
      .get('/search/suggestions/filters')
      .query({ albumId, withSharedSpaces: true });

    expect(status).toBe(400);
    expect(body).toEqual(errorDto.badRequest([expect.stringContaining('albumId')]));
  });
});
```

- [ ] **Step 2: Run the controller tests to verify they fail**

Run:

```bash
pnpm --dir server test --run src/controllers/search.controller.spec.ts
```

Expected: failures showing that `albumId` is stripped or ignored, invalid `albumId` is not rejected, and mixed-scope requests still return `200`.

- [ ] **Step 3: Add `albumId` and mixed-scope validation to the DTOs**

Update the two DTO schemas in `server/src/dtos/search.dto.ts` with these exact additions:

```typescript
const SearchSuggestionRequestSchema = z
  .object({
    type: SearchSuggestionTypeSchema,
    albumId: z.uuidv4().optional().describe('Scope suggestions to a specific album'),
    country: z.string().optional().describe('Filter by country'),
    state: z.string().optional().describe('Filter by state/province'),
    make: z.string().optional().describe('Filter by camera make'),
    model: z.string().optional().describe('Filter by camera model'),
    lensModel: z.string().optional().describe('Filter by camera lens model'),
    takenAfter: isoDatetimeToDate.optional().describe('Filter suggestions by taken date (after)'),
    takenBefore: isoDatetimeToDate.optional().describe('Filter suggestions by taken date (before)'),
    spaceId: z.uuidv4().optional().describe('Scope suggestions to a specific shared space'),
    withSharedSpaces: stringToBool
      .optional()
      .describe('Include suggestions from shared spaces the user is a member of'),
    includeNull: stringToBool
      .optional()
      .describe('Include null values in suggestions')
      .meta(new HistoryBuilder().added('v1.111.0').stable('v2').getExtensions()),
  })
  .refine((data) => !(data.albumId && data.spaceId), { error: 'Cannot use both albumId and spaceId' })
  .refine((data) => !(data.albumId && data.withSharedSpaces), {
    error: 'Cannot use both albumId and withSharedSpaces',
  })
  .meta({ id: 'SearchSuggestionRequestDto' });

const FilterSuggestionsRequestSchema = z
  .object({
    personIds: z
      .preprocess((v) => (v === undefined ? undefined : Array.isArray(v) ? v : [v]), z.array(z.uuidv4()))
      .optional()
      .describe('Filter by person IDs'),
    country: z.string().optional().describe('Filter by country'),
    city: z.string().optional().describe('Filter by city'),
    make: z.string().optional().describe('Filter by camera make'),
    model: z.string().optional().describe('Filter by camera model'),
    tagIds: z
      .preprocess((v) => (v === undefined ? undefined : Array.isArray(v) ? v : [v]), z.array(z.uuidv4()))
      .optional()
      .describe('Filter by tag IDs'),
    rating: z.coerce.number().int().min(1).max(5).optional().describe('Filter by rating (1-5)'),
    mediaType: AssetTypeSchema.optional().describe('Filter by asset type'),
    isFavorite: stringToBool.optional().describe('Filter by favorites'),
    takenAfter: isoDatetimeToDate.optional().describe('Filter by taken date (after)'),
    takenBefore: isoDatetimeToDate.optional().describe('Filter by taken date (before)'),
    albumId: z.uuidv4().optional().describe('Scope to a specific album'),
    spaceId: z.uuidv4().optional().describe('Scope to a specific shared space'),
    withSharedSpaces: stringToBool.optional().describe('Include shared spaces the user is a member of'),
  })
  .refine((data) => !(data.albumId && data.spaceId), { error: 'Cannot use both albumId and spaceId' })
  .refine((data) => !(data.albumId && data.withSharedSpaces), {
    error: 'Cannot use both albumId and withSharedSpaces',
  })
  .meta({ id: 'FilterSuggestionsRequestDto' });
```

- [ ] **Step 4: Run the controller tests again**

Run:

```bash
pnpm --dir server test --run src/controllers/search.controller.spec.ts
```

Expected: `PASS` for the new `/search/suggestions` and `/search/suggestions/filters` cases.

- [ ] **Step 5: Commit the DTO / HTTP validation slice**

```bash
git add server/src/controllers/search.controller.spec.ts server/src/dtos/search.dto.ts
git commit -m "feat: add album-scoped suggestion dto validation"
```

## Task 2: Enforce album access and service-level scope rules

**Files:**

- Modify: `server/src/services/search.service.spec.ts`
- Modify: `server/src/services/search.service.ts`

- [ ] **Step 1: Write failing service tests for `getSearchSuggestions`**

Add these tests inside the existing `describe('getSearchSuggestions', () => {` section in `server/src/services/search.service.spec.ts`:

```typescript
it('checks album access and passes albumId to getSearchSuggestions', async () => {
  const albumId = newUuid();
  mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set());
  mocks.access.album.checkSharedAlbumAccess.mockResolvedValue(new Set([albumId]));
  mocks.search.getCountries.mockResolvedValue(['Germany']);

  const result = await sut.getSearchSuggestions(authStub.user1, {
    type: SearchSuggestionType.COUNTRY,
    albumId,
  });

  expect(result).toEqual(['Germany']);
  expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalled();
  expect(mocks.access.album.checkSharedAlbumAccess).toHaveBeenCalled();
  expect(mocks.search.getCountries).toHaveBeenCalledWith(
    [authStub.user1.user.id],
    expect.objectContaining({ albumId }),
  );
});

it('rejects albumId mixed with spaceId for getSearchSuggestions', async () => {
  await expect(
    sut.getSearchSuggestions(authStub.user1, {
      type: SearchSuggestionType.COUNTRY,
      albumId: newUuid(),
      spaceId: newUuid(),
    }),
  ).rejects.toThrow('Cannot use albumId with spaceId');
});

it('rejects albumId mixed with withSharedSpaces for getSearchSuggestions', async () => {
  await expect(
    sut.getSearchSuggestions(authStub.user1, {
      type: SearchSuggestionType.COUNTRY,
      albumId: newUuid(),
      withSharedSpaces: true,
    }),
  ).rejects.toThrow('Cannot use albumId with withSharedSpaces');
});
```

- [ ] **Step 2: Write failing service tests for `getFilterSuggestions`**

Add these tests inside the existing `describe('getFilterSuggestions', () => {` section:

```typescript
it('checks album access and passes albumId to getFilterSuggestions', async () => {
  const albumId = newUuid();
  const auth = AuthFactory.create();
  mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set());
  mocks.access.album.checkSharedAlbumAccess.mockResolvedValue(new Set([albumId]));
  mocks.search.getFilterSuggestions.mockResolvedValue({
    countries: ['Germany'],
    cameraMakes: ['Canon'],
    tags: [{ id: 'tag-1', value: 'Vacation' }],
    people: [{ id: 'person-1', name: 'Alice' }],
    ratings: [5],
    mediaTypes: ['IMAGE'],
    hasUnnamedPeople: false,
  });

  const result = await sut.getFilterSuggestions(auth, { albumId });

  expect(result.countries).toEqual(['Germany']);
  expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalled();
  expect(mocks.access.album.checkSharedAlbumAccess).toHaveBeenCalled();
  expect(mocks.search.getFilterSuggestions).toHaveBeenCalledWith([auth.user.id], expect.objectContaining({ albumId }));
  expect(mocks.sharedSpace.getSpaceIdsForTimeline).not.toHaveBeenCalled();
});

it('rejects albumId mixed with withSharedSpaces for getFilterSuggestions', async () => {
  const auth = AuthFactory.create();

  await expect(sut.getFilterSuggestions(auth, { albumId: newUuid(), withSharedSpaces: true })).rejects.toThrow(
    'Cannot use albumId with withSharedSpaces',
  );
});

it('rejects albumId mixed with spaceId for getFilterSuggestions', async () => {
  const auth = AuthFactory.create();

  await expect(sut.getFilterSuggestions(auth, { albumId: newUuid(), spaceId: newUuid() })).rejects.toThrow(
    'Cannot use albumId with spaceId',
  );
});
```

- [ ] **Step 3: Run the service tests to verify they fail**

Run:

```bash
pnpm --dir server test --run src/services/search.service.spec.ts
```

Expected: failures showing missing album access checks, missing `albumId` passthrough, and no direct-service rejection for invalid scope combinations.

- [ ] **Step 4: Implement the service logic**

Add these exact guards to both `getSearchSuggestions` and `getFilterSuggestions` in `server/src/services/search.service.ts`:

```typescript
if (dto.albumId && dto.spaceId) {
  throw new BadRequestException('Cannot use albumId with spaceId');
}

if (dto.albumId && dto.withSharedSpaces) {
  throw new BadRequestException('Cannot use albumId with withSharedSpaces');
}

if (dto.spaceId && dto.withSharedSpaces) {
  throw new BadRequestException('Cannot use both spaceId and withSharedSpaces');
}

if (dto.albumId) {
  await this.requireAccess({ auth, permission: Permission.AlbumRead, ids: [dto.albumId] });
} else if (dto.spaceId) {
  await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
}

const userIds = await this.getUserIdsToSearch(auth);

let timelineSpaceIds: string[] | undefined;
if (!dto.albumId && dto.withSharedSpaces) {
  const spaceRows = await this.sharedSpaceRepository.getSpaceIdsForTimeline(auth.user.id);
  if (spaceRows.length > 0) {
    timelineSpaceIds = spaceRows.map((row) => row.spaceId);
  }
}
```

Then keep the existing repository calls, but make sure they now pass `albumId` through unchanged:

```typescript
const suggestions = await this.getSuggestions(userIds, { ...dto, timelineSpaceIds });
const result = await this.searchRepository.getFilterSuggestions(userIds, { ...dto, timelineSpaceIds });
```

- [ ] **Step 5: Run the service tests again**

Run:

```bash
pnpm --dir server test --run src/services/search.service.spec.ts
```

Expected: `PASS` for the new album access and validation cases, with existing shared-space cases still green.

- [ ] **Step 6: Commit the service slice**

```bash
git add server/src/services/search.service.ts server/src/services/search.service.spec.ts
git commit -m "feat: enforce album scope for search suggestions"
```

## Task 3: Add repository album scope through `album_asset`

**Files:**

- Modify: `server/src/repositories/search.repository.spec.ts`
- Modify: `server/src/repositories/search.repository.ts`

- [ ] **Step 1: Write failing SQL-shape tests**

Extend `server/src/repositories/search.repository.spec.ts` with these helpers and tests:

```typescript
const compileFilteredAssetIds = (sut: SearchRepository, options: Record<string, unknown>) =>
  (sut as any).buildFilteredAssetIds(['00000000-0000-0000-0000-000000000000'], options).compile().sql;

const compileExifField = (sut: SearchRepository, field: 'country' | 'model', options: Record<string, unknown>) =>
  (sut as any).getExifField(field, ['00000000-0000-0000-0000-000000000000'], options).compile().sql;

describe('album-scoped suggestions', () => {
  it('buildFilteredAssetIds uses album_asset and does not fall back to ownerId scope', () => {
    const sql = compileFilteredAssetIds(sut, {
      albumId: '11111111-1111-1111-1111-111111111111',
      tagIds: ['22222222-2222-2222-2222-222222222222'],
    });

    expect(sql).toContain('"album_asset"');
    expect(sql).toContain('"album_asset"."albumId"');
    expect(sql).not.toContain('"asset"."ownerId" = any(');
  });

  it('getExifField uses album_asset and does not fall back to ownerId scope', () => {
    const sql = compileExifField(sut, 'country', {
      albumId: '11111111-1111-1111-1111-111111111111',
    });

    expect(sql).toContain('"album_asset"');
    expect(sql).toContain('"album_asset"."albumId"');
    expect(sql).not.toContain('"ownerId" = any(');
  });
});
```

- [ ] **Step 2: Run the repository tests to verify they fail**

Run:

```bash
pnpm --dir server test --run src/repositories/search.repository.spec.ts
```

Expected: failures because the compiled SQL still uses owner-based scope and never references `album_asset`.

- [ ] **Step 3: Add a reusable suggestion-scope helper**

In `server/src/repositories/search.repository.ts`, update the Kysely import to include `SelectQueryBuilder`, replace `SpaceScopeOptions` with an album-aware scope type, and add this helper:

```typescript
export interface SuggestionScopeOptions {
  albumId?: string;
  spaceId?: string;
  timelineSpaceIds?: string[];
  takenAfter?: Date;
  takenBefore?: Date;
}

private applySuggestionScope<T extends SelectQueryBuilder<DB, any, any>>(
  qb: T,
  userIds: string[],
  options?: SuggestionScopeOptions,
) {
  return qb
    .$if(!!options?.albumId, (qb) =>
      qb.where((eb) =>
        eb.exists(
          eb
            .selectFrom('album_asset')
            .whereRef('album_asset.assetId', '=', 'asset.id')
            .where('album_asset.albumId', '=', asUuid(options!.albumId!)),
        ),
      ),
    )
    .$if(!options?.albumId && !options?.spaceId && !options?.timelineSpaceIds, (qb) =>
      qb.where('asset.ownerId', '=', anyUuid(userIds)),
    )
    .$if(!!options?.spaceId && !options?.timelineSpaceIds && !options?.albumId, (qb) =>
      qb.where((eb) =>
        eb.or([
          eb.exists(
            eb
              .selectFrom('shared_space_asset')
              .whereRef('shared_space_asset.assetId', '=', 'asset.id')
              .where('shared_space_asset.spaceId', '=', asUuid(options!.spaceId!)),
          ),
          eb.exists(
            eb
              .selectFrom('shared_space_library')
              .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
              .where('shared_space_library.spaceId', '=', asUuid(options!.spaceId!)),
          ),
        ]),
      ),
    )
    .$if(!!options?.timelineSpaceIds && !options?.albumId, (qb) =>
      qb.where((eb) =>
        eb.or([
          eb('asset.ownerId', '=', anyUuid(userIds)),
          eb.exists(
            eb
              .selectFrom('shared_space_asset')
              .whereRef('shared_space_asset.assetId', '=', 'asset.id')
              .where('shared_space_asset.spaceId', '=', anyUuid(options!.timelineSpaceIds!)),
          ),
          eb.exists(
            eb
              .selectFrom('shared_space_library')
              .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
              .where('shared_space_library.spaceId', '=', anyUuid(options!.timelineSpaceIds!)),
          ),
        ]),
      ),
    );
}
```

- [ ] **Step 4: Reuse the helper in the two suggestion query paths that need album scope**

Update `getExifField` and `buildFilteredAssetIds` to use the helper instead of duplicating scope clauses:

```typescript
private getExifField<K extends 'city' | 'state' | 'country' | 'make' | 'model' | 'lensModel'>(
  field: K,
  userIds: string[],
  options?: SuggestionScopeOptions,
) {
  return this.applySuggestionScope(
    this.db
      .selectFrom('asset_exif')
      .select(field)
      .distinctOn(field)
      .innerJoin('asset', 'asset.id', 'asset_exif.assetId')
      .where('visibility', '=', AssetVisibility.Timeline)
      .where('deletedAt', 'is', null)
      .where(field, 'is not', null)
      .where(field, '!=', '' as any),
    userIds,
    options,
  )
    .$if(!!options?.takenAfter, (qb) => qb.where('asset.fileCreatedAt', '>=', options!.takenAfter!))
    .$if(!!options?.takenBefore, (qb) => qb.where('asset.fileCreatedAt', '<', options!.takenBefore!));
}

private buildFilteredAssetIds(userIds: string[], options: FilterSuggestionsOptions) {
  const needsExifJoin = !!(options.country || options.city || options.make || options.model || options.rating);

  return this.applySuggestionScope(
    this.db
      .selectFrom('asset')
      .select('asset.id')
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .where('asset.deletedAt', 'is', null),
    userIds,
    options,
  )
    .$if(!!options.takenAfter, (qb) => qb.where('asset.fileCreatedAt', '>=', options.takenAfter!))
    .$if(!!options.takenBefore, (qb) => qb.where('asset.fileCreatedAt', '<', options.takenBefore!))
    .$if(needsExifJoin, (qb) =>
      qb
        .innerJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
        .$if(!!options.country, (qb) => qb.where('asset_exif.country', '=', options.country!))
        .$if(!!options.city, (qb) => qb.where('asset_exif.city', '=', options.city!))
        .$if(!!options.make, (qb) => qb.where('asset_exif.make', '=', options.make!))
        .$if(!!options.model, (qb) => qb.where('asset_exif.model', '=', options.model!))
        .$if(!!options.rating, (qb) => qb.where('asset_exif.rating', '=', options.rating!)),
    );
}
```

Also update the suggestion option interfaces so `GetStatesOptions`, `GetCitiesOptions`, `GetCameraMakesOptions`, `GetCameraModelsOptions`, `GetCameraLensModelsOptions`, and `FilterSuggestionsOptions` extend `SuggestionScopeOptions`.

- [ ] **Step 5: Run the repository tests again**

Run:

```bash
pnpm --dir server test --run src/repositories/search.repository.spec.ts
```

Expected: `PASS`, with compiled SQL showing `album_asset` scope and no owner-only fallback when `albumId` is present.

- [ ] **Step 6: Commit the repository slice**

```bash
git add server/src/repositories/search.repository.ts server/src/repositories/search.repository.spec.ts
git commit -m "feat: scope suggestion queries by album membership"
```

## Task 4: Regenerate the OpenAPI document and TypeScript SDK

**Files:**

- Modify: `open-api/immich-openapi-specs.json`
- Modify: `open-api/typescript-sdk/src/fetch-client.ts`

- [ ] **Step 1: Regenerate the OpenAPI artifacts**

Run:

```bash
make open-api-typescript
```

Expected: the command rebuilds `immich`, runs `sync:open-api`, regenerates `open-api/immich-openapi-specs.json`, regenerates `open-api/typescript-sdk/src/fetch-client.ts`, and finishes without TypeScript build errors.

- [ ] **Step 2: Verify the generated SDK signatures**

Run:

```bash
grep -n "getSearchSuggestions\\|getFilterSuggestions\\|albumId" open-api/typescript-sdk/src/fetch-client.ts | head -20
```

Expected: `albumId?: string;` appears in both `getSearchSuggestions` and `getFilterSuggestions`.

- [ ] **Step 3: Commit the generated SDK slice**

```bash
git add open-api/immich-openapi-specs.json open-api/typescript-sdk/src/fetch-client.ts
git commit -m "chore: regenerate sdk for album-scoped suggestions"
```

## Task 5: Add album filter helper modules

**Files:**

- Create: `web/src/lib/utils/album-filter-config.ts`
- Create: `web/src/lib/utils/album-filter-options.ts`
- Create: `web/src/lib/utils/__tests__/album-filter-config.spec.ts`
- Create: `web/src/lib/utils/__tests__/album-filter-options.spec.ts`

- [ ] **Step 1: Write the failing option-builder tests**

Create `web/src/lib/utils/__tests__/album-filter-options.spec.ts`:

```typescript
import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import { buildAlbumAssetPickerOptions, buildAlbumTimelineOptions } from '$lib/utils/album-filter-options';
import { AssetOrder, AssetTypeEnum, AssetVisibility } from '@immich/sdk';

describe('buildAlbumTimelineOptions', () => {
  it('maps all supported filters without changing album order', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['person-1'],
      country: 'Germany',
      city: 'Berlin',
      make: 'Sony',
      model: 'A7C',
      tagIds: ['tag-1'],
      rating: 4,
      mediaType: 'image' as const,
      selectedYear: 2024,
      selectedMonth: 2,
      sortOrder: 'asc' as const,
    };

    expect(buildAlbumTimelineOptions('album-1', AssetOrder.Asc, filters)).toEqual({
      albumId: 'album-1',
      order: AssetOrder.Asc,
      personIds: ['person-1'],
      country: 'Germany',
      city: 'Berlin',
      make: 'Sony',
      model: 'A7C',
      tagIds: ['tag-1'],
      rating: 4,
      $type: AssetTypeEnum.Image,
      takenAfter: '2024-02-01T00:00:00.000Z',
      takenBefore: '2024-03-01T00:00:00.000Z',
    });
  });
});

describe('buildAlbumAssetPickerOptions', () => {
  it('keeps picker base options and does not add album scope', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['person-1'],
      tagIds: ['tag-1'],
      mediaType: 'video' as const,
      selectedYear: 2023,
    };

    expect(buildAlbumAssetPickerOptions('album-1', filters)).toEqual({
      visibility: AssetVisibility.Timeline,
      withPartners: true,
      timelineAlbumId: 'album-1',
      personIds: ['person-1'],
      tagIds: ['tag-1'],
      $type: AssetTypeEnum.Video,
      takenAfter: '2023-01-01T00:00:00.000Z',
      takenBefore: '2024-01-01T00:00:00.000Z',
    });
  });
});
```

- [ ] **Step 2: Write the failing config-builder tests**

Create `web/src/lib/utils/__tests__/album-filter-config.spec.ts`:

```typescript
import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import { buildAlbumAssetPickerFilterConfig, buildAlbumDetailFilterConfig } from '$lib/utils/album-filter-config';
import { AssetTypeEnum, getFilterSuggestions, getSearchSuggestions } from '@immich/sdk';
import { vi } from 'vitest';

vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/sdk')>();
  return {
    ...actual,
    getFilterSuggestions: vi.fn().mockResolvedValue({
      countries: ['Germany'],
      cameraMakes: ['Sony'],
      tags: [{ id: 'tag-1', value: 'Vacation' }],
      people: [{ id: 'person-1', name: 'Alice' }],
      ratings: [5],
      mediaTypes: ['IMAGE'],
      hasUnnamedPeople: false,
    }),
    getSearchSuggestions: vi.fn().mockResolvedValue(['Berlin']),
  };
});

describe('buildAlbumDetailFilterConfig', () => {
  it('passes albumId to filter suggestions and dependent providers', async () => {
    const config = buildAlbumDetailFilterConfig('album-1');
    const filters = {
      ...createFilterState(),
      personIds: ['person-1'],
      tagIds: ['tag-1'],
      mediaType: 'image' as const,
    };

    await config.suggestionsProvider!(filters);
    await config.providers!.cities!('Germany', { takenAfter: '2024-01-01T00:00:00.000Z' });
    await config.providers!.cameraModels!('Sony', { takenBefore: '2024-12-31T00:00:00.000Z' });

    expect(getFilterSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({
        albumId: 'album-1',
        personIds: ['person-1'],
        tagIds: ['tag-1'],
        mediaType: AssetTypeEnum.Image,
      }),
    );
    expect(getSearchSuggestions).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ albumId: 'album-1', country: 'Germany' }),
    );
    expect(getSearchSuggestions).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ albumId: 'album-1', make: 'Sony' }),
    );
  });
});

describe('buildAlbumAssetPickerFilterConfig', () => {
  it('does not send albumId or withSharedSpaces', async () => {
    const config = buildAlbumAssetPickerFilterConfig();

    await config.suggestionsProvider!(createFilterState());
    await config.providers!.cities!('Germany');

    const filterRequest = vi.mocked(getFilterSuggestions).mock.calls[0][0];
    const cityRequest = vi.mocked(getSearchSuggestions).mock.calls[0][0];

    expect(filterRequest).not.toHaveProperty('albumId');
    expect(filterRequest).not.toHaveProperty('withSharedSpaces');
    expect(cityRequest).not.toHaveProperty('albumId');
    expect(cityRequest).not.toHaveProperty('withSharedSpaces');
  });
});
```

- [ ] **Step 3: Run the new helper tests to verify they fail**

Run:

```bash
pnpm --dir web test --run src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts
```

Expected: failures because the helper modules do not exist yet.

- [ ] **Step 4: Implement `album-filter-options.ts`**

Create `web/src/lib/utils/album-filter-options.ts` with these functions:

```typescript
import { buildFilterContext, type FilterState } from '$lib/components/filter-panel/filter-panel';
import { AssetTypeEnum, AssetVisibility, type AssetOrder } from '@immich/sdk';

function applyCommonFilterFields(base: Record<string, unknown>, filters: FilterState) {
  if (filters.personIds.length > 0) {
    base.personIds = filters.personIds;
  }
  if (filters.city) {
    base.city = filters.city;
  }
  if (filters.country) {
    base.country = filters.country;
  }
  if (filters.make) {
    base.make = filters.make;
  }
  if (filters.model) {
    base.model = filters.model;
  }
  if (filters.tagIds.length > 0) {
    base.tagIds = filters.tagIds;
  }
  if (filters.rating !== undefined) {
    base.rating = filters.rating;
  }
  if (filters.mediaType !== 'all') {
    base.$type = filters.mediaType === 'image' ? AssetTypeEnum.Image : AssetTypeEnum.Video;
  }

  const context = buildFilterContext(filters);
  if (context) {
    base.takenAfter = context.takenAfter;
    base.takenBefore = context.takenBefore;
  }

  return base;
}

export function buildAlbumTimelineOptions(
  albumId: string,
  order: AssetOrder,
  filters: FilterState,
): Record<string, unknown> {
  return applyCommonFilterFields({ albumId, order }, filters);
}

export function buildAlbumAssetPickerOptions(albumId: string, filters: FilterState): Record<string, unknown> {
  return applyCommonFilterFields(
    {
      visibility: AssetVisibility.Timeline,
      withPartners: true,
      timelineAlbumId: albumId,
    },
    filters,
  );
}
```

- [ ] **Step 5: Implement `album-filter-config.ts`**

Create `web/src/lib/utils/album-filter-config.ts`:

```typescript
import {
  buildFilterContext,
  type FilterPanelConfig,
  type FilterState,
} from '$lib/components/filter-panel/filter-panel';
import { createUrl } from '$lib/utils';
import { AssetTypeEnum, getFilterSuggestions, getSearchSuggestions, SearchSuggestionType } from '@immich/sdk';

const sections = ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media'] as const;

function mapSuggestions(response: Awaited<ReturnType<typeof getFilterSuggestions>>) {
  return {
    countries: response.countries,
    cameraMakes: response.cameraMakes,
    tags: response.tags.map((tag) => ({ id: tag.id, name: tag.value })),
    people: response.people.map((person) => ({
      id: person.id,
      name: person.name,
      thumbnailUrl: createUrl(`/people/${person.id}/thumbnail`),
    })),
    ratings: response.ratings,
    mediaTypes: response.mediaTypes,
    hasUnnamedPeople: response.hasUnnamedPeople,
  };
}

function toSuggestionRequest(filters: FilterState) {
  const context = buildFilterContext(filters);
  return {
    personIds: filters.personIds.length > 0 ? filters.personIds : undefined,
    country: filters.country,
    city: filters.city,
    make: filters.make,
    model: filters.model,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    rating: filters.rating,
    mediaType:
      filters.mediaType === 'all'
        ? undefined
        : filters.mediaType === 'image'
          ? AssetTypeEnum.Image
          : AssetTypeEnum.Video,
    takenAfter: context?.takenAfter,
    takenBefore: context?.takenBefore,
  };
}

export function buildAlbumDetailFilterConfig(albumId: string): FilterPanelConfig {
  return {
    sections: [...sections],
    suggestionsProvider: async (filters) =>
      mapSuggestions(await getFilterSuggestions({ albumId, ...toSuggestionRequest(filters) })),
    providers: {
      cities: (country, context) =>
        getSearchSuggestions({ $type: SearchSuggestionType.City, albumId, country, ...context }),
      cameraModels: (make, context) =>
        getSearchSuggestions({ $type: SearchSuggestionType.CameraModel, albumId, make, ...context }),
    },
  };
}

export function buildAlbumAssetPickerFilterConfig(): FilterPanelConfig {
  return {
    sections: [...sections],
    suggestionsProvider: async (filters) => mapSuggestions(await getFilterSuggestions(toSuggestionRequest(filters))),
    providers: {
      cities: (country, context) => getSearchSuggestions({ $type: SearchSuggestionType.City, country, ...context }),
      cameraModels: (make, context) =>
        getSearchSuggestions({ $type: SearchSuggestionType.CameraModel, make, ...context }),
    },
  };
}
```

- [ ] **Step 6: Run the helper tests again**

Run:

```bash
pnpm --dir web test --run src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts
```

Expected: `PASS`.

- [ ] **Step 7: Commit the helper slice**

```bash
git add web/src/lib/utils/album-filter-config.ts web/src/lib/utils/album-filter-options.ts web/src/lib/utils/__tests__/album-filter-config.spec.ts web/src/lib/utils/__tests__/album-filter-options.spec.ts
git commit -m "feat: add album filter helper builders"
```

## Task 6: Wire the album route with separate mode-specific filter state

**Files:**

- Create: `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/mock-timeline.test-wrapper.svelte`
- Create: `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.spec.ts`
- Modify: `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

- [ ] **Step 1: Create the route-test timeline stub**

Create `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/mock-timeline.test-wrapper.svelte`:

```svelte
<script lang="ts">
  interface Props {
    timelineManager?: any;
    options?: Record<string, unknown>;
    album?: { assetCount?: number };
  }

  let { timelineManager = $bindable(), options = {}, album }: Props = $props();

  $effect(() => {
    const tagIds = Array.isArray(options.tagIds) ? options.tagIds : [];
    const empty = tagIds.includes('tag-no-match') || album?.assetCount === 0;

    timelineManager = {
      months: empty ? [] : [{ yearMonth: { year: 2024, month: 4 }, assetsCount: 2 }],
      assetCount: empty ? 0 : 2,
      isInitialized: true,
      showAssetOwners: false,
      albumAssets: new Set(['asset-in-album']),
      suspendTransitions: false,
      removeAssets: () => {},
      upsertAssets: () => {},
      update: () => {},
      toggleShowAssetOwners: () => {},
      getRandomAsset: async () => undefined,
    };
  });
</script>

<div data-testid="timeline-options">{JSON.stringify(options)}</div>
<div data-testid="mock-disabled-asset" data-asset="asset-in-album" data-disabled="true"></div>
<slot />
```

- [ ] **Step 2: Write the failing route integration tests**

Create `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.spec.ts`:

```typescript
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { albumFactory } from '@test-data/factories/album-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AlbumPage from './+page.svelte';

vi.mock('$lib/components/timeline/Timeline.svelte', async () => {
  const { default: MockTimeline } = await import('./mock-timeline.test-wrapper.svelte');
  return { default: MockTimeline };
});

vi.mock('$lib/managers/command-context-manager.svelte', () => ({
  registerAlbumContext: () => {},
}));

function renderPage(album = albumFactory.build({ assetCount: 2 })) {
  authManager.setUser(userAdminFactory.build({ id: album.ownerId }));
  authManager.setPreferences(preferencesFactory.build());

  sdkMock.getFilterSuggestions.mockImplementation(async ({ albumId }) => {
    if (albumId) {
      const personName =
        albumId === 'album-2' ? 'Second Album Person' : albumId === 'album-1' ? 'First Album Person' : 'Album Person';
      const tagName =
        albumId === 'album-2' ? 'Second Album Tag' : albumId === 'album-1' ? 'First Album Tag' : 'Album Tag';
      return {
        countries: [],
        cameraMakes: [],
        tags: [
          { id: 'tag-view', value: tagName },
          { id: 'tag-no-match', value: 'No Match' },
        ],
        people: [{ id: 'person-view', name: personName }],
        ratings: [5],
        mediaTypes: ['IMAGE'],
        hasUnnamedPeople: false,
      };
    }

    return {
      countries: [],
      cameraMakes: [],
      tags: [{ id: 'tag-picker', value: 'Picker Tag' }],
      people: [{ id: 'person-picker', name: 'Picker Person' }],
      ratings: [5],
      mediaTypes: ['IMAGE'],
      hasUnnamedPeople: false,
    };
  });

  sdkMock.getSearchSuggestions.mockResolvedValue([]);

  return render(AlbumPage, {
    props: {
      data: {
        album,
      },
    },
  });
}

describe('album detail filter panel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the filter panel in view mode and select-assets mode', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByTestId('discovery-panel')).toBeInTheDocument());
    await fireEvent.click(screen.getByLabelText('add_photos'));
    await waitFor(() => expect(screen.getByTestId('discovery-panel')).toBeInTheDocument());
  });

  it('hides the filter panel when the active dataset is empty and no filters are active', async () => {
    renderPage(albumFactory.build({ assetCount: 0 }));

    await waitFor(() => expect(screen.queryByTestId('discovery-panel')).not.toBeInTheDocument());
  });

  it('keeps separate filter state for view and select-assets, and reuses view filters for select-thumbnail', async () => {
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByTestId('people-item-person-view')).toBeInTheDocument());
    await user.click(screen.getByTestId('people-item-person-view'));
    expect(screen.getByText(/Album Person/)).toBeInTheDocument();

    await fireEvent.click(screen.getByLabelText('add_photos'));
    await waitFor(() => expect(screen.getByTestId('people-item-person-picker')).toBeInTheDocument());
    expect(screen.queryByText(/Album Person/)).not.toBeInTheDocument();

    await user.click(screen.getByTestId('people-item-person-picker'));
    expect(screen.getByText(/Picker Person/)).toBeInTheDocument();

    await fireEvent.click(screen.getByLabelText('go_back'));
    expect(screen.getByText(/Album Person/)).toBeInTheDocument();

    await fireEvent.click(screen.getByLabelText('add_photos'));
    expect(screen.getByText(/Picker Person/)).toBeInTheDocument();

    await fireEvent.click(screen.getByLabelText('go_back'));
    await user.click(screen.getByLabelText('album_options'));
    await user.click(screen.getByText('select_album_cover'));
    expect(screen.getByTestId('discovery-panel')).toBeInTheDocument();
    expect(screen.getByText(/Album Person/)).toBeInTheDocument();
  });

  it('keeps timelineAlbumId in picker options after filters change and shows filtered empty state', async () => {
    renderPage();
    const user = userEvent.setup();

    await fireEvent.click(screen.getByLabelText('add_photos'));
    await waitFor(() => expect(screen.getByTestId('tags-item-tag-no-match')).toBeInTheDocument());
    await user.click(screen.getByTestId('tags-item-tag-no-match'));

    expect(screen.getByTestId('timeline-options').textContent).toContain('"timelineAlbumId"');
    expect(screen.getByText('No photos available to add match your filters')).toBeInTheDocument();
    await user.click(screen.getByText('Clear all filters'));
    await waitFor(() =>
      expect(screen.queryByText('No photos available to add match your filters')).not.toBeInTheDocument(),
    );
  });

  it('keeps already-in-album assets disabled after picker filters change', async () => {
    renderPage();
    const user = userEvent.setup();

    await fireEvent.click(screen.getByLabelText('add_photos'));
    await waitFor(() => expect(screen.getByTestId('tags-item-tag-picker')).toBeInTheDocument());
    await user.click(screen.getByTestId('tags-item-tag-picker'));

    expect(screen.getByTestId('timeline-options').textContent).toContain('"timelineAlbumId"');
    expect(screen.getByTestId('mock-disabled-asset')).toHaveAttribute('data-disabled', 'true');
  });

  it('resets both filter states and label caches when navigating to another album', async () => {
    const firstAlbum = albumFactory.build({ id: 'album-1', assetCount: 2 });
    const secondAlbum = albumFactory.build({ id: 'album-2', assetCount: 2 });
    const view = renderPage(firstAlbum);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByTestId('people-item-person-view')).toBeInTheDocument());
    await user.click(screen.getByTestId('people-item-person-view'));
    expect(screen.getByText(/First Album Person/)).toBeInTheDocument();

    await view.rerender({
      data: {
        album: secondAlbum,
      },
    });

    await waitFor(() => expect(screen.queryByText(/First Album Person/)).not.toBeInTheDocument());
    expect(screen.queryByTestId('active-chip')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('people-item-person-view')).toBeInTheDocument());
    await user.click(screen.getByTestId('people-item-person-view'));
    expect(screen.getByText(/Second Album Person/)).toBeInTheDocument();
    expect(screen.queryByText(/First Album Person/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the route tests to verify they fail**

Run:

```bash
pnpm --dir web test --run "src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.spec.ts"
```

Expected: failures because the route does not yet render a filter panel, has only one implicit option set, and has no album/picker filter state separation.

- [ ] **Step 4: Implement the route wiring**

Make these focused additions in `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte`:

1. Add the new imports:

```typescript
import ActiveFiltersBar from '$lib/components/filter-panel/active-filters-bar.svelte';
import FilterPanel from '$lib/components/filter-panel/filter-panel.svelte';
import { clearFilters, createFilterState, getActiveFilterCount } from '$lib/components/filter-panel/filter-panel';
import { buildAlbumAssetPickerFilterConfig, buildAlbumDetailFilterConfig } from '$lib/utils/album-filter-config';
import { buildAlbumAssetPickerOptions, buildAlbumTimelineOptions } from '$lib/utils/album-filter-options';
import { handlePhotosRemoveFilter } from '$lib/utils/photos-filter-options';
import { SvelteMap } from 'svelte/reactivity';
```

2. Replace the single derived album reference and single `options` derived with explicit local state:

```typescript
let album = $state(data.album);
let albumFilters = $state(createFilterState());
let pickerFilters = $state(createFilterState());
let albumPersonNames = new SvelteMap<string, string>();
let albumTagNames = new SvelteMap<string, string>();
let pickerPersonNames = new SvelteMap<string, string>();
let pickerTagNames = new SvelteMap<string, string>();

const albumFilterConfig = $derived.by(() => {
  const base = buildAlbumDetailFilterConfig(album.id);
  const provider = base.suggestionsProvider!;
  return {
    ...base,
    suggestionsProvider: async (filters) => {
      const result = await provider(filters);
      for (const person of result.people) {
        albumPersonNames.set(person.id, person.name);
      }
      for (const tag of result.tags) {
        albumTagNames.set(tag.id, tag.name);
      }
      return result;
    },
  };
});

const pickerFilterConfig = $derived.by(() => {
  const base = buildAlbumAssetPickerFilterConfig();
  const provider = base.suggestionsProvider!;
  return {
    ...base,
    suggestionsProvider: async (filters) => {
      const result = await provider(filters);
      for (const person of result.people) {
        pickerPersonNames.set(person.id, person.name);
      }
      for (const tag of result.tags) {
        pickerTagNames.set(tag.id, tag.name);
      }
      return result;
    },
  };
});

const totalAssetCount = $derived(timelineManager?.assetCount ?? 0);
const activeFilterCount = $derived(
  getActiveFilterCount(viewMode === AlbumPageViewMode.SELECT_ASSETS ? pickerFilters : albumFilters),
);
const isTimelineEmpty = $derived(timelineManager?.isInitialized && totalAssetCount === 0 && activeFilterCount === 0);
const showFilteredEmptyState = $derived(
  timelineManager?.isInitialized && totalAssetCount === 0 && activeFilterCount > 0,
);
const timeBuckets = $derived(
  timelineManager?.months?.map((month) => ({
    timeBucket: `${month.yearMonth.year}-${String(month.yearMonth.month).padStart(2, '0')}-01T00:00:00.000Z`,
    count: month.assetsCount,
  })) ?? [],
);

const options = $derived.by(() => {
  if (viewMode === AlbumPageViewMode.SELECT_ASSETS) {
    return buildAlbumAssetPickerOptions(album.id, pickerFilters);
  }
  return buildAlbumTimelineOptions(album.id, album.order, albumFilters);
});
```

3. Add the album-navigation reset effect:

```typescript
$effect(() => {
  if (data.album.id !== album.id) {
    album = data.album;
    albumFilters = createFilterState();
    pickerFilters = createFilterState();
    albumPersonNames.clear();
    albumTagNames.clear();
    pickerPersonNames.clear();
    pickerTagNames.clear();
    timelineMultiSelectManager.clear();
    assetMultiSelectManager.clear();
    viewMode = AlbumPageViewMode.VIEW;
    oldAt = null;
  }
});
```

4. Render the panel and chips outside the `Timeline` children with explicit mode branches:

```svelte
<div class="flex h-full" data-testid="discovery-timeline">
  {#if viewMode === AlbumPageViewMode.SELECT_ASSETS}
    <FilterPanel
      config={pickerFilterConfig}
      bind:filters={pickerFilters}
      {timeBuckets}
      storageKey="gallery-filter-visible-sections-album-detail"
      hidden={isTimelineEmpty}
    />
  {:else}
    <FilterPanel
      config={albumFilterConfig}
      bind:filters={albumFilters}
      {timeBuckets}
      storageKey="gallery-filter-visible-sections-album-detail"
      hidden={isTimelineEmpty}
    />
  {/if}

  <div class="flex flex-1 flex-col overflow-hidden pl-4">
    {#if viewMode === AlbumPageViewMode.SELECT_ASSETS && getActiveFilterCount(pickerFilters) > 0}
      <ActiveFiltersBar
        filters={pickerFilters}
        resultCount={totalAssetCount}
        personNames={pickerPersonNames}
        tagNames={pickerTagNames}
        onRemoveFilter={(type, id) => {
          pickerFilters = handlePhotosRemoveFilter(pickerFilters, type, id);
        }}
        onClearAll={() => {
          pickerFilters = clearFilters(pickerFilters);
        }}
      />
    {:else if viewMode !== AlbumPageViewMode.SELECT_ASSETS && getActiveFilterCount(albumFilters) > 0}
      <ActiveFiltersBar
        filters={albumFilters}
        resultCount={totalAssetCount}
        personNames={albumPersonNames}
        tagNames={albumTagNames}
        onRemoveFilter={(type, id) => {
          albumFilters = handlePhotosRemoveFilter(albumFilters, type, id);
        }}
        onClearAll={() => {
          albumFilters = clearFilters(albumFilters);
        }}
      />
    {/if}

    {#if showFilteredEmptyState}
      <div class="flex flex-1 flex-col items-center justify-center gap-2" data-testid="empty-state-message">
        <p class="text-sm text-[var(--fg-muted)]">
          {viewMode === AlbumPageViewMode.SELECT_ASSETS
            ? 'No photos available to add match your filters'
            : 'No photos match your filters'}
        </p>
        <button
          type="button"
          class="text-sm text-[var(--primary)]"
          onclick={() => {
            if (viewMode === AlbumPageViewMode.SELECT_ASSETS) {
              pickerFilters = clearFilters(pickerFilters);
            } else {
              albumFilters = clearFilters(albumFilters);
            }
          }}
        >
          Clear all filters
        </button>
      </div>
    {:else}
      <Timeline
        enableRouting={viewMode === AlbumPageViewMode.SELECT_ASSETS ? false : true}
        {album}
        {albumUsers}
        bind:timelineManager
        {options}
        assetInteraction={currentAssetIntersection}
        {isShared}
        {isSelectionMode}
        {singleSelect}
        {showArchiveIcon}
        {onSelect}
        onEscape={handleEscape}
        withStacked={true}
      >
        <!-- keep the existing album title / empty album / rest of the current slot content here -->
      </Timeline>
    {/if}
  </div>
</div>
```

The route should continue using `handlePhotosRemoveFilter` so chip-removal semantics stay identical to `/photos`.

- [ ] **Step 5: Run the route tests again**

Run:

```bash
pnpm --dir web test --run "src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.spec.ts"
```

Expected: `PASS`.

- [ ] **Step 6: Run the helper tests again against the route changes**

Run:

```bash
pnpm --dir web test --run src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts "src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.spec.ts"
```

Expected: all three web specs stay green together.

- [ ] **Step 7: Commit the route slice**

```bash
git add "web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte" "web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.spec.ts" "web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/mock-timeline.test-wrapper.svelte"
git commit -m "feat: add filter panel to album detail modes"
```

## Task 7: Add album E2E coverage and run the focused verification suite

**Files:**

- Modify: `e2e/src/specs/web/album.e2e-spec.ts`

- [ ] **Step 1: Add a reusable album fixture helper**

Add this helper near the top of `e2e/src/specs/web/album.e2e-spec.ts`:

```typescript
import { updateAsset } from '@immich/sdk';
import { asBearerAuth } from 'src/utils';

async function createFilterableAlbum() {
  const albumAsset = await utils.createAsset(admin.accessToken, {
    fileCreatedAt: '2024-04-10T10:00:00.000Z',
    fileModifiedAt: '2024-04-10T10:00:00.000Z',
  });
  const secondAlbumAsset = await utils.createAsset(admin.accessToken, {
    fileCreatedAt: '2024-03-10T10:00:00.000Z',
    fileModifiedAt: '2024-03-10T10:00:00.000Z',
  });
  const pickerAsset = await utils.createAsset(admin.accessToken, {
    fileCreatedAt: '2024-02-10T10:00:00.000Z',
    fileModifiedAt: '2024-02-10T10:00:00.000Z',
  });

  const tags = await utils.upsertTags(admin.accessToken, ['Album Tag', 'Picker Tag']);
  await utils.tagAssets(admin.accessToken, tags[0].id, [albumAsset.id]);
  await utils.tagAssets(admin.accessToken, tags[1].id, [pickerAsset.id, albumAsset.id]);
  await updateAsset({ id: albumAsset.id, updateAssetDto: { rating: 5 } }, { headers: asBearerAuth(admin.accessToken) });

  const album = await utils.createAlbum(admin.accessToken, {
    albumName: 'Filterable Album',
    assetIds: [albumAsset.id, secondAlbumAsset.id],
  });

  return { album, tags, albumAsset, secondAlbumAsset, pickerAsset };
}
```

- [ ] **Step 2: Add the E2E tests**

Append these tests to `e2e/src/specs/web/album.e2e-spec.ts`:

```typescript
test('filters album detail assets and clears back to the full album', async ({ context, page }) => {
  const { album, tags } = await createFilterableAlbum();
  await utils.setAuthCookies(context, admin.accessToken);
  await page.goto(`/albums/${album.id}`);
  await page.waitForSelector('[data-testid="discovery-panel"]');

  const bucketResponse = page.waitForResponse((r) => r.url().includes('/timeline/buckets'));
  await page.locator(`[data-testid="tags-item-${tags[0].id}"]`).click();
  await bucketResponse;

  await expect(page.locator('[data-testid="active-filters-bar"]')).toBeVisible();
  await expect(page.locator('[data-testid="active-chip"]')).toContainText('Album Tag');

  const clearResponse = page.waitForResponse((r) => r.url().includes('/timeline/buckets'));
  await page.locator('[data-testid="clear-all-btn"]').dispatchEvent('click');
  await clearResponse;

  await expect(page.locator('[data-testid="active-filters-bar"]')).not.toBeVisible();
});

test('reuses album filters for select cover but keeps a separate picker state for add assets', async ({
  context,
  page,
}) => {
  const { album, tags } = await createFilterableAlbum();
  await utils.setAuthCookies(context, admin.accessToken);
  await page.goto(`/albums/${album.id}`);
  await page.waitForSelector('[data-testid="discovery-panel"]');

  await page.locator(`[data-testid="tags-item-${tags[0].id}"]`).click();
  await expect(page.locator('[data-testid="active-chip"]')).toContainText('Album Tag');

  await page.getByLabel('Album options').click();
  await page.getByText('Select album cover').click();
  await expect(page.locator('[data-testid="active-chip"]')).toContainText('Album Tag');

  await page.getByLabel('Go back').click();
  await page.getByLabel('Add photos').click();
  await expect(page.locator('[data-testid="active-chip"]')).toHaveCount(0);

  await page.locator(`[data-testid="tags-item-${tags[1].id}"]`).click();
  await expect(page.locator('[data-testid="active-chip"]')).toContainText('Picker Tag');

  await page.getByLabel('Go back').click();
  await expect(page.locator('[data-testid="active-chip"]')).toContainText('Album Tag');

  await page.getByLabel('Add photos').click();
  await expect(page.locator('[data-testid="active-chip"]')).toContainText('Picker Tag');
});

test('keeps already-in-album assets disabled after picker filtering', async ({ context, page }) => {
  const { album, tags, albumAsset } = await createFilterableAlbum();
  await utils.setAuthCookies(context, admin.accessToken);
  await page.goto(`/albums/${album.id}`);
  await page.getByLabel('Add photos').click();
  await page.waitForSelector('[data-testid="discovery-panel"]');

  const bucketResponse = page.waitForResponse((r) => r.url().includes('/timeline/buckets'));
  await page.locator(`[data-testid="tags-item-${tags[1].id}"]`).click();
  await bucketResponse;

  await expect(page.locator(`[data-asset="${albumAsset.id}"][data-disabled="true"]`)).toBeVisible();
});
```

- [ ] **Step 3: Run the album E2E spec to verify it fails**

Run:

```bash
pnpm --dir e2e test:web -- e2e/src/specs/web/album.e2e-spec.ts
```

Expected: failures because the album page does not yet expose the filter panel or separate mode-specific filter behavior.

- [ ] **Step 4: Run the focused verification suite after the route work is green**

Run these commands in order:

```bash
pnpm --dir server test --run src/controllers/search.controller.spec.ts src/services/search.service.spec.ts src/repositories/search.repository.spec.ts
pnpm --dir web test --run src/lib/utils/__tests__/album-filter-options.spec.ts src/lib/utils/__tests__/album-filter-config.spec.ts "src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.spec.ts"
pnpm --dir e2e test:web -- e2e/src/specs/web/album.e2e-spec.ts
```

Expected:

- server: all targeted album-scope tests `PASS`
- web: helper and route integration tests `PASS`
- e2e: album filter panel spec `PASS`

- [ ] **Step 5: Commit the E2E + verification slice**

```bash
git add e2e/src/specs/web/album.e2e-spec.ts
git commit -m "test: cover album detail filter panel flows"
```
