# Smart Search Adaptive Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add smart-search scoped filter facets for `/photos?q=...` and `/spaces/:spaceId/photos?q=...` so the sidebar shows exact timeline counts and narrowed facet values for the full server-side result set.

**Architecture:** Add a companion `POST /search/smart/facets` endpoint beside `POST /search/smart`; it reuses smart-search validation, access checks, embedding resolution, and ML config behavior, then aggregates facets from one exact candidate set. The frontend keeps `SmartSearchResults` focused on paginated results while route-level filter-panel providers fetch and cache smart facets, ignore sort-only changes, and pass exact totals into result count UI.

**Tech Stack:** NestJS, nestjs-zod, Kysely, Postgres vector search, Vitest, Svelte 5, Testing Library, OpenAPI generator, oazapfts TypeScript SDK, Dart OpenAPI output.

---

## File Structure

**Backend API contract**

- Modify `server/src/dtos/time-bucket.dto.ts`
  - Export `TimeBucketsResponseSchema` so the smart facets response can reuse the exact `getTimeBuckets` response shape.
- Modify `server/src/dtos/search.dto.ts`
  - Add `SmartSearchFacetsDto`.
  - Add `SmartSearchFacetsResponseDto`.
  - Keep this DTO smart-search-specific. Do not add `page`, `size`, `order`, `visibility`, or legacy `/search` fields.
- Modify `server/src/controllers/search.controller.ts`
  - Add `POST /search/smart/facets` beside `POST /search/smart`.
- Modify `server/src/controllers/search.controller.spec.ts`
  - Add route authentication, validation, and service-forwarding tests.

**Backend service**

- Modify `server/src/services/search.service.ts`
  - Extract a private smart-search resolver used by both `searchSmart` and `searchSmartFacets`.
  - Add `searchSmartFacets(auth, dto)`.
  - Keep existing `searchSmart` behavior and logging intact.
- Modify `server/src/services/search.service.spec.ts`
  - Add TDD tests for ML disabled, query embedding, query embedding cache, language, `queryAssetId`, missing query, access checks, `withSharedSpaces`, `spaceId`, `spacePersonIds`, and no sort option in facet repository calls.

**Backend repository**

- Modify `server/src/repositories/search.repository.ts`
  - Add `SmartSearchFacetsOptions` and `SmartSearchFacetsResult`.
  - Add private candidate-set and filtered-id helpers for smart facets.
  - Add `getSmartSearchFacets(options)`.
  - Use one materialized temporary candidate set per facets request inside the transaction, then aggregate every output from that set.
- Modify `server/src/repositories/search.repository.spec.ts`
  - Add offline SQL-shape tests for the candidate query and self-exclusion filters.
- Create `server/test/medium/specs/repositories/search.repository.spec.ts`
  - Add database-backed tests for exact totals, full-candidate aggregation, time bucket self-exclusion, no-match responses, and space-person facets.

**Generated API**

- Modify generated files from `make open-api`
  - `open-api/immich-openapi-specs.json`
  - `open-api/typescript-sdk/src/fetch-client.ts`
  - `mobile/openapi/lib/api/search_api.dart`
  - New mobile model files for `SmartSearchFacetsDto`, `SmartSearchFacetsResponseDto`, and response item schemas produced by the generator.

**Frontend utilities**

- Modify `web/src/lib/utils/space-search.ts`
  - Add `buildSmartSearchFacetsParams`.
  - Add `buildSmartSearchFacetKey`.
  - Add `mapSmartSearchFacetsToFilterSuggestions`.
- Modify `web/src/lib/utils/__tests__/space-search.spec.ts`
  - Add payload, key stability, sort exclusion, and mapping tests.

**Frontend result count**

- Modify `web/src/lib/components/spaces/space-search-results.svelte`
  - Add optional `total?: number`.
  - Display exact `total` when provided; otherwise keep current loaded-count fallback.
- Modify `web/src/lib/components/spaces/space-search-results.spec.ts`
  - Add exact total and fallback tests.
- Modify `web/src/lib/components/search/smart-search-results.svelte`
  - Add optional `total?: number`.
  - Pass it through to `SpaceSearchResults`.
- Modify `web/src/lib/components/search/smart-search-results.spec.ts`
  - Add total pass-through and fallback tests.
- Modify `web/src/test-data/mocks/smart-search-results.stub.svelte`
  - Expose `data-total` for route tests.

**Frontend routes**

- Modify `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`
  - In search mode, use smart facets for filter suggestions and timeline buckets.
  - In no-search mode, keep existing `getFilterSuggestions({ withSharedSpaces: true })` and timeline manager buckets.
  - Preserve previous facet values on facet fetch failure.
  - Key the filter panel by committed search mode and query so provider data refreshes when `q` changes or clears.
  - Pass an AbortController signal to the SDK request and discard stale keyed responses.
  - Pass exact facet total to `ActiveFiltersBar` and `SmartSearchResults` when available.
- Modify `web/src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts`
  - Add search-mode facet request, timeline bucket, total, sort-only, failure, and clear-query tests.
- Modify `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
  - Same route-owned facet provider model using `spaceId`.
  - Ensure selected people are sent as `spacePersonIds`.
  - Key the filter panel by space ID plus committed search mode and query so provider data refreshes when `q` changes or clears.
  - Pass an AbortController signal to the SDK request and discard stale keyed responses.
- Modify `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts`
  - Add space-scoped facet request, `spacePersonIds`, shared-person thumbnail path, total, and sort-only tests.
- Modify `web/src/test-data/mocks/bindable-filter-panel.stub.svelte`
  - Expose `data-time-buckets`.
  - Invoke `config.suggestionsProvider(filters)` on mount so route tests observe the same provider path as the real panel.

---

## Implementation Tasks

### Task 1: Backend DTO And Controller Contract

**Files:**

- Modify `server/src/dtos/time-bucket.dto.ts`
- Modify `server/src/dtos/search.dto.ts`
- Modify `server/src/controllers/search.controller.ts`
- Test `server/src/controllers/search.controller.spec.ts`

- [ ] **Step 1: Write failing controller tests**

Add these tests beside `describe('POST /search/smart')` in `server/src/controllers/search.controller.spec.ts`:

```ts
describe('POST /search/smart/facets', () => {
  const queryAssetId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    service.searchSmartFacets.mockResolvedValue({
      total: 2,
      timeBuckets: [{ timeBucket: '2024-01-01', count: 2 }],
      countries: ['Germany'],
      cities: ['Berlin'],
      cameraMakes: ['Sony'],
      cameraModels: ['A7'],
      tags: [{ id: '22222222-2222-4222-8222-222222222222', value: 'Travel' }],
      people: [{ id: '33333333-3333-4333-8333-333333333333', name: 'Ada' }],
      ratings: [4, 5],
      mediaTypes: ['IMAGE'],
      hasUnnamedPeople: false,
    });
  });

  it('should be an authenticated route', async () => {
    await request(ctx.getHttpServer()).post('/search/smart/facets');
    expect(ctx.authenticate).toHaveBeenCalled();
  });

  it('forwards the smart facets body to the service', async () => {
    ctx.authenticate.mockResolvedValue({});

    const { status, body } = await request(ctx.getHttpServer())
      .post('/search/smart/facets')
      .send({
        query: 'mountains',
        language: 'de',
        withSharedSpaces: true,
        personIds: ['44444444-4444-4444-8444-444444444444'],
        country: 'Germany',
        rating: 4,
        takenAfter: '2024-01-01T00:00:00.000Z',
        takenBefore: '2025-01-01T00:00:00.000Z',
        type: 'IMAGE',
        isFavorite: true,
      });

    expect(status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.timeBuckets).toEqual([{ timeBucket: '2024-01-01', count: 2 }]);
    expect(service.searchSmartFacets).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        query: 'mountains',
        language: 'de',
        withSharedSpaces: true,
        country: 'Germany',
        rating: 4,
        type: 'IMAGE',
        isFavorite: true,
      }),
    );
  });

  it('accepts queryAssetId requests', async () => {
    ctx.authenticate.mockResolvedValue({});

    const { status } = await request(ctx.getHttpServer()).post('/search/smart/facets').send({ queryAssetId });

    expect(status).toBe(200);
    expect(service.searchSmartFacets).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ queryAssetId }),
    );
  });

  it('accepts rating null for unrated smart facet requests', async () => {
    ctx.authenticate.mockResolvedValue({});

    const { status } = await request(ctx.getHttpServer()).post('/search/smart/facets').send({
      query: 'unrated',
      rating: null,
    });

    expect(status).toBe(200);
    expect(service.searchSmartFacets).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ rating: null }),
    );
  });

  it('rejects invalid queryAssetId values', async () => {
    const { status, body } = await request(ctx.getHttpServer())
      .post('/search/smart/facets')
      .send({ queryAssetId: 'not-a-uuid' });

    expect(status).toBe(400);
    expect(body).toEqual(errorDto.badRequest([expect.stringContaining('[queryAssetId]')]));
  });
});
```

- [ ] **Step 2: Run the controller tests and confirm red**

Run:

```bash
cd server && pnpm test -- --run src/controllers/search.controller.spec.ts
```

Expected: FAIL because `SearchController` has no `POST /search/smart/facets` route and the service mock has no `searchSmartFacets` method.

- [ ] **Step 3: Add DTOs and the controller route**

In `server/src/dtos/time-bucket.dto.ts`, export the existing schema:

```ts
export const TimeBucketsResponseSchema = z
  .object({
    timeBucket: z
      .string()
      .describe('Time bucket identifier in YYYY-MM-DD format representing the start of the time period')
      .meta({ example: '2024-01-01' }),
    count: z.int().describe('Number of assets in this time bucket').meta({ example: 42 }),
  })
  .meta({ id: 'TimeBucketsResponseDto' });
```

In `server/src/dtos/search.dto.ts`, import the exported schema:

```ts
import { TimeBucketsResponseSchema } from 'src/dtos/time-bucket.dto';
```

Add the request and response schemas after `SmartSearchSchema`:

```ts
const SmartSearchFacetsSchema = BaseSearchSchema.pick({
  type: true,
  isFavorite: true,
  takenBefore: true,
  takenAfter: true,
  city: true,
  country: true,
  make: true,
  model: true,
  personIds: true,
  tagIds: true,
  rating: true,
  spaceId: true,
  spacePersonIds: true,
})
  .extend({
    query: z.string().trim().optional().describe('Natural language search query'),
    queryAssetId: z.uuidv4().optional().describe('Asset ID to use as search reference'),
    language: z.string().optional().describe('Search language code'),
    withSharedSpaces: z.boolean().optional().describe('Include shared spaces the user is a member of'),
  })
  .meta({ id: 'SmartSearchFacetsDto' });

const SmartSearchFacetsResponseSchema = z
  .object({
    total: z.int().nonnegative().describe('Exact count after applying all active smart-search filters'),
    timeBuckets: z
      .array(TimeBucketsResponseSchema)
      .describe('Available monthly buckets for the smart-search result set'),
    countries: z.array(z.string()).describe('Available countries'),
    cities: z.array(z.string()).describe('Available cities for the current smart-search country scope'),
    cameraMakes: z.array(z.string()).describe('Available camera makes'),
    cameraModels: z.array(z.string()).describe('Available camera models for the current smart-search make scope'),
    tags: z.array(FilterSuggestionsTagSchema).describe('Available tags'),
    people: z.array(FilterSuggestionsPersonSchema).describe('Available people'),
    ratings: z.array(z.number()).describe('Available ratings'),
    mediaTypes: z.array(AssetTypeSchema).describe('Available media types'),
    hasUnnamedPeople: z.boolean().describe('Whether unnamed people exist in the filtered smart-search set'),
  })
  .meta({ id: 'SmartSearchFacetsResponseDto' });
```

Export DTO classes:

```ts
export class SmartSearchFacetsDto extends createZodDto(SmartSearchFacetsSchema) {}
export class SmartSearchFacetsResponseDto extends createZodDto(SmartSearchFacetsResponseSchema) {}
```

In `server/src/controllers/search.controller.ts`, import the new DTOs:

```ts
SmartSearchFacetsDto,
SmartSearchFacetsResponseDto,
```

Add the route immediately after `searchSmart`:

```ts
@Post('smart/facets')
@Authenticated({ permission: Permission.AssetRead })
@HttpCode(HttpStatus.OK)
@Endpoint({
  summary: 'Smart asset search facets',
  description: 'Retrieve filter facets and timeline buckets for the full smart-search result set.',
  history: new HistoryBuilder().added('v1'),
})
searchSmartFacets(@Auth() auth: AuthDto, @Body() dto: SmartSearchFacetsDto): Promise<SmartSearchFacetsResponseDto> {
  return this.service.searchSmartFacets(auth, dto);
}
```

- [ ] **Step 4: Run the controller tests and confirm green**

Run:

```bash
cd server && pnpm test -- --run src/controllers/search.controller.spec.ts
```

Expected: PASS for `search.controller.spec.ts`.

- [ ] **Step 5: Commit the API contract slice**

Run:

```bash
git add server/src/dtos/time-bucket.dto.ts server/src/dtos/search.dto.ts server/src/controllers/search.controller.ts server/src/controllers/search.controller.spec.ts
git commit -m "feat: add smart search facets route contract"
```

---

### Task 2: Service Facets Method And Shared Smart-Search Resolution

**Files:**

- Modify `server/src/services/search.service.ts`
- Test `server/src/services/search.service.spec.ts`

- [ ] **Step 1: Write failing service tests**

Add this `describe` block after the existing `describe('searchSmart')` block in `server/src/services/search.service.spec.ts`:

```ts
describe('searchSmartFacets', () => {
  const facetsResult = {
    total: 3,
    timeBuckets: [{ timeBucket: '2024-01-01', count: 3 }],
    countries: ['Germany'],
    cities: ['Berlin'],
    cameraMakes: ['Sony'],
    cameraModels: ['A7'],
    tags: [{ id: newUuid(), value: 'Travel' }],
    people: [
      { id: newUuid(), name: 'Zoe' },
      { id: newUuid(), name: 'Ada' },
    ],
    ratings: [4, 5],
    mediaTypes: ['IMAGE'],
    hasUnnamedPeople: false,
  };

  beforeEach(() => {
    mocks.search.getSmartSearchFacets.mockResolvedValue(facetsResult);
    mocks.machineLearning.encodeText.mockResolvedValue('[1, 2, 3]');
    clearConfigCache();
  });

  it('raises BadRequestException when smart search is disabled', async () => {
    mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { clip: { enabled: false } } });

    await expect(sut.searchSmartFacets(authStub.user1, { query: 'test' })).rejects.toThrow(
      'Smart search is not enabled',
    );
  });

  it('encodes text queries using the configured CLIP model and language', async () => {
    mocks.systemMetadata.get.mockResolvedValue({
      machineLearning: { clip: { modelName: 'ViT-B-16-SigLIP__webli', maxDistance: 0.75 } },
    });

    await sut.searchSmartFacets(authStub.user1, { query: 'test', language: 'de' });

    expect(mocks.machineLearning.encodeText).toHaveBeenCalledWith('test', {
      modelName: 'ViT-B-16-SigLIP__webli',
      language: 'de',
    });
    expect(mocks.search.getSmartSearchFacets).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'test',
        embedding: '[1, 2, 3]',
        userIds: [authStub.user1.user.id],
        maxDistance: 0.75,
      }),
    );
  });

  it('reuses the text embedding cache across result and facet calls', async () => {
    mocks.search.searchSmart.mockResolvedValue({ hasNextPage: false, items: [] });

    await sut.searchSmart(authStub.user1, { query: 'test' });
    await sut.searchSmartFacets(authStub.user1, { query: 'test' });

    expect(mocks.machineLearning.encodeText).toHaveBeenCalledTimes(1);
  });

  it('searches by queryAssetId after checking asset access', async () => {
    const assetId = newUuid();
    mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
    mocks.search.getEmbedding.mockResolvedValue('[4, 5, 6]');

    await sut.searchSmartFacets(authStub.user1, { queryAssetId: assetId });

    expect(mocks.machineLearning.encodeText).not.toHaveBeenCalled();
    expect(mocks.search.getEmbedding).toHaveBeenCalledWith(assetId);
    expect(mocks.search.getSmartSearchFacets).toHaveBeenCalledWith(
      expect.objectContaining({ queryAssetId: assetId, embedding: '[4, 5, 6]' }),
    );
  });

  it('throws when queryAssetId has no embedding', async () => {
    const assetId = newUuid();
    mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([assetId]));
    mocks.search.getEmbedding.mockResolvedValue(null);

    await expect(sut.searchSmartFacets(authStub.user1, { queryAssetId: assetId })).rejects.toThrow(
      `Asset ${assetId} has no embedding`,
    );
  });

  it('throws when neither query nor queryAssetId is set', async () => {
    await expect(sut.searchSmartFacets(authStub.user1, {})).rejects.toThrow(
      'Either `query` or `queryAssetId` must be set',
    );
  });

  it('rejects spaceId mixed with withSharedSpaces', async () => {
    await expect(
      sut.searchSmartFacets(authStub.user1, { query: 'test', spaceId: newUuid(), withSharedSpaces: true }),
    ).rejects.toThrow('Cannot use both spaceId and withSharedSpaces');
  });

  it('checks shared space access and passes space filters through', async () => {
    const spaceId = newUuid();
    const spacePersonIds = [newUuid()];
    mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));

    await sut.searchSmartFacets(authStub.user1, { query: 'test', spaceId, spacePersonIds });

    expect(mocks.access.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(authStub.user1.user.id, new Set([spaceId]));
    expect(mocks.search.getSmartSearchFacets).toHaveBeenCalledWith(
      expect.objectContaining({ spaceId, spacePersonIds }),
    );
  });

  it('rejects spacePersonIds without spaceId', async () => {
    await expect(sut.searchSmartFacets(authStub.user1, { query: 'test', spacePersonIds: [newUuid()] })).rejects.toThrow(
      'spacePersonIds requires spaceId',
    );
  });

  it('passes timeline shared spaces when withSharedSpaces is true', async () => {
    const spaceId1 = newUuid();
    const spaceId2 = newUuid();
    mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId: spaceId1 }, { spaceId: spaceId2 }]);

    await sut.searchSmartFacets(authStub.user1, { query: 'test', withSharedSpaces: true });

    expect(mocks.sharedSpace.getSpaceIdsForTimeline).toHaveBeenCalledWith(authStub.user1.user.id);
    expect(mocks.search.getSmartSearchFacets).toHaveBeenCalledWith(
      expect.objectContaining({ timelineSpaceIds: [spaceId1, spaceId2] }),
    );
  });

  it('does not pass orderDirection to the facets repository call', async () => {
    await sut.searchSmartFacets(authStub.user1, { query: 'test' });

    expect(mocks.search.getSmartSearchFacets).toHaveBeenCalledWith(
      expect.not.objectContaining({ orderDirection: expect.anything() }),
    );
  });

  it('passes rating null through for unrated smart facet filters', async () => {
    await sut.searchSmartFacets(authStub.user1, { query: 'test', rating: null });

    expect(mocks.search.getSmartSearchFacets).toHaveBeenCalledWith(expect.objectContaining({ rating: null }));
  });

  it('sorts people by name before returning the response', async () => {
    const result = await sut.searchSmartFacets(authStub.user1, { query: 'test' });

    expect(result.people.map((person) => person.name)).toEqual(['Ada', 'Zoe']);
  });
});
```

- [ ] **Step 2: Run the service tests and confirm red**

Run:

```bash
cd server && pnpm test -- --run src/services/search.service.spec.ts
```

Expected: FAIL because `searchSmartFacets` and `mocks.search.getSmartSearchFacets` do not exist yet.

- [ ] **Step 3: Add the shared resolver and facets method**

In `server/src/services/search.service.ts`, update imports:

```ts
import { SmartSearchDto, SmartSearchFacetsDto, SmartSearchFacetsResponseDto } from 'src/dtos/search.dto';
```

Add a private result type near the service class:

```ts
type ResolvedSmartSearch = {
  options: Omit<SmartSearchDto, 'page' | 'size' | 'order'> & {
    embedding: string;
    userIds: string[];
    timelineSpaceIds?: string[];
    maxDistance?: number;
    orderDirection?: SmartSearchDto['order'];
  };
  embeddingSource: 'cache' | 'ml' | 'asset';
  encodeMs: number;
  timelineSpaceCount: number;
};
```

Extract the existing setup work from `searchSmart` into this private helper:

```ts
private async resolveSmartSearch(
  auth: AuthDto,
  dto: SmartSearchDto | SmartSearchFacetsDto,
  options: { includeOrder: boolean },
): Promise<ResolvedSmartSearch> {
  if ('visibility' in dto && dto.visibility === AssetVisibility.Locked) {
    requireElevatedPermission(auth);
  }

  if (dto.spaceId && dto.withSharedSpaces) {
    throw new BadRequestException('Cannot use both spaceId and withSharedSpaces');
  }

  if (dto.spaceId) {
    await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
  }

  if (dto.spacePersonIds?.length && !dto.spaceId) {
    throw new BadRequestException('spacePersonIds requires spaceId');
  }

  const { machineLearning } = await this.getConfig({ withCache: true });
  if (!isSmartSearchEnabled(machineLearning)) {
    throw new BadRequestException('Smart search is not enabled');
  }

  let embedding: string | undefined;
  let encodeMs = 0;
  let embeddingSource: 'cache' | 'ml' | 'asset' = 'cache';

  if (dto.query) {
    const key = machineLearning.clip.modelName + dto.query + dto.language;
    embedding = this.embeddingCache.get(key);
    if (!embedding) {
      embeddingSource = 'ml';
      const tEncodeStart = performance.now();
      embedding = await this.machineLearningRepository.encodeText(dto.query, {
        modelName: machineLearning.clip.modelName,
        language: dto.language,
      });
      encodeMs = performance.now() - tEncodeStart;
      this.embeddingCache.set(key, embedding);
    }
  } else if (dto.queryAssetId) {
    embeddingSource = 'asset';
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [dto.queryAssetId] });
    const assetEmbedding = await this.searchRepository.getEmbedding(dto.queryAssetId);
    if (!assetEmbedding) {
      throw new BadRequestException(`Asset ${dto.queryAssetId} has no embedding`);
    }
    embedding = assetEmbedding;
  } else {
    throw new BadRequestException('Either `query` or `queryAssetId` must be set');
  }

  let timelineSpaceIds: string[] | undefined;
  if (dto.withSharedSpaces) {
    const spaceRows = await this.sharedSpaceRepository.getSpaceIdsForTimeline(auth.user.id);
    if (spaceRows.length > 0) {
      timelineSpaceIds = spaceRows.map((row) => row.spaceId);
    }
  }

  return {
    options: {
      ...dto,
      timelineSpaceIds,
      userIds: await this.getUserIdsToSearch(auth),
      embedding,
      orderDirection: options.includeOrder && 'order' in dto ? dto.order : undefined,
      maxDistance: machineLearning.clip.maxDistance,
    },
    embeddingSource,
    encodeMs,
    timelineSpaceCount: timelineSpaceIds?.length ?? 0,
  };
}
```

Refactor `searchSmart` to call the helper and preserve its current response mapping and timing log. The repository call should keep this shape:

```ts
const { options, embeddingSource, encodeMs, timelineSpaceCount } = await this.resolveSmartSearch(auth, dto, {
  includeOrder: true,
});

const { hasNextPage, items } = await this.searchRepository.searchSmart({ page, size }, options);
```

Add the facets method:

```ts
async searchSmartFacets(auth: AuthDto, dto: SmartSearchFacetsDto): Promise<SmartSearchFacetsResponseDto> {
  const t0 = performance.now();
  const { options, embeddingSource, encodeMs, timelineSpaceCount } = await this.resolveSmartSearch(auth, dto, {
    includeOrder: false,
  });
  const tResolved = performance.now();

  const result = await this.searchRepository.getSmartSearchFacets(options);
  const tDb = performance.now();

  if (searchTimingEnabled) {
    this.logger.log(
      `searchSmartFacets total=${(tDb - t0).toFixed(0)}ms ` +
        `resolve=${(tResolved - t0).toFixed(0)}ms(src=${embeddingSource}${
          embeddingSource === 'ml' ? `,encode=${encodeMs.toFixed(0)}ms` : ''
        }) ` +
        `spaces=${timelineSpaceCount} ` +
        `db=${(tDb - tResolved).toFixed(0)}ms(total=${result.total}) ` +
        `query="${dto.query?.slice(0, 60) ?? ''}"`,
    );
  }

  return { ...result, people: result.people.toSorted((a, b) => a.name.localeCompare(b.name)) };
}
```

- [ ] **Step 4: Add the repository mock method**

Add the `getSmartSearchFacets` method signature to `SearchRepository` before rerunning service tests. The existing `automock(SearchRepository, { strict: false })` in `server/test/utils.ts` will then expose `mocks.search.getSmartSearchFacets` to `server/src/services/search.service.spec.ts`.

Use this temporary body until Task 4 replaces it with the full repository implementation:

```ts
async getSmartSearchFacets(_options: SmartSearchFacetsOptions): Promise<SmartSearchFacetsResult> {
  throw new Error('Smart search facets repository implementation is added in Task 4');
}
```

- [ ] **Step 5: Run service tests and confirm green**

Run:

```bash
cd server && pnpm test -- --run src/services/search.service.spec.ts
```

Expected: PASS for all existing `searchSmart` tests and new `searchSmartFacets` tests.

- [ ] **Step 6: Commit the service slice**

Run:

```bash
git add server/src/services/search.service.ts server/src/services/search.service.spec.ts server/src/repositories/search.repository.ts
git commit -m "feat: resolve smart search facets in service"
```

---

### Task 3: Repository SQL Shape For Exact Smart Facets

**Files:**

- Modify `server/src/repositories/search.repository.ts`
- Test `server/src/repositories/search.repository.spec.ts`

- [ ] **Step 1: Write failing offline SQL-shape tests**

Add helper functions near the existing offline helpers in `server/src/repositories/search.repository.spec.ts`:

```ts
const buildFacetCandidateSql = (sut: SearchRepository, options: Record<string, unknown>) =>
  (sut as any).buildSmartFacetCandidateQuery(offlineKysely(), options).compile().sql;

const buildFacetFilteredIdsSql = (
  sut: SearchRepository,
  options: Record<string, unknown>,
  exclude: 'time' | 'people' | 'location' | 'city' | 'camera' | 'cameraModel' | 'tags' | 'rating' | 'media' | undefined,
) => (sut as any).buildSmartFacetFilteredAssetIds(offlineKysely(), options, exclude).compile().sql;
```

Add this `describe` block before `describe('filter suggestions query shape')`:

```ts
describe('smart facets query shape', () => {
  it('builds one unordered candidate query from smart_search and does not page-limit facets', () => {
    const sql = buildFacetCandidateSql(sut, {
      ...baseOptions,
      city: 'Berlin',
      personIds: ['00000000-0000-0000-0000-000000000001'],
      tagIds: ['00000000-0000-0000-0000-000000000002'],
      takenAfter: new Date('2024-01-01T00:00:00.000Z'),
      orderDirection: AssetOrder.Desc,
    });

    expect(sql).toContain('"smart_search"');
    expect(sql).toMatch(/smart_search\.embedding\s*<=>/i);
    expect(sql).not.toMatch(/\border by\b/i);
    expect(sql).not.toMatch(/\blimit\b/i);
    expect(sql).not.toContain('"asset_exif"."city"');
    expect(sql).not.toContain('"tag_asset"');
    expect(sql).not.toContain('"asset_face"');
  });

  it('time bucket filtering excludes only takenAfter and takenBefore', () => {
    const sql = buildFacetFilteredIdsSql(
      sut,
      {
        ...baseOptions,
        takenAfter: new Date('2024-01-01T00:00:00.000Z'),
        takenBefore: new Date('2025-01-01T00:00:00.000Z'),
        country: 'Germany',
        rating: 4,
      },
      'time',
    );

    expect(sql).not.toMatch(/"asset"\."fileCreatedAt"\s*>?=/i);
    expect(sql).not.toMatch(/"asset"\."fileCreatedAt"\s*</i);
    expect(sql).toContain('"asset_exif"."country"');
    expect(sql).toMatch(/"asset_exif"\."rating"\s*>=\s*\$\d+/i);
  });

  it('people filtering excludes global and space people filters', () => {
    const sql = buildFacetFilteredIdsSql(
      sut,
      {
        ...baseOptions,
        personIds: ['00000000-0000-0000-0000-000000000001'],
        spacePersonIds: ['00000000-0000-0000-0000-000000000002'],
        country: 'Germany',
      },
      'people',
    );

    expect(sql).not.toContain('"asset_face"."personId"');
    expect(sql).not.toContain('"shared_space_person_face"."personId"');
    expect(sql).toContain('"asset_exif"."country"');
  });

  it('location, camera, tags, rating, and media each exclude only their own group', () => {
    const locationSql = buildFacetFilteredIdsSql(
      sut,
      { ...baseOptions, country: 'Germany', city: 'Berlin' },
      'location',
    );
    const citySql = buildFacetFilteredIdsSql(sut, { ...baseOptions, country: 'Germany', city: 'Berlin' }, 'city');
    const cameraSql = buildFacetFilteredIdsSql(sut, { ...baseOptions, make: 'Sony', model: 'A7' }, 'camera');
    const modelSql = buildFacetFilteredIdsSql(sut, { ...baseOptions, make: 'Sony', model: 'A7' }, 'cameraModel');
    const tagsSql = buildFacetFilteredIdsSql(
      sut,
      { ...baseOptions, tagIds: ['00000000-0000-0000-0000-000000000001'] },
      'tags',
    );
    const ratingSql = buildFacetFilteredIdsSql(sut, { ...baseOptions, rating: 5 }, 'rating');
    const mediaSql = buildFacetFilteredIdsSql(sut, { ...baseOptions, type: 'IMAGE' }, 'media');

    expect(locationSql).not.toContain('"asset_exif"."country"');
    expect(locationSql).not.toContain('"asset_exif"."city"');
    expect(citySql).toContain('"asset_exif"."country"');
    expect(citySql).not.toContain('"asset_exif"."city"');
    expect(cameraSql).not.toContain('"asset_exif"."make"');
    expect(cameraSql).not.toContain('"asset_exif"."model"');
    expect(modelSql).toContain('"asset_exif"."make"');
    expect(modelSql).not.toContain('"asset_exif"."model"');
    expect(tagsSql).not.toContain('"tag_asset"');
    expect(ratingSql).not.toMatch(/"asset_exif"\."rating"\s*>=/i);
    expect(mediaSql).not.toContain('"asset"."type" =');
  });

  it('rating null filters for unrated assets instead of using minimum rating comparison', () => {
    const sql = buildFacetFilteredIdsSql(sut, { ...baseOptions, rating: null }, undefined);

    expect(sql).toMatch(/"asset_exif"\."rating"\s+is\s+null/i);
    expect(sql).not.toMatch(/"asset_exif"\."rating"\s*>=/i);
  });

  it('total filtering keeps current smart-search rating, person, and tag semantics', () => {
    const sql = buildFacetFilteredIdsSql(
      sut,
      {
        ...baseOptions,
        rating: 4,
        personIds: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'],
        tagIds: ['00000000-0000-0000-0000-000000000003'],
      },
      undefined,
    );

    expect(sql).toMatch(/"asset_exif"\."rating"\s*>=\s*\$\d+/i);
    expect(sql).toContain('"has_people"');
    expect(sql).toContain('"tag_closure"');
  });
});
```

- [ ] **Step 2: Run repository SQL tests and confirm red**

Run:

```bash
cd server && pnpm test -- --run src/repositories/search.repository.spec.ts
```

Expected: FAIL because the smart facet helper methods do not exist.

- [ ] **Step 3: Add repository types and SQL helpers**

In `server/src/repositories/search.repository.ts`, expand imports from `src/utils/database`:

```ts
import {
  anyUuid,
  asUuid,
  hasAnySpacePerson,
  hasPeople,
  hasTags,
  searchAssetBuilder,
  truncatedDate,
  withExifInner,
} from 'src/utils/database';
```

Add types near `SmartSearchOptions` and `FilterSuggestionsResult`:

```ts
type SmartFacetExclude =
  | 'time'
  | 'people'
  | 'location'
  | 'city'
  | 'camera'
  | 'cameraModel'
  | 'tags'
  | 'rating'
  | 'media';

export type SmartSearchFacetsOptions = Omit<SmartSearchOptions, 'orderDirection'>;

export interface SmartSearchFacetsResult {
  total: number;
  timeBuckets: Array<{ timeBucket: string; count: number }>;
  countries: string[];
  cities: string[];
  cameraMakes: string[];
  cameraModels: string[];
  tags: FilterSuggestionsResult['tags'];
  people: FilterSuggestionsResult['people'];
  ratings: number[];
  mediaTypes: AssetType[];
  hasUnnamedPeople: boolean;
}
```

Add a candidate query helper that keeps only immutable smart-search scope:

```ts
private buildSmartFacetCandidateQuery(kysely: Kysely<DB>, options: SmartSearchFacetsOptions) {
  const hasDistanceThreshold = isActiveDistanceThreshold(options.maxDistance);

  return searchAssetBuilder(kysely, {
    ...without(
      options,
      'city',
      'country',
      'make',
      'model',
      'rating',
      'type',
      'isFavorite',
      'takenAfter',
      'takenBefore',
      'personIds',
      'personMatchAny',
      'spacePersonIds',
      'tagIds',
      'tagMatchAny',
    ),
    ratingIsMinimum: true,
  })
    .select('asset.id')
    .innerJoin('smart_search', 'asset.id', 'smart_search.assetId')
    .$if(hasDistanceThreshold, (qb) =>
      qb.where(sql<SqlBool>`(smart_search.embedding <=> ${options.embedding}) <= ${options.maxDistance!}`),
    )
    .where(sql<SqlBool>`smart_search.embedding <=> ${options.embedding}`, 'is not', null);
}
```

Add a temporary candidate table helper:

```ts
private async createSmartFacetCandidates(trx: Kysely<DB>, options: SmartSearchFacetsOptions) {
  await sql`drop table if exists smart_search_facet_candidates`.execute(trx);
  await sql`
    create temporary table smart_search_facet_candidates on commit drop as
    ${this.buildSmartFacetCandidateQuery(trx, options)}
  `.execute(trx);
  await sql`create index smart_search_facet_candidates_asset_id_idx on smart_search_facet_candidates ("id")`.execute(trx);
}
```

Add a filtered asset-id helper that applies self-exclusion:

```ts
private buildSmartFacetFilteredAssetIds(
  kysely: Kysely<DB>,
  options: SmartSearchFacetsOptions,
  exclude?: SmartFacetExclude,
) {
  const appliesCountry = exclude !== 'location' && !!options.country;
  const appliesCity = exclude !== 'location' && exclude !== 'city' && !!options.city;
  const appliesMake = exclude !== 'camera' && !!options.make;
  const appliesModel = exclude !== 'camera' && exclude !== 'cameraModel' && !!options.model;
  const needsExifJoin = !!(
    appliesCountry ||
    appliesCity ||
    appliesMake ||
    appliesModel ||
    (exclude !== 'rating' && options.rating !== undefined)
  );

  return kysely
    .selectFrom('asset')
    .select('asset.id')
    .where(
      'asset.id',
      'in',
      kysely.selectFrom(sql<{ id: string }>`smart_search_facet_candidates`.as('candidates')).select('candidates.id'),
    )
    .$if(exclude !== 'time' && !!options.takenAfter, (qb) => qb.where('asset.fileCreatedAt', '>=', options.takenAfter!))
    .$if(exclude !== 'time' && !!options.takenBefore, (qb) => qb.where('asset.fileCreatedAt', '<=', options.takenBefore!))
    .$if(exclude !== 'media' && !!options.type, (qb) => qb.where('asset.type', '=', options.type!))
    .$if(options.isFavorite !== undefined, (qb) => qb.where('asset.isFavorite', '=', options.isFavorite!))
    .$if(needsExifJoin, (qb) =>
      withExifInner(qb)
        .$if(appliesCountry, (qb) => qb.where('asset_exif.country', '=', options.country!))
        .$if(appliesCity, (qb) => qb.where('asset_exif.city', '=', options.city!))
        .$if(appliesMake, (qb) => qb.where('asset_exif.make', '=', options.make!))
        .$if(appliesModel, (qb) => qb.where('asset_exif.model', '=', options.model!))
        .$if(exclude !== 'rating' && options.rating !== undefined, (qb) =>
          options.rating === null
            ? qb.where('asset_exif.rating', 'is', null)
            : qb.where('asset_exif.rating', '>=', options.rating!),
        ),
    )
    .$if(exclude !== 'people' && !!options.personIds?.length, (qb) => hasPeople(qb, options.personIds!))
    .$if(exclude !== 'people' && !!options.spacePersonIds?.length, (qb) =>
      hasAnySpacePerson(qb, options.spacePersonIds!),
    )
    .$if(exclude !== 'tags' && !!options.tagIds?.length, (qb) => hasTags(qb, options.tagIds!));
}
```

- [ ] **Step 4: Run repository SQL tests and confirm green**

Run:

```bash
cd server && pnpm test -- --run src/repositories/search.repository.spec.ts
```

Expected: PASS for the new SQL-shape tests and existing vchord planner guards.

- [ ] **Step 5: Commit the repository helper slice**

Run:

```bash
git add server/src/repositories/search.repository.ts server/src/repositories/search.repository.spec.ts
git commit -m "feat: add smart facet repository query helpers"
```

---

### Task 4: Repository Aggregation And Medium Edge Tests

**Files:**

- Modify `server/src/repositories/search.repository.ts`
- Create `server/test/medium/specs/repositories/search.repository.spec.ts`

- [ ] **Step 1: Write failing medium repository tests**

Create `server/test/medium/specs/repositories/search.repository.spec.ts`:

```ts
import { Kysely } from 'kysely';
import { AssetType } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { SearchRepository } from 'src/repositories/search.repository';
import { SharedSpaceRepository } from 'src/repositories/shared-space.repository';
import { TagRepository } from 'src/repositories/tag.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { upsertTags } from 'src/utils/tag';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const matchingEmbedding = `[${Array.from({ length: 512 }, () => '0.01').join(',')}]`;
const farEmbedding = `[${Array.from({ length: 512 }, () => '-0.01').join(',')}]`;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [AssetRepository, SearchRepository, PersonRepository, SharedSpaceRepository, TagRepository],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(SearchRepository) };
};

const addEmbedding = async (db: Kysely<DB>, assetId: string, embedding = matchingEmbedding) => {
  await db.insertInto('smart_search').values({ assetId, embedding }).execute();
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SearchRepository.name, () => {
  describe('getSmartSearchFacets', () => {
    it('aggregates exact facets from all smart-search candidates and ignores nonmatching embeddings', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: january } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-01-15T10:00:00.000Z'),
        localDateTime: new Date('2024-01-15T10:00:00.000Z'),
      });
      const { asset: february } = await ctx.newAsset({
        ownerId: user.id,
        type: AssetType.Video,
        isFavorite: true,
        fileCreatedAt: new Date('2024-02-20T10:00:00.000Z'),
        localDateTime: new Date('2024-02-20T10:00:00.000Z'),
      });
      const { asset: farAway } = await ctx.newAsset({ ownerId: user.id });

      await ctx.newExif({
        assetId: january.id,
        country: 'Germany',
        city: 'Berlin',
        make: 'Sony',
        model: 'A7',
        rating: 4,
      });
      await ctx.newExif({
        assetId: february.id,
        country: 'France',
        city: 'Paris',
        make: 'Canon',
        model: 'R5',
        rating: 5,
      });
      await ctx.newExif({
        assetId: farAway.id,
        country: 'Norway',
        city: 'Bergen',
        make: 'Nikon',
        model: 'Z8',
        rating: 5,
      });
      await addEmbedding(ctx.database, january.id);
      await addEmbedding(ctx.database, february.id);
      await addEmbedding(ctx.database, farAway.id, farEmbedding);

      const [travel] = await upsertTags(ctx.get(TagRepository), { userId: user.id, tags: ['Travel'] });
      await ctx.newTagAsset({ tagIds: [travel.id], assetIds: [january.id, february.id] });

      const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Ada' });
      await ctx.newAssetFace({ assetId: january.id, personId: person.id });

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0.01,
      });

      expect(result.total).toBe(2);
      expect(result.timeBuckets).toEqual([
        { timeBucket: '2024-02-01', count: 1 },
        { timeBucket: '2024-01-01', count: 1 },
      ]);
      expect(result.countries).toEqual(['France', 'Germany']);
      expect(result.cities).toEqual(['Berlin', 'Paris']);
      expect(result.cameraMakes).toEqual(['Canon', 'Sony']);
      expect(result.cameraModels).toEqual(['A7', 'R5']);
      expect(result.tags).toEqual([{ id: travel.id, value: 'Travel' }]);
      expect(result.people).toEqual([{ id: person.id, name: 'Ada' }]);
      expect(result.ratings).toEqual([4, 5]);
      expect(result.mediaTypes).toEqual(['IMAGE', 'VIDEO']);
      expect(result.hasUnnamedPeople).toBe(false);
    });

    it('applies date filters to total while timeBuckets exclude the date filter group', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: january } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-01-15T10:00:00.000Z'),
        localDateTime: new Date('2024-01-15T10:00:00.000Z'),
      });
      const { asset: february } = await ctx.newAsset({
        ownerId: user.id,
        fileCreatedAt: new Date('2024-02-20T10:00:00.000Z'),
        localDateTime: new Date('2024-02-20T10:00:00.000Z'),
      });
      await addEmbedding(ctx.database, january.id);
      await addEmbedding(ctx.database, february.id);

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0.01,
        takenAfter: new Date('2024-02-01T00:00:00.000Z'),
        takenBefore: new Date('2024-03-01T00:00:00.000Z'),
      });

      expect(result.total).toBe(1);
      expect(result.timeBuckets).toEqual([
        { timeBucket: '2024-02-01', count: 1 },
        { timeBucket: '2024-01-01', count: 1 },
      ]);
    });

    it('uses all embedded accessible assets when maxDistance is disabled', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      for (let index = 0; index < 125; index++) {
        const { asset } = await ctx.newAsset({ ownerId: user.id });
        await ctx.newExif({ assetId: asset.id, country: 'Germany' });
        await addEmbedding(ctx.database, asset.id, index % 2 === 0 ? matchingEmbedding : farEmbedding);
      }

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0,
      });

      expect(result.total).toBe(125);
      expect(result.countries).toEqual(['Germany']);
    });

    it('treats rating null as an unrated filter and numeric rating as an inclusive minimum', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset: unrated } = await ctx.newAsset({ ownerId: user.id });
      const { asset: ratedThree } = await ctx.newAsset({ ownerId: user.id });
      const { asset: ratedFive } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: unrated.id, rating: null });
      await ctx.newExif({ assetId: ratedThree.id, rating: 3 });
      await ctx.newExif({ assetId: ratedFive.id, rating: 5 });
      await addEmbedding(ctx.database, unrated.id);
      await addEmbedding(ctx.database, ratedThree.id);
      await addEmbedding(ctx.database, ratedFive.id);

      await expect(
        sut.getSmartSearchFacets({ embedding: matchingEmbedding, userIds: [user.id], maxDistance: 0, rating: null }),
      ).resolves.toMatchObject({ total: 1 });
      await expect(
        sut.getSmartSearchFacets({ embedding: matchingEmbedding, userIds: [user.id], maxDistance: 0, rating: 4 }),
      ).resolves.toMatchObject({ total: 1, ratings: [3, 5] });
    });

    it('returns empty facets and total 0 when no candidates match', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [user.id],
        maxDistance: 0.01,
      });

      expect(result).toEqual({
        total: 0,
        timeBuckets: [],
        countries: [],
        cities: [],
        cameraMakes: [],
        cameraModels: [],
        tags: [],
        people: [],
        ratings: [],
        mediaTypes: [],
        hasUnnamedPeople: false,
      });
    });

    it('returns shared-space person ids when spaceId is set', async () => {
      const { ctx, sut } = setup();
      const { user: owner } = await ctx.newUser();
      const { user: member } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: owner.id });
      await addEmbedding(ctx.database, asset.id);

      const { space } = await ctx.newSharedSpace({ createdById: owner.id });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: owner.id, role: 'owner' });
      await ctx.newSharedSpaceMember({ spaceId: space.id, userId: member.id, role: 'viewer' });
      await ctx.newSharedSpaceAsset({ spaceId: space.id, assetId: asset.id, addedById: owner.id });

      const { person } = await ctx.newPerson({ ownerId: owner.id, name: 'Personal Ada' });
      const { assetFace } = await ctx.newAssetFace({ assetId: asset.id, personId: person.id });
      const sharedPerson = await ctx.database
        .insertInto('shared_space_person')
        .values({
          spaceId: space.id,
          name: 'Space Ada',
          representativeFaceId: assetFace.id,
          isHidden: false,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await ctx.database
        .insertInto('shared_space_person_face')
        .values({ personId: sharedPerson.id, assetFaceId: assetFace.id })
        .execute();

      const result = await sut.getSmartSearchFacets({
        embedding: matchingEmbedding,
        userIds: [member.id],
        maxDistance: 0.01,
        spaceId: space.id,
      });

      expect(result.people).toEqual([{ id: sharedPerson.id, name: 'Space Ada' }]);
    });
  });
});
```

- [ ] **Step 2: Run the medium repository test and confirm red**

Run:

```bash
cd server && pnpm test:medium -- --run test/medium/specs/repositories/search.repository.spec.ts
```

Expected: FAIL because `getSmartSearchFacets` does not exist or returns empty placeholders.

- [ ] **Step 3: Implement smart facet aggregation**

In `server/src/repositories/search.repository.ts`, add the public method:

```ts
@GenerateSql({
  params: [
    {
      embedding: DummyValue.VECTOR,
      userIds: [DummyValue.UUID],
      timelineSpaceIds: [DummyValue.UUID, DummyValue.UUID],
      maxDistance: 0.75,
      country: DummyValue.STRING,
      make: DummyValue.STRING,
      tagIds: [DummyValue.UUID],
      rating: 4,
      type: AssetType.Image,
      takenAfter: DummyValue.DATE,
      takenBefore: DummyValue.DATE,
    },
  ],
})
async getSmartSearchFacets(options: SmartSearchFacetsOptions): Promise<SmartSearchFacetsResult> {
  return this.db.transaction().execute(async (trx) => {
    await sql`set local vchordrq.probes = ${sql.lit(probes[VectorIndex.Clip])}`.execute(trx);
    await this.createSmartFacetCandidates(trx, options);

    const totalRow = await this.getSmartFacetTotal(trx, options);
    const timeBuckets = await this.getSmartFacetTimeBuckets(trx, options);
    const countries = await this.getSmartFacetCountries(trx, options);
    const cities = await this.getSmartFacetCities(trx, options);
    const cameraMakes = await this.getSmartFacetCameraMakes(trx, options);
    const cameraModels = await this.getSmartFacetCameraModels(trx, options);
    const tags = await this.getSmartFacetTags(trx, options);
    const peopleResult = await this.getSmartFacetPeople(trx, options);
    const ratings = await this.getSmartFacetRatings(trx, options);
    const mediaTypes = await this.getSmartFacetMediaTypes(trx, options);

    return {
      total: totalRow,
      timeBuckets,
      countries,
      cities,
      cameraMakes,
      cameraModels,
      tags,
      people: peopleResult.people,
      ratings,
      mediaTypes,
      hasUnnamedPeople: peopleResult.hasUnnamedPeople,
    };
  });
}
```

Add the aggregation helpers. Use `buildSmartFacetFilteredAssetIds(trx, options, undefined)` for `total`, and pass the self-exclusion group for each facet:

```ts
private async getSmartFacetTotal(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<number> {
  const row = await trx
    .selectFrom(this.buildSmartFacetFilteredAssetIds(trx, options, undefined).as('filtered'))
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();
  return Number(row.count);
}

private async getSmartFacetTimeBuckets(
  trx: Kysely<DB>,
  options: SmartSearchFacetsOptions,
): Promise<Array<{ timeBucket: string; count: number }>> {
  return trx
    .with('asset', (qb) =>
      qb
        .selectFrom('asset')
        .select(truncatedDate<Date>().as('timeBucket'))
        .where('asset.id', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'time')),
    )
    .selectFrom('asset')
    .select(sql<string>`("timeBucket" AT TIME ZONE 'UTC')::date::text`.as('timeBucket'))
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .groupBy('timeBucket')
    .orderBy('timeBucket', 'desc')
    .execute() as Promise<Array<{ timeBucket: string; count: number }>>;
}

private async getSmartFacetCountries(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<string[]> {
  const rows = await trx
    .selectFrom('asset_exif')
    .select('country')
    .distinct()
    .where('assetId', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'location'))
    .where('country', 'is not', null)
    .where('country', '!=', '')
    .orderBy('country')
    .execute();
  return rows.map((row) => row.country!);
}

private async getSmartFacetCities(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<string[]> {
  const rows = await trx
    .selectFrom('asset_exif')
    .select('city')
    .distinct()
    .where('assetId', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'city'))
    .where('city', 'is not', null)
    .where('city', '!=', '')
    .orderBy('city')
    .execute();
  return rows.map((row) => row.city!);
}

private async getSmartFacetCameraMakes(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<string[]> {
  const rows = await trx
    .selectFrom('asset_exif')
    .select('make')
    .distinct()
    .where('assetId', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'camera'))
    .where('make', 'is not', null)
    .where('make', '!=', '')
    .orderBy('make')
    .execute();
  return rows.map((row) => row.make!);
}

private async getSmartFacetCameraModels(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<string[]> {
  const rows = await trx
    .selectFrom('asset_exif')
    .select('model')
    .distinct()
    .where('assetId', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'cameraModel'))
    .where('model', 'is not', null)
    .where('model', '!=', '')
    .orderBy('model')
    .execute();
  return rows.map((row) => row.model!);
}

private async getSmartFacetTags(
  trx: Kysely<DB>,
  options: SmartSearchFacetsOptions,
): Promise<Array<{ id: string; value: string }>> {
  return trx
    .selectFrom('tag')
    .select(['tag.id', 'tag.value'])
    .distinct()
    .innerJoin('tag_asset', 'tag.id', 'tag_asset.tagId')
    .where('tag_asset.assetId', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'tags'))
    .orderBy('tag.value')
    .execute();
}
```

For people, preserve the existing global and shared-space return shapes from `getFilteredPeople`, but use `buildSmartFacetFilteredAssetIds(trx, options, 'people')` as the asset scope:

```ts
private async getSmartFacetPeople(
  trx: Kysely<DB>,
  options: SmartSearchFacetsOptions,
): Promise<{ people: Array<{ id: string; name: string }>; hasUnnamedPeople: boolean }> {
  const filteredIds = this.buildSmartFacetFilteredAssetIds(trx, options, 'people');

  if (options.spaceId) {
    const spacePeople = await trx
      .selectFrom('shared_space_person')
      .leftJoin('asset_face', 'asset_face.id', 'shared_space_person.representativeFaceId')
      .leftJoin('person', 'person.id', 'asset_face.personId')
      .select(['shared_space_person.id', 'shared_space_person.name'])
      .select('person.name as personalName')
      .where('shared_space_person.spaceId', '=', asUuid(options.spaceId))
      .where('shared_space_person.isHidden', '=', false)
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('shared_space_person_face')
            .innerJoin('asset_face as af', 'af.id', 'shared_space_person_face.assetFaceId')
            .whereRef('shared_space_person_face.personId', '=', 'shared_space_person.id')
            .where('af.assetId', 'in', filteredIds),
        ),
      )
      .orderBy('shared_space_person.name')
      .execute();

    const people = spacePeople
      .map((p) => ({ id: p.id, name: p.name || (p as any).personalName || '' }))
      .filter((p) => p.name !== '')
      .toSorted((a, b) => a.name.localeCompare(b.name));

    return { people, hasUnnamedPeople: spacePeople.some((p) => !p.name && !(p as any).personalName) };
  }

  const people = await trx
    .selectFrom('person')
    .select(['person.id', 'person.name'])
    .where('person.name', '!=', '')
    .where('person.isHidden', '=', false)
    .where((eb) =>
      eb.exists(
        eb.selectFrom('asset_face').whereRef('asset_face.personId', '=', 'person.id').where('asset_face.assetId', 'in', filteredIds),
      ),
    )
    .orderBy('person.name')
    .execute();

  const unnamed = await trx
    .selectFrom('person')
    .select(sql`1`.as('exists'))
    .where((eb) => eb.or([eb('person.name', '=', ''), eb('person.name', 'is', null)]))
    .where((eb) =>
      eb.exists(
        eb.selectFrom('asset_face').whereRef('asset_face.personId', '=', 'person.id').where('asset_face.assetId', 'in', filteredIds),
      ),
    )
    .limit(1)
    .executeTakeFirst();

  return { people, hasUnnamedPeople: !!unnamed };
}
```

Add rating and media helpers:

```ts
private async getSmartFacetRatings(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<number[]> {
  const rows = await trx
    .selectFrom('asset_exif')
    .select('rating')
    .distinct()
    .where('assetId', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'rating'))
    .where('rating', 'is not', null)
    .where('rating', '>', 0)
    .orderBy('rating')
    .execute();
  return rows.map((row) => row.rating!);
}

private async getSmartFacetMediaTypes(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<string[]> {
  const rows = await trx
    .selectFrom('asset')
    .select('type')
    .distinct()
    .where('id', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'media'))
    .orderBy('type')
    .execute();
  return rows.map((row) => row.type);
}
```

- [ ] **Step 4: Run medium repository tests and confirm green**

Run:

```bash
cd server && pnpm test:medium -- --run test/medium/specs/repositories/search.repository.spec.ts
```

Expected: PASS for the smart facets repository medium tests.

- [ ] **Step 5: Run focused server regression tests**

Run:

```bash
cd server && pnpm test -- --run src/repositories/search.repository.spec.ts src/services/search.service.spec.ts src/controllers/search.controller.spec.ts
```

Expected: PASS for all three focused unit specs.

- [ ] **Step 6: Commit the repository aggregation slice**

Run:

```bash
git add server/src/repositories/search.repository.ts server/test/medium/specs/repositories/search.repository.spec.ts
git commit -m "feat: aggregate smart search facets"
```

---

### Task 5: Regenerate OpenAPI And SDK Outputs

**Files:**

- Modify `open-api/immich-openapi-specs.json`
- Modify `open-api/typescript-sdk/src/fetch-client.ts`
- Modify generated `mobile/openapi/**` files
- Build output under `open-api/typescript-sdk/build*` may change according to the generator script

- [ ] **Step 1: Regenerate full OpenAPI output**

Run:

```bash
make open-api
```

Expected: command exits 0 after server build, OpenAPI sync, Dart generation, TypeScript SDK generation, and TypeScript SDK build.

- [ ] **Step 2: Confirm generated symbols exist**

Run:

```bash
rg -n "searchSmartFacets|SmartSearchFacetsDto|SmartSearchFacetsResponseDto" open-api/typescript-sdk/src/fetch-client.ts open-api/immich-openapi-specs.json mobile/openapi/lib
```

Expected: matches in the OpenAPI JSON, TypeScript SDK, Dart search API, and Dart model files.

- [ ] **Step 3: Run SDK build directly**

Run:

```bash
pnpm --filter @immich/sdk build
```

Expected: PASS.

- [ ] **Step 4: Commit generated API outputs**

Run:

```bash
git add open-api/immich-openapi-specs.json open-api/typescript-sdk mobile/openapi
git commit -m "chore: regenerate smart search facets api"
```

---

### Task 6: Frontend Smart Facet Payload Utilities

**Files:**

- Modify `web/src/lib/utils/space-search.ts`
- Test `web/src/lib/utils/__tests__/space-search.spec.ts`

- [ ] **Step 1: Write failing utility tests**

Add imports:

```ts
import { createUrl } from '$lib/utils';
import {
  buildSmartSearchFacetKey,
  buildSmartSearchFacetsParams,
  mapSmartSearchFacetsToFilterSuggestions,
} from '$lib/utils/space-search';
```

Add tests after the existing `buildSmartSearchParams` describe block:

```ts
describe('buildSmartSearchFacetsParams', () => {
  it('uses the same filters as smart search but strips order, page, and size concepts', () => {
    const result = buildSmartSearchFacetsParams({
      query: 'beach',
      filters: { ...baseFilters, sortOrder: 'asc', rating: 4, mediaType: 'image' },
      withSharedSpaces: true,
    });

    expect(result).toEqual({
      query: 'beach',
      withSharedSpaces: true,
      rating: 4,
      type: AssetTypeEnum.Image,
    });
    expect(result).not.toHaveProperty('order');
    expect(result).not.toHaveProperty('page');
    expect(result).not.toHaveProperty('size');
  });

  it('maps space people to spacePersonIds', () => {
    const result = buildSmartSearchFacetsParams({
      query: 'beach',
      filters: { ...baseFilters, personIds: ['space-person-1'] },
      spaceId: 'space-1',
      withSharedSpaces: true,
    });

    expect(result).toMatchObject({ spaceId: 'space-1', spacePersonIds: ['space-person-1'] });
    expect(result.personIds).toBeUndefined();
    expect(result.withSharedSpaces).toBeUndefined();
  });

  it('uses the same key for sort-only changes', () => {
    const relevanceKey = buildSmartSearchFacetKey({
      query: 'beach',
      filters: { ...baseFilters, sortOrder: 'relevance' },
      withSharedSpaces: true,
    });
    const ascendingKey = buildSmartSearchFacetKey({
      query: 'beach',
      filters: { ...baseFilters, sortOrder: 'asc' },
      withSharedSpaces: true,
    });

    expect(ascendingKey).toBe(relevanceKey);
  });

  it('changes the key for facet-affecting filters', () => {
    const baseKey = buildSmartSearchFacetKey({ query: 'beach', filters: baseFilters, withSharedSpaces: true });
    const countryKey = buildSmartSearchFacetKey({
      query: 'beach',
      filters: { ...baseFilters, country: 'Germany' },
      withSharedSpaces: true,
    });

    expect(countryKey).not.toBe(baseKey);
  });
});

describe('mapSmartSearchFacetsToFilterSuggestions', () => {
  it('maps SDK facet response to FilterPanel suggestions and thumbnail URLs', () => {
    const result = mapSmartSearchFacetsToFilterSuggestions(
      {
        total: 2,
        timeBuckets: [{ timeBucket: '2024-01-01', count: 2 }],
        countries: ['Germany'],
        cities: ['Berlin'],
        cameraMakes: ['Sony'],
        cameraModels: ['A7'],
        tags: [{ id: 'tag-1', value: 'Travel' }],
        people: [{ id: 'person-1', name: 'Ada' }],
        ratings: [4],
        mediaTypes: [AssetTypeEnum.Image],
        hasUnnamedPeople: true,
      },
      { spaceId: 'space-1' },
    );

    expect(result).toEqual({
      countries: ['Germany'],
      cities: ['Berlin'],
      cameraMakes: ['Sony'],
      cameraModels: ['A7'],
      tags: [{ id: 'tag-1', name: 'Travel' }],
      people: [
        { id: 'person-1', name: 'Ada', thumbnailUrl: createUrl('/shared-spaces/space-1/people/person-1/thumbnail') },
      ],
      ratings: [4],
      mediaTypes: [AssetTypeEnum.Image],
      hasUnnamedPeople: true,
    });
  });
});
```

- [ ] **Step 2: Run utility tests and confirm red**

Run:

```bash
cd web && pnpm exec vitest run src/lib/utils/__tests__/space-search.spec.ts
```

Expected: FAIL because the new utility functions do not exist.

- [ ] **Step 3: Implement the utility functions**

In `web/src/lib/utils/space-search.ts`, update imports:

```ts
import { createUrl } from '$lib/utils';
import {
  AssetOrder,
  AssetTypeEnum,
  type SmartSearchDto,
  type SmartSearchFacetsDto,
  type SmartSearchFacetsResponseDto,
} from '@immich/sdk';
```

Factor the argument type:

```ts
type SmartSearchParamsArgs = {
  query: string;
  filters: FilterState;
  spaceId?: string;
  withSharedSpaces?: boolean;
};
```

Use the type in `buildSmartSearchParams`, then add:

```ts
export function buildSmartSearchFacetsParams(args: SmartSearchParamsArgs): SmartSearchFacetsDto {
  const { order: _order, ...params } = buildSmartSearchParams(args);
  return params;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function buildSmartSearchFacetKey(args: SmartSearchParamsArgs): string {
  return stableJson(buildSmartSearchFacetsParams(args));
}

export function mapSmartSearchFacetsToFilterSuggestions(
  facets: SmartSearchFacetsResponseDto,
  options: { spaceId?: string } = {},
) {
  return {
    countries: facets.countries,
    cities: facets.cities,
    cameraMakes: facets.cameraMakes,
    cameraModels: facets.cameraModels,
    tags: facets.tags.map((tag) => ({ id: tag.id, name: tag.value })),
    people: facets.people.map((person) => ({
      id: person.id,
      name: person.name,
      thumbnailUrl: options.spaceId
        ? createUrl(`/shared-spaces/${options.spaceId}/people/${person.id}/thumbnail`)
        : createUrl(`/people/${person.id}/thumbnail`),
    })),
    ratings: facets.ratings,
    mediaTypes: facets.mediaTypes,
    hasUnnamedPeople: facets.hasUnnamedPeople,
  };
}
```

- [ ] **Step 4: Run utility tests and confirm green**

Run:

```bash
cd web && pnpm exec vitest run src/lib/utils/__tests__/space-search.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the frontend utility slice**

Run:

```bash
git add web/src/lib/utils/space-search.ts web/src/lib/utils/__tests__/space-search.spec.ts
git commit -m "feat: add smart search facet payload utilities"
```

---

### Task 7: Exact Total In Smart Search Result Count

**Files:**

- Modify `web/src/lib/components/spaces/space-search-results.svelte`
- Modify `web/src/lib/components/spaces/space-search-results.spec.ts`
- Modify `web/src/lib/components/search/smart-search-results.svelte`
- Modify `web/src/lib/components/search/smart-search-results.spec.ts`
- Modify `web/src/test-data/mocks/smart-search-results.stub.svelte`

- [ ] **Step 1: Write failing result count tests**

In `web/src/lib/components/spaces/space-search-results.spec.ts`, add:

```ts
it('shows exact total when total is provided even when more pages exist', () => {
  render(SpaceSearchResults, {
    props: {
      results: mockAssets,
      isLoading: false,
      hasMore: true,
      totalLoaded: 3,
      total: 238,
      onLoadMore: vi.fn(),
      sortMode: 'relevance',
    },
  });

  expect(screen.getByTestId('result-count')).toHaveTextContent('238 results');
  expect(screen.getByTestId('result-count').textContent).not.toContain('+');
});

it('falls back to loaded-count display when total is undefined', () => {
  render(SpaceSearchResults, {
    props: {
      results: mockAssets,
      isLoading: false,
      hasMore: true,
      totalLoaded: 100,
      total: undefined,
      onLoadMore: vi.fn(),
      sortMode: 'relevance',
    },
  });

  expect(screen.getByTestId('result-count')).toHaveTextContent('100+');
});
```

In `web/src/lib/components/search/smart-search-results.spec.ts`, mock `SpaceSearchResults` with a prop-capturing stub and add:

```ts
it('passes exact total to SpaceSearchResults when provided', async () => {
  searchSmartMock.mockResolvedValue({
    assets: { items: [{ id: 'asset-1', originalFileName: 'photo.jpg' }], nextPage: null },
  });

  render(SmartSearchResults, { props: { ...baseProps, total: 42 } });
  await vi.advanceTimersByTimeAsync(SEARCH_FILTER_DEBOUNCE_MS);

  expect(screen.getByTestId('result-count')).toHaveTextContent('42 results');
});
```

- [ ] **Step 2: Run result count tests and confirm red**

Run:

```bash
cd web && pnpm exec vitest run src/lib/components/spaces/space-search-results.spec.ts src/lib/components/search/smart-search-results.spec.ts
```

Expected: FAIL because `total` is not accepted or displayed.

- [ ] **Step 3: Implement exact total display**

In `web/src/lib/components/spaces/space-search-results.svelte`, add the prop:

```ts
total?: number;
```

Update props destructuring:

```ts
let { results, isLoading, hasMore, totalLoaded, total, onLoadMore, spaceId, isShared, sortMode }: Props = $props();
```

Add derived display values:

```ts
let displayedCount = $derived(total ?? totalLoaded);
let hasExactTotal = $derived(total !== undefined);
```

Replace the result-count span content:

```svelte
{#if hasExactTotal}
  {displayedCount} result{displayedCount === 1 ? '' : 's'}
{:else if sortMode === 'relevance'}
  {totalLoaded}{hasMore ? '+' : ''} result{totalLoaded === 1 && !hasMore ? '' : 's'}
{:else}
  {totalLoaded}{hasMore ? ' of up to 500' : ''} result{totalLoaded === 1 && !hasMore ? '' : 's'}
{/if}
```

In `web/src/lib/components/search/smart-search-results.svelte`, add `total?: number` to props and pass it through:

```svelte
<SpaceSearchResults
  results={searchResults}
  {isLoading}
  hasMore={hasMoreResults}
  totalLoaded={searchResults.length}
  {total}
  onLoadMore={handleLoadMore}
  {spaceId}
  {isShared}
  sortMode={filters.sortOrder}
/>
```

In `web/src/test-data/mocks/smart-search-results.stub.svelte`, expose the route-test attribute:

```svelte
data-total={rest.total === undefined ? '' : String(rest.total)}
```

- [ ] **Step 4: Run result count tests and confirm green**

Run:

```bash
cd web && pnpm exec vitest run src/lib/components/spaces/space-search-results.spec.ts src/lib/components/search/smart-search-results.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the result count slice**

Run:

```bash
git add web/src/lib/components/spaces/space-search-results.svelte web/src/lib/components/spaces/space-search-results.spec.ts web/src/lib/components/search/smart-search-results.svelte web/src/lib/components/search/smart-search-results.spec.ts web/src/test-data/mocks/smart-search-results.stub.svelte
git commit -m "feat: show exact smart search total"
```

---

### Task 8: Photos Route Smart Facets

**Files:**

- Modify `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`
- Modify `web/src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts`
- Modify `web/src/test-data/mocks/bindable-filter-panel.stub.svelte`

- [ ] **Step 1: Upgrade the filter panel test stub**

Change `web/src/test-data/mocks/bindable-filter-panel.stub.svelte` so route tests can observe time buckets and trigger the provider path:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    filters?: unknown;
    config?: { suggestionsProvider?: (filters: unknown) => Promise<unknown> };
    timeBuckets?: Array<{ timeBucket: string; count: number }>;
    [key: string]: unknown;
  }

  let { filters = $bindable(), config, timeBuckets = [], ...rest }: Props = $props();

  onMount(() => {
    void config?.suggestionsProvider?.(filters);
  });
</script>

<div
  {...rest}
  data-testid="filter-panel-stub"
  data-has-filters={String(filters !== undefined)}
  data-time-buckets={JSON.stringify(timeBuckets)}
></div>
```

- [ ] **Step 2: Write failing photos route tests**

In `web/src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts`, import `sdkMock`:

```ts
import { sdkMock } from '$lib/__mocks__/sdk.mock';
```

Switch the filter panel mock to the bindable stub:

```ts
vi.mock('$lib/components/filter-panel/filter-panel.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/bindable-filter-panel.stub.svelte');
  return { default: MockComponent };
});
```

Delete the existing local `vi.mock('@immich/sdk', ...)` block in this spec. The imported `sdkMock` supplies mocked SDK functions for the route tests.

Add beforeEach defaults:

```ts
sdkMock.getFilterSuggestions.mockResolvedValue({
  people: [],
  countries: [],
  cameraMakes: [],
  tags: [],
  ratings: [],
  mediaTypes: [],
  hasUnnamedPeople: false,
});
sdkMock.searchSmartFacets.mockResolvedValue({
  total: 12,
  timeBuckets: [{ timeBucket: '2024-01-01', count: 12 }],
  countries: ['Germany'],
  cities: ['Berlin'],
  cameraMakes: ['Sony'],
  cameraModels: ['A7'],
  tags: [{ id: 'tag-1', value: 'Travel' }],
  people: [{ id: 'person-1', name: 'Ada' }],
  ratings: [4],
  mediaTypes: ['IMAGE'],
  hasUnnamedPeople: false,
});
sdkMock.getSearchSuggestions.mockResolvedValue([]);
```

Add tests:

```ts
it('fetches smart facets for committed photos search and passes exact total to results', async () => {
  mockPage.url = new URL('https://gallery.test/photos?q=nature');

  renderPage();

  await vi.waitFor(() => {
    expect(sdkMock.searchSmartFacets).toHaveBeenCalledWith({
      smartSearchFacetsDto: expect.objectContaining({
        query: 'nature',
        withSharedSpaces: true,
      }),
    });
  });

  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-total', '12');
});

it('uses smart facet timeBuckets in search mode', async () => {
  mockPage.url = new URL('https://gallery.test/photos?q=nature');

  renderPage();

  await vi.waitFor(() => {
    expect(screen.getByTestId('filter-panel-stub')).toHaveAttribute(
      'data-time-buckets',
      JSON.stringify([{ timeBucket: '2024-01-01', count: 12 }]),
    );
  });
});

it('does not fetch smart facets when the committed query is empty', () => {
  mockPage.url = new URL('https://gallery.test/photos');

  renderPage();

  expect(sdkMock.searchSmartFacets).not.toHaveBeenCalled();
  expect(sdkMock.getFilterSuggestions).toHaveBeenCalled();
});

it('does not include sort order in the smart facet payload', async () => {
  mockPage.url = new URL('https://gallery.test/photos?q=nature&sort=asc');

  renderPage();

  await vi.waitFor(() => {
    expect(sdkMock.searchSmartFacets).toHaveBeenCalled();
  });
  expect(sdkMock.searchSmartFacets.mock.calls[0][0].smartSearchFacetsDto).not.toHaveProperty('order');
});

it('keeps rendering search results when smart facets fail', async () => {
  sdkMock.searchSmartFacets.mockRejectedValueOnce(new Error('facets failed'));
  mockPage.url = new URL('https://gallery.test/photos?q=nature');

  renderPage();

  await vi.waitFor(() => {
    expect(sdkMock.searchSmartFacets).toHaveBeenCalled();
  });
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-search-query', 'nature');
});
```

Add these route edge-case tests in the same TDD step:

- successful facets followed by a rejected facet request preserves the previous `data-total` and `data-time-buckets`;
- changing `q` remounts the filter-panel stub and fetches a fresh smart facet payload;
- clearing `q` remounts back to normal filter suggestions and does not leave smart-search buckets visible;
- changing an active filter, such as `country` or a date bucket, refetches smart facets with the changed DTO and resets smart-search results to the first page;
- a late first facet response cannot overwrite a newer second response;
- paginating/loading more smart-search results leaves the smart facet request count unchanged.

- [ ] **Step 3: Run photos route tests and confirm red**

Run:

```bash
cd web && pnpm exec vitest run 'src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts'
```

Expected: FAIL because the photos route still calls normal filter suggestions in search mode and does not pass facet totals.

- [ ] **Step 4: Implement photos route smart facet provider**

In `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`, update imports:

```ts
import {
  buildSmartSearchFacetKey,
  buildSmartSearchFacetsParams,
  mapSmartSearchFacetsToFilterSuggestions,
} from '$lib/utils/space-search';
import {
  AssetTypeEnum,
  getFilterSuggestions,
  getSearchSuggestions,
  searchSmartFacets,
  SearchSuggestionType,
  type SmartSearchFacetsResponseDto,
} from '@immich/sdk';
```

Add route state:

```ts
let smartFacets = $state<SmartSearchFacetsResponseDto>();
let smartFacetKey = $state('');
let smartFacetInFlight:
  | {
      key: string;
      controller: AbortController;
      promise: Promise<SmartSearchFacetsResponseDto | undefined>;
    }
  | undefined;
```

Add helper functions before `filterConfig`:

```ts
const timelineBuckets = $derived(
  timelineManager?.months?.map((m) => ({
    timeBucket: `${m.yearMonth.year}-${String(m.yearMonth.month).padStart(2, '0')}-01T00:00:00.000Z`,
    count: m.assetsCount,
  })) ?? [],
);

const smartFacetBuckets = $derived(showSearchResults ? (smartFacets?.timeBuckets ?? []) : timelineBuckets);
const smartFacetTotal = $derived(showSearchResults ? smartFacets?.total : undefined);

async function loadPhotoSmartFacets(nextFilters: FilterState): Promise<SmartSearchFacetsResponseDto | undefined> {
  const query = committedQuery.trim();
  if (!query) {
    return undefined;
  }

  const key = buildSmartSearchFacetKey({ query, filters: nextFilters, withSharedSpaces: true });
  if (smartFacets && smartFacetKey === key) {
    return smartFacets;
  }
  if (smartFacetInFlight?.key === key) {
    return smartFacetInFlight.promise;
  }

  smartFacetInFlight?.controller.abort();
  const controller = new AbortController();

  const promise = searchSmartFacets(
    {
      smartSearchFacetsDto: buildSmartSearchFacetsParams({ query, filters: nextFilters, withSharedSpaces: true }),
    },
    { signal: controller.signal },
  )
    .then((result) => {
      if (smartFacetInFlight?.key === key && !controller.signal.aborted) {
        smartFacets = result;
        smartFacetKey = key;
      }
      return result;
    })
    .catch((error: unknown) => {
      console.error('Failed to fetch smart search facets:', error);
      return smartFacets;
    })
    .finally(() => {
      if (smartFacetInFlight?.key === key) {
        smartFacetInFlight = undefined;
      }
    });

  smartFacetInFlight = { key, controller, promise };
  return promise;
}
```

Split the existing normal suggestions code into `loadPhotoFilterSuggestions(nextFilters)`, then update `suggestionsProvider`:

```ts
suggestionsProvider: async (nextFilters: FilterState) => {
  if (showSearchResults) {
    const facets = await loadPhotoSmartFacets(nextFilters);
    if (!facets) {
      return {
        countries: [],
        cities: [],
        cameraMakes: [],
        cameraModels: [],
        tags: [],
        people: [],
        ratings: [],
        mediaTypes: [],
        hasUnnamedPeople: false,
      };
    }

    const mapped = mapSmartSearchFacetsToFilterSuggestions(facets);
    for (const p of facets.people) {
      personNames.set(p.id, p.name);
    }
    for (const t of facets.tags) {
      tagNames.set(t.id, t.value);
    }
    return mapped;
  }

  return loadPhotoFilterSuggestions(nextFilters);
},
```

For search mode, override the dependent child providers as well:

```ts
providers: {
  ...normalProviders,
  cities: async (country) => {
    if (!showSearchResults) {
      return normalProviders.cities(country);
    }
    const query = committedQuery.trim();
    if (!query) {
      return [];
    }
    const facets = await searchSmartFacets({
      smartSearchFacetsDto: buildSmartSearchFacetsParams({
        query,
        filters: { ...filters, country },
        withSharedSpaces: true,
      }),
    });
    return facets.cities;
  },
  cameraModels: async (make) => {
    if (!showSearchResults) {
      return normalProviders.cameraModels(make);
    }
    const query = committedQuery.trim();
    if (!query) {
      return [];
    }
    const facets = await searchSmartFacets({
      smartSearchFacetsDto: buildSmartSearchFacetsParams({
        query,
        filters: { ...filters, make },
        withSharedSpaces: true,
      }),
    });
    return facets.cameraModels;
  },
},
```

These dependent provider calls must not update `smartFacets`, `smartFacetKey`, or the route result count.

Pass smart buckets and total:

```svelte
{#key showSearchResults ? `search:${committedQuery.trim()}` : 'timeline'}
  <FilterPanel
    bind:filters
    config={filterConfig}
    timeBuckets={smartFacetBuckets}
    storageKey="gallery-filter-visible-sections-photos"
    hidden={isTimelineEmpty}
  />
{/key}
```

```svelte
<ActiveFiltersBar
  {filters}
  searchQuery={committedQuery}
  onClearSearch={clearSearch}
  resultCount={showSearchResults ? smartFacetTotal : totalAssetCount}
  {personNames}
  {tagNames}
  onRemoveFilter={(type, id) => {
    filters = handlePhotosRemoveFilter(filters, type, id);
  }}
  onClearAll={() => {
    filters = clearFilters(filters);
  }}
/>
```

```svelte
<SmartSearchResults
  bind:isLoading
  searchQuery={committedQuery}
  {filters}
  isShared={false}
  withSharedSpaces={true}
  total={smartFacetTotal}
/>
```

When the committed query is cleared, clear search facet state:

```ts
if (!nextSearchState.query.trim()) {
  smartFacetInFlight?.controller.abort();
  smartFacets = undefined;
  smartFacetKey = '';
  smartFacetInFlight = undefined;
}
```

- [ ] **Step 5: Run photos route tests and confirm green**

Run:

```bash
cd web && pnpm exec vitest run 'src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts'
```

Expected: PASS.

- [ ] **Step 6: Commit the photos route slice**

Run:

```bash
git add 'web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts' web/src/test-data/mocks/bindable-filter-panel.stub.svelte
git commit -m "feat: use smart facets on photos search route"
```

---

### Task 9: Spaces Route Smart Facets

**Files:**

- Modify `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Modify `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts`

- [ ] **Step 1: Write failing spaces route tests**

In `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts`, seed `searchSmartFacets` in `beforeEach`:

```ts
sdkMock.searchSmartFacets.mockResolvedValue({
  total: 7,
  timeBuckets: [{ timeBucket: '2024-03-01', count: 7 }],
  countries: ['Norway'],
  cities: ['Bergen'],
  cameraMakes: ['Fuji'],
  cameraModels: ['X-T5'],
  tags: [{ id: 'tag-1', value: 'Hike' }],
  people: [{ id: 'space-person-1', name: 'Ada' }],
  ratings: [5],
  mediaTypes: ['IMAGE'],
  hasUnnamedPeople: false,
});
sdkMock.getFilterSuggestions.mockResolvedValue({
  people: [],
  countries: [],
  cameraMakes: [],
  tags: [],
  ratings: [],
  mediaTypes: [],
  hasUnnamedPeople: false,
});
```

Add tests:

```ts
it('fetches smart facets with spaceId for committed space search', async () => {
  mockPage.url = new URL('https://gallery.test/spaces/space-1/photos?q=beach');

  renderPage();

  await vi.waitFor(() => {
    expect(sdkMock.searchSmartFacets).toHaveBeenCalledWith({
      smartSearchFacetsDto: expect.objectContaining({
        query: 'beach',
        spaceId: 'space-1',
      }),
    });
  });
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-total', '7');
});

it('does not include withSharedSpaces or order in the space facets payload', async () => {
  mockPage.url = new URL('https://gallery.test/spaces/space-1/photos?q=beach&sort=asc');

  renderPage();

  await vi.waitFor(() => {
    expect(sdkMock.searchSmartFacets).toHaveBeenCalled();
  });
  const dto = sdkMock.searchSmartFacets.mock.calls[0][0].smartSearchFacetsDto;
  expect(dto).not.toHaveProperty('withSharedSpaces');
  expect(dto).not.toHaveProperty('order');
});

it('uses smart facet timeBuckets in space search mode', async () => {
  mockPage.url = new URL('https://gallery.test/spaces/space-1/photos?q=beach');

  renderPage();

  await vi.waitFor(() => {
    expect(screen.getByTestId('filter-panel-stub')).toHaveAttribute(
      'data-time-buckets',
      JSON.stringify([{ timeBucket: '2024-03-01', count: 7 }]),
    );
  });
});
```

The selected-person mapping for spaces is covered by `buildSmartSearchFacetsParams` in Task 6 and by the service pass-through test in Task 2. The route uses that shared builder, so this route slice asserts the `spaceId` scope and the absence of `withSharedSpaces` and `order`.

Also add the same route edge-case tests as photos, scoped to spaces:

- successful facets followed by a rejected facet request preserves the previous `data-total` and `data-time-buckets`;
- changing `q` remounts the filter-panel stub and fetches a fresh smart facet payload for the same `spaceId`;
- changing `spaceId` clears previous space facet state and fetches the new space scope;
- changing an active filter, such as `country` or a date bucket, refetches smart facets with the changed DTO and resets smart-search results to the first page;
- a late first facet response cannot overwrite a newer second response;
- paginating/loading more smart-search results leaves the smart facet request count unchanged.

- [ ] **Step 2: Run spaces route tests and confirm red**

Run:

```bash
cd web && pnpm exec vitest run 'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts'
```

Expected: FAIL because the spaces route still uses normal filter suggestions in search mode and does not pass smart facet totals.

- [ ] **Step 3: Implement spaces route smart facet provider**

In the spaces route, import the same utility functions and SDK method used by the photos route:

```ts
import {
  buildSmartSearchFacetKey,
  buildSmartSearchFacetsParams,
  mapSmartSearchFacetsToFilterSuggestions,
} from '$lib/utils/space-search';
```

Add `searchSmartFacets` and `type SmartSearchFacetsResponseDto` to the SDK imports.

Add state:

```ts
let smartFacets = $state<SmartSearchFacetsResponseDto>();
let smartFacetKey = $state('');
let smartFacetInFlight:
  | {
      key: string;
      controller: AbortController;
      promise: Promise<SmartSearchFacetsResponseDto | undefined>;
    }
  | undefined;
```

Add route helpers:

```ts
const timelineBuckets = $derived(
  timelineManager?.months?.map((m) => ({
    timeBucket: `${m.yearMonth.year}-${String(m.yearMonth.month).padStart(2, '0')}-01T00:00:00.000Z`,
    count: m.assetsCount,
  })) ?? [],
);

const smartFacetBuckets = $derived(showSearchResults ? (smartFacets?.timeBuckets ?? []) : timelineBuckets);
const smartFacetTotal = $derived(showSearchResults ? smartFacets?.total : undefined);

async function loadSpaceSmartFacets(nextFilters: FilterState): Promise<SmartSearchFacetsResponseDto | undefined> {
  const query = committedSearchQuery.trim();
  if (!query) {
    return undefined;
  }

  const key = buildSmartSearchFacetKey({ query, filters: nextFilters, spaceId: space.id });
  if (smartFacets && smartFacetKey === key) {
    return smartFacets;
  }
  if (smartFacetInFlight?.key === key) {
    return smartFacetInFlight.promise;
  }

  smartFacetInFlight?.controller.abort();
  const controller = new AbortController();

  const promise = searchSmartFacets(
    {
      smartSearchFacetsDto: buildSmartSearchFacetsParams({ query, filters: nextFilters, spaceId: space.id }),
    },
    { signal: controller.signal },
  )
    .then((result) => {
      if (smartFacetInFlight?.key === key && !controller.signal.aborted) {
        smartFacets = result;
        smartFacetKey = key;
      }
      return result;
    })
    .catch((error: unknown) => {
      console.error('Failed to fetch smart search facets:', error);
      return smartFacets;
    })
    .finally(() => {
      if (smartFacetInFlight?.key === key) {
        smartFacetInFlight = undefined;
      }
    });

  smartFacetInFlight = { key, controller, promise };
  return promise;
}
```

Update the spaces `suggestionsProvider` branch:

```ts
suggestionsProvider: async (nextFilters: FilterState) => {
  if (showSearchResults) {
    const facets = await loadSpaceSmartFacets(nextFilters);
    if (!facets) {
      return {
        countries: [],
        cities: [],
        cameraMakes: [],
        cameraModels: [],
        tags: [],
        people: [],
        ratings: [],
        mediaTypes: [],
        hasUnnamedPeople: false,
      };
    }

    const mapped = mapSmartSearchFacetsToFilterSuggestions(facets, { spaceId: space.id });
    for (const p of facets.people) {
      personNames.set(p.id, p.name);
    }
    for (const t of facets.tags) {
      tagNames.set(t.id, t.value);
    }
    return mapped;
  }

  return loadSpaceFilterSuggestions(nextFilters);
},
```

For search mode, override the dependent child providers as well:

```ts
providers: {
  ...normalProviders,
  cities: async (country) => {
    if (!showSearchResults) {
      return normalProviders.cities(country);
    }
    const query = committedSearchQuery.trim();
    if (!query) {
      return [];
    }
    const facets = await searchSmartFacets({
      smartSearchFacetsDto: buildSmartSearchFacetsParams({
        query,
        filters: { ...filters, country },
        spaceId: space.id,
      }),
    });
    return facets.cities;
  },
  cameraModels: async (make) => {
    if (!showSearchResults) {
      return normalProviders.cameraModels(make);
    }
    const query = committedSearchQuery.trim();
    if (!query) {
      return [];
    }
    const facets = await searchSmartFacets({
      smartSearchFacetsDto: buildSmartSearchFacetsParams({
        query,
        filters: { ...filters, make },
        spaceId: space.id,
      }),
    });
    return facets.cameraModels;
  },
},
```

These dependent provider calls must not update `smartFacets`, `smartFacetKey`, or the route result count.

Pass smart buckets and totals to `FilterPanel`, `ActiveFiltersBar`, and `SmartSearchResults`:

```svelte
{#key `${space.id}:${showSearchResults ? `search:${committedSearchQuery.trim()}` : 'timeline'}`}
  <FilterPanel
    config={filterConfig}
    bind:filters
    timeBuckets={smartFacetBuckets}
    hidden={isTimelineEmpty}
  />
{/key}
```

```svelte
resultCount={showSearchResults ? smartFacetTotal : totalAssetCount}
```

```svelte
<SmartSearchResults
  searchQuery={committedSearchQuery}
  bind:isLoading
  {filters}
  spaceId={space.id}
  isShared={true}
  total={smartFacetTotal}
/>
```

Clear facet state when `data.space.id` changes or the committed query clears:

```ts
smartFacets = undefined;
smartFacetKey = '';
smartFacetInFlight?.controller.abort();
smartFacetInFlight = undefined;
```

- [ ] **Step 4: Run spaces route tests and confirm green**

Run:

```bash
cd web && pnpm exec vitest run 'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts'
```

Expected: PASS.

- [ ] **Step 5: Commit the spaces route slice**

Run:

```bash
git add 'web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts'
git commit -m "feat: use smart facets on space search route"
```

---

### Task 10: Focused Regression And Edge Coverage

**Files:**

- Modify only files with failing edge tests from this task

- [ ] **Step 1: Run focused backend unit tests**

Run:

```bash
cd server && pnpm test -- --run src/controllers/search.controller.spec.ts src/services/search.service.spec.ts src/repositories/search.repository.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run focused backend medium tests**

Run:

```bash
cd server && pnpm test:medium -- --run test/medium/specs/repositories/search.repository.spec.ts test/medium/specs/services/search.service.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run focused web tests**

Run:

```bash
cd web && pnpm exec vitest run \
  src/lib/utils/__tests__/space-search.spec.ts \
  src/lib/components/spaces/space-search-results.spec.ts \
  src/lib/components/search/smart-search-results.spec.ts \
  'src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts' \
  'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts'
```

Expected: PASS.

- [ ] **Step 4: Run generated SDK and type checks**

Run:

```bash
pnpm --filter @immich/sdk build
pnpm --filter immich run check
pnpm --filter immich-web run check:typescript
pnpm --filter immich-web run check:svelte
```

Expected: PASS for all four commands.

- [ ] **Step 5: Run final formatting and diff checks**

Run:

```bash
pnpm --filter immich run format
pnpm --filter immich-web run format
git diff --check HEAD
```

Expected: PASS. `git diff --check HEAD` prints no whitespace errors.

- [ ] **Step 6: Verify explicit design edge cases**

Use this checklist before final handoff:

- [ ] `/photos?q=...` calls `searchSmartFacets` with `withSharedSpaces: true`.
- [ ] `/spaces/:spaceId/photos?q=...` calls `searchSmartFacets` with `spaceId`.
- [ ] Space selected people are sent as `spacePersonIds`.
- [ ] Legacy `/search?query=...` files are unchanged.
- [ ] Empty or whitespace-only committed queries do not fetch facets.
- [ ] `queryAssetId` works at API and service layers.
- [ ] `total` applies all filters.
- [ ] `timeBuckets` exclude only date and timeline filters.
- [ ] `people` excludes only selected people filters.
- [ ] `countries` excludes only country and city.
- [ ] `cameraMakes` excludes only make and model.
- [ ] `tags` excludes only selected tag IDs.
- [ ] `ratings` excludes only rating.
- [ ] `mediaTypes` excludes only media type.
- [ ] Rating and media controls remain visible because `FilterPanel` still ignores provider-returned ratings and media types for hiding.
- [ ] Sort-only URL changes do not change facet payload keys and do not send `order`.
- [ ] Loading more smart-search result pages does not fetch facets.
- [ ] Facet fetch failure keeps previous facet values when they exist and leaves results rendering.
- [ ] Changing or clearing the committed query remounts the filter panel provider so normal and smart suggestions do not remain stale.
- [ ] Stale facet responses cannot replace newer route facet state because state updates require the latest in-flight key.
- [ ] OpenAPI, TypeScript SDK, and Dart OpenAPI outputs include `SmartSearchFacetsDto`, `SmartSearchFacetsResponseDto`, and `searchSmartFacets`.

---

## Plan Review Checklist

- [x] Matches the design: dedicated `POST /search/smart/facets`, no legacy `/search` replacement, photos and spaces only, full exact candidate set, route-owned frontend fetching, independent result and facet loading, no hidden cap.
- [x] Uses TDD: every implementation slice starts with failing tests, a command to prove red, a minimal implementation step, a command to prove green, and a commit.
- [x] Covers backend API behavior: route auth, body forwarding, DTO validation, service validation, ML disabled, query and `queryAssetId`, access checks, shared-space scope, space people, language, embedding cache, and no order for facets.
- [x] Covers repository edge cases: full-candidate aggregation, no-match response, self-exclusion groups, rating threshold semantics, tag/person smart-search semantics, time bucket shape, and shared-space people.
- [x] Covers frontend behavior: payload builder, sort exclusion, search-mode buckets, normal-mode fallback, exact total display, spaces `spacePersonIds`, facet failure, and generated SDK usage.
- [x] Includes generated API work: full `make open-api` is in the plan so TypeScript and Dart clients stay consistent.

## Review Round Amendments

These amendments supersede earlier task snippets if they conflict. They were added after review against the design to keep the plan internally consistent before implementation.

### API And Semantics

- The generated SDK method is expected to be `searchSmartFacets(...)`. Keep the repository method name as `SearchRepository.getSmartSearchFacets(...)`.
- Add search-scoped dependent suggestions to `SmartSearchFacetsResponseDto`: `cities: string[]` and `cameraModels: string[]`.
- `countries` continues to self-exclude the whole location group (`country`, `city`), so the country list does not collapse when a city is active.
- `cities` self-excludes only `city` and respects an active `country`, so the city picker can show cities inside the currently selected country.
- `cameraMakes` continues to self-exclude the whole camera group (`make`, `model`), so the make list does not collapse when a model is active.
- `cameraModels` self-excludes only `model` and respects an active `make`, so the model picker can show models for the currently selected make.
- Design deviation: `queryAssetId` is supported at the controller/service/repository/API level in this slice, but photos and spaces route wiring for query-asset search is intentionally out of scope because those routes only carry text `q` today. Add route refetch behavior for `queryAssetId` when a route state source exists.
- `maxDistance` disabled (`0`, `null`, or `undefined`) means no distance cutoff. The facet candidate set is every accessible asset that has smart-search embedding data, matching the requested "full/exact/current behavior" semantics.
- `rating` matches existing search semantics: numeric rating is an inclusive minimum (`rating >= n`), `rating: null` means unrated assets, and rating filters self-exclude only the rating facet.
- Smart-search facet totals apply the active smart-search filters. Time buckets use the same local-date bucketing as `getTimeBuckets`, and the response shape remains `{ timeBucket, count }`.
- Return `mediaTypes` as `AssetType[]`, not arbitrary strings, so the response schema and repository type stay aligned.

### Repository Implementation

- Do not run all facet aggregation queries with `Promise.all` inside a single transaction. Materialize the unpaginated smart-search candidate set once, then run the facet queries serially in that transaction.
- The candidate table must not reuse the normal smart-search page size. Add a DB-backed test with more than one result page of matching assets (for example 125) and assert `total` and at least one facet include the full candidate set.
- Add repository tests for no active distance threshold, `rating: null`, numeric rating as inclusive minimum, `countries` vs `cities` self-exclusion, `cameraMakes` vs `cameraModels` self-exclusion, and inaccessible assets being excluded from `total` and every facet.
- Medium tests should obtain the repository through DI with a concrete service host, for example `newMediumService(BaseService, ...)` and `ctx.get(SearchRepository)`, rather than passing `SearchRepository` as the service class.

### Frontend Implementation

- Route code must call `searchSmartFacets(...)`; do not use the legacy `/search` endpoint or generated legacy filter suggestion helpers when `showSearchResults` is true.
- Use existing `createUrl(...)` helpers when mapping people and tag thumbnail URLs; do not hardcode `/api/...` strings.
- The photos route should use the project SDK mock (`sdkMock.searchSmartFacets`) in tests, not a local `vi.mock('@immich/sdk')` block.
- Search-mode dependent providers must also be search-scoped: photos/spaces `providers.cities(country, context)` should fetch smart facets with the active filters plus `country`, and `providers.cameraModels(make, context)` should fetch smart facets with the active filters plus `make`.
- Dependent provider requests should return `facets.cities` or `facets.cameraModels` and must not overwrite the main timeline count/facet state unless they are the main suggestions-provider request.
- Key `FilterPanel` by query and mode: photos use `photos-search-${q}` vs `photos-browse`; spaces use `spaces-search-${spaceId}-${q}` vs `spaces-browse-${spaceId}`. This remounts provider state when `q` changes or clears.
- Facet requests must be abortable and stale-safe. A newer query/filter request must be able to abort the previous request, and a late previous response must not overwrite the current count/facets.
- On facet request failure, preserve the previous known good smart-search total and suggestions while still logging the error. Add automated route tests that first show successful facets and then fail the next facet request.

### Required Test Coverage

- Backend unit tests: controller route and DTO validation including `rating: null`; service delegates full request data including `queryAssetId`; repository SQL/offline tests cover active filters and self-exclusion groups.
- Backend medium tests: unpaginated full-candidate aggregation beyond one result page; access control across owner/shared-space membership; no-threshold semantics; rating null/unrated semantics.
- Frontend unit tests: payload builder preserves all supported filters and search context; facet mapping includes people, tags, media types, ratings, country/city, and make/model fields; failed facet fetch preserves previous result count and suggestions; changing or clearing `q` remounts/refetches filter suggestions and prevents stale results; active filter changes refetch facets and reset result pagination; load-more pagination does not refetch or mutate facet totals; spaces search sends `spaceId` and does not leak photos-route facet state.
