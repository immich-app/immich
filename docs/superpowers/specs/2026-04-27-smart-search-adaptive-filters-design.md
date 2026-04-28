# Smart Search Adaptive Filters Design

## Goal

Implement adaptive filter panels for the new smart-search timeline experience so users can search first, then narrow the full server-side result set with filters that only show valid values for that search.

This addresses [discussion #388](https://github.com/open-noodle/gallery/discussions/388), “Adaptive filter panels in search results — After-Search Navigation.”

## Scope

In scope:

- `/photos?q=...`
- `/spaces/:spaceId?q=...`
- Smart-search text queries
- `queryAssetId` support at the API/service layer. The current photos and spaces routes only expose text `q`, so route wiring for query-asset search is deferred until a route state source exists.
- Search-scoped timeline counts
- Search-scoped people, location, camera, and tag value lists
- Exact totals for the full server-side matching set

Out of scope:

- Legacy `/search?query=...`
- Replacing `searchSmart`
- Live command palette autocomplete facets
- Album result facets
- Dynamic hiding of rating and media controls
- Mobile UI changes
- Server-side facet response caching
- Approximate counts or hidden candidate caps

## Decisions

1. Add a dedicated smart-search facets endpoint instead of overloading generic suggestions or replacing `searchSmart`.
2. Compute facets from the full server-side smart-search result set, not the loaded page.
3. Keep exact semantics in v1. Do not silently cap candidate count or approximate counts.
4. Match current faceted-search self-exclusion behavior.
5. Return monthly time buckets using the same local-date bucketing and `{ timeBucket, count }` shape used by `getTimeBuckets`.
6. Use route-owned facet fetching. `SmartSearchResults` stays focused on result pages.
7. Load search results and facets independently.
8. Preserve current stable rating/media UI behavior.
9. Use space-person IDs in space routes.
10. Ignore sort order for facets and avoid refetching facets on sort-only changes.

## API Design

Add:

```text
POST /search/smart/facets
```

The endpoint is a companion to `POST /search/smart`. It does not replace legacy `/search` or the existing smart-search results endpoint.

### Request

Create a new `SmartSearchFacetsDto` aligned with `SmartSearchDto`.

Supported fields:

- `query`
- `queryAssetId`
- `language`
- `withSharedSpaces`
- `spaceId`
- `spacePersonIds`
- `personIds`
- `city`
- `country`
- `make`
- `model`
- `tagIds`
- `rating`
- `type`
- `isFavorite`
- `takenAfter`
- `takenBefore`

The endpoint requires either `query` or `queryAssetId`, matching `searchSmart`.

Validation rules match `searchSmart`:

- `spaceId` and `withSharedSpaces` are mutually exclusive.
- `spacePersonIds` requires `spaceId`.
- `queryAssetId` requires asset read access.
- `spaceId` requires shared-space read access.

The v1 facets DTO does not add `visibility`; it supports only the filters listed above.

### Response

Create a dedicated response type, for example `SmartSearchFacetsResponseDto`.

```typescript
type SmartSearchFacetsResponseDto = {
  total: number;
  timeBuckets: Array<{ timeBucket: string; count: number }>;
  countries: string[];
  cameraMakes: string[];
  tags: Array<{ id: string; value: string }>;
  people: Array<{ id: string; name: string }>;
  ratings: number[];
  mediaTypes: string[];
  hasUnnamedPeople: boolean;
};
```

The response intentionally mirrors the useful parts of `FilterSuggestionsResponseDto` but has its own name because the contract is smart-search-specific and includes timeline buckets plus total count.

## Facet Semantics

All facets are computed from assets matching the smart-search query under the current access scope and CLIP max-distance threshold.

`total` applies all active filters. It answers: “How many assets are currently in the result set?”

Facet lists use current self-exclusion behavior:

| Output        | Filters excluded for that output                    |
| ------------- | --------------------------------------------------- |
| `timeBuckets` | timeline/date filters (`takenAfter`, `takenBefore`) |
| `people`      | selected people (`personIds` or `spacePersonIds`)   |
| `countries`   | selected country and city                           |
| `cameraMakes` | selected make and model                             |
| `tags`        | selected tag IDs                                    |
| `ratings`     | selected rating                                     |
| `mediaTypes`  | selected media type                                 |

All other active filters remain applied to each facet.

For spaces, the people facet returns shared-space person IDs and names. The frontend continues to use `/shared-spaces/:spaceId/people/:personId/thumbnail` for thumbnails.

Selected-but-orphaned values are not returned as normal facet values. The existing frontend orphaned-selection UI remains responsible for showing selected values that are no longer present in the current result set.

## Query Strategy

Facet computation is heavier than a paginated `searchSmart` request because it aggregates over the full matching set.

The repository should avoid running a separate vector search for every facet. The intended shape is:

1. Resolve or compute the embedding using the existing `SearchService` embedding cache.
2. Build one smart-search candidate set for the request’s immutable search scope:
   - query or query asset embedding
   - user access scope
   - `spaceId` or timeline shared spaces
   - visibility/deleted constraints
   - CLIP max-distance threshold
3. Aggregate `total` and each facet from that candidate set, applying the active filters needed for each output.

The candidate set must be exact for the request. Do not use the first page of results as the candidate set.

Facet queries do not need result ordering. Sort order must not change facet results or trigger a facet refetch.

Add timing logs or repository-level tests around the expensive path so regressions are visible before shipping. This is especially important because the existing smart-search query has planner-sensitive vchord behavior.

## Frontend Design

Facet fetching is owned by the route components for `/photos` and spaces.

### Photos

When no query is committed:

- `FilterPanel` receives the existing timeline manager buckets.
- Suggestions continue to use the existing `getFilterSuggestions({ withSharedSpaces: true, ...filters })` flow.

When a query is committed:

- The route fetches smart-search facets with `POST /search/smart/facets`.
- `FilterPanel` receives `facets.timeBuckets`.
- The panel’s people, country, camera, and tag lists come from the facet response.
- `SmartSearchResults` still fetches asset pages via `searchSmart`.
- `SmartSearchResults` receives optional `total`.

### Spaces

Spaces follow the same model with `spaceId`.

When no query is committed:

- `FilterPanel` uses current space-scoped suggestions.

When a query is committed:

- The route fetches smart-search facets with `spaceId`.
- Selected people are sent as `spacePersonIds`.
- Returned people are rendered as shared-space people.

### Loading And Failure

Results and facets load independently.

- Show result rows as soon as `searchSmart` returns.
- Keep the filter panel mounted while facets load.
- Debounce and cancel facet requests after filter changes.
- Do not fetch facets for command palette autocomplete.
- If facet fetching fails, keep previous facet values and selections, log the error, and let results continue loading.
- If `total` is unavailable because facets are loading or failed, `SmartSearchResults` falls back to the existing loaded-count display.

### Refetch Rules

Facet refetch triggers:

- committed query change
- `queryAssetId` change when a route state source exists
- language change
- scope change
- active filter change, except sort order

Facet refetch does not trigger on:

- sort order only
- loading more result pages
- live command palette typing

Filter changes reset result pagination to page 1 and refetch both results and facets.

## Data Flow

```text
Committed route query + filters
  -> searchSmart
      -> paginated result assets
  -> smart-search facets
      -> total
      -> timeBuckets
      -> narrowed facet values
  -> FilterPanel + ActiveFiltersBar + SmartSearchResults header
```

For `/photos?q=Norwegen`:

1. The route calls `searchSmart` for the first page of Norway results.
2. The route calls `/search/smart/facets` for all Norway results.
3. Timeline shows only matching months/years with counts from the full result set.
4. People/location/camera/tag sections show only values present in the full result set.
5. Selecting a year refetches results for that year while the timeline facet excludes the year filter so other years remain available.

## Error Handling

- Missing both `query` and `queryAssetId`: `400`.
- Mixed `spaceId` and `withSharedSpaces`: `400`.
- `spacePersonIds` without `spaceId`: `400`.
- Access failures use existing auth/permission errors.
- ML disabled follows existing `searchSmart` error behavior.
- Facet fetch failure is non-fatal in the UI.

## Testing

Implementation must follow TDD. For each backend, frontend utility, and route wiring slice:

1. Write a failing test that describes the desired behavior.
2. Run the targeted test and confirm it fails for the expected reason.
3. Implement the smallest production change that makes that test pass.
4. Refactor only after the relevant test slice is green.

Do not write production code for a slice before at least one failing test exists for that slice.

Backend tests:

- Controller route test for `POST /search/smart/facets`.
- Service tests for validation, access checks, ML-disabled behavior, query embedding reuse, `queryAssetId`, language propagation, shared timeline spaces, `spaceId`, and `spacePersonIds`.
- Repository tests for exact full-result aggregation.
- Repository tests for facet self-exclusion:
  - timeline excludes date filters
  - people excludes person filters
  - location excludes country/city
  - camera excludes make/model
  - tags excludes tag IDs
- Repository tests for empty matches returning `total: 0` and empty facet arrays.
- Repository tests for broad matches spanning more assets than one result page, proving facets and `total` are not page-limited.
- Repository tests for current smart-search filter semantics, including:
  - `rating` behaves as the current minimum-rating filter
  - `type` scopes image/video assets
  - `isFavorite` supports both `true` and `false`
  - tag/person matching preserves existing smart-search behavior
- Repository or service tests for `queryAssetId` with a missing embedding returning the existing smart-search error.
- Query-shape or regression tests that guard against one independent vector search per facet where practical.

Frontend tests:

- Payload builder tests for photos and spaces.
- Route/component tests for:
  - no-search mode using normal timeline buckets
  - search mode using facet `timeBuckets`
  - spaces sending `spacePersonIds`
  - sort changes not refetching facets
  - loading more result pages not refetching facets
  - filter changes refetching facets and resetting results
  - exact `total` passed to `SmartSearchResults`
  - `total` fallback while facets are loading or after facets fail
  - facet failure preserving previous panel values
  - clearing the committed query returning the panel to normal timeline/suggestion mode
  - late facet responses from an aborted/stale request not replacing newer facet state
- Existing smart-search and filter-panel tests remain green.

Edge cases to cover:

- Empty committed query: no facets request.
- Whitespace-only committed query: no facets request.
- Search with no matches: results empty, `total` is `0`, and facet sections are empty without hiding the panel incorrectly.
- Timeline filter active: `total` applies the date filter, while `timeBuckets` excludes it.
- Multiple active filters: each facet excludes only its own filter group and respects all others.
- Space route with a selected space person: request uses `spacePersonIds`, not `personIds`.
- Space route without permission: normal shared-space access error.
- `/photos` route with `withSharedSpaces: true` and no timeline spaces: still returns user/partner-owned facets correctly.
- Sort-only changes: result request can rerun, facet request must not.
- Facet request failure: previous facet data remains visible and selected orphaned values stay removable.
- OpenAPI generation: new DTOs and SDK method are present after `make open-api`.

Generated files:

- Regenerate OpenAPI after adding the endpoint and DTOs.
- Regenerate the TypeScript SDK.
- Regenerate mobile/Dart OpenAPI output as part of the repo's normal `make open-api` workflow, even though mobile does not consume this feature.

## Rollout Notes

Ship this as a smart-search-only slice. Keep the legacy `/search` route stable and unchanged.

If profiling shows exact full-result facets are too slow on large libraries, revisit the product contract explicitly. Do not introduce silent approximation as a hidden implementation detail.
