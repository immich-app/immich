# Filterable Timeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a collapsible filter panel to the Spaces timeline that enables in-place
filtering by people, location, camera, tags, rating, and media type — with a temporal
year→month picker and sort direction toggle.

**Architecture:** Extend the timeline server endpoints (`GET /timeline/buckets` and
`GET /timeline/bucket`) with EXIF filter parameters (city, country, make, model, rating,
type) and upgrade single-value person/tag fields to arrays with OR semantics. Build a
generic, view-agnostic `FilterPanel` Svelte 5 component that receives configuration and
data providers. V1 integrates into the Spaces page (fork-only code, zero upstream
conflict). Add space-scoped suggestions via optional `spaceId` on the existing
`GET /search/suggestions` endpoint.

**Tech Stack:** SvelteKit + Svelte 5 runes (web), NestJS + Kysely (server), Vitest
(unit/medium tests), Playwright (E2E), `@immich/ui` component library, MDI icons.

**Design reference:** `docs/plans/2026-03-22-discovery-page-design.md`

**Visual reference:** `docs/plans/mockups/discovery-independent-panel.html` (open in
browser — the "Left" option shows expanded + collapsed states).

---

## Task 1: Create `hasAnyPerson()` and `hasAnySpacePerson()` helpers

**Files:**

- Modify: `server/src/utils/database.ts` (add after `hasPeople` at line 172)
- Test: `server/src/services/timeline.service.spec.ts`

**Step 1: Write failing test**

In `server/src/services/timeline.service.spec.ts`, add:

```typescript
it('should pass personIds array to time bucket options', async () => {
  mocks.asset.getTimeBuckets.mockResolvedValue([]);
  await sut.getTimeBuckets(authStub.admin, { personIds: ['person-1', 'person-2'] });
  expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(
    expect.objectContaining({ personIds: ['person-1', 'person-2'] }),
  );
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/services/timeline.service.spec.ts`

Expected: FAIL — `personIds` not a valid property on `TimeBucketDto`.

**Step 3: Implement `hasAnyPerson()` helper**

In `server/src/utils/database.ts`, add after `hasPeople` (line 172):

```typescript
export function hasAnyPerson<O>(qb: SelectQueryBuilder<DB, 'asset', O>, personIds: string[]) {
  return qb.innerJoin(
    (eb) =>
      eb
        .selectFrom('asset_face')
        .select('assetId')
        .where('personId', '=', anyUuid(personIds))
        .where('deletedAt', 'is', null)
        .where('isVisible', 'is', true)
        .groupBy('assetId')
        .as('has_any_person'),
    (join) => join.onRef('has_any_person.assetId', '=', 'asset.id'),
  );
}
```

Note: Same as `hasPeople` but WITHOUT the `.having(count = length)` check. This gives
OR semantics — assets with ANY of the selected people are returned.

**Step 4: Implement `hasAnySpacePerson()` helper**

In `server/src/utils/database.ts`, add after `hasSpacePerson` (line 184):

```typescript
export function hasAnySpacePerson<O>(qb: SelectQueryBuilder<DB, 'asset', O>, spacePersonIds: string[]) {
  return qb.where((eb) =>
    eb.exists(
      eb
        .selectFrom('shared_space_person_face')
        .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
        .whereRef('asset_face.assetId', '=', 'asset.id')
        .where('shared_space_person_face.personId', '=', anyUuid(spacePersonIds)),
    ),
  );
}
```

**Step 5: Implement `withAnyTagId()` helper**

In `server/src/utils/database.ts`, add after `withTagId` (line 251):

```typescript
export function withAnyTagId<O>(qb: SelectQueryBuilder<DB, 'asset', O>, tagIds: string[]) {
  return qb.where((eb) =>
    eb.exists(
      eb
        .selectFrom('tag_closure')
        .innerJoin('tag_asset', 'tag_asset.tagId', 'tag_closure.id_descendant')
        .whereRef('tag_asset.assetId', '=', 'asset.id')
        .where('tag_closure.id_ancestor', '=', anyUuid(tagIds)),
    ),
  );
}
```

Note: Preserves tag hierarchy via `tag_closure` — selecting a parent tag includes
child-tagged photos. Uses `anyUuid` for OR across multiple tag IDs.

**Step 6: Run test to verify it passes**

The test from Step 1 won't pass yet — we need Task 2 (DTO changes) first. But verify
the helpers compile:

Run: `cd server && npx tsc --noEmit`

Expected: No type errors.

**Step 7: Commit**

```
feat(server): add hasAnyPerson, hasAnySpacePerson, withAnyTagId helpers

New OR-logic helpers for multi-select filtering. Existing AND-logic
helpers (hasPeople, hasSpacePerson, withTagId) are unchanged —
search depends on their AND semantics.
```

---

## Task 2: Extend `TimeBucketDto` with filter params and array upgrades

**Files:**

- Modify: `server/src/dtos/time-bucket.dto.ts` (add new fields)
- Modify: `server/src/repositories/asset.repository.ts:73-95` (update
  `AssetBuilderOptions` and `TimeBucketOptions`)
- Modify: `server/src/services/timeline.service.ts:55-77` (update access checks)
- Test: `server/src/services/timeline.service.spec.ts`

**Step 1: Write failing tests**

Add to `server/src/services/timeline.service.spec.ts`:

```typescript
it('should pass city filter to time bucket options', async () => {
  mocks.asset.getTimeBuckets.mockResolvedValue([]);
  await sut.getTimeBuckets(authStub.admin, { city: 'Munich' });
  expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ city: 'Munich' }));
});

it('should pass rating filter to time bucket options', async () => {
  mocks.asset.getTimeBuckets.mockResolvedValue([]);
  await sut.getTimeBuckets(authStub.admin, { rating: 3 });
  expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ rating: 3 }));
});

it('should pass type filter to time bucket options', async () => {
  mocks.asset.getTimeBuckets.mockResolvedValue([]);
  await sut.getTimeBuckets(authStub.admin, { type: AssetType.Image });
  expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ assetType: AssetType.Image }));
});

it('should accept deprecated personId and normalize to personIds', async () => {
  mocks.asset.getTimeBuckets.mockResolvedValue([]);
  await sut.getTimeBuckets(authStub.admin, { personId: 'person-1' });
  expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ personIds: ['person-1'] }));
});

it('should check tag access for each tagId in tagIds array', async () => {
  mocks.asset.getTimeBuckets.mockResolvedValue([]);
  await sut.getTimeBuckets(authStub.admin, { tagIds: ['tag-1', 'tag-2'] });
  expect(mocks.access.checkAccess).toHaveBeenCalledWith(
    expect.objectContaining({ permission: expect.stringContaining('Tag') }),
  );
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/timeline.service.spec.ts`

**Step 3: Update `TimeBucketDto`**

In `server/src/dtos/time-bucket.dto.ts`, add new fields after the existing ones
(before the closing brace). Keep old fields as deprecated aliases:

```typescript
// --- Array upgrades (multi-select, OR semantics) ---

@ValidateUUID({ each: true, optional: true })
personIds?: string[];

@ValidateUUID({ each: true, optional: true })
spacePersonIds?: string[];

@ValidateUUID({ each: true, optional: true })
tagIds?: string[];

// --- EXIF filters (new) ---

@ApiPropertyOptional({ description: 'Filter by city name' })
@IsString()
@Optional()
city?: string;

@ApiPropertyOptional({ description: 'Filter by country name' })
@IsString()
@Optional()
country?: string;

@ApiPropertyOptional({ description: 'Filter by camera make' })
@IsString()
@Optional()
make?: string;

@ApiPropertyOptional({ description: 'Filter by camera model' })
@IsString()
@Optional()
model?: string;

@ApiPropertyOptional({ description: 'Minimum star rating (>=)' })
@IsInt()
@Min(1)
@Max(5)
@Optional()
rating?: number;

@ValidateEnum({
  enum: AssetType,
  name: 'AssetType',
  optional: true,
  description: 'Filter by asset type (IMAGE or VIDEO)',
})
type?: AssetType;
```

Add necessary imports: `IsString`, `IsInt`, `Min`, `Max`, `Optional` from
`class-validator`; `AssetType` from `src/enum`.

**Step 4: Update `AssetBuilderOptions` and `TimeBucketOptions`**

In `server/src/repositories/asset.repository.ts`, update `AssetBuilderOptions` (line 73):

```typescript
interface AssetBuilderOptions {
  // ... existing fields ...
  personId?: string; // deprecated, use personIds
  personIds?: string[]; // NEW: multi-select OR
  spacePersonId?: string; // deprecated, use spacePersonIds
  spacePersonIds?: string[]; // NEW: multi-select OR
  tagId?: string; // deprecated, use tagIds
  tagIds?: string[]; // NEW: multi-select OR
  // ... existing fields ...
  // NEW EXIF filters:
  city?: string;
  country?: string;
  make?: string;
  model?: string;
  rating?: number;
}
```

**Step 5: Update `buildTimeBucketOptions` in timeline service**

In `server/src/services/timeline.service.ts`, update `buildTimeBucketOptions` to
normalize deprecated single-value fields to arrays:

```typescript
private async buildTimeBucketOptions(auth: AuthDto, dto: TimeBucketDto): Promise<TimeBucketOptions> {
  const { userId, personId, spacePersonId, tagId, type, ...options } = dto;

  // Normalize deprecated single-value fields to arrays
  if (personId && !options.personIds?.length) {
    options.personIds = [personId];
  }
  if (spacePersonId && !options.spacePersonIds?.length) {
    options.spacePersonIds = [spacePersonId];
  }
  if (tagId && !options.tagIds?.length) {
    options.tagIds = [tagId];
  }
  // Map type to assetType
  if (type) {
    (options as any).assetType = type;
  }

  // ... existing userId / partner / space logic unchanged ...
}
```

**Step 6: Update `timeBucketChecks` for tagIds array**

In `server/src/services/timeline.service.ts`, update the tag access check (line 75):

```typescript
// Before:
if (dto.tagId) {
  await this.requireAccess({ auth, permission: Permission.TagRead, ids: [dto.tagId] });
}

// After:
const allTagIds = dto.tagIds ?? (dto.tagId ? [dto.tagId] : []);
if (allTagIds.length > 0) {
  await this.requireAccess({ auth, permission: Permission.TagRead, ids: allTagIds });
}
```

**Step 7: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/timeline.service.spec.ts`

**Step 8: Commit**

```
feat(server): extend TimeBucketDto with EXIF filters and array fields

Adds city, country, make, model, rating, type filter params.
Upgrades personId→personIds, spacePersonId→spacePersonIds,
tagId→tagIds (arrays, OR semantics). Old single-value fields kept
as deprecated aliases for backward compatibility.
```

---

## Task 3: Wire EXIF filters into `getTimeBuckets` and `getTimeBucket` CTE

**Files:**

- Modify: `server/src/repositories/asset.repository.ts:701-773` (getTimeBuckets CTE)
- Modify: `server/src/repositories/asset.repository.ts:776-905` (getTimeBucket CTE)
- Test: `server/src/services/timeline.service.spec.ts`

**Step 1: Write failing test**

```typescript
it('should pass city to getTimeBuckets repository call', async () => {
  mocks.asset.getTimeBuckets.mockResolvedValue([]);
  await sut.getTimeBuckets(authStub.admin, { city: 'Munich' });
  expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ city: 'Munich' }));
});
```

**Step 2: Run to verify failure**

Run: `cd server && pnpm test -- --run src/services/timeline.service.spec.ts`

**Step 3: Update `getTimeBuckets` CTE with EXIF filters**

In `server/src/repositories/asset.repository.ts`, in the `getTimeBuckets` method:

1. Replace the existing conditional `bbox`-only `asset_exif` join (line 715) with a
   unified conditional join:

```typescript
.$if(
  !!options.bbox || !!options.city || !!options.country || !!options.make || !!options.model || options.rating !== undefined,
  (qb) => {
    let q = qb.innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId');

    // Existing bbox logic
    if (options.bbox) {
      const circle = getBoundingCircle(options.bbox);
      q = q.where(/* existing bbox WHERE clauses */);
    }

    // New EXIF filters
    if (options.city) q = q.where('asset_exif.city', '=', options.city);
    if (options.country) q = q.where('asset_exif.country', '=', options.country);
    if (options.make) q = q.where('asset_exif.make', '=', options.make);
    if (options.model) q = q.where('asset_exif.model', '=', options.model);
    if (options.rating !== undefined) q = q.where('asset_exif.rating', '>=', options.rating);

    return q;
  },
)
```

2. Replace the single-value person/tag checks with array versions:

```typescript
// Replace line 737 (personId is already normalized to personIds by service layer):
// .$if(!!options.personId, (qb) => hasPeople(qb, [options.personId!]))
.$if(!!options.personIds?.length, (qb) => hasAnyPerson(qb, options.personIds!))

// Replace line 738 (spacePersonId normalized to spacePersonIds by service layer):
// .$if(!!options.spacePersonId, (qb) => hasSpacePerson(qb, options.spacePersonId!))
.$if(!!options.spacePersonIds?.length, (qb) => hasAnySpacePerson(qb, options.spacePersonIds!))

// Replace line 766 (tagId normalized to tagIds by service layer):
// .$if(!!options.tagId, (qb) => withTagId(qb, options.tagId!))
.$if(!!options.tagIds?.length, (qb) => withAnyTagId(qb, options.tagIds!))
```

Note: The old single-value fields (`personId`, `spacePersonId`, `tagId`) are normalized
to arrays by `buildTimeBucketOptions` in the service layer (Task 2), so the repository
only needs to handle the array versions. No fallback chains needed here.

3. Add the asset type filter (no join needed):

```typescript
.$if(!!options.assetType, (qb) => qb.where('asset.type', '=', options.assetType!))
```

(This line may already exist — check first.)

**Step 4: Update `getTimeBucket` CTE with same filters**

In `getTimeBucket` (line 776+), `asset_exif` is already joined unconditionally at
line 785. Add WHERE clauses only:

```typescript
.$if(!!options.city, (qb) => qb.where('asset_exif.city', '=', options.city!))
.$if(!!options.country, (qb) => qb.where('asset_exif.country', '=', options.country!))
.$if(!!options.make, (qb) => qb.where('asset_exif.make', '=', options.make!))
.$if(!!options.model, (qb) => qb.where('asset_exif.model', '=', options.model!))
.$if(options.rating !== undefined, (qb) => qb.where('asset_exif.rating', '>=', options.rating!))
```

Apply the same person/tag array upgrades as in `getTimeBuckets` (replace lines 853-854
and 903).

Import the new helpers at the top of the file:

```typescript
import { hasAnyPerson, hasAnySpacePerson, withAnyTagId } from 'src/utils/database';
```

**Step 5: Run tests**

Run: `cd server && pnpm test -- --run src/services/timeline.service.spec.ts`

**Step 6: Commit**

```
feat(server): wire EXIF filters and array helpers into timeline CTE

getTimeBuckets: unified conditional asset_exif join for bbox + EXIF.
getTimeBucket: WHERE clauses only (join already exists).
Both support personIds[], spacePersonIds[], tagIds[] with OR logic.
Rating uses >= semantics.
```

---

## Task 4: Add `spaceId` to search suggestions endpoint

**Files:**

- Modify: `server/src/dtos/search.dto.ts:303-338` (add `spaceId` to
  `SearchSuggestionRequestDto`)
- Modify: `server/src/repositories/search.repository.ts:511-524` (scope
  `getExifField` by `spaceId`)
- Modify: `server/src/services/search.service.ts:171-195` (pass `spaceId` through)
- Test: `server/src/services/search.service.spec.ts`

**Step 1: Write failing test**

In `server/src/services/search.service.spec.ts`, add:

```typescript
it('should pass spaceId to search suggestions', async () => {
  mocks.search.getCountries.mockResolvedValue(['Germany']);
  const result = await sut.getSearchSuggestions(authStub.admin, {
    type: SearchSuggestionType.COUNTRY,
    spaceId: 'space-1',
  });
  expect(mocks.search.getCountries).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ spaceId: 'space-1' }),
  );
});
```

**Step 2: Run to verify failure**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts`

**Step 3: Add `spaceId` to `SearchSuggestionRequestDto`**

In `server/src/dtos/search.dto.ts`, add to `SearchSuggestionRequestDto`:

```typescript
@ValidateUUID({ optional: true, description: 'Scope suggestions to a specific shared space' })
spaceId?: string;
```

**Step 4: Update `getExifField` to accept and use `spaceId`**

In `server/src/repositories/search.repository.ts`, update the signature and add the
EXISTS subquery:

```typescript
private getExifField<K extends 'city' | 'state' | 'country' | 'make' | 'model' | 'lensModel'>(
  field: K,
  userIds: string[],
  options?: { spaceId?: string },
) {
  return this.db
    .selectFrom('asset_exif')
    .select(field)
    .distinctOn(field)
    .innerJoin('asset', 'asset.id', 'asset_exif.assetId')
    .where('ownerId', '=', anyUuid(userIds))
    .where('visibility', '=', AssetVisibility.Timeline)
    .where('deletedAt', 'is', null)
    .where(field, 'is not', null)
    .$if(!!options?.spaceId, (qb) =>
      qb.where((eb) =>
        eb.exists(
          eb
            .selectFrom('shared_space_asset')
            .whereRef('shared_space_asset.assetId', '=', 'asset.id')
            .where('shared_space_asset.spaceId', '=', asUuid(options!.spaceId!)),
        ),
      ),
    );
}
```

Update all callers (`getCountries`, `getStates`, `getCities`, `getCameraMakes`,
`getCameraModels`, `getCameraLensModels`) to pass the dto/options through.

**Step 5: Update `getSuggestions` to pass `spaceId`**

In `server/src/services/search.service.ts`, update each case in `getSuggestions` to
pass `dto` (which now contains `spaceId`) through to the repository methods.

**Step 6: Run tests**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts`

**Step 7: Commit**

```
feat(server): add spaceId scoping to search suggestions endpoint

GET /search/suggestions now accepts optional spaceId parameter.
When provided, only returns values from assets in that space.
Backward compatible — omitting spaceId returns global results.
```

---

## Task 5: Regenerate OpenAPI SDK

**Files:**

- Regenerate: `open-api/typescript-sdk/src/fetch-client.ts`
- Regenerate: `open-api/immich-openapi-specs.json`

**Step 1: Build server and regenerate**

```bash
cd server && pnpm build
cd server && pnpm sync:open-api
make open-api-typescript
```

**Step 2: Verify new types appear in SDK**

```bash
grep -n "personIds\|tagIds\|spacePersonIds\|AssetSortBy\|city.*string\|rating.*number" open-api/typescript-sdk/src/fetch-client.ts | head -20
```

**Step 3: Run lint and type checks**

```bash
make lint-server && make check-server
```

**Step 4: Commit**

```
chore: regenerate OpenAPI SDK with timeline filter params
```

---

## Task 6: Create `FilterPanel` component shell and `FilterSection` wrapper

**Files:**

- Create: `web/src/lib/components/filter-panel/filter-panel.svelte`
- Create: `web/src/lib/components/filter-panel/filter-section.svelte`
- Create: `web/src/lib/components/filter-panel/filter-panel.ts` (types)
- Test: `web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`

**Step 1: Write failing test**

Create `web/src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`:

```typescript
import { render } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { describe, it, expect, beforeAll } from 'vitest';
import FilterPanel from '../filter-panel.svelte';

describe('FilterPanel', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it('should render configured sections only', () => {
    const { queryByTestId } = render(FilterPanel, {
      props: {
        config: {
          sections: ['people', 'rating'],
          providers: {},
        },
        timeBuckets: [],
        onFilterChange: () => {},
      },
    });
    expect(queryByTestId('filter-section-people')).toBeTruthy();
    expect(queryByTestId('filter-section-rating')).toBeTruthy();
    expect(queryByTestId('filter-section-location')).toBeNull();
    expect(queryByTestId('filter-section-camera')).toBeNull();
  });

  it('should hide sections not in config', () => {
    const { queryByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['rating'], providers: {} },
        timeBuckets: [],
        onFilterChange: () => {},
      },
    });
    expect(queryByTestId('filter-section-people')).toBeNull();
    expect(queryByTestId('filter-section-location')).toBeNull();
    expect(queryByTestId('filter-section-camera')).toBeNull();
    expect(queryByTestId('filter-section-tags')).toBeNull();
    expect(queryByTestId('filter-section-media')).toBeNull();
    expect(queryByTestId('filter-section-rating')).toBeTruthy();
  });

  it('should collapse to icon strip', async () => {
    const { getByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['people', 'location'], providers: {} },
        timeBuckets: [],
        onFilterChange: () => {},
      },
    });
    const collapseBtn = getByTestId('collapse-panel-btn');
    await collapseBtn.click();
    expect(getByTestId('collapsed-icon-strip')).toBeTruthy();
  });

  it('should preserve filter state when collapsing and expanding', async () => {
    // Set a filter, collapse, expand, verify filter still active
  });

  it('should show badge dots on collapsed icons with active filters', async () => {
    // Set person filter, collapse, verify people icon has badge
    // Verify camera icon does NOT have badge
  });

  it('should show no badges when no filters active', async () => {
    // Collapse with no filters, verify no badge dots
  });

  it('should expand and scroll to section when collapsed icon clicked', async () => {
    // Collapse, click people icon, verify panel expanded
  });
});
```

**Step 2: Run to verify failure**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`

**Step 3: Create types file**

Create `web/src/lib/components/filter-panel/filter-panel.ts`:

```typescript
export type FilterSection = 'timeline' | 'people' | 'location' | 'camera' | 'tags' | 'rating' | 'media';

export interface PersonOption {
  id: string;
  name: string;
  thumbnailPath?: string;
}

export interface LocationOption {
  value: string;
  type: 'country' | 'city';
}

export interface CameraOption {
  value: string;
  type: 'make' | 'model';
}

export interface TagOption {
  id: string;
  name: string;
}

export interface FilterPanelConfig {
  sections: FilterSection[];
  providers: {
    people?: () => Promise<PersonOption[]>;
    locations?: () => Promise<LocationOption[]>;
    cameras?: () => Promise<CameraOption[]>;
    tags?: () => Promise<TagOption[]>;
  };
}

export interface FilterState {
  personIds: string[];
  city?: string;
  country?: string;
  make?: string;
  model?: string;
  tagIds: string[];
  rating?: number;
  mediaType: 'all' | 'image' | 'video';
  sortOrder: 'asc' | 'desc';
}

// Client-only view state (not sent to server)
export interface FilterViewState {
  selectedYear?: number;
  selectedMonth?: number;
  collapsed: boolean;
}

export function createFilterState(): FilterState {
  return {
    personIds: [],
    tagIds: [],
    mediaType: 'all',
    sortOrder: 'desc',
  };
}

export function getActiveFilterCount(state: FilterState): number {
  return (
    (state.personIds.length > 0 ? 1 : 0) +
    (state.city ? 1 : 0) +
    (state.country && !state.city ? 1 : 0) +
    (state.make ? 1 : 0) +
    (state.tagIds.length > 0 ? 1 : 0) +
    (state.rating !== undefined ? 1 : 0) +
    (state.mediaType !== 'all' ? 1 : 0)
  );
}

export function clearFilters(state: FilterState): FilterState {
  return {
    ...state,
    personIds: [],
    city: undefined,
    country: undefined,
    make: undefined,
    model: undefined,
    tagIds: [],
    rating: undefined,
    mediaType: 'all',
    // sortOrder is NOT cleared — it's a view preference
  };
}
```

**Step 4: Implement `filter-section.svelte`**

Create `web/src/lib/components/filter-panel/filter-section.svelte`:

```svelte
<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiChevronDown } from '@mdi/js';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    testId: string;
    children: Snippet;
  }

  let { title, testId, children }: Props = $props();
  let expanded = $state(true);
</script>

<div class="border-b border-[var(--border)]" data-testid="filter-section-{testId}">
  <button
    class="flex w-full items-center justify-between px-3 py-2.5 hover:bg-[var(--primary-soft)]"
    onclick={() => (expanded = !expanded)}
  >
    <span class="text-[10px] font-bold uppercase tracking-[0.7px] text-[var(--fg-muted)]">
      {title}
    </span>
    <Icon
      icon={mdiChevronDown}
      size="14"
      class="text-[var(--fg-faint)] transition-transform {expanded ? '' : '-rotate-90'}"
    />
  </button>
  {#if expanded}
    <div class="px-3 pb-2.5">
      {@render children()}
    </div>
  {/if}
</div>
```

**Step 5: Implement `filter-panel.svelte` shell**

Create `web/src/lib/components/filter-panel/filter-panel.svelte`:

```svelte
<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiChevronLeft, mdiChevronRight, mdiCalendar, mdiAccount, mdiMapMarker, mdiCamera, mdiTag, mdiStar, mdiImage } from '@mdi/js';
  import type { FilterPanelConfig, FilterState } from './filter-panel';
  import { createFilterState, getActiveFilterCount } from './filter-panel';
  import FilterSection from './filter-section.svelte';

  interface Props {
    config: FilterPanelConfig;
    timeBuckets: Array<{ timeBucket: string; count: number }>;
    onFilterChange: (filters: FilterState) => void;
  }

  let { config, timeBuckets, onFilterChange }: Props = $props();
  let collapsed = $state(false);
  let filters = $state(createFilterState());

  const sectionIcons: Record<string, string> = {
    timeline: mdiCalendar,
    people: mdiAccount,
    location: mdiMapMarker,
    camera: mdiCamera,
    tags: mdiTag,
    rating: mdiStar,
    media: mdiImage,
  };

  function hasActiveFilter(section: string): boolean {
    switch (section) {
      case 'people': return filters.personIds.length > 0;
      case 'location': return !!filters.city || !!filters.country;
      case 'camera': return !!filters.make;
      case 'tags': return filters.tagIds.length > 0;
      case 'rating': return filters.rating !== undefined;
      case 'media': return filters.mediaType !== 'all';
      default: return false;
    }
  }
</script>

{#if collapsed}
  <div class="flex w-8 flex-col items-center gap-3 border-r border-[var(--border)] bg-[#131316] py-2"
       data-testid="collapsed-icon-strip">
    <button
      class="flex h-6 w-6 items-center justify-center rounded-md text-[var(--fg-faint)] hover:bg-[var(--primary-soft)]"
      onclick={() => (collapsed = false)}
      data-testid="expand-panel-btn"
    >
      <Icon icon={mdiChevronRight} size="16" />
    </button>
    {#each config.sections as section}
      <button
        class="relative flex h-6 w-6 items-center justify-center rounded-md text-[var(--fg-faint)] hover:bg-[var(--primary-soft)]"
        onclick={() => (collapsed = false)}
      >
        <Icon icon={sectionIcons[section]} size="16" />
        {#if hasActiveFilter(section) && section !== 'tags' && section !== 'media'}
          <!-- Badges only on: timeline, people, location, camera, rating (per design spec) -->
          <span class="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--primary)] border-[1.5px] border-[#131316]"></span>
        {/if}
      </button>
    {/each}
  </div>
{:else}
  <div class="flex w-60 flex-col overflow-y-auto border-r border-[var(--border)] bg-[#131316] scrollbar-thin"
       data-testid="discovery-panel">
    <!-- Header -->
    <div class="sticky top-0 z-5 flex items-center justify-between border-b border-[var(--border)] bg-[#131316] px-3 py-2.5">
      <span class="text-[13px] font-semibold">Filters</span>
      <button
        class="flex h-6 w-6 items-center justify-center rounded-full text-[var(--fg-muted)]"
        onclick={() => (collapsed = true)}
        data-testid="collapse-panel-btn"
      >
        <Icon icon={mdiChevronLeft} size="14" />
      </button>
    </div>

    <!-- Sections rendered based on config -->
    {#each config.sections as section}
      {#if section === 'timeline'}
        <FilterSection title="Timeline" testId="timeline">
          <p class="text-xs text-[var(--fg-muted)]">Temporal picker placeholder</p>
        </FilterSection>
      {:else if section === 'people'}
        <FilterSection title="People" testId="people">
          <p class="text-xs text-[var(--fg-muted)]">People filter placeholder</p>
        </FilterSection>
      {:else if section === 'location'}
        <FilterSection title="Location" testId="location">
          <p class="text-xs text-[var(--fg-muted)]">Location filter placeholder</p>
        </FilterSection>
      {:else if section === 'camera'}
        <FilterSection title="Camera" testId="camera">
          <p class="text-xs text-[var(--fg-muted)]">Camera filter placeholder</p>
        </FilterSection>
      {:else if section === 'tags'}
        <FilterSection title="Tags" testId="tags">
          <p class="text-xs text-[var(--fg-muted)]">Tags filter placeholder</p>
        </FilterSection>
      {:else if section === 'rating'}
        <FilterSection title="Rating" testId="rating">
          <p class="text-xs text-[var(--fg-muted)]">Rating filter placeholder</p>
        </FilterSection>
      {:else if section === 'media'}
        <FilterSection title="Media Type" testId="media">
          <p class="text-xs text-[var(--fg-muted)]">Media type filter placeholder</p>
        </FilterSection>
      {/if}
    {/each}
  </div>
{/if}
```

**Step 6: Run tests**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`

**Step 7: Commit**

```
feat(web): add FilterPanel shell with collapsible sections and types
```

---

## Task 7: Build temporal picker component

**Files:**

- Create: `web/src/lib/components/filter-panel/temporal-picker.svelte`
- Test: `web/src/lib/components/filter-panel/__tests__/temporal-picker.spec.ts`

**Design reference:** `docs/plans/mockups/discovery-navigation-phase3.html` — year chips
with volume bars (4-column grid), month drill-down (4-column grid), breadcrumb.

**Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { aggregateYears, getMonthsForYear } from '../temporal-picker.svelte';

describe('TemporalPicker', () => {
  const buckets = [
    { timeBucket: '2020-01-01', count: 100 },
    { timeBucket: '2020-06-01', count: 200 },
    { timeBucket: '2020-08-01', count: 400 },
    { timeBucket: '2021-03-01', count: 150 },
    { timeBucket: '2021-07-01', count: 50 },
  ];

  it('should aggregate monthly buckets into year counts', () => {
    const years = aggregateYears(buckets);
    expect(years).toHaveLength(2);
    expect(years[0]).toEqual({ year: 2020, count: 700, volumePercent: 100 });
    expect(years[1]).toEqual({ year: 2021, count: 200, volumePercent: expect.closeTo(28.6, 0) });
  });

  it('should calculate relative volume (max year = 100%)', () => {
    const years = aggregateYears(buckets);
    expect(years[0].volumePercent).toBe(100);
    expect(years[1].volumePercent).toBeLessThan(100);
  });

  it('should return months for a specific year', () => {
    const months = getMonthsForYear(buckets, 2020);
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ month: 1, label: 'Jan', count: 100 });
    expect(months[5]).toEqual({ month: 6, label: 'Jun', count: 200 });
    expect(months[7]).toEqual({ month: 8, label: 'Aug', count: 400 });
    expect(months[1]).toEqual({ month: 2, label: 'Feb', count: 0 });
  });

  it('should handle empty buckets', () => {
    const years = aggregateYears([]);
    expect(years).toHaveLength(0);
  });

  it('should handle single bucket', () => {
    const years = aggregateYears([{ timeBucket: '2023-05-01', count: 42 }]);
    expect(years).toHaveLength(1);
    expect(years[0]).toEqual({ year: 2023, count: 42, volumePercent: 100 });
  });
});
```

**Step 2: Run to verify failure**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/temporal-picker.spec.ts`

**Step 3: Implement temporal picker**

Create `web/src/lib/components/filter-panel/temporal-picker.svelte` with:

- Exported `aggregateYears()` and `getMonthsForYear()` functions
- Year chips in a 4-column flex-wrap grid with count and volume bar
- When a year is clicked: show month grid (4-column CSS grid) below with breadcrumb
- Breadcrumb: "All" link (primary color) / year (bold)
- Events: `onyearselect` and `onmonthselect` callbacks
- Style per mockup: 10px font, 4px border-radius, 2px volume bars

**Step 4: Run tests**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/temporal-picker.spec.ts`

**Step 5: Wire into FilterPanel**

Replace the temporal picker placeholder in `filter-panel.svelte` with the real component.

**Step 6: Commit**

```
feat(web): add temporal picker with year/month aggregation and volume bars
```

---

## Task 8: Build people, location, and camera filter components

**Files:**

- Create: `web/src/lib/components/filter-panel/people-filter.svelte`
- Create: `web/src/lib/components/filter-panel/location-filter.svelte`
- Create: `web/src/lib/components/filter-panel/camera-filter.svelte`
- Test: `web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts`

**Design reference:** `docs/plans/mockups/discovery-independent-panel.html` —
People: multi-select checkboxes with avatar + search input + "Show N more".
Location: single-select radio, hierarchical country→city.
Camera: single-select radio, hierarchical make→model.

**Step 1: Write failing tests**

```typescript
describe('PeopleFilter', () => {
  it('should render people with checkboxes (multi-select)', () => {
    // Render with test people data
    // Assert multiple checkboxes can be active simultaneously
  });

  it('should deselect and remove from selection array', () => {
    // Select two people, deselect one, verify array has only the other
  });

  it('should filter by search input', () => {
    // Type in search box, assert list filters
  });

  it('should show "Show N more" for long lists', () => {
    // Render with 20+ people, assert only first N shown with button
  });

  it('should emit correct filter state on selection', () => {
    // Select a person, verify onFilterChange called with personIds
  });
});

describe('LocationFilter', () => {
  it('should render countries with radio buttons (single-select)', () => {
    // Render with test countries
    // Assert radio-style (selecting B deselects A)
  });

  it('should expand cities when country selected', () => {
    // Select country, assert second fetch for cities triggers, cities appear indented
  });

  it('should auto-fill country when city selected', () => {
    // Select a city, verify country is also set in filter state
  });

  it('should show empty message when no locations exist', () => {
    // Render with empty provider, assert "No locations in this space" message
  });
});

describe('CameraFilter', () => {
  it('should render makes with radio buttons (single-select)', () => {
    // Render with test camera makes
    // Assert radio-style single selection
  });

  it('should expand models when make selected', () => {
    // Select make, assert second fetch for models triggers, models appear
  });

  it('should auto-fill make when model selected', () => {
    // Select a model, verify make is also set in filter state
  });

  it('should show empty message when no cameras exist', () => {
    // Render with empty provider, assert "No cameras in this space" message
  });
});
```

**Step 2–4: Implement and test each component**

Each component receives its filter options from the parent's data provider and emits
changes back via a callback. Follow the visual spec in the design doc for exact styling.

**Step 5: Wire into FilterPanel**

Replace placeholder content in `filter-panel.svelte` with real components.

**Step 6: Commit**

```
feat(web): add people, location, and camera filter components
```

---

## Task 9: Build tags, rating, and media type filter components

**Files:**

- Create: `web/src/lib/components/filter-panel/tags-filter.svelte`
- Create: `web/src/lib/components/filter-panel/rating-filter.svelte`
- Create: `web/src/lib/components/filter-panel/media-type-filter.svelte`
- Test: `web/src/lib/components/filter-panel/__tests__/filter-sections-2.spec.ts`

**Design reference:** See design doc Visual Specification section.

**Step 1: Write failing tests**

```typescript
describe('TagsFilter', () => {
  it('should render tags with checkboxes (multi-select)', () => {});
  it('should show all user tags (not space-scoped in V1)', () => {});
  it('should show empty message when user has no tags', () => {});
});

describe('RatingFilter', () => {
  it('should highlight stars up to selected rating', () => {});
  it('should clear rating when same star clicked again', () => {});
});

describe('MediaTypeFilter', () => {
  it('should default to All', () => {});
  it('should toggle between All, Photos, Videos', () => {});
});
```

**Step 2–5: Implement, test, wire, commit**

```
feat(web): add tags, rating, and media type filter components
```

---

## Task 10: Build sort toggle and active filters bar

**Files:**

- Create: `web/src/lib/components/filter-panel/sort-toggle.svelte`
- Create: `web/src/lib/components/filter-panel/active-filters-bar.svelte`
- Test: `web/src/lib/components/filter-panel/__tests__/sort-toggle.spec.ts`
- Test: `web/src/lib/components/filter-panel/__tests__/active-filters-bar.spec.ts`

**Design reference:** Sort toggle is a simple asc/desc button in the toolbar. Active
filters bar sits above the grid with removable chips, result count, and "Clear all".

**Step 1: Write failing tests**

```typescript
describe('SortToggle', () => {
  it('should show descending by default', () => {});
  it('should toggle direction on click', () => {});
});

describe('ActiveFiltersBar', () => {
  it('should render chip for each active filter with correct label', () => {
    // Person: shows name
    // Location: shows "City, Country"
    // Camera: shows "Make Model"
    // Tag: one chip per tag
    // Rating: shows "★ 3+"
    // Media: shows "Photos only" or "Videos only"
  });
  it('should remove individual filter on chip close', () => {});
  it('should clear all on Clear All click', () => {});
  it('should not clear sortOrder on Clear All', () => {});
  it('should show result count', () => {});
  it('should show nothing when no filters active', () => {});
});
```

**Step 2–5: Implement, test, commit**

```
feat(web): add sort toggle and active filters bar
```

---

## Task 11: Integrate FilterPanel into Spaces page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Add FilterPanel to the space page layout**

Import the FilterPanel and wire it alongside the existing timeline:

```svelte
<script>
  import FilterPanel from '$lib/components/filter-panel/filter-panel.svelte';
  import ActiveFiltersBar from '$lib/components/filter-panel/active-filters-bar.svelte';
  import SortToggle from '$lib/components/filter-panel/sort-toggle.svelte';
  import { createFilterState, clearFilters, type FilterState } from '$lib/components/filter-panel/filter-panel';
  import { getSpacePeople, getSearchSuggestions, getAllTags } from '@immich/sdk';

  let filters = $state(createFilterState());

  // Rebuild TimelineManager when filters change
  $effect(() => {
    timelineManager = new TimelineManager({
      spaceId: space.id,
      // In Spaces context, FilterState.personIds maps to spacePersonIds
      spacePersonIds: filters.personIds.length ? filters.personIds : undefined,
      city: filters.city,
      country: filters.country,
      make: filters.make,
      model: filters.model,
      tagIds: filters.tagIds.length ? filters.tagIds : undefined,
      rating: filters.rating,
      assetType: filters.mediaType === 'all' ? undefined
        : filters.mediaType === 'image' ? 'IMAGE' : 'VIDEO',
      order: filters.sortOrder,
    });
  });
</script>

<!-- Layout: FilterPanel | Main Content -->
<div class="flex h-full">
  <FilterPanel
    config={{
      sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media'],
      providers: {
        people: () => getSpacePeople(space.id),
        locations: () => getSearchSuggestions({ type: 'country', spaceId: space.id }),
        cameras: () => getSearchSuggestions({ type: 'camera-make', spaceId: space.id }),
        tags: () => getAllTags(),
      },
    }}
    timeBuckets={timelineManager.months}
    onFilterChange={(f) => (filters = f)}
  />

  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Sort toggle in toolbar -->
    <SortToggle bind:sortOrder={filters.sortOrder} />

    <!-- Active filter chips -->
    <ActiveFiltersBar {filters} onClear={() => (filters = clearFilters(filters))} />

    <!-- Timeline (or empty state when filters match nothing) -->
    {#if totalCount === 0 && getActiveFilterCount(filters) > 0}
      <div class="flex flex-1 flex-col items-center justify-center gap-2" data-testid="empty-state-message">
        <p class="text-sm text-[var(--fg-muted)]">No photos match your filters</p>
        <button class="text-sm text-[var(--primary)]" onclick={() => (filters = clearFilters(filters))}>
          Clear all filters
        </button>
      </div>
    {:else}
      <Timeline {timelineManager} />
    {/if}
  </div>
</div>
```

Note: The exact integration depends on the current space page structure. The FilterPanel
sits as a sibling to the main content area, inside the existing layout. The space page
already uses `TimelineManager` — we rebuild it with filter params when filters change.

**Important:** For Spaces, `FilterState.personIds` must map to `spacePersonIds` (not
`personIds`) on the server. The parent view handles this mapping when constructing the
`TimelineManager` options.

**Step 2: Add `data-testid` attributes**

Add `data-testid` attributes to all interactive elements for E2E testing:

- `discovery-panel`, `collapse-panel-btn`, `expand-panel-btn`, `collapsed-icon-strip`
- `filter-section-{name}` for each section
- `temporal-picker`, `year-chip`, `month-chip`
- `sort-toggle`, `active-chip`, `clear-all-btn`
- `media-photos-btn`, `media-videos-btn`, `media-all-btn`
- `people-search-input`
- `empty-state-message`

**Step 3: Verify manually**

```bash
cd web && pnpm dev
```

Navigate to a space. Verify:

- Filter panel renders on the left
- Sections show space-scoped data (only people/locations/cameras in this space)
- Selecting filters updates the timeline
- Temporal picker shows correct year/month counts
- Collapsing/expanding works
- Active chips appear and are removable

**Step 4: Commit**

```
feat(web): integrate FilterPanel into Spaces page
```

---

## Task 12: Lint, type check, and format

**Step 1: Run all checks**

```bash
make lint-server && make lint-web
make check-server && make check-web
make format-server && make format-web
```

**Step 2: Fix any issues**

**Step 3: Commit**

```
chore: fix lint and type check issues
```

---

## Task 13: Server E2E tests for timeline filters

**Files:**

- Modify: `e2e/src/specs/server/api/search.e2e-spec.ts` (or create new timeline spec)

**Step 1: Write E2E tests**

```typescript
describe('GET /timeline/buckets (filters)', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    // Create assets with known EXIF data
    const asset1 = await utils.createAsset(admin.accessToken, {
      fileCreatedAt: '2020-08-15T10:00:00.000Z',
    });
    await utils.updateAssetExif(admin.accessToken, asset1.id, {
      city: 'Munich',
      country: 'Germany',
      make: 'Canon',
      model: 'EOS 5D',
      rating: 5,
    });

    const asset2 = await utils.createAsset(admin.accessToken, {
      fileCreatedAt: '2020-07-10T10:00:00.000Z',
    });
    await utils.updateAssetExif(admin.accessToken, asset2.id, {
      city: 'Berlin',
      country: 'Germany',
      make: 'Sony',
      model: 'A7III',
      rating: 3,
    });

    const asset3 = await utils.createAsset(admin.accessToken, {
      fileCreatedAt: '2021-01-05T10:00:00.000Z',
    });
    // No EXIF data on asset3
  });

  it('should filter buckets by city', async () => {
    const buckets = await getTimeBuckets({ city: 'Munich' });
    expect(buckets).toHaveLength(1);
    expect(buckets[0].count).toBe(1);
  });

  it('should filter buckets by rating (>= 4)', async () => {
    const buckets = await getTimeBuckets({ rating: 4 });
    expect(buckets).toHaveLength(1); // Only the 5-star asset
  });

  it('should filter buckets by camera make', async () => {
    const buckets = await getTimeBuckets({ make: 'Canon' });
    expect(buckets).toHaveLength(1);
  });

  it('should return zero buckets for non-matching filter', async () => {
    const buckets = await getTimeBuckets({ city: 'Tokyo' });
    expect(buckets).toHaveLength(0);
  });

  it('should combine multiple filters (AND logic across categories)', async () => {
    const buckets = await getTimeBuckets({ city: 'Munich', make: 'Canon' });
    expect(buckets).toHaveLength(1);
    const buckets2 = await getTimeBuckets({ city: 'Munich', make: 'Sony' });
    expect(buckets2).toHaveLength(0);
  });
});

describe('GET /search/suggestions (spaceId scoping)', () => {
  it('should return only countries from the specified space', async () => {
    const space = await utils.createSpace(admin.accessToken, { name: 'Test' });
    // Add only Munich asset to space
    await utils.addSpaceAssets(admin.accessToken, space.id, [asset1.id]);

    const countries = await getSearchSuggestions({
      type: 'country',
      spaceId: space.id,
    });
    expect(countries).toContain('Germany');
    // Should not contain countries from assets not in this space
  });

  it('should return global results when spaceId is omitted', async () => {
    const countries = await getSearchSuggestions({ type: 'country' });
    expect(countries).toContain('Germany');
  });
});
```

**Step 2: Run**

```bash
cd e2e && pnpm test -- --run src/specs/server/api/search.e2e-spec.ts
```

**Step 3: Commit**

```
test: add server E2E tests for timeline EXIF filters and scoped suggestions
```

---

## Task 14: Web E2E tests for FilterPanel in Spaces

**Files:**

- Create: `e2e/src/specs/web/spaces-filter-panel.e2e-spec.ts`

**Follow the pattern in `e2e/src/specs/web/spaces-p1.e2e-spec.ts`.**

This is the largest task — 87 E2E test cases from the design doc. Implement ALL
test cases listed in the design doc's "E2E (Playwright) — comprehensive coverage"
section. Group them into test.describe blocks matching the design doc categories:

- Page load and basic rendering (3 tests)
- Temporal picker (8 tests)
- People filter (9 tests)
- Location filter (9 tests)
- Camera filter (6 tests)
- Tags filter (7 tests)
- Rating filter (6 tests)
- Media type filter (6 tests)
- Sort direction (4 tests)
- Active filter chips (9 tests)
- Combined filters (4 tests)
- Collapsed panel (7 tests)
- Edge cases (9 tests)

Total: 87 E2E test cases (must match design doc exactly).

**Setup pattern:**

```typescript
import type { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Spaces FilterPanel', () => {
  let admin: LoginResponseDto;
  let spaceId: string;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    // Create a space with diverse assets for testing
    const space = await utils.createSpace(admin.accessToken, { name: 'Filter Test Space' });
    spaceId = space.id;

    // Create assets with varied EXIF data across multiple months/years
    // Asset 1: Munich, Canon, 5 stars, image, Aug 2020
    // Asset 2: Berlin, Sony, 3 stars, video, Jul 2020
    // Asset 3: Munich, Canon, 4 stars, image, Jan 2021
    // Asset 4: No EXIF, image, Mar 2021
    // ... create and add to space
  });

  test.describe('Page load', () => {
    test('should render filter panel with all sections', async ({ context, page }) => {
      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${spaceId}`);
      await expect(page.locator('[data-testid="discovery-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-section-timeline"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-section-people"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-section-location"]')).toBeVisible();
    });
  });

  // ... all other test categories from design doc
});
```

Refer to the design doc section "E2E (Playwright) — comprehensive coverage" for the
complete list of test cases to implement. Each test case in the design doc becomes one
Playwright `test()` call.

**Step 2: Run**

```bash
cd e2e && pnpm test:web -- --grep "FilterPanel"
```

**Step 3: Commit**

```
test: add 87 E2E tests for Spaces FilterPanel
```

---

## Task 15: Final verification and cleanup

**Step 1: Run ALL test suites**

```bash
cd server && pnpm test
cd web && pnpm test
make lint-all && make check-all
```

**Step 2: Verify complete flow manually**

1. Open a space with diverse photos (different locations, cameras, dates)
2. Verify filter panel shows space-scoped options
3. Select a person → timeline updates
4. Select a location → chip appears, timeline narrows
5. Select a rating → only rated photos shown
6. Change media type to Videos → only videos
7. Check temporal picker → year counts update with filters
8. Click a year → months expand
9. Click a month → timeline scrolls
10. Collapse panel → badges visible on active filters
11. Expand → filters preserved
12. Clear all → timeline returns to full set, sort preserved

**Step 3: Commit if needed**

```
chore: final cleanup for filterable timeline
```
