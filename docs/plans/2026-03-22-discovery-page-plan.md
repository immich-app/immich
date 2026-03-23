# Discovery Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a `/discover` page that replaces the main timeline with faceted discovery
navigation — search, filtering, sorting, and hierarchical temporal picker in one view.

**Architecture:** New SvelteKit route at `/discover` with a collapsible left-side filter
panel (240px → 32px). Server-side sorting via a new `AssetSortBy` enum added to search
DTOs. Temporal picker aggregates existing monthly time buckets client-side. The existing
nav sidebar is untouched — zero fork conflict risk.

**Tech Stack:** SvelteKit + Svelte 5 runes (web), NestJS + Kysely (server), Vitest
(unit/medium tests), Playwright (E2E tests), `@immich/ui` component library, MDI icons.

**Design reference:** `docs/plans/2026-03-22-discovery-page-design.md` and mockups in
`docs/plans/mockups/discovery-independent-panel.html` (the chosen layout).

---

## Task 1: Add `AssetSortBy` enum and DTO support (server)

**Files:**

- Modify: `server/src/enum.ts` (add enum after `AssetOrder` at line 77)
- Modify: `server/src/dtos/search.dto.ts` (add `sortBy` to `MetadataSearchDto`)
- Modify: `server/src/repositories/search.repository.ts:107-109` (extend
  `SearchOrderOptions`)
- Test: `server/src/services/search.service.spec.ts`

**Step 1: Write failing test for sortBy passthrough**

In `server/src/services/search.service.spec.ts`, add a test that verifies `sortBy` is
passed through to the repository:

```typescript
it('should pass sortBy to search repository', async () => {
  const dto: MetadataSearchDto = { sortBy: AssetSortBy.UploadDate, order: AssetOrder.Asc };
  mocks.search.searchMetadata.mockResolvedValue({ items: [], hasNextPage: false });
  await sut.searchMetadata(authStub.admin, dto);
  expect(mocks.search.searchMetadata).toHaveBeenCalledWith(
    expect.objectContaining({ sortBy: AssetSortBy.UploadDate }),
    expect.anything(),
  );
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts`

Expected: FAIL — `AssetSortBy` is not defined.

**Step 3: Add `AssetSortBy` enum**

In `server/src/enum.ts`, after the `AssetOrder` enum (line 77), add:

```typescript
export enum AssetSortBy {
  CaptureDate = 'captureDate',
  UploadDate = 'uploadDate',
  Filename = 'filename',
}
```

**Step 4: Add `sortBy` to `SearchOrderOptions` and `MetadataSearchDto`**

In `server/src/repositories/search.repository.ts`, update the interface at line 107:

```typescript
export interface SearchOrderOptions {
  orderDirection?: 'asc' | 'desc';
  sortBy?: AssetSortBy;
}
```

In `server/src/dtos/search.dto.ts`, add to `MetadataSearchDto` (near the `order`
property at line 211):

```typescript
@ValidateIf((dto: MetadataSearchDto) => dto.sortBy !== undefined)
@IsEnum(AssetSortBy)
@ApiPropertyOptional({ enum: AssetSortBy, enumName: 'AssetSortBy' })
sortBy?: AssetSortBy;
```

Import `AssetSortBy` from `src/enum`.

**Step 5: Run test to verify it passes**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts`

Expected: PASS

**Step 6: Commit**

```
feat(server): add AssetSortBy enum and sortBy DTO parameter
```

---

## Task 2: Implement dynamic sort in search repository (server)

**Files:**

- Modify: `server/src/repositories/search.repository.ts:210` (dynamic orderBy in
  `searchMetadata`)
- Test: `server/src/repositories/search.repository.spec.ts` (if exists) or add inline

**Step 1: Write failing test for dynamic sort field**

Add a test that verifies different sort fields produce different ORDER BY clauses. If
a dedicated repository spec doesn't exist, add the test to the service spec:

```typescript
it('should sort by upload date when sortBy is UploadDate', async () => {
  const dto: MetadataSearchDto = { sortBy: AssetSortBy.UploadDate, order: AssetOrder.Desc };
  mocks.search.searchMetadata.mockResolvedValue({ items: [], hasNextPage: false });
  await sut.searchMetadata(authStub.admin, dto);
  expect(mocks.search.searchMetadata).toHaveBeenCalledWith(
    expect.objectContaining({ sortBy: AssetSortBy.UploadDate, orderDirection: 'desc' }),
    expect.anything(),
  );
});

it('should sort by filename when sortBy is Filename', async () => {
  const dto: MetadataSearchDto = { sortBy: AssetSortBy.Filename, order: AssetOrder.Asc };
  mocks.search.searchMetadata.mockResolvedValue({ items: [], hasNextPage: false });
  await sut.searchMetadata(authStub.admin, dto);
  expect(mocks.search.searchMetadata).toHaveBeenCalledWith(
    expect.objectContaining({ sortBy: AssetSortBy.Filename, orderDirection: 'asc' }),
    expect.anything(),
  );
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts`

Expected: FAIL — `sortBy` not propagated to repository options.

**Step 3: Implement dynamic orderBy in search repository**

In `server/src/repositories/search.repository.ts`, replace the hardcoded orderBy at
line 210:

```typescript
// Before:
.orderBy('asset.fileCreatedAt', orderDirection)

// After:
.orderBy(
  options.sortBy === 'uploadDate'
    ? 'asset.createdAt'
    : options.sortBy === 'filename'
      ? 'asset.originalFileName'
      : 'asset.fileCreatedAt',
  orderDirection,
)
```

Also update the `searchMetadata` call in `server/src/services/search.service.ts` to
pass `sortBy` through to the repository options. Find where `MetadataSearchDto` is mapped
to repository options and include `sortBy: dto.sortBy`.

**Step 4: Run test to verify it passes**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts`

Expected: PASS

**Step 5: Commit**

```
feat(server): implement dynamic sort field in search repository
```

---

## Task 3: Add sortBy to timeline bucket options (server)

**Files:**

- Modify: `server/src/repositories/asset.repository.ts:93-95` (add `sortBy` to
  `TimeBucketOptions`)
- Modify: `server/src/repositories/asset.repository.ts:904-905` (dynamic orderBy in
  `getTimeBucket`)
- Modify: `server/src/dtos/time-bucket.dto.ts` (add `sortBy` to `TimeBucketDto`)
- Test: `server/src/services/timeline.service.spec.ts`

**Step 1: Write failing test**

```typescript
it('should pass sortBy to time bucket options', async () => {
  // Test that sortBy parameter is accepted and forwarded
  const dto = { sortBy: AssetSortBy.UploadDate } as TimeBucketDto;
  // ... verify it gets passed to the repository
});
```

**Step 2: Run to verify failure**

Run: `cd server && pnpm test -- --run src/services/timeline.service.spec.ts`

**Step 3: Add sortBy to TimeBucketOptions and TimeBucketDto**

In `server/src/repositories/asset.repository.ts`, update `TimeBucketOptions`:

```typescript
export interface TimeBucketOptions extends AssetBuilderOptions {
  order?: AssetOrder;
  sortBy?: AssetSortBy;
}
```

In the `getTimeBucket()` method (lines 904-905), update the orderBy:

```typescript
const sortField =
  options.sortBy === 'uploadDate'
    ? 'asset.createdAt'
    : options.sortBy === 'filename'
      ? 'asset.originalFileName'
      : 'asset.fileCreatedAt';

.orderBy(sortField, order)
```

In `server/src/dtos/time-bucket.dto.ts`, add to `TimeBucketDto`:

```typescript
@ValidateIf((dto: TimeBucketDto) => dto.sortBy !== undefined)
@IsEnum(AssetSortBy)
@ApiPropertyOptional({ enum: AssetSortBy, enumName: 'AssetSortBy' })
sortBy?: AssetSortBy;
```

**Step 4: Run to verify pass**

Run: `cd server && pnpm test -- --run src/services/timeline.service.spec.ts`

**Step 5: Commit**

```
feat(server): add sortBy support to timeline bucket queries
```

---

## Task 4: Regenerate OpenAPI SDK

**Files:**

- Regenerate: `open-api/typescript-sdk/src/fetch-client.ts`
- Regenerate: `open-api/immich-openapi-specs.json`

**Step 1: Build server and regenerate**

```bash
cd server && pnpm build
cd server && pnpm sync:open-api
make open-api-typescript
```

**Step 2: Verify `AssetSortBy` appears in generated SDK**

```bash
grep -n "AssetSortBy" open-api/typescript-sdk/src/fetch-client.ts
```

Expected: Enum definition and usage in search/timeline DTOs.

**Step 3: Run server lint/check**

```bash
make lint-server && make check-server
```

**Step 4: Commit**

```
chore: regenerate OpenAPI SDK with AssetSortBy enum
```

---

## Task 5: Add `/discover` route and route definition (web)

**Files:**

- Modify: `web/src/lib/route.ts:97` (add `discover` route)
- Create: `web/src/routes/(user)/discover/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Create: `web/src/routes/(user)/discover/[[photos=photos]]/[[assetId=id]]/+page.ts`
- Modify: `web/src/lib/components/shared-components/side-bar/user-sidebar.svelte:44`
  (point Photos to `/discover`)

**Step 1: Add route definition**

In `web/src/lib/route.ts`, after the `photos` entry (line 97), add:

```typescript
// discover
discover: (params?: { at?: string }) => '/discover' + asQueryString(params),
```

**Step 2: Create minimal route page**

Create `web/src/routes/(user)/discover/[[photos=photos]]/[[assetId=id]]/+page.svelte`
with a minimal placeholder that renders the existing timeline (copy the structure from
the photos route). This should include:

- The `UserPageLayout` wrapper
- A basic `TimelineManager` instance
- A placeholder `<div>` for the discovery panel (left side)

The route structure mirrors photos: `[[photos=photos]]/[[assetId=id]]` supports the
asset viewer overlay.

Create `+page.ts` with `export const prerender = false;`.

**Step 3: Update sidebar nav**

In `web/src/lib/components/shared-components/side-bar/user-sidebar.svelte` at line 44,
change:

```svelte
<!-- Before -->
<NavbarItem title={$t('photos')} href={Route.photos()} ... />
<!-- After -->
<NavbarItem title={$t('photos')} href={Route.discover()} ... />
```

**Step 4: Verify route loads**

```bash
cd web && pnpm dev
```

Navigate to `http://localhost:5173/discover` — verify page loads.

**Step 5: Commit**

```
feat(web): add /discover route with timeline placeholder
```

---

## Task 6: Create discovery filter store (web)

**Files:**

- Create: `web/src/lib/stores/discovery-filters.svelte.ts`
- Test: `web/src/lib/stores/__tests__/discovery-filters.spec.ts`

**Step 1: Write failing test for the store**

```typescript
import { describe, it, expect } from 'vitest';

describe('discoveryFilters', () => {
  it('should initialize with default values', () => {
    const filters = createDiscoveryFilters();
    expect(filters.sortBy).toBe('captureDate');
    expect(filters.sortOrder).toBe('desc');
    expect(filters.personIds).toEqual([]);
    expect(filters.city).toBeUndefined();
    expect(filters.country).toBeUndefined();
    expect(filters.make).toBeUndefined();
    expect(filters.model).toBeUndefined();
    expect(filters.tagIds).toEqual([]);
    expect(filters.rating).toBeUndefined();
    expect(filters.mediaType).toBe('all');
    expect(filters.searchQuery).toBe('');
    expect(filters.selectedYear).toBeUndefined();
    expect(filters.selectedMonth).toBeUndefined();
  });

  it('should track active filter count', () => {
    const filters = createDiscoveryFilters();
    expect(filters.activeFilterCount).toBe(0);
    filters.personIds = ['person-1'];
    expect(filters.activeFilterCount).toBe(1);
    filters.city = 'Munich';
    expect(filters.activeFilterCount).toBe(2);
  });

  it('should clear all filters', () => {
    const filters = createDiscoveryFilters();
    filters.personIds = ['person-1'];
    filters.city = 'Munich';
    filters.rating = 3;
    filters.clearAll();
    expect(filters.activeFilterCount).toBe(0);
    expect(filters.personIds).toEqual([]);
    expect(filters.city).toBeUndefined();
  });
});
```

**Step 2: Run test to verify failure**

Run: `cd web && pnpm test -- --run src/lib/stores/__tests__/discovery-filters.spec.ts`

**Step 3: Implement the store**

Create `web/src/lib/stores/discovery-filters.svelte.ts` using Svelte 5 runes:

```typescript
import type { AssetSortBy } from '@immich/sdk';

export type MediaTypeFilter = 'all' | 'image' | 'video';

export function createDiscoveryFilters() {
  let sortBy = $state<string>('captureDate');
  let sortOrder = $state<'asc' | 'desc'>('desc');
  let personIds = $state<string[]>([]);
  let city = $state<string | undefined>(undefined);
  let country = $state<string | undefined>(undefined);
  let state_ = $state<string | undefined>(undefined);
  let make = $state<string | undefined>(undefined);
  let model = $state<string | undefined>(undefined);
  let tagIds = $state<string[]>([]);
  let rating = $state<number | undefined>(undefined);
  let mediaType = $state<MediaTypeFilter>('all');
  let searchQuery = $state('');
  let searchType = $state<'smart' | 'metadata' | 'ocr'>('smart');
  let selectedYear = $state<number | undefined>(undefined);
  let selectedMonth = $state<number | undefined>(undefined);

  const activeFilterCount = $derived(
    (personIds.length > 0 ? 1 : 0) +
      (city ? 1 : 0) +
      (country ? 1 : 0) +
      (make ? 1 : 0) +
      (tagIds.length > 0 ? 1 : 0) +
      (rating !== undefined ? 1 : 0) +
      (mediaType !== 'all' ? 1 : 0),
  );

  function clearAll() {
    personIds = [];
    city = undefined;
    country = undefined;
    state_ = undefined;
    make = undefined;
    model = undefined;
    tagIds = [];
    rating = undefined;
    mediaType = 'all';
    searchQuery = '';
    selectedYear = undefined;
    selectedMonth = undefined;
  }

  return {
    get sortBy() {
      return sortBy;
    },
    set sortBy(v) {
      sortBy = v;
    },
    get sortOrder() {
      return sortOrder;
    },
    set sortOrder(v) {
      sortOrder = v;
    },
    get personIds() {
      return personIds;
    },
    set personIds(v) {
      personIds = v;
    },
    get city() {
      return city;
    },
    set city(v) {
      city = v;
    },
    get country() {
      return country;
    },
    set country(v) {
      country = v;
    },
    get state_() {
      return state_;
    },
    set state_(v) {
      state_ = v;
    },
    get make() {
      return make;
    },
    set make(v) {
      make = v;
    },
    get model() {
      return model;
    },
    set model(v) {
      model = v;
    },
    get tagIds() {
      return tagIds;
    },
    set tagIds(v) {
      tagIds = v;
    },
    get rating() {
      return rating;
    },
    set rating(v) {
      rating = v;
    },
    get mediaType() {
      return mediaType;
    },
    set mediaType(v) {
      mediaType = v;
    },
    get searchQuery() {
      return searchQuery;
    },
    set searchQuery(v) {
      searchQuery = v;
    },
    get searchType() {
      return searchType;
    },
    set searchType(v) {
      searchType = v;
    },
    get selectedYear() {
      return selectedYear;
    },
    set selectedYear(v) {
      selectedYear = v;
    },
    get selectedMonth() {
      return selectedMonth;
    },
    set selectedMonth(v) {
      selectedMonth = v;
    },
    get activeFilterCount() {
      return activeFilterCount;
    },
    clearAll,
  };
}
```

**Step 4: Run test to verify pass**

Run: `cd web && pnpm test -- --run src/lib/stores/__tests__/discovery-filters.spec.ts`

**Step 5: Commit**

```
feat(web): add discovery filters store with Svelte 5 runes
```

---

## Task 7: Build DiscoveryPanel component — temporal picker (web)

**Files:**

- Create:
  `web/src/lib/components/discover/discovery-panel.svelte`
- Create:
  `web/src/lib/components/discover/temporal-picker.svelte`
- Test:
  `web/src/lib/components/discover/__tests__/temporal-picker.spec.ts`

**Design reference:** See `docs/plans/mockups/discovery-independent-panel.html` — the
"Left" option, expanded state. The temporal picker is the "TIMELINE" section with year
chips (4-column grid, volume bars) and month drill-down (4-column grid with breadcrumb).

Also see `docs/plans/mockups/discovery-navigation-phase3.html` for detailed temporal
picker mockup with volume bars, breadcrumb, and filtered counts.

**Step 1: Write failing test for year aggregation**

```typescript
import { describe, it, expect } from 'vitest';
import { aggregateYears } from './temporal-picker.svelte';

describe('TemporalPicker', () => {
  it('should aggregate monthly buckets into year counts', () => {
    const months = [
      { timeBucket: '2020-01-01', count: 100 },
      { timeBucket: '2020-06-01', count: 200 },
      { timeBucket: '2021-03-01', count: 150 },
    ];
    const years = aggregateYears(months);
    expect(years).toEqual([
      { year: 2020, count: 300 },
      { year: 2021, count: 150 },
    ]);
  });

  it('should calculate relative volume (max year = 100%)', () => {
    const months = [
      { timeBucket: '2020-01-01', count: 100 },
      { timeBucket: '2021-01-01', count: 50 },
    ];
    const years = aggregateYears(months);
    expect(years[0].volumePercent).toBe(100);
    expect(years[1].volumePercent).toBe(50);
  });
});
```

**Step 2: Run to verify failure**

Run: `cd web && pnpm test -- --run src/lib/components/discover/__tests__/temporal-picker.spec.ts`

**Step 3: Implement temporal picker**

Create `temporal-picker.svelte` with:

- Exported `aggregateYears()` function for testability
- Year chip grid (4 columns) with count and volume bar
- Month drill-down grid (4 columns) shown when a year is selected
- Breadcrumb: "All years / 2020"
- Events: `onyearselect`, `onmonthselect`

Create `discovery-panel.svelte` as the outer wrapper:

- Header with "Filters" title + collapse chevron button
- Collapsible sections using `<details>` or accordion pattern
- Temporal picker as first section
- Placeholder slots for filter sections (built in later tasks)

**Step 4: Run tests**

Run: `cd web && pnpm test -- --run src/lib/components/discover/__tests__/temporal-picker.spec.ts`

**Step 5: Commit**

```
feat(web): add temporal picker component with year/month aggregation
```

---

## Task 8: Build filter sections — People, Location, Camera (web)

**Files:**

- Create: `web/src/lib/components/discover/filter-section.svelte`
- Create: `web/src/lib/components/discover/people-filter.svelte`
- Create: `web/src/lib/components/discover/location-filter.svelte`
- Create: `web/src/lib/components/discover/camera-filter.svelte`
- Test: `web/src/lib/components/discover/__tests__/filter-sections.spec.ts`

**Design reference:** See `docs/plans/mockups/discovery-independent-panel.html` — the
People section has avatar + checkbox + name with a local search input. Location has
hierarchical country → city items. Camera is a flat list.

**Step 1: Write failing test**

```typescript
describe('FilterSection', () => {
  it('should render items with checkboxes', () => {
    // Render people filter with test data
    // Assert checkbox + avatar + name visible
  });

  it('should emit selection changes', () => {
    // Click a checkbox
    // Assert onchange callback fires with selected ID
  });

  it('should filter items by search input', () => {
    // Type in the search box
    // Assert only matching items visible
  });
});
```

**Step 2: Run to verify failure**

**Step 3: Implement filter sections**

`filter-section.svelte` — generic collapsible section wrapper:

- Section header (title + chevron) — click to collapse/expand
- Section body slot
- Uses `<details open>` pattern for native collapse

`people-filter.svelte`:

- Local search input (filter people by name client-side)
- List of person items with avatar circle, checkbox, name
- Fetches people list from `searchPerson` SDK endpoint
- "Show N more" button for long lists
- Emits selected person IDs to the discovery filters store

`location-filter.svelte`:

- Hierarchical: country items, indented city items below selected country
- Fetches countries from `getSearchSuggestions({ type: 'country' })`
- On country select, fetches cities for that country
- Emits selected city/country/state to store

`camera-filter.svelte`:

- Flat list of camera make/model combinations
- Fetches from `getSearchSuggestions({ type: 'camera-make' })`
- Emits selected make/model to store

**Step 4: Run tests**

**Step 5: Commit**

```
feat(web): add people, location, and camera filter sections
```

---

## Task 9: Build filter sections — Tags, Rating, Media Type (web)

**Files:**

- Create: `web/src/lib/components/discover/tags-filter.svelte`
- Create: `web/src/lib/components/discover/rating-filter.svelte`
- Create: `web/src/lib/components/discover/media-type-filter.svelte`
- Test: `web/src/lib/components/discover/__tests__/filter-sections-2.spec.ts`

**Design reference:** See `docs/plans/mockups/discovery-independent-panel.html` — Rating
section has 5 star icons (click to set minimum rating). Media Type has three toggle
buttons: All / Photos / Videos.

**Step 1: Write failing tests**

```typescript
describe('RatingFilter', () => {
  it('should highlight stars up to selected rating', () => {
    // Click 3rd star
    // Assert first 3 stars have "filled" class
  });
});

describe('MediaTypeFilter', () => {
  it('should toggle between All, Photos, Videos', () => {
    // Click Photos button
    // Assert Photos has active class, others don't
  });
});
```

**Step 2–4: Implement and verify**

`tags-filter.svelte` — flat checkbox list, fetches tags from SDK.

`rating-filter.svelte` — 5 star icons, click to set minimum. Uses MDI `mdiStar` icon.
Clicking a star fills all stars up to that one.

`media-type-filter.svelte` — three toggle buttons. "All" is default. Selection updates
`mediaType` in the store.

**Step 5: Commit**

```
feat(web): add tags, rating, and media type filter sections
```

---

## Task 10: Build sort dropdown and active filters bar (web)

**Files:**

- Create: `web/src/lib/components/discover/sort-dropdown.svelte`
- Create: `web/src/lib/components/discover/active-filters-bar.svelte`
- Test: `web/src/lib/components/discover/__tests__/sort-dropdown.spec.ts`
- Test: `web/src/lib/components/discover/__tests__/active-filters-bar.spec.ts`

**Design reference:** See `docs/plans/mockups/discovery-independent-panel.html` — Sort
dropdown is in the top bar showing "Date captured ▾". Active filters bar sits between
the top bar and the photo grid showing result count + removable chips + "Clear all".

**Step 1: Write failing tests**

```typescript
describe('SortDropdown', () => {
  it('should show current sort field', () => {
    // Assert "Capture Date" is displayed by default
  });

  it('should change sort field on selection', () => {
    // Click dropdown, select "Upload Date"
    // Assert store.sortBy updated
  });
});

describe('ActiveFiltersBar', () => {
  it('should render chips for active filters', () => {
    // Set filters.personIds = ['id1'] with name "Sarah"
    // Assert chip with text "Sarah" is visible
  });

  it('should remove filter on chip close click', () => {
    // Click the × on a chip
    // Assert that filter is removed from store
  });

  it('should clear all on Clear all click', () => {
    // Click Clear all
    // Assert all filters reset
  });
});
```

**Step 2–4: Implement and verify**

`sort-dropdown.svelte`:

- Ghost button trigger showing current sort label + chevron
- Dropdown with three options: Capture Date, Upload Date, Filename
- Divider + Ascending/Descending toggle
- Updates `sortBy` and `sortOrder` in the discovery filters store

`active-filters-bar.svelte`:

- Horizontal bar with result count, removable chips, "Clear all" button
- Each active filter renders as a chip: `[Label ×]`
- Chip labels: person name, "City, Country", camera model, tag name, "★ N+",
  "Photos only" / "Videos only"
- Hidden when no filters are active (or shows just result count)

**Step 5: Commit**

```
feat(web): add sort dropdown and active filters bar
```

---

## Task 11: Build collapsed panel state (web)

**Files:**

- Modify: `web/src/lib/components/discover/discovery-panel.svelte`
- Test: `web/src/lib/components/discover/__tests__/discovery-panel.spec.ts`

**Design reference:** See `docs/plans/mockups/discovery-independent-panel.html` — the
collapsed state (right column) shows a 32px icon strip with category icons. Icons with
active filters have a small blue dot badge.

**Step 1: Write failing test**

```typescript
describe('DiscoveryPanel collapsed state', () => {
  it('should render icon strip when collapsed', () => {
    // Set collapsed = true
    // Assert panel width is 32px
    // Assert filter category icons are visible
  });

  it('should show badge on icons with active filters', () => {
    // Set personIds = ['id1']
    // Assert people icon has badge dot
    // Assert location icon does NOT have badge
  });

  it('should expand when chevron icon is clicked', () => {
    // Click expand chevron
    // Assert panel expands to full width
  });
});
```

**Step 2–4: Implement and verify**

Add collapsed state to `discovery-panel.svelte`:

- `let collapsed = $state(false);`
- When collapsed, render a 32px-wide strip with vertical icon buttons
- Icons: calendar (timeline), person (people), map-pin (location), camera,
  tag, star (rating), image (media)
- Each icon shows a small blue dot if that filter category has active values
- Clicking an icon expands the panel and scrolls to that section
- Collapse button (chevron left) in the header

**Step 5: Commit**

```
feat(web): add collapsed state with badge indicators to discovery panel
```

---

## Task 12: Wire up the Discover page layout (web)

**Files:**

- Modify:
  `web/src/routes/(user)/discover/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Design reference:** See `docs/plans/mockups/discovery-independent-panel.html` — the
full "Left" layout. Nav (160px, as-is) | Discovery Panel (240px ↔ 32px) | Photo Grid.
Search bar in the top area. Sort dropdown next to search. Active filter chips above grid.

**Step 1: Wire up the page layout**

Update the discover page to compose all components:

```svelte
<UserPageLayout>
  <div class="flex h-full">
    <!-- Discovery Panel (left, bg slightly darker than nav: bg-[#131316]) -->
    <DiscoveryPanel {filters} />

    <!-- Main Content -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Top bar: search + sort -->
      <div class="flex items-center gap-3 border-b border-gray-700 px-4 py-2">
        <SearchInput bind:value={filters.searchQuery} searchType={filters.searchType} />
        <SortDropdown {filters} />
      </div>

      <!-- Active filters -->
      <ActiveFiltersBar {filters} resultCount={totalCount} />

      <!-- Timeline grid -->
      <div class="flex-1 overflow-y-auto">
        <Timeline {timelineManager} />
      </div>
    </div>
  </div>
</UserPageLayout>
```

**Note on search input:** The search bar includes a type toggle (Smart / File / OCR)
as small pill buttons inside the input, matching the mockup in
`discovery-independent-panel.html`. Reuse the existing search type logic from
`web/src/lib/components/shared-components/search-bar/search-bar.svelte`.

**Step 2: Connect filters to TimelineManager**

When filter values change (`$effect`), rebuild the `TimelineManager` with the new
options. Map the discovery filter store values to the existing `TimeBucketDto` parameters:

- `personIds` → `personId` (first selected)
- `city/country` → search metadata filter
- `make/model` → search metadata filter
- `tagIds` → `tagId` (first selected)
- `sortBy` → new `sortBy` parameter
- `sortOrder` → `order` parameter
- `selectedYear/selectedMonth` → scroll-to target after load

**Step 3: Connect temporal picker to bucket data**

The `TimelineManager.months` property already contains all month groups with counts.
Pass this data to the `TemporalPicker` component. The temporal picker aggregates it
into year-level view.

When a month is selected in the picker, call `TimelineManager` scroll-to method to
jump to that position.

**Step 4: Verify manually**

```bash
cd web && pnpm dev
```

Navigate to `/discover`. Verify:

- Discovery panel renders on the left with all filter sections
- Search bar visible at top
- Sort dropdown works
- Timeline renders in the main area
- Selecting a filter updates the timeline
- Temporal picker shows years with counts
- Collapsing panel works

**Step 5: Commit**

```
feat(web): wire up discover page with filter panel and timeline
```

---

## Task 13: Lint, type check, and format (web + server)

**Files:** All modified files

**Step 1: Run all checks**

```bash
make lint-server && make lint-web
make check-server && make check-web
make format-server && make format-web
```

**Step 2: Fix any issues**

Address lint errors, type errors, formatting issues.

**Step 3: Commit fixes**

```
chore: fix lint and type check issues
```

---

## Task 14: Server search E2E tests

**Files:**

- Modify: `e2e/src/specs/server/api/search.e2e-spec.ts`

**Step 1: Add sort E2E tests**

```typescript
describe('POST /search/metadata (sortBy)', () => {
  it('should sort by capture date descending (default)', async () => {
    // Create assets with different fileCreatedAt values
    // Search without sortBy
    // Verify results ordered by fileCreatedAt DESC
  });

  it('should sort by upload date ascending', async () => {
    // Search with sortBy=uploadDate, order=asc
    // Verify results ordered by createdAt ASC
  });

  it('should sort by filename ascending', async () => {
    // Search with sortBy=filename, order=asc
    // Verify results ordered alphabetically by originalFileName
  });
});
```

**Step 2: Run E2E tests**

```bash
cd e2e && pnpm test -- --run src/specs/server/api/search.e2e-spec.ts
```

**Step 3: Commit**

```
test: add E2E tests for sortBy parameter in metadata search
```

---

## Task 15: Web E2E tests for Discovery page

**Files:**

- Create: `e2e/src/specs/web/discover.e2e-spec.ts`

**Design reference:** Follow the pattern in
`e2e/src/specs/web/spaces-p1.e2e-spec.ts` — uses `utils.initSdk()`,
`utils.resetDatabase()`, `utils.adminSetup()`, `utils.setAuthCookies()`,
`page.goto()`, and `expect(page.locator(...)).toBeVisible()`.

**Step 1: Write E2E tests**

```typescript
import type { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Discovery Page', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test('should load the discover page with timeline', async ({ context, page }) => {
    await utils.createAsset(admin.accessToken);
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/discover');
    await expect(page.locator('[data-testid="discovery-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="discovery-timeline"]')).toBeVisible();
  });

  test('should collapse and expand filter panel', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/discover');
    await page.locator('[data-testid="collapse-panel-btn"]').click();
    await expect(page.locator('[data-testid="collapsed-icon-strip"]')).toBeVisible();
    await page.locator('[data-testid="expand-panel-btn"]').click();
    await expect(page.locator('[data-testid="discovery-panel"]')).toBeVisible();
  });

  test('should show temporal picker with year counts', async ({ context, page }) => {
    // Create assets in different years
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/discover');
    await expect(page.locator('[data-testid="temporal-picker"]')).toBeVisible();
    await expect(page.locator('[data-testid="year-chip"]').first()).toBeVisible();
  });

  test('should filter by sort option', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/discover');
    await page.locator('[data-testid="sort-dropdown"]').click();
    await page.locator('[data-testid="sort-option-filename"]').click();
    // Verify sort applied (timeline re-renders)
  });

  test('should show active filter chips and clear all', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/discover');
    // Select a filter (e.g., media type)
    await page.locator('[data-testid="media-photos-btn"]').click();
    await expect(page.locator('[data-testid="active-chip"]')).toBeVisible();
    await page.locator('[data-testid="clear-all-btn"]').click();
    await expect(page.locator('[data-testid="active-chip"]')).not.toBeVisible();
  });
});
```

**Step 2: Run E2E tests**

```bash
cd e2e && pnpm test:web -- --grep "Discovery"
```

**Step 3: Commit**

```
test: add E2E tests for Discovery page
```

---

## Task 16: Final verification and cleanup

**Step 1: Run all test suites**

```bash
cd server && pnpm test
cd web && pnpm test
make lint-all && make check-all
```

**Step 2: Verify complete flow manually**

1. Navigate to `/discover`
2. Search for "beach" — verify results
3. Select a person filter — verify timeline updates
4. Select a location — verify chips appear
5. Change sort to Filename — verify order changes
6. Open temporal picker — click a year — verify month grid
7. Click a month — verify scroll
8. Collapse panel — verify badges
9. Clear all — verify reset

**Step 3: Final commit if needed**

```
chore: final cleanup for discovery page
```
