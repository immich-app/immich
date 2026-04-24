# Album Detail FilterPanel Design

## Goal

Add the existing `FilterPanel` and `ActiveFiltersBar` to the album detail page (`/albums/[albumId]`) so users can filter the album timeline with the same filter set already available on `/photos`, while also supporting the add-assets picker on the same page.

This work is limited to album detail. The `/albums` index stays unchanged.

## Decisions

1. **Album detail only** — no changes to the album list or album grouping UI.
2. **Full `/photos` parity for filter sections** — `timeline`, `people`, `location`, `camera`, `tags`, `rating`, and `media`.
3. **No search box and no sort controls** — preserve the current album page toolbar and ordering behavior.
4. **Panel visible in all relevant modes** — `VIEW`, `SELECT_ASSETS`, and `SELECT_THUMBNAIL`.
5. **Two filter states, not one** — `VIEW` and `SELECT_THUMBNAIL` share one album-scoped state; `SELECT_ASSETS` uses an independent picker-scoped state.
6. **Album-scoped suggestions must be real** — no client-side approximation or global fallback for the album timeline.
7. **Picker scope stays picker scope** — `SELECT_ASSETS` filters the current add-assets dataset, not the album’s existing assets.

## Approach

Use the existing `FilterPanel` and `ActiveFiltersBar` directly on the album detail route and extend the search suggestion APIs so they can scope suggestions to `albumId`.

The timeline/query layer already supports combining `albumId` with the normal asset filters, so the main gap is suggestion scope. The album timeline and album cover selection will use album-scoped suggestions; the add-assets picker will keep its existing global picker dataset and use picker-scoped suggestions.

## Mode Matrix

| Mode               | Filter state    | Suggestion scope          | Timeline scope                                        |
| ------------------ | --------------- | ------------------------- | ----------------------------------------------------- |
| `VIEW`             | `albumFilters`  | Current album (`albumId`) | Existing album assets                                 |
| `SELECT_THUMBNAIL` | `albumFilters`  | Current album (`albumId`) | Existing album assets                                 |
| `SELECT_ASSETS`    | `pickerFilters` | Add-assets picker dataset | Current picker dataset with `timelineAlbumId` markers |

`VIEW` and `SELECT_THUMBNAIL` intentionally share one state because they operate on the same asset set. `SELECT_ASSETS` is separate because it operates on a different dataset and shared state would make mode switches feel misleading.

## Frontend Design

### Album Page Integration

Add the album page filter UI at the route level in `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte`, following the same broad layout pattern as `/photos`:

```text
[FilterPanel] [ActiveFiltersBar + Timeline]
```

The panel sits outside the inner `Timeline` children so the page structure stays stable across mode switches. Use a mode branch around the panel and chips so binding stays explicit:

- Non-picker branch: bind `FilterPanel` and `ActiveFiltersBar` to `albumFilters`
- Picker branch: bind `FilterPanel` and `ActiveFiltersBar` to `pickerFilters`

This keeps the current page readable and avoids inventing a new abstraction for only one route.

### Filter State

Add two states:

- `albumFilters = createFilterState()`
- `pickerFilters = createFilterState()`

Also keep separate suggestion label caches:

- `albumPersonNames` / `albumTagNames`
- `pickerPersonNames` / `pickerTagNames`

This avoids chip-label bleed between album-scoped suggestions and picker-scoped suggestions.

When navigating to a different album, reset both filter states and both label maps so filters do not leak between albums.

### Filter Configs

Create two route-local or helper-based configs:

- `buildAlbumDetailFilterConfig(albumId: string): FilterPanelConfig`
- `buildAlbumAssetPickerFilterConfig(): FilterPanelConfig`

`buildAlbumDetailFilterConfig` uses:

- `getFilterSuggestions({ albumId, ...filters })`
- `providers.cities(country, context) -> getSearchSuggestions({ albumId, country, ...context })`
- `providers.cameraModels(make, context) -> getSearchSuggestions({ albumId, make, ...context })`

`buildAlbumAssetPickerFilterConfig` uses picker scope only:

- no `albumId`
- no `withSharedSpaces`
- suggestions aligned with the current picker dataset, which already uses `withPartners: true` and `timelineAlbumId`
- `providers.cities(country, context)` and `providers.cameraModels(make, context)` follow the same picker scope rules

Do not add a search box, sort dropdown, or favorites section in this work.

### Timeline Options

Add small helpers to map `FilterState` into timeline options without changing current ordering semantics.

For album timeline / album cover selection:

- base options stay album-native: `{ albumId, order: album.order }`
- merge in filter fields: `personIds`, `city`, `country`, `make`, `model`, `tagIds`, `rating`, media type, and temporal range
- do not override album order

For add-assets picker:

- base options stay picker-native: `{ visibility: AssetVisibility.Timeline, withPartners: true, timelineAlbumId: album.id }`
- merge in the same filter fields
- do not add `withSharedSpaces`
- do not add album scoping

This preserves existing route behavior while adding filtering.

### Time Buckets

Continue passing `timeBuckets` from `timelineManager?.months` into the active panel. The panel should always reflect the currently mounted timeline dataset for the active mode.

### Chips And Clearing

Render `ActiveFiltersBar` in all three modes, bound to the active mode’s state.

- `VIEW` and `SELECT_THUMBNAIL` clear/remove against `albumFilters`
- `SELECT_ASSETS` clear/remove against `pickerFilters`

Use the existing filter-removal semantics already used on `/photos` and `/spaces`.

### Hidden And Empty States

Hide the panel only when the active timeline dataset is initialized, has zero results, and there are no active filters. This matches `/photos` and avoids showing a useless sidebar on empty datasets.

When filters are active and results narrow to zero, keep the panel visible and show an inline empty state above or instead of the timeline content:

- Album timeline / thumbnail mode: `No photos match your filters`
- Picker mode: `No photos available to add match your filters`

Include a `Clear all filters` action in both cases.

This covers the filtered-zero-results case that the album page does not currently handle explicitly.

### Persistence

Do not persist filter values across reloads or via URL params in this work.

UI persistence can stay shared:

- one shared `storageKey` for visible filter sections on album detail
- existing global collapsed/expanded panel persistence behavior

Only the filter values themselves are mode-specific.

## Server And API Design

### DTO And SDK Changes

Add `albumId?: string` support to:

- `SearchSuggestionRequestDto`
- `FilterSuggestionsRequestDto`

Regenerate the TypeScript SDK so `@immich/sdk` exposes `albumId` for:

- `getSearchSuggestions`
- `getFilterSuggestions`

Do not extend `TagSuggestionRequestDto` in v1. The current design uses the unified `suggestionsProvider`, which already returns tags through `getFilterSuggestions`, so widening the tag-specific endpoint would add scope without a consumer.

### Validation Rules

`albumId` is mutually exclusive with:

- `spaceId`
- `withSharedSpaces`

These represent different scope models and should not be mixed in one request.

### Access Control

When `albumId` is present, require:

- `Permission.AlbumRead`

before executing suggestion queries.

This mirrors existing album timeline access rules and keeps album-scoped suggestions from leaking inaccessible metadata.

### Repository Scope Refactor

The search repository currently has separate logic for:

- user-owned scope
- `spaceId` scope
- `timelineSpaceIds` scope

Add album scope through a small reusable asset-scope helper rather than copying a new `album_asset` condition into every query path separately.

That helper should support:

- default owned/partner scope
- album scope
- space scope
- timeline shared-space scope

and be reused by filtered suggestion queries for:

- countries
- camera makes
- tags
- people
- ratings
- media types
- city/model follow-up suggestions

The intent is not a broad repository rewrite. It is a targeted refactor that keeps album scope consistent across all suggestion queries.

One correctness requirement is non-negotiable: album scope must not fall back to `ownerId IN userIds` semantics. Shared album suggestions must include assets from accessible album members even when those owners are neither the current user nor a partner.

## Data Flow

### `VIEW` / `SELECT_THUMBNAIL`

```text
albumFilters
  -> album-scoped FilterPanel suggestions
  -> album timeline option builder
  -> TimelineManager.updateOptions({ albumId, order, ...filters })
  -> filtered album buckets/assets
  -> ActiveFiltersBar reflects albumFilters
```

### `SELECT_ASSETS`

```text
pickerFilters
  -> picker-scoped FilterPanel suggestions
  -> picker timeline option builder
  -> TimelineManager.updateOptions({ visibility, withPartners, timelineAlbumId, ...filters })
  -> filtered add-assets picker buckets/assets
  -> ActiveFiltersBar reflects pickerFilters
```

## Error Handling

- Suggestion fetch failures remain non-fatal: log, keep the panel mounted, preserve current selections.
- Invalid mixed scope params (`albumId` + `spaceId`, `albumId` + `withSharedSpaces`) return `400`.
- Album access failure on suggestion endpoints returns the normal authorization error.
- Clearing filters must always restore the active mode’s unfiltered baseline dataset.

## Testing

### TDD Execution

Implementation should follow strict red-green-refactor order instead of treating the test list as a post-hoc checklist.

### Sequence

1. Add failing server tests for `albumId` validation, authorization, and album-scoped suggestion behavior.
2. Add failing repository/service tests for shared-album scope, especially assets owned by non-partner collaborators.
3. Add failing web unit tests for filter-state separation and timeline option builders.
4. Add failing route/component tests for mode wiring, chip behavior, and filtered empty states.
5. Implement the minimum code to make those tests pass.
6. Add or update E2E coverage for the user-visible flows once the lower-level tests are green.
7. Refactor only after the relevant test slice is green.

No production code for a slice should be added before at least one failing test exists for that slice.

### Web Unit Tests

- Album timeline option builder maps all supported filter fields without changing album order.
- Picker option builder maps all supported filter fields without adding album scope.
- Mode switching preserves `albumFilters` across `VIEW` <-> `SELECT_THUMBNAIL`.
- Mode switching preserves `albumFilters` when entering and leaving `SELECT_ASSETS`.
- Mode switching preserves `pickerFilters` independently of `albumFilters`.
- Active filter removal updates the correct state for the current mode.

### Web Component / Route Tests

- Panel renders on album detail in `VIEW`.
- Panel renders in `SELECT_ASSETS`.
- Panel renders in `SELECT_THUMBNAIL`.
- Active filter chips use album-scoped labels in album modes and picker-scoped labels in picker mode.
- Filtered zero-results state shows the correct empty message and clear-all action.
- `SELECT_ASSETS` keeps already-in-album assets disabled and visibly marked after filters change.
- Navigating from one album detail page to another resets both filter states and both label caches.

### Server Tests

#### Controller / HTTP validation

- `/search/suggestions` accepts a valid `albumId` query param.
- `/search/suggestions/filters` accepts a valid `albumId` query param.
- Invalid `albumId` query params return `400` on both endpoints.

#### Service / repository behavior

- `getFilterSuggestions` accepts `albumId` and scopes results to accessible album assets.
- `getSearchSuggestions` accepts `albumId` and scopes follow-up suggestions to accessible album assets.
- Requests mixing `albumId` with `spaceId` or `withSharedSpaces` are rejected.
- `Permission.AlbumRead` is enforced before album-scoped suggestions run.
- Album-scoped suggestions include assets from shared album collaborators who are not partners.

### E2E Coverage

- Album detail panel filters existing album assets by at least one person/tag/timeline case.
- `SELECT_THUMBNAIL` reuses album filters.
- `VIEW` and `SELECT_ASSETS` preserve separate filter states when switching back and forth.
- `SELECT_ASSETS` uses a separate filter state and restores it when switching back into picker mode.
- `SELECT_ASSETS` filtering does not make already-in-album assets selectable.
- Clearing filters restores the expected dataset for the active mode.

## Files Expected To Change

- `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- `web/src/lib/utils/` helper for album timeline filter option mapping
- `server/src/controllers/search.controller.spec.ts`
- `server/src/dtos/search.dto.ts`
- `server/src/services/search.service.ts`
- `server/src/repositories/search.repository.ts`
- `open-api/typescript-sdk/src/fetch-client.ts`
- generated SDK build output
- targeted unit and route tests for the new album-specific behavior

## Not Doing

- Album index filters on `/albums`
- Search box on album detail
- Sort controls on album detail
- URL persistence for album filters
- New generic filter-panel abstraction for all timeline routes
- Favorites filter for album detail
