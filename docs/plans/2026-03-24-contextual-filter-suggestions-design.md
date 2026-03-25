# Contextual Filter Suggestions

## Problem

When a user opens the FilterPanel (currently used in Spaces), each filter section
(people, locations, cameras, tags) fetches suggestions independently. If you select
"June 2024" in the temporal picker, the location dropdown still shows every city
across all time — including cities where photos only exist in 2019. This leads to
misleading filter options and empty-result dead ends.

## Decision

**Option C with bidirectional temporal:**

- Temporal (date range) scopes all other filter suggestions (people, locations, cameras)
- Non-temporal filters scope the temporal picker back (already free via TimelineManager)
- Within-section cascades remain: country → city, make → model
- Non-temporal filters do NOT scope filters in _other_ sections (person selection
  doesn't narrow location suggestions). Within-section cascades are not considered
  cross-scoping.

## Scoping Model

| When this changes...      | ...these re-fetch scoped suggestions           |
| ------------------------- | ---------------------------------------------- |
| Temporal (year/month)     | People, locations, cameras                     |
| People, location, camera  | Temporal picker (via existing TimelineManager) |
| Country (within location) | City (existing cascade)                        |
| Make (within camera)      | Model (existing cascade)                       |

Note: The server supports a country → state → city cascade, but the frontend UI only
exposes country → city. State-level filtering is not in scope. Lens model is also
server-supported but not exposed in the UI; it will get temporal scoping automatically
on the server side but no frontend re-fetch is needed.

The temporal picker's bidirectional scoping is already handled: `timeBuckets` is
derived from `timelineManager.months`, which re-fetches when filter options change.
No additional work is needed for this direction. Note that `timeBuckets` reflects ALL
active filters (including rating, media type) because it comes from TimelineManager,
while `FilterContext` only contains temporal bounds. This asymmetry is intentional —
rating/media type affect which months have assets, but they are not sent to suggestion
providers.

Timezone handling inherits whatever behavior `fileCreatedAt` already has. The EXIF
date may be in local camera time. Timezone-aware filtering is out of scope.

## Server Changes

### SearchSuggestionRequestDto

Add optional `takenAfter` and `takenBefore` to `SearchSuggestionRequestDto`. This DTO
is standalone — it does not extend `BaseSearchDto` where these fields already exist.
Use `@ValidateDate` decorator (same as `BaseSearchDto`) so NestJS class-transformer
handles ISO string → `Date` conversion. The frontend sends ISO strings; the server
types are `Date`.

### Threading through the chain

1. **DTO** (`search.dto.ts`): Add `takenAfter?` and `takenBefore?` with
   `@ValidateDate` to `SearchSuggestionRequestDto`
2. **Service** (`search.service.ts`): Pass temporal fields through `getSuggestions()`
   to all repository methods. **Note:** `getCountries` currently only passes
   `{ spaceId: dto.spaceId }` — it must be updated to also pass temporal fields.
   The other methods (`getStates`, `getCities`, `getCameraMakes`, `getCameraModels`,
   `getCameraLensModels`) do pass the full dto to the repository, but see item 3b.
3. **Repository options type** (two changes needed):
   a. Add `takenAfter` and `takenBefore` to `SpaceScopeOptions` — since all per-field
   options interfaces extend it, the type propagates automatically
   b. **Fix destructuring in all repository methods**: Every method currently
   destructures only specific fields and passes `{ spaceId }` to `getExifField()`,
   which drops any additional fields. All of `getStates`, `getCities`,
   `getCameraMakes`, `getCameraModels`, `getCameraLensModels` must be updated to
   forward temporal fields to `getExifField()`. The cleanest approach: pass the
   full options object to `getExifField()` instead of `{ spaceId }`
4. **`getExifField()` helper** (`search.repository.ts`): Add
   `.$if(!!options?.takenAfter, qb => qb.where('asset.fileCreatedAt', '>=', takenAfter))`
   and `.$if(!!options?.takenBefore, qb => qb.where('asset.fileCreatedAt', '<', takenBefore))`.
   Use `>=` for `takenAfter` and strict `<` for `takenBefore` (exclusive upper bound).
   The column `fileCreatedAt` is the EXIF-derived taken date, not the DB insert
   timestamp (`createdAt`). This is the single place where temporal scoping is applied
   to all suggestion queries.
5. **OpenAPI regeneration**: Since `SearchSuggestionRequestDto` changes the API
   contract, run `make open-api-typescript` to regenerate the TypeScript SDK

### People endpoint

`getSpacePeople` uses a different endpoint (`GET /spaces/:id/people`) which currently
takes only an `id` path parameter with no query params. Changes needed:

1. Create a new DTO (e.g., `SpacePeopleQueryDto`) with optional `takenAfter` and
   `takenBefore` fields using `@ValidateDate`
2. Update the controller to accept `@Query() query: SpacePeopleQueryDto`
3. Thread temporal params through the service to the repository query. The current
   architecture is N+1: `getPersonsBySpaceId` fetches all persons (flat query on
   `shared_space_person`), then the service loops and calls `getPersonFaceCount` /
   `getPersonAssetCount` per person. None of these queries join through to the
   `asset` table where `fileCreatedAt` lives. **Recommended approach:** Create a new
   repository method that filters persons in a single query joining
   `shared_space_person` → `shared_space_person_face` → `asset_face` → `asset` with
   a WHERE on `asset.fileCreatedAt`, returning only persons with at least one face
   asset in the range. This avoids the N+1 pattern and naturally excludes people with
   zero matches.
4. Regenerate OpenAPI spec and TypeScript SDK (covered by the same
   `make open-api-typescript` step above)

### Fix pre-existing cascade bugs

Two cascade callbacks in `filter-panel.svelte` ignore their parent parameters:

1. **City cascade**: `onCityFetch` receives the country from `LocationFilter`
   (`expandedCountry`) but ignores it — the callback calls `config.providers.locations()`
   which returns all locations globally, then client-side filters by `type === 'city'`.
   Fix: pass the country to the server as a query param (e.g.,
   `getSearchSuggestions({ $type: SearchSuggestionType.City, country })`)
2. **Camera model cascade**: `onModelFetch` has the identical bug — ignores the make
   parameter. Fix: pass the make to the server.

Both must be fixed before layering temporal scoping on top.

## Frontend Changes

### FilterPanel becomes self-contained

The page provides `FilterPanelConfig` with provider functions that now accept an
optional context parameter:

```typescript
type FilterContext = {
  takenAfter?: string;
  takenBefore?: string;
};

providers: {
  // Scopes the country list by temporal context
  people: async (context?: FilterContext) => ...,
  // Scopes the country list by temporal context
  locations: async (context?: FilterContext) => ...,
  // Scopes the make list by temporal context
  cameras: async (context?: FilterContext) => ...,
}
```

The page constructs actual API calls — FilterPanel passes context through. This keeps
FilterPanel reusable across different pages (spaces, albums, future main timeline).
The temporal scoping works identically for non-space contexts since `takenAfter`/
`takenBefore` on `SearchSuggestionRequestDto` are independent of `spaceId`.

Cascade callbacks also need temporal context. Update the Props interfaces of
`LocationFilter` and `CameraFilter` to accept both the parent value and context:

```typescript
// LocationFilter.Props (breaking change to component interface)
onCityFetch: (country: string, context?: FilterContext) => Promise<string[]>;

// CameraFilter.Props (breaking change to component interface)
onModelFetch: (make: string, context?: FilterContext) => Promise<string[]>;
```

FilterPanel passes the current temporal context to cascade callbacks alongside the
parent value. This ensures cities are scoped by both country AND date range.

**Cascade re-fetch on temporal change:** Pass `FilterContext` as a prop to
`LocationFilter` and `CameraFilter`. Their internal `$effect` blocks should depend on
both the parent value (e.g., `expandedCountry`) AND the context, so that changing the
temporal filter triggers a city/model re-fetch for any currently expanded cascade.
The `$effect` must guard on `expandedCountry` (or `expandedMake`) being set before
issuing a re-fetch — otherwise temporal changes would trigger a fetch even when no
cascade is expanded.

### Temporal range mapping

When the user selects a year/month in the temporal picker, map to ISO strings:

- **Year 2024**: `takenAfter: 2024-01-01T00:00:00.000Z`,
  `takenBefore: 2025-01-01T00:00:00.000Z` (exclusive upper bound, consistent with
  server's `<` operator)
- **June 2024**: `takenAfter: 2024-06-01T00:00:00.000Z`,
  `takenBefore: 2024-07-01T00:00:00.000Z`

Use start-of-next-period for `takenBefore` (not end-of-period with `.999Z`) to avoid
boundary precision issues.

Selecting a year without a month produces a full-year temporal range and triggers
re-fetch. Selecting a month narrows to that month and triggers re-fetch.

### Re-fetch flow

When a temporal filter changes (`selectedYear` and/or `selectedMonth`):

1. 200ms debounce (trailing edge — fires 200ms after the last change, so rapid
   clicks through years don't trigger intermediate fetches). Implemented via an
   `$effect` watching temporal filter state that sets a timeout and clears the
   previous one.
2. Re-fetch people, locations, cameras in parallel, passing temporal context
3. Sections show current suggestions at reduced opacity (0.5) while loading,
   implemented via a CSS transition with a 150ms delay (so fast responses under
   150ms never trigger the fade). The opacity fade only applies to re-fetches —
   initial load shows empty/loading state per current behavior.
4. On response, swap suggestions and restore opacity

**What triggers re-fetch:** Only `selectedYear`/`selectedMonth` changes trigger
provider re-fetch. Changes to `sortOrder`, `rating`, `mediaType`, `personIds`,
`city`, `country`, `make`, `model`, or `tagIds` do NOT trigger provider re-fetch
(per the scoping model — non-temporal filters don't scope other sections).

**`clearFilters()` bypasses debounce:** When the user clears all filters, re-fetch
immediately with empty `FilterContext` (no 200ms wait). Users clicking "Clear All"
expect instant feedback. Implementation: detect when temporal values transition from
non-empty to `undefined` (clear action) and skip the debounce timeout, firing the
re-fetch synchronously.

### Stale request handling

`AbortController` per fetch cycle. When a new debounced fetch fires, abort previous
in-flight requests. Clean up AbortControllers on FilterPanel unmount via `$effect`
cleanup return or Svelte `onDestroy`.

### Error handling

When a provider fetch fails (network error, server error), keep showing the previous
suggestions unchanged (no opacity fade, no stale indicator). Log the error to console.
Do not show an error state in the UI — the user can retry by changing the filter again.
This matches the existing behavior where provider failures on initial load silently
show empty sections.

### Orphaned selections

When suggestions narrow and a previously-selected value is no longer in the results
(e.g., selected "Alice" then picked a date range where Alice has no photos):

- **Keep the selection active**
- Show it at the top of the suggestion list, visually muted
- User can deselect manually
- Filter results remain correct (AND of all active filters)
- **Accessibility**: Orphaned muted items must retain `aria-selected="true"` (or
  equivalent) so screen readers convey their active state. Visual muting alone is
  insufficient.
- **Cascaded children**: If a parent is still in scope but its child becomes orphaned
  (e.g., make=Canon still visible but model=EOS R5 gone from scoped results), clear
  the child selection automatically — the model list re-fetches when temporal changes,
  and keeping an orphaned child of a cascade is more confusing than helpful

### Empty sections

When a section has 0 suggestions after scoping, collapse to muted header with **(0)**
count. No layout shifts. Add a count prop to `FilterSection` derived from suggestion
array length.

## Testing

### Server Unit Tests (`server/src/services/search.service.spec.ts`)

- **Temporal threading per suggestion type**: For each of `COUNTRY`, `STATE`, `CITY`,
  `CAMERA_MAKE`, `CAMERA_MODEL`, `CAMERA_LENS_MODEL`, pass `takenAfter` and
  `takenBefore` in the DTO and assert the repository method receives them in its
  options argument.
- **Temporal fields omitted**: Verify that when `takenAfter`/`takenBefore` are not
  set, the repository methods receive `undefined` for those fields (no accidental
  defaults).
- **Space + temporal combined**: Test that `spaceId`, `takenAfter`, and `takenBefore`
  all pass through together when all three are provided.
- **getCountries passes temporal fields**: Specifically assert that the `getCountries`
  call includes temporal fields (since this one required a manual fix, unlike the
  other methods which pass the full dto).

### Server Unit Tests (`server/src/services/shared-space.service.spec.ts`)

- **People with temporal scoping**: Verify `takenAfter`/`takenBefore` flow from the
  controller DTO through the service to the repository query.
- **People without temporal params**: Verify backward compatibility — calling without
  temporal params returns the full unscoped list.
- **People excluded by temporal range**: Verify that a person with zero face assets in
  the date range is excluded from results entirely (not returned with count 0).

### Repository / Medium Tests

If medium tests exist for `search.repository.ts` (real DB via testcontainers):

- **`getExifField` with temporal bounds**: Insert assets with known `fileCreatedAt`
  dates. Query `getCountries` with `takenAfter`/`takenBefore` and verify only
  countries from assets within the range are returned.
- **Temporal + space combined**: Insert assets in and out of a space, with varied
  dates. Verify the intersection (space AND temporal) is correct.
- **Boundary inclusivity**: Test `takenAfter` with `>=` (asset at exact boundary IS
  included) and `takenBefore` with `<` (asset at exact boundary is NOT included).
  Test `takenBefore` before all assets returns empty result.
- **All repository methods forward temporal fields**: Verify `getStates`, `getCities`,
  `getCameraMakes`, `getCameraModels`, `getCameraLensModels` all respect temporal
  bounds (not just `getCountries`), catching any destructuring bugs.

### Web Component Tests (`web/src/lib/components/filter-panel/`)

- **Re-fetch on temporal change**: Mount FilterPanel with mock providers that accept
  `FilterContext`. Simulate selecting a year in the temporal picker. Assert that
  people, locations, and cameras providers are re-called with the correct
  `{ takenAfter, takenBefore }` context.
- **Year-only selection triggers re-fetch**: Select a year without selecting a month.
  Assert providers are called with full-year temporal bounds.
- **Debounce behavior**: Rapidly change temporal selection multiple times. Assert
  providers are called only once after the debounce settles (~200ms), not on every
  intermediate change.
- **AbortController cancellation**: Start a slow provider fetch (via a delayed mock),
  then change temporal selection before it resolves. Assert the first fetch is aborted
  and only the second fetch's results are applied.
- **Combined debounce + abort**: Change temporal selection, let debounce fire and
  fetch start, then change temporal again before fetch resolves. Assert the debounce
  timer resets, the first in-flight request is aborted, and only the second fetch's
  results are applied.
- **Abort race condition**: Start a fetch, trigger abort at the same moment the
  response arrives. Assert no stale data is applied (generation counter or
  AbortController signal check on response handling).
- **Orphaned selections preserved**: Set up a person selection, then re-fetch with
  scoped suggestions that no longer include that person. Assert the person remains in
  `filters.personIds` and appears in the UI with muted styling.
- **Orphaned selection lifecycle**: Select a person, apply temporal filter that orphans
  it (muted at top), deselect it, change temporal back so person reappears. Assert
  person is in the normal suggestion list (not muted) and can be reselected cleanly.
- **Cascade child auto-clear**: Select make=Canon and model=EOS R5, then apply
  temporal filter where Canon exists but EOS R5 does not. Assert model selection is
  cleared automatically while make selection persists.
- **Empty section collapse**: Mock a provider that returns `[]` after temporal scoping.
  Assert the section header shows `(0)` and the section content is collapsed.
- **Section populated → empty → populated**: Apply narrow temporal filter (section
  collapses to `(0)`), then widen temporal filter. Assert the section re-expands with
  new suggestions and the `(0)` indicator is removed.
- **City cascade fix**: Mount LocationFilter, select a country, assert that
  `onCityFetch` is called with the selected country string (not ignored).
- **Camera model cascade fix**: Mount CameraFilter, select a make, assert that
  `onModelFetch` is called with the selected make string (not ignored).
- **Cascade callback receives temporal context**: Select a year, then select a country.
  Assert `onCityFetch` is called with both the country string AND the current
  `FilterContext` (temporal params).
- **Cascade re-fetch on temporal change**: Expand a country (cities loaded), then
  change temporal filter. Assert `onCityFetch` is re-called with the same country but
  updated temporal context.
- **Clear all filters resets suggestions**: Set temporal filters, verify scoped
  suggestions, then call `clearFilters()`. Assert all providers are re-called
  immediately (no debounce) with no temporal context.
- **Error handling on re-fetch**: Mock a provider that rejects. Assert the section
  keeps showing its previous suggestions unchanged (no opacity change, no error UI).
- **Non-temporal changes do not trigger re-fetch**: Change `sortOrder`, `rating`, or
  `mediaType`. Assert providers are NOT re-called.
- **Temporal range mapping**: Select year 2024 and assert provider receives
  `takenAfter: 2024-01-01T00:00:00.000Z, takenBefore: 2025-01-01T00:00:00.000Z`.
  Select June 2024 and assert `takenAfter: 2024-06-01T00:00:00.000Z,
takenBefore: 2024-07-01T00:00:00.000Z`.
- **Component unmount cleanup**: Mount FilterPanel, trigger a temporal change (starting
  a debounced fetch), unmount before it resolves. Assert no errors or state updates
  after unmount.

### E2E API Tests (`e2e/src/specs/server/api/`)

Extend the existing `GET /search/suggestions` tests:

- **Suggestions with temporal params**: Upload assets with different `fileCreatedAt`
  dates. Request suggestions with `takenAfter`/`takenBefore`. Assert only values from
  assets within the date range appear.
- **Suggestions with temporal + space**: Combine `spaceId` with temporal params.
  Assert the intersection is correct.
- **Temporal params with no matches**: Request with a date range containing no assets.
  Assert empty array response.
- **Backward compatibility**: Existing suggestion tests must continue passing without
  temporal params.
- **Space people with temporal params**: Call `GET /spaces/:id/people` with temporal
  params. Assert only people with face assets in the date range are returned.
- **Space people excludes out-of-range**: Call with a narrow date range and verify
  people with faces only outside that range are excluded entirely.
- **Boundary precision**: Upload an asset with `fileCreatedAt` exactly at the
  `takenBefore` boundary. Assert it is NOT included (strict `<`).

### E2E Playwright Tests (`e2e/src/specs/web/`)

Requires test data with distinct metadata per time period (different people, locations,
cameras across different years/months):

- **Temporal scoping narrows suggestions**: Navigate to a space, select a year in the
  temporal picker, verify that location/camera/people dropdowns only show values from
  assets in that year.
- **Orphaned selection visual state**: Select a person, then apply a temporal filter
  that excludes that person. Assert the person chip remains visible with muted styling.
- **Empty section state**: Apply a temporal filter that leaves zero cameras. Assert
  the camera section shows `(0)` in its header and content is collapsed.
- **Cascade correctness under temporal scoping**: Select a year, then select a country
  in the location filter. Assert the city dropdown only shows cities matching both
  the country AND the date range.
- **Clear filters restores full suggestions**: Apply temporal + location filters,
  clear all filters, verify all filter sections show full unscoped suggestions.
- **Section recovery from empty**: Apply a temporal filter that empties the camera
  section, then clear the temporal filter. Assert the camera section re-expands with
  all cameras.

## Deferred Work

### 1. Tags contextual scoping

**What:** Narrow the tag list to only tags applied to assets within the selected date
range.

**Why deferred:** `getAllTags()` returns user-level tags with no asset-scoping
mechanism. Would require a new query joining `tag_asset` → `asset` filtered by
`fileCreatedAt`, or a new `SearchSuggestionType.Tag`. Tag lists are typically small
enough that showing all of them isn't misleading.

**When to revisit:** If users report tag lists becoming unwieldy, or when adding
non-temporal cross-scoping.

**Implementation hint:** The cleanest approach would be adding a
`SearchSuggestionType.Tag` that queries through `tag_asset` → `asset` in
`getExifField()`-style, reusing the same temporal scoping infrastructure.

### 2. Non-temporal cross-scoping

**What:** Selecting a person narrows location/camera suggestions; selecting a location
narrows people/camera suggestions; etc.

**Why deferred:** Significant frontend complexity — every filter change re-fetches all
other sections, not just temporal. The server support is mostly there
(`searchAssetBuilder` handles all filter combinations) but the provider interface
would need full filter state, not just temporal context. Also introduces the "all
filters except self" pattern requiring careful UX thought around filter order
independence.

**When to revisit:** After v1 ships and we have user feedback on whether temporal
scoping alone is sufficient.

**Upgrade path:** Extend `FilterContext` to include all filter dimensions (`personIds`,
`city`, `country`, `make`, `model`, `rating`) and widen the re-fetch triggers so any
filter change re-fetches all other sections (except itself). The server endpoints
already accept these params on `BaseSearchDto`.

### 3. Batched facets endpoint

**What:** Single `POST /search/facets` returning all suggestion lists in one
round-trip.

**Why deferred:** Parallel individual requests for 4-5 lightweight DISTINCT queries
are fast enough (<50ms each). Batching adds a new endpoint contract with no
user-visible benefit unless latency becomes a problem.

**When to revisit:** If non-temporal cross-scoping is added (doubles re-fetches per
filter change) or if network latency makes parallel requests noticeably slow.

**Implementation hint:** A thin orchestration layer that calls existing repository
methods in parallel and returns a combined response. The shared query base
optimization (single CTE with multiple DISTINCT selects) would be a further
iteration.
