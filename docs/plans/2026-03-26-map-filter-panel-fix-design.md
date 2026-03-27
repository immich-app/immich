# Map Filter Panel Fix — Design

## Problem

The map view's FilterPanel only applies Timeline, Camera, and Media Type filters.
People, Location, Tags, and Rating filters have no effect.

## Root Causes

### 1. People filter: AND logic instead of OR

`searchAssetBuilder` calls `hasPeople()` which requires ALL selected people to appear
on the same photo (`.having(count = personIds.length)`). Filter panel semantics need
OR (any selected person). `hasAnyPerson()` already exists upstream with OR logic.

Same issue with `hasTags()` — no OR variant exists yet.

### 2. Array query param parsing

When a single UUID is sent via GET query string (`?personIds=uuid1`), Express parses
it as a plain string. The DTO's `@IsArray()` validation fails, and `whitelist: true`
strips the field silently. Two+ values work because Express parses
`?personIds=a&personIds=b` as an array.

### 3. Rating type conversion

`rating` arrives as string `"3"` from query params. Without `@Type(() => Number)`,
the `@Min(1)`/`@Max(5)` validators compare against the string.

### 4. Location filter unwired

`city`/`country` exist in `FilterState` but are never sent to the API — missing from
`FilteredMapMarkerDto`, service pass-through, and frontend API call. The
`searchAssetBuilder` already supports `city`/`country` (lines 389-402 of
`database.ts`).

## Design

### Fix 1: OR logic via flags on `AssetSearchBuilderOptions`

Add `personMatchAny?: boolean` and `tagMatchAny?: boolean` to
`AssetSearchBuilderOptions`. When true, `searchAssetBuilder` calls `hasAnyPerson` /
`hasAnyTag` instead of `hasPeople` / `hasTags`.

Create `hasAnyTag` — same as `hasTags` but without the `.having()` count clause.

The map endpoint sets both flags to `true`. Existing search callers keep AND as
default.

### Fix 2: `@Transform` on array fields

Add `@Transform(({ value }) => (Array.isArray(value) ? value : [value]))` to
`personIds` and `tagIds` in `FilteredMapMarkerDto`, guarded by truthy check.

### Fix 3: `@Type(() => Number)` on rating

Matches the pattern used by upstream `search.dto.ts`.

### Fix 4: Wire location fields

- Add `city?: string` and `country?: string` to `FilteredMapMarkerDto`
- Pass through in `SharedSpaceService.getFilteredMapMarkers()`
- Send from frontend `$effect` (add `city, country` to destructuring)

### Generated files

- `make open-api-typescript` for SDK changes
- `make sql` for query documentation

## Files Changed

1. `server/src/utils/database.ts` — add `hasAnyTag`, add flags to builder options and
   conditional calls
2. `server/src/dtos/gallery-map.dto.ts` — Transform/Type decorators, city/country
3. `server/src/services/shared-space.service.ts` — pass city/country and match flags
4. `web/src/routes/(user)/map/.../+page.svelte` — send city/country in API call
5. `open-api/typescript-sdk/src/fetch-client.ts` — regenerated
6. `server/src/queries/shared.space.repository.sql` — regenerated

## What Is NOT Changing

- `hasPeople` / `hasTags` — kept as-is (AND logic preserved for future use)
- `hasAnySpacePerson` — already correct
- `map.svelte` — display layer, receives pre-filtered markers
- Upstream `MapMarkerDto` — separate endpoint
