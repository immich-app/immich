# Unified Smart Search + Filters Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify search and filters in shared spaces so smart search results can be refined with structured filters (people, location, camera, tags, rating, media type, temporal).

**Architecture:** Smart search becomes a filter dimension — when active, it replaces the timeline with a flat relevance-ordered grid while keeping the filter panel functional. One small server addition (`spacePersonIds` on search DTOs), rest is frontend wiring.

**Tech Stack:** NestJS (server), SvelteKit + Svelte 5 runes (web), Vitest (tests), Playwright (E2E), Kysely (SQL), `@immich/sdk` (generated API client)

**Design doc:** `docs/plans/2026-03-24-unified-space-search-design.md`

---

### Task 1: Add `spacePersonIds` to search DTOs and query builder

**Files:**

- Modify: `server/src/dtos/search.dto.ts` (after `spaceId` field in `BaseSearchDto`)
- Modify: `server/src/repositories/search.repository.ts` (`SearchSpaceOptions` interface)
- Modify: `server/src/utils/database.ts` (after spaceId clause in `searchAssetBuilder`)

**Step 1: Add field to `BaseSearchDto`**

In `server/src/dtos/search.dto.ts`, find `spaceId?: string;` in `BaseSearchDto` and add after it:

```typescript
@ValidateUUID({ each: true, optional: true, description: 'Shared space person IDs to filter by' })
spacePersonIds?: string[];
```

**Step 2: Add field to `SearchSpaceOptions`**

In `server/src/repositories/search.repository.ts`, find `SearchSpaceOptions` interface and update:

```typescript
export interface SearchSpaceOptions {
  spaceId?: string;
  spacePersonIds?: string[];
}
```

This propagates to both `SmartSearchOptions` (via intersection) and `AssetSearchBuilderOptions` (via `BaseAssetSearchOptions`).

**Step 3: Add clause to `searchAssetBuilder`**

In `server/src/utils/database.ts`, find the `.$if(!!options.spaceId, ...)` clause in `searchAssetBuilder` and add immediately after it:

```typescript
.$if(!!options.spacePersonIds?.length, (qb) => hasAnySpacePerson(qb, options.spacePersonIds!))
```

The `hasAnySpacePerson` helper already exists in the same file.

**Step 4: Run type check**

Run: `cd server && npx tsc --noEmit`
Expected: PASS (no type errors)

**Step 5: Commit**

```bash
git add server/src/dtos/search.dto.ts server/src/repositories/search.repository.ts server/src/utils/database.ts
git commit -m "feat(server): add spacePersonIds to search DTOs and query builder"
```

---

### Task 2: Add service-level validation for `spacePersonIds`

**Files:**

- Modify: `server/src/services/search.service.ts` (in `searchSmart` method, after spaceId access check)
- Modify: `server/src/services/search.service.spec.ts` (in `describe('searchSmart')` > `describe('shared space access')`)

**Step 1: Write the failing test**

In `server/src/services/search.service.spec.ts`, find the `describe('shared space access (spaceId)')` block inside `describe('searchSmart')`. After the last `it(...)` in that block, add:

```typescript
it('should reject spacePersonIds when spaceId is not set', async () => {
  await expect(sut.searchSmart(authStub.user1, { query: 'test', spacePersonIds: [newUuid()] })).rejects.toThrow(
    BadRequestException,
  );
});

it('should pass spacePersonIds through to repository', async () => {
  const spaceId = newUuid();
  const spacePersonIds = [newUuid(), newUuid()];
  mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));

  await sut.searchSmart(authStub.user1, { query: 'test', spaceId, spacePersonIds });

  expect(mocks.search.searchSmart).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ spaceId, spacePersonIds }),
  );
});

it('should pass combined filters through to repository', async () => {
  const spaceId = newUuid();
  const spacePersonIds = [newUuid()];
  mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set([spaceId]));

  await sut.searchSmart(authStub.user1, {
    query: 'test',
    spaceId,
    spacePersonIds,
    city: 'Paris',
    rating: 4,
  });

  expect(mocks.search.searchSmart).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ spaceId, spacePersonIds, city: 'Paris', rating: 4 }),
  );
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts`
Expected: 1 FAIL (the rejection test — the passthrough tests may pass since `...dto` spread already includes the field)

**Step 3: Add validation to `searchSmart`**

In `server/src/services/search.service.ts`, find the `searchSmart` method. After the existing `if (dto.spaceId) { ... }` access check block, add:

```typescript
if (dto.spacePersonIds?.length && !dto.spaceId) {
  throw new BadRequestException('spacePersonIds requires spaceId');
}
```

**Step 4: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add server/src/services/search.service.ts server/src/services/search.service.spec.ts
git commit -m "feat(server): validate spacePersonIds requires spaceId in searchSmart"
```

---

### Task 3: Update `@GenerateSql` and regenerate specs

**Files:**

- Modify: `server/src/repositories/search.repository.ts` (`@GenerateSql` decorator on `searchSmart`)

**Step 1: Add spacePersonIds test case to `@GenerateSql`**

In `server/src/repositories/search.repository.ts`, find the `@GenerateSql` decorator above `searchSmart`. Add `spacePersonIds` to the existing params object:

```typescript
@GenerateSql({
  params: [
    { page: 1, size: 200 },
    {
      takenAfter: DummyValue.DATE,
      embedding: DummyValue.VECTOR,
      lensModel: DummyValue.STRING,
      withStacked: true,
      isFavorite: true,
      userIds: [DummyValue.UUID],
      spacePersonIds: [DummyValue.UUID],
    },
  ],
})
```

**Step 2: Build server and regenerate**

Run: `cd server && pnpm build`
Expected: BUILD SUCCESS

Run: `make open-api`
Expected: OpenAPI specs regenerated

Run: `make sql`
Expected: SQL docs regenerated (requires running DB — if not available, skip and note for CI)

**Step 3: Commit**

```bash
git add server/ open-api/
git commit -m "chore: regenerate OpenAPI specs and SQL docs for spacePersonIds"
```

---

### Task 4: Create `SpaceSearchResults` component

This is a view-only grid for v1. Multi-select via `AssetInteraction` is deferred to v2.

**Files:**

- Create: `web/src/lib/components/spaces/space-search-results.svelte`
- Create: `web/src/lib/components/spaces/space-search-results.spec.ts`

**Step 1: Write the failing tests**

Create `web/src/lib/components/spaces/space-search-results.spec.ts`:

```typescript
import SpaceSearchResults from '$lib/components/spaces/space-search-results.svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

const mockAssets = [
  { id: 'asset-1', originalFileName: 'photo1.jpg' },
  { id: 'asset-2', originalFileName: 'photo2.jpg' },
  { id: 'asset-3', originalFileName: 'photo3.jpg' },
] as any[];

describe('SpaceSearchResults', () => {
  it('should render thumbnail grid from search results', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        spaceId: 'space-1',
        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
      },
    });

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
  });

  it('should show result count with + when more pages exist', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        spaceId: 'space-1',
        isLoading: false,
        hasMore: true,
        totalLoaded: 100,
        onLoadMore: vi.fn(),
      },
    });

    expect(screen.getByTestId('result-count')).toHaveTextContent('100+');
  });

  it('should show exact count when no more pages', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        spaceId: 'space-1',
        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
      },
    });

    expect(screen.getByTestId('result-count')).toHaveTextContent('3');
    expect(screen.getByTestId('result-count').textContent).not.toContain('+');
  });

  it('should show load more button when hasMore is true', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        spaceId: 'space-1',
        isLoading: false,
        hasMore: true,
        totalLoaded: 100,
        onLoadMore: vi.fn(),
      },
    });

    expect(screen.getByTestId('load-more-btn')).toBeInTheDocument();
  });

  it('should not show load more button when hasMore is false', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        spaceId: 'space-1',
        isLoading: false,
        hasMore: false,
        totalLoaded: 3,
        onLoadMore: vi.fn(),
      },
    });

    expect(screen.queryByTestId('load-more-btn')).not.toBeInTheDocument();
  });

  it('should disable load more button when loading', () => {
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        spaceId: 'space-1',
        isLoading: true,
        hasMore: true,
        totalLoaded: 100,
        onLoadMore: vi.fn(),
      },
    });

    expect(screen.getByTestId('load-more-btn')).toBeDisabled();
  });

  it('should call onLoadMore when button clicked', async () => {
    const onLoadMore = vi.fn();
    render(SpaceSearchResults, {
      props: {
        results: mockAssets,
        spaceId: 'space-1',
        isLoading: false,
        hasMore: true,
        totalLoaded: 100,
        onLoadMore,
      },
    });

    await userEvent.click(screen.getByTestId('load-more-btn'));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it('should show loading spinner when loading', () => {
    render(SpaceSearchResults, {
      props: {
        results: [],
        spaceId: 'space-1',
        isLoading: true,
        hasMore: false,
        totalLoaded: 0,
        onLoadMore: vi.fn(),
      },
    });

    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
  });

  it('should show empty state when no results and not loading', () => {
    render(SpaceSearchResults, {
      props: {
        results: [],
        spaceId: 'space-1',
        isLoading: false,
        hasMore: false,
        totalLoaded: 0,
        onLoadMore: vi.fn(),
      },
    });

    expect(screen.getByTestId('search-empty')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-search-results.spec.ts`
Expected: FAIL (component doesn't exist yet)

**Step 3: Create the component**

Create `web/src/lib/components/spaces/space-search-results.svelte`. The thumbnail approach (`/api/assets/{id}/thumbnail` via `<img>`) matches the existing space page pattern:

```svelte
<script lang="ts">
  import { Route } from '$lib/route';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';
  import { Button } from '@immich/ui';
  import type { AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    results: AssetResponseDto[];
    spaceId: string;
    isLoading: boolean;
    hasMore: boolean;
    totalLoaded: number;
    onLoadMore: () => void;
  }

  let { results, spaceId, isLoading, hasMore, totalLoaded, onLoadMore }: Props = $props();
</script>

<section class="px-4 py-4">
  {#if isLoading && results.length === 0}
    <div class="flex justify-center py-8" data-testid="search-loading">
      <LoadingSpinner />
    </div>
  {:else if results.length === 0}
    <p class="mt-8 text-center text-gray-500 dark:text-gray-400" data-testid="search-empty">
      {$t('search_no_result')}
    </p>
  {:else}
    <div class="mb-4 flex items-center gap-2">
      <span class="text-sm text-gray-500 dark:text-gray-400" data-testid="result-count">
        {totalLoaded}{hasMore ? '+' : ''} result{totalLoaded === 1 && !hasMore ? '' : 's'}
      </span>
      {#if isLoading}
        <LoadingSpinner size="16" />
      {/if}
    </div>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-1">
      {#each results as asset (asset.id)}
        <a
          href="{Route.viewSpace({ id: spaceId })}/photos/{asset.id}"
          class="aspect-square cursor-pointer overflow-hidden rounded"
        >
          <img
            src="/api/assets/{asset.id}/thumbnail"
            alt={asset.originalFileName}
            class="h-full w-full object-cover"
          />
        </a>
      {/each}
    </div>
    {#if hasMore}
      <div class="mt-4 flex justify-center">
        <Button
          data-testid="load-more-btn"
          disabled={isLoading}
          onclick={onLoadMore}
        >
          {$t('load_more')}
        </Button>
      </div>
    {/if}
  {/if}
</section>
```

**Step 4: Run tests to verify they pass**

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-search-results.spec.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/space-search-results.svelte web/src/lib/components/spaces/space-search-results.spec.ts
git commit -m "feat(web): add SpaceSearchResults component with tests"
```

---

### Task 5: Add search chip to `ActiveFiltersBar`

**Files:**

- Modify: `web/src/lib/components/filter-panel/active-filters-bar.svelte`
- Create: `web/src/lib/components/filter-panel/active-filters-bar.spec.ts`

**Step 1: Write the failing tests**

Create `web/src/lib/components/filter-panel/active-filters-bar.spec.ts`:

```typescript
import ActiveFiltersBar from '$lib/components/filter-panel/active-filters-bar.svelte';
import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

describe('ActiveFiltersBar search chip', () => {
  it('should render search chip when searchQuery is set', () => {
    render(ActiveFiltersBar, {
      props: {
        filters: createFilterState(),
        onRemoveFilter: vi.fn(),
        onClearAll: vi.fn(),
        searchQuery: 'sunset',
        onClearSearch: vi.fn(),
      },
    });

    expect(screen.getByTestId('search-chip')).toHaveTextContent('sunset');
  });

  it('should call onClearSearch when search chip is removed', async () => {
    const onClearSearch = vi.fn();
    render(ActiveFiltersBar, {
      props: {
        filters: createFilterState(),
        onRemoveFilter: vi.fn(),
        onClearAll: vi.fn(),
        searchQuery: 'sunset',
        onClearSearch,
      },
    });

    await userEvent.click(screen.getByTestId('search-chip-close'));
    expect(onClearSearch).toHaveBeenCalled();
  });

  it('should be visible when only search query is active (no structured filters)', () => {
    render(ActiveFiltersBar, {
      props: {
        filters: createFilterState(),
        onRemoveFilter: vi.fn(),
        onClearAll: vi.fn(),
        searchQuery: 'sunset',
        onClearSearch: vi.fn(),
      },
    });

    expect(screen.getByTestId('active-filters-bar')).toBeInTheDocument();
  });

  it('should not render search chip when searchQuery is empty', () => {
    render(ActiveFiltersBar, {
      props: {
        filters: createFilterState(),
        onRemoveFilter: vi.fn(),
        onClearAll: vi.fn(),
        searchQuery: '',
        onClearSearch: vi.fn(),
      },
    });

    expect(screen.queryByTestId('search-chip')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/active-filters-bar.spec.ts`
Expected: FAIL

**Step 3: Update the component**

In `web/src/lib/components/filter-panel/active-filters-bar.svelte`:

Update the `Props` interface to add `searchQuery` and `onClearSearch`:

```typescript
interface Props {
  filters: FilterState;
  resultCount?: number;
  personNames?: Map<string, string>;
  tagNames?: Map<string, string>;
  onRemoveFilter: (type: string, id?: string) => void;
  onClearAll: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}
```

Update the destructuring to include new props:

```typescript
let {
  filters,
  resultCount,
  personNames,
  tagNames,
  onRemoveFilter,
  onClearAll,
  searchQuery = '',
  onClearSearch,
}: Props = $props();
```

Update `hasActiveFilters` to include search state:

```typescript
let hasActiveFilters = $derived(chips.length > 0 || searchQuery.trim().length > 0);
```

In the template, after the result count span and before the `{#each chips ...}` block, add:

```svelte
{#if searchQuery.trim()}
  <span
    class="inline-flex items-center gap-1 rounded-full bg-immich-primary/10 px-2.5 py-0.5 text-xs text-immich-primary dark:bg-immich-dark-primary/10 dark:text-immich-dark-primary"
    data-testid="search-chip"
  >
    <span>{searchQuery}</span>
    <button
      type="button"
      class="flex h-4 w-4 items-center justify-center rounded-full text-immich-primary/60 hover:text-immich-primary dark:text-immich-dark-primary/60 dark:hover:text-immich-dark-primary"
      onclick={() => onClearSearch?.()}
      aria-label="Clear search"
      data-testid="search-chip-close"
    >
      &times;
    </button>
  </span>
{/if}
```

**Step 4: Run tests to verify they pass**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/active-filters-bar.spec.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add web/src/lib/components/filter-panel/active-filters-bar.svelte web/src/lib/components/filter-panel/active-filters-bar.spec.ts
git commit -m "feat(web): add search query chip to ActiveFiltersBar"
```

---

### Task 6: Wire unified search into space page

This is the largest task — it replaces the separate search overlay with `SpaceSearchResults` and wires filter state into search API calls.

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Add `SpaceSearchResults` import**

At the top of the file, near the other space component imports, add:

```typescript
import SpaceSearchResults from '$lib/components/spaces/space-search-results.svelte';
```

**Step 2: Replace search state management**

Find the current search state block (search for `let searchQuery = $state('')`). Replace the entire block from `let searchQuery` through the `clearSearch` function with:

```typescript
const SEARCH_FILTER_DEBOUNCE_MS = 250;

let searchQuery = $state('');
let searchResults = $state<AssetResponseDto[]>([]);
let isSearching = $state(false);
let showSearchResults = $state(false);
let searchPage = $state(1);
let hasMoreResults = $state(false);
let searchAbortController: AbortController | undefined;

const buildSearchParams = (): SmartSearchDto => {
  const params: SmartSearchDto = {
    query: searchQuery.trim(),
    spaceId: space.id,
  };
  if (filters.personIds.length > 0) {
    params.spacePersonIds = filters.personIds;
  }
  if (filters.city) {
    params.city = filters.city;
  }
  if (filters.country) {
    params.country = filters.country;
  }
  if (filters.make) {
    params.make = filters.make;
  }
  if (filters.model) {
    params.model = filters.model;
  }
  if (filters.tagIds.length > 0) {
    params.tagIds = filters.tagIds;
  }
  if (filters.rating !== undefined) {
    params.rating = filters.rating;
  }
  if (filters.mediaType !== 'all') {
    params.type = filters.mediaType === 'image' ? AssetTypeEnum.Image : AssetTypeEnum.Video;
  }
  if (filters.selectedYear && filters.selectedMonth) {
    const start = new Date(filters.selectedYear, filters.selectedMonth - 1, 1);
    const end = new Date(filters.selectedYear, filters.selectedMonth, 0, 23, 59, 59, 999);
    params.takenAfter = start;
    params.takenBefore = end;
  } else if (filters.selectedYear) {
    params.takenAfter = new Date(filters.selectedYear, 0, 1);
    params.takenBefore = new Date(filters.selectedYear, 11, 31, 23, 59, 59, 999);
  }
  return params;
};

const executeSearch = async (page: number, append: boolean) => {
  const query = searchQuery.trim();
  if (!query) {
    return;
  }

  searchAbortController?.abort();
  const controller = new AbortController();
  searchAbortController = controller;

  isSearching = true;
  try {
    const { assets } = await searchSmart({
      smartSearchDto: { ...buildSearchParams(), page, size: 100 },
    });

    if (controller.signal.aborted) {
      return;
    }

    searchResults = append ? [...searchResults, ...assets.items] : assets.items;
    searchPage = page;
    hasMoreResults = assets.nextPage !== null;
    showSearchResults = true;
  } catch {
    if (controller.signal.aborted) {
      return;
    }
    searchResults = append ? searchResults : [];
    hasMoreResults = false;
  } finally {
    if (!controller.signal.aborted) {
      isSearching = false;
    }
  }
};

const handleSearchSubmit = () => {
  searchPage = 1;
  void executeSearch(1, false);
};

const handleLoadMore = () => {
  void executeSearch(searchPage + 1, true);
};

const clearSearch = () => {
  searchAbortController?.abort();
  searchQuery = '';
  searchResults = [];
  showSearchResults = false;
  searchPage = 1;
  hasMoreResults = false;
  isSearching = false;
};
```

Also add the `SmartSearchDto` import at the top of the file:

```typescript
import type { SmartSearchDto } from '@immich/sdk';
```

**Step 3: Add filter reactivity effect**

After the search state block, add:

```typescript
// Re-run search when filters change during active search
$effect(() => {
  // Read all filter values to establish dependency tracking
  const _ = [
    filters.personIds,
    filters.city,
    filters.country,
    filters.make,
    filters.model,
    filters.tagIds,
    filters.rating,
    filters.mediaType,
    filters.selectedYear,
    filters.selectedMonth,
  ];

  if (!showSearchResults || !searchQuery.trim()) {
    return;
  }

  const timeout = setTimeout(() => {
    searchPage = 1;
    void executeSearch(1, false);
  }, SEARCH_FILTER_DEBOUNCE_MS);

  return () => {
    clearTimeout(timeout);
    searchAbortController?.abort();
  };
});
```

Note: The cleanup function cancels both the debounce timer AND any in-flight request, handling component unmount and rapid filter changes.

**Step 4: Hide sort toggle during search**

Find the `<SortToggle` component in the template. Wrap it with a condition:

```svelte
{#if !showSearchResults}
  <SortToggle
    sortOrder={filters.sortOrder}
    onToggle={(order) => {
      filters = { ...filters, sortOrder: order };
    }}
  />
{/if}
```

**Step 5: Replace search results overlay**

Find the `{#if showSearchResults}` block that contains the old overlay (the inline `<section>` with the grid of `<img>` tags). Replace the entire block with:

```svelte
{#if showSearchResults}
  <SpaceSearchResults
    results={searchResults}
    spaceId={space.id}
    isLoading={isSearching}
    hasMore={hasMoreResults}
    totalLoaded={searchResults.length}
    onLoadMore={handleLoadMore}
  />
{/if}
```

**Step 6: Update `ActiveFiltersBar` usage**

Find the `{#if getActiveFilterCount(filters) > 0}` condition that wraps `<ActiveFiltersBar`. Update it to also show when search is active, and pass search props:

```svelte
{#if getActiveFilterCount(filters) > 0 || searchQuery.trim().length > 0}
  <ActiveFiltersBar
    {filters}
    resultCount={showSearchResults ? searchResults.length : totalAssetCount}
    {personNames}
    {tagNames}
    onRemoveFilter={handleRemoveFilter}
    onClearAll={() => {
      filters = clearFilters(filters);
    }}
    searchQuery={searchQuery}
    onClearSearch={clearSearch}
  />
{/if}
```

**Step 7: Update Escape key handling**

Find the escape/back handler in the space page (search for `handleEscape` or the escape keyboard shortcut). Ensure it follows the two-step behavior:

```typescript
if (showSearchResults) {
  clearSearch();
}
```

This goes in the escape handler chain, after the multi-select cancellation check. The existing `cancelMultiselect` for `assetInteraction` is already handled by the `AssetSelectControlBar`. For v1 (no multi-select in search results), a single Escape clears the search.

**Step 8: Delete dead `SpaceSearch` component**

The `SpaceSearch` component at `web/src/lib/components/spaces/space-search.svelte` is not imported anywhere (confirmed via grep). Delete it and its spec:

```bash
rm web/src/lib/components/spaces/space-search.svelte
rm web/src/lib/components/spaces/space-search.spec.ts
```

**Step 9: Run type check and format**

Run: `cd web && npx tsc --noEmit`
Expected: PASS

Run: `make format-web`
Expected: Files formatted

**Step 10: Commit**

```bash
git add web/
git commit -m "feat(web): wire unified search + filters into space page

Remove dead SpaceSearch component, replace search overlay with
SpaceSearchResults, wire filter state into searchSmart API calls,
add filter reactivity with debounce and AbortController cleanup."
```

---

### Task 7: Integration tests for space page search behavior

The search logic lives inline in the space page. Test the extracted `buildSearchParams` helper and the key integration behaviors.

**Files:**

- Create: `web/src/lib/utils/space-search.ts` (extract `buildSearchParams` for testability)
- Create: `web/src/lib/utils/space-search.spec.ts`

**Step 1: Extract `buildSearchParams` for testability**

If `buildSearchParams` is tightly coupled to the page component's reactive state, extract it as a pure function that accepts filter state and space ID:

Create `web/src/lib/utils/space-search.ts`:

```typescript
import { AssetTypeEnum, type SmartSearchDto } from '@immich/sdk';
import type { FilterState } from '$lib/components/filter-panel/filter-panel';

export const SEARCH_FILTER_DEBOUNCE_MS = 250;

export function buildSmartSearchParams(query: string, spaceId: string, filters: FilterState): SmartSearchDto {
  const params: SmartSearchDto = { query, spaceId };

  if (filters.personIds.length > 0) {
    params.spacePersonIds = filters.personIds;
  }
  if (filters.city) {
    params.city = filters.city;
  }
  if (filters.country) {
    params.country = filters.country;
  }
  if (filters.make) {
    params.make = filters.make;
  }
  if (filters.model) {
    params.model = filters.model;
  }
  if (filters.tagIds.length > 0) {
    params.tagIds = filters.tagIds;
  }
  if (filters.rating !== undefined) {
    params.rating = filters.rating;
  }
  if (filters.mediaType !== 'all') {
    params.type = filters.mediaType === 'image' ? AssetTypeEnum.Image : AssetTypeEnum.Video;
  }
  if (filters.selectedYear && filters.selectedMonth) {
    const start = new Date(filters.selectedYear, filters.selectedMonth - 1, 1);
    const end = new Date(filters.selectedYear, filters.selectedMonth, 0, 23, 59, 59, 999);
    params.takenAfter = start;
    params.takenBefore = end;
  } else if (filters.selectedYear) {
    params.takenAfter = new Date(filters.selectedYear, 0, 1);
    params.takenBefore = new Date(filters.selectedYear, 11, 31, 23, 59, 59, 999);
  }

  return params;
}
```

Then update the space page to import and use this function instead of the inline version.

**Step 2: Write tests**

Create `web/src/lib/utils/space-search.spec.ts`:

```typescript
import { AssetTypeEnum } from '@immich/sdk';
import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import { buildSmartSearchParams } from '$lib/utils/space-search';

describe('buildSmartSearchParams', () => {
  it('should include query and spaceId', () => {
    const result = buildSmartSearchParams('sunset', 'space-1', createFilterState());

    expect(result.query).toBe('sunset');
    expect(result.spaceId).toBe('space-1');
  });

  it('should map personIds to spacePersonIds', () => {
    const filters = { ...createFilterState(), personIds: ['person-1', 'person-2'] };
    const result = buildSmartSearchParams('test', 'space-1', filters);

    expect(result.spacePersonIds).toEqual(['person-1', 'person-2']);
    expect(result).not.toHaveProperty('personIds');
  });

  it('should not include spacePersonIds when no people selected', () => {
    const result = buildSmartSearchParams('test', 'space-1', createFilterState());

    expect(result.spacePersonIds).toBeUndefined();
  });

  it('should map all filter fields', () => {
    const filters = {
      ...createFilterState(),
      city: 'Paris',
      country: 'France',
      make: 'Canon',
      model: 'EOS R5',
      tagIds: ['tag-1'],
      rating: 4,
      mediaType: 'image' as const,
    };
    const result = buildSmartSearchParams('test', 'space-1', filters);

    expect(result.city).toBe('Paris');
    expect(result.country).toBe('France');
    expect(result.make).toBe('Canon');
    expect(result.model).toBe('EOS R5');
    expect(result.tagIds).toEqual(['tag-1']);
    expect(result.rating).toBe(4);
    expect(result.type).toBe(AssetTypeEnum.Image);
  });

  it('should map video mediaType', () => {
    const filters = { ...createFilterState(), mediaType: 'video' as const };
    const result = buildSmartSearchParams('test', 'space-1', filters);

    expect(result.type).toBe(AssetTypeEnum.Video);
  });

  it('should not set type when mediaType is all', () => {
    const result = buildSmartSearchParams('test', 'space-1', createFilterState());

    expect(result.type).toBeUndefined();
  });

  it('should set date range for year + month', () => {
    const filters = { ...createFilterState(), selectedYear: 2024, selectedMonth: 6 };
    const result = buildSmartSearchParams('test', 'space-1', filters);

    expect(result.takenAfter).toEqual(new Date(2024, 5, 1));
    expect(result.takenBefore).toEqual(new Date(2024, 6, 0, 23, 59, 59, 999));
  });

  it('should set date range for year only', () => {
    const filters = { ...createFilterState(), selectedYear: 2024 };
    const result = buildSmartSearchParams('test', 'space-1', filters);

    expect(result.takenAfter).toEqual(new Date(2024, 0, 1));
    expect(result.takenBefore).toEqual(new Date(2024, 11, 31, 23, 59, 59, 999));
  });

  it('should not set dates when no temporal filter', () => {
    const result = buildSmartSearchParams('test', 'space-1', createFilterState());

    expect(result.takenAfter).toBeUndefined();
    expect(result.takenBefore).toBeUndefined();
  });

  it('should handle all filters active simultaneously', () => {
    const filters = {
      ...createFilterState(),
      personIds: ['p-1'],
      city: 'Tokyo',
      country: 'Japan',
      make: 'Sony',
      model: 'A7IV',
      tagIds: ['t-1', 't-2'],
      rating: 5,
      mediaType: 'video' as const,
      selectedYear: 2025,
      selectedMonth: 3,
    };
    const result = buildSmartSearchParams('cherry blossoms', 'space-1', filters);

    expect(result.query).toBe('cherry blossoms');
    expect(result.spaceId).toBe('space-1');
    expect(result.spacePersonIds).toEqual(['p-1']);
    expect(result.city).toBe('Tokyo');
    expect(result.country).toBe('Japan');
    expect(result.make).toBe('Sony');
    expect(result.model).toBe('A7IV');
    expect(result.tagIds).toEqual(['t-1', 't-2']);
    expect(result.rating).toBe(5);
    expect(result.type).toBe(AssetTypeEnum.Video);
    expect(result.takenAfter).toBeDefined();
    expect(result.takenBefore).toBeDefined();
  });
});
```

**Step 3: Run tests**

Run: `cd web && pnpm test -- --run src/lib/utils/space-search.spec.ts`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add web/src/lib/utils/space-search.ts web/src/lib/utils/space-search.spec.ts web/src/routes/
git commit -m "refactor(web): extract buildSmartSearchParams with comprehensive tests"
```

---

### Task 8: E2E API tests for spacePersonIds

**Files:**

- Modify: `e2e/src/specs/server/api/search.e2e-spec.ts`

**Step 1: Review existing patterns**

Read `e2e/src/specs/server/api/search.e2e-spec.ts` to understand the test setup (it uses `utils.resetDatabase()`, `utils.adminSetup()`, `request(app)` from supertest, etc.).

**Step 2: Add space-scoped smart search tests**

In the existing `describe('/search')` block, add a new nested describe:

```typescript
describe('POST /search/smart with spacePersonIds', () => {
  it('should return 400 when spacePersonIds sent without spaceId', async () => {
    const { status, body } = await request(app)
      .post('/search/smart')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ query: 'test', spacePersonIds: [admin.userId] });

    expect(status).toBe(400);
  });

  it('should accept spacePersonIds with spaceId', async () => {
    const space = await utils.createSpace(admin.accessToken, { name: 'Search Test Space' });
    const asset = await utils.createAsset(admin.accessToken);
    await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);

    const { status } = await request(app)
      .post('/search/smart')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ query: 'test', spaceId: space.id, spacePersonIds: [admin.userId] });

    // Should not 400 — the person may not match but the request is valid
    expect(status).toBe(200);
  });

  it('should filter by structured filters within a space', async () => {
    const space = await utils.createSpace(admin.accessToken, { name: 'Filter Test Space' });
    const asset = await utils.createAsset(admin.accessToken);
    await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);

    const { status } = await request(app)
      .post('/search/smart')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        query: 'test',
        spaceId: space.id,
        city: 'NonexistentCity',
        rating: 5,
      });

    expect(status).toBe(200);
    // With nonexistent city filter, no results expected
  });
});
```

**Note:** Full CLIP embedding tests require the ML service. If ML is not available in the E2E env, these tests validate request/response shape and validation only. The `query: 'test'` requires CLIP to produce embeddings; if ML is down, these tests will get 400 "Smart search is not enabled". Check the existing search E2E tests for how they handle this — they may gate on ML availability.

**Step 3: Run E2E tests**

Run: `cd e2e && pnpm test -- --run src/specs/server/api/search.e2e-spec.ts`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add e2e/
git commit -m "test(e2e): add API tests for spacePersonIds search filtering"
```

---

### Task 9: Playwright E2E tests

**Files:**

- Create: `e2e/src/specs/web/spaces-search.e2e-spec.ts`

**Step 1: Review existing Playwright patterns**

Read `e2e/src/specs/web/spaces-p1.e2e-spec.ts` for the test setup pattern: `utils.initSdk()`, `utils.resetDatabase()`, `utils.adminSetup()`, `utils.createSpace()`, `utils.setAuthCookies()`, etc.

**Step 2: Write Playwright tests**

Create `e2e/src/specs/web/spaces-search.e2e-spec.ts`:

```typescript
import type { LoginResponseDto, SharedSpaceResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Spaces Search', () => {
  let admin: LoginResponseDto;
  let space: SharedSpaceResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    // Create a space with assets
    space = await utils.createSpace(admin.accessToken, { name: 'Search Test' });
    const assets = await Promise.all([
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
      utils.createAsset(admin.accessToken),
    ]);
    await utils.addSpaceAssets(
      admin.accessToken,
      space.id,
      assets.map((a) => a.id),
    );
  });

  test('search in space shows results in grid', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/spaces/${space.id}/photos`);

    // Type in search bar and submit
    const searchInput = page.locator('input[placeholder]').first();
    await searchInput.fill('test');
    await searchInput.press('Enter');

    // Should show search results (SpaceSearchResults component)
    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 10_000,
    });
  });

  test('clearing search returns to timeline', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/spaces/${space.id}/photos`);

    // Search
    const searchInput = page.locator('input[placeholder]').first();
    await searchInput.fill('test');
    await searchInput.press('Enter');

    // Wait for results or empty state
    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 10_000,
    });

    // Clear search via the X button in the search bar
    await page.locator('[aria-label="Clear value"], [aria-label="clear_value"]').first().click();

    // Timeline should be visible again (scrubber or timeline container)
    await expect(page.locator('[data-testid="result-count"]')).not.toBeVisible();
  });

  test('search chip appears in active filters bar and is removable', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/spaces/${space.id}/photos`);

    const searchInput = page.locator('input[placeholder]').first();
    await searchInput.fill('sunset');
    await searchInput.press('Enter');

    // Wait for search to complete
    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 10_000,
    });

    // Search chip should be visible
    await expect(page.getByTestId('search-chip')).toContainText('sunset');

    // Remove chip
    await page.getByTestId('search-chip-close').click();

    // Search should be cleared
    await expect(page.getByTestId('search-chip')).not.toBeVisible();
  });

  test('escape key clears search', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto(`/spaces/${space.id}/photos`);

    const searchInput = page.locator('input[placeholder]').first();
    await searchInput.fill('test');
    await searchInput.press('Enter');

    // Wait for search results
    await expect(page.getByTestId('result-count').or(page.getByTestId('search-empty'))).toBeVisible({
      timeout: 10_000,
    });

    // Press Escape to clear search
    await page.keyboard.press('Escape');

    // Search results should be gone
    await expect(page.getByTestId('result-count')).not.toBeVisible();
    await expect(page.getByTestId('search-empty')).not.toBeVisible();
  });
});
```

**Step 3: Run Playwright tests**

Run: `cd e2e && pnpm test:web -- spaces-search`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add e2e/src/specs/web/
git commit -m "test(e2e): add Playwright tests for unified space search"
```

---

### Task 10: Lint, format, and final verification

**Files:** All modified files

**Step 1: Run formatting**

Run: `make format-server && make format-web`
Expected: Files formatted

**Step 2: Run linting**

Run: `make lint-server` (allow ~10 min)
Expected: PASS

Run: `make lint-web` (allow ~10 min)
Expected: PASS

**Step 3: Run type checks**

Run: `make check-server && make check-web`
Expected: PASS

**Step 4: Run all unit tests**

Run: `cd server && pnpm test`
Expected: ALL PASS

Run: `cd web && pnpm test`
Expected: ALL PASS

**Step 5: Final commit if any formatting changes**

```bash
git add -A && git commit -m "chore: lint and format"
```
