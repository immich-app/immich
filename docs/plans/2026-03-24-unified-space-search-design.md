# Unified Smart Search + Filters in Spaces

## Status

Design approved. v1 scoped to smart search (CLIP) + structured filters.

## Problem

Shared spaces have a search bar and a filter panel that operate independently.
Search shows results in a separate overlay grid; filters only affect the timeline.
Users cannot search and then refine results with filters — the two features are
disconnected. Additionally, search only uses CLIP smart search with no option for
metadata search types (filename, description, OCR).

## Decision

Unify search and filters so that a search query becomes another dimension in the
filter pipeline. When a search is active, results appear in a flat relevance-ordered
grid with the filter panel still functional — changing filters re-runs the search
with updated params.

## Scope

**v1 (this design):** Smart search (CLIP) + all structured filters. One small
server change for `spacePersonIds`.

**v2 (future):** Add metadata search types (filename, description, OCR) to the
timeline query builders (`getTimeBuckets`, `getTimeBucket`). Add a search type
selector dropdown to let users pick between smart/filename/description/OCR.

## Core Behavior

When the user types a query and hits Enter:

1. Client builds a `searchSmart` request with the query, `spaceId`, and all active
   structured filters.
2. Results come back relevance-ordered in a flat thumbnail grid.
3. The filter panel stays visible and functional. Changing a filter re-runs the search
   with updated params (reset to page 1, replace results).
4. All filters remain enabled including temporal (`takenAfter`/`takenBefore`).
5. Clearing the search term returns to the normal timeline view with filters preserved.
6. The sort toggle is hidden during smart search (results are always relevance-ordered).

## Filter-to-Search Param Mapping

| Filter field       | SmartSearchDto field     | Notes                                              |
| ------------------ | ------------------------ | -------------------------------------------------- |
| personIds          | spacePersonIds           | Server change needed — never send as `personIds`   |
| city               | city                     | Via BaseSearchDto                                  |
| country            | country                  | Via BaseSearchDto                                  |
| make               | make                     | Via BaseSearchDto                                  |
| model              | model                    | Via BaseSearchDto                                  |
| tagIds             | tagIds                   | Via BaseSearchDto                                  |
| rating             | rating                   | Via BaseSearchDto                                  |
| mediaType          | type                     | 'image' → IMAGE, 'video' → VIDEO                   |
| selectedYear/Month | takenAfter / takenBefore | Convert to ISO range, then Date for SmartSearchDto |
| sortOrder          | N/A                      | Smart search is always relevance-ordered           |

**Omitted fields:** `state` and `lensModel` exist on `BaseSearchDto` and
`searchAssetBuilder` but are not exposed in the space filter panel. They are
intentionally excluded from this mapping.

**Important:** In space context, the client must send `spacePersonIds`, never
`personIds`. These query different tables (`shared_space_person_face` vs
`asset_face`). If both are sent, the query ANDs them, which is not intended.
`spacePersonIds` requires `spaceId` — add a service-level check that rejects
`spacePersonIds` without `spaceId`.

## Server Changes

One small addition. The `hasAnySpacePerson` helper already exists in `database.ts`
(from the contextual-filters branch timeline work).

1. Add `spacePersonIds` field to `BaseSearchDto` (`server/src/dtos/search.dto.ts`)
2. Add `spacePersonIds` to `SearchSpaceOptions` interface
   (`server/src/repositories/search.repository.ts`). This propagates to both
   `SmartSearchOptions` (via intersection) and `AssetSearchBuilderOptions` (via
   `BaseAssetSearchOptions`), making it available in `searchAssetBuilder`'s
   parameter type without additional changes.
3. Add `.$if(!!options.spacePersonIds?.length, (qb) => hasAnySpacePerson(qb, options.spacePersonIds!))`
   to `searchAssetBuilder` in `database.ts`
4. Add service-level validation: reject `spacePersonIds` when `spaceId` is not set
5. Regenerate OpenAPI specs (`make open-api`) and SQL docs (`make sql`)

## Pagination

- Page size: 100 (server default for `searchSmart`)
- Track `searchPage` state variable, accumulate results on "load more"
- Reset to page 1 when query or filters change (replace, don't append)
- Use `nextPage !== null` from response to show "100+" indicator and "load more" button
- Disable "load more" while any search request is in flight

## Filter Reactivity During Search

- `$effect` watches `filters` state; when search is active, re-runs `searchSmart`
- Debounce filter changes with `SEARCH_FILTER_DEBOUNCE_MS = 250`
- Use `AbortController` to cancel in-flight requests when a new search triggers
- `$effect` cleanup function cancels debounce timer, aborts in-flight request, and
  handles component unmount (navigation away from space page)
- Each re-run resets to page 1 and replaces results

## Search as Filter Chip

- When search is active, show query as a removable chip in `ActiveFiltersBar`
- Update visibility condition:
  `getActiveFilterCount(filters) > 0 || searchQuery.trim().length > 0`
- Removing chip clears search and returns to timeline

## Escape Key Behavior

1. If assets are selected in search grid → first Escape clears selection
2. Second Escape → clears search, returns to timeline

## Empty State

"No results match your search" when zero results — distinct from the existing
"no photos in space" empty state.

## Components

### New: `SpaceSearchResults`

- Flat thumbnail grid, relevance-ordered
- "Load more" button when `nextPage !== null`, disabled while loading
- Result count: show `{loadedCount}+` when `nextPage !== null` (e.g., "100+",
  "200+" after loading more)
- Loading spinner on initial search and filter-triggered re-search
- Supports multi-select via existing `AssetInteraction`

### Modified: space page (`+page.svelte`)

- Keep the same `SearchBar` element but wire it to pass filters alongside query
- Remove separate search results overlay (current lines 711–738)
- When search is active, show `SpaceSearchResults` instead of `Timeline`
- Pass filter state to search API call

### Modified: `ActiveFiltersBar`

- Accept optional `searchQuery` prop
- Show search term as removable chip
- Update visibility condition

### Modified: `FilterPanel`

- Hide sort toggle when search is active

## What Stays the Same

- Search bar element (`web/src/lib/elements/SearchBar.svelte`)
- No search type selector in v1 — just smart search
- `TimelineManager` and timeline view
- Filter state management (`createFilterState`, `clearFilters`, etc.)
- Space access control
- Main app search bar (untouched)

## Testing Strategy

### Server unit tests

**`server/src/services/search.service.spec.ts`:**

- `searchSmart` passes `spacePersonIds` through to repository
- `searchSmart` rejects `spacePersonIds` when `spaceId` is not set
- `searchSmart` with combined filters (`spacePersonIds` + `city` + `rating`)
  passes all params through

**`server/src/repositories/search.repository.spec.ts`:**

- Update `@GenerateSql` params on `searchSmart` to include a `spacePersonIds`
  test case for SQL documentation

### Web component tests

**`web/src/lib/components/spaces/space-search.spec.ts`** (update existing):

- Search submits with `spaceId` and active filter params
- Filter change during active search re-triggers search with reset pagination
- Rapid filter changes coalesce via debounce (single request, not multiple)
- In-flight request cancelled when new search triggers (AbortController)
- Cleanup on component unmount cancels debounce timer and in-flight request
- Clearing search returns to timeline view
- Empty state renders when zero results
- "Load more" calls next page, appends results
- "Load more" disabled while request in flight
- Escape key: first press clears multi-select, second press clears search
- Sort toggle hidden when search is active

**New: `SpaceSearchResults` component test:**

- Renders thumbnail grid from search results
- Shows `{count}+` when more pages exist
- "Load more" button visible only when `nextPage !== null`
- Loading spinner shown during search
- Multi-select works via `AssetInteraction`

**`web/src/lib/components/filter-panel/active-filters-bar.spec.ts`:**

- Search chip renders when `searchQuery` is set
- Removing search chip calls `onClear`
- Bar visible when only search query is active (no structured filters)

### E2E tests

**`e2e/src/api/specs/search.e2e-spec.ts`** (new or extend existing):

- `POST /search/smart` with `spaceId` + `spacePersonIds` returns only matching
  space assets
- `POST /search/smart` with `spacePersonIds` but no `spaceId` returns 400
- `POST /search/smart` with `spaceId` + `personIds` (global, not space) does NOT
  filter by space persons — guards against the personIds/spacePersonIds footgun
- `POST /search/smart` with `spaceId` + structured filters (city, rating)
  returns filtered results

**`e2e/src/web/specs/`** (Playwright):

- Search in space → results appear in grid (not timeline)
- Apply filter during search → results update
- Clear search → timeline returns with filters preserved
- Search chip appears in active filters bar and is removable
- Escape key: clears selection first, then clears search

### Additional edge cases

- Search with all filters active simultaneously
- Search term with special characters (quotes, unicode)
- Space with zero assets → search returns empty immediately

## Key Files

- `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- `web/src/lib/elements/SearchBar.svelte`
- `web/src/lib/components/filter-panel/filter-panel.svelte`
- `web/src/lib/components/filter-panel/active-filters-bar.svelte`
- `web/src/lib/components/filter-panel/filter-panel.ts`
- `server/src/dtos/search.dto.ts`
- `server/src/repositories/search.repository.ts`
- `server/src/utils/database.ts`

## Relationship to Other Branches

- **contextual-filters branch:** Adds temporal scoping to filter suggestions.
  Independent of this work. If it merges first, `hasAnySpacePerson` helper is
  already available. This design is based on main.
- **v2 metadata search:** Will require adding `originalFileName`, `description`,
  `ocr` fields to `TimeBucketDto` and the timeline query builders (`getTimeBuckets`,
  `getTimeBucket`). Those builders are separate from `searchAssetBuilder` and will
  need the filter clauses added independently — consider extracting shared helpers.
