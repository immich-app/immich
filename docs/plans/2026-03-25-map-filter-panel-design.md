# Map FilterPanel Design

## Overview

Add the FilterPanel component to the map view (`/map`) to enable rich content filtering of map markers. Works for both global map and space-scoped map (`/map?spaceId=X`).

## Decisions

- **Filter markers themselves** — applying "person: Alice" removes markers without Alice's face
- **Fork-only server endpoint** — uses `searchAssetBuilder` with map-column projection, zero upstream server changes
- **Replace MapSettingsModal** with FilterPanel — gear icon hidden via `showSettings={false}`
- **Drop location filter** — the map IS the location filter
- **Drop sort toggle** — meaningless for spatial markers
- **Add favorites toggle** — new FilterPanel section, maps to `isFavorite` endpoint param
- **Expanded by default** — discoverability for new feature
- **Left sidebar layout** — consistent with /photos and /spaces
- **Dark mode tile toggle** — standalone MapLibre control button on the map (replaces the setting from MapSettingsModal)

## Not Doing

- **Partners/SharedAlbums filter** — non-space map shows user's own assets only. Can be added later.
- **Include archived toggle** — only timeline-visible assets shown. Can be added later.

## Server

### New endpoint: `GET /api/gallery/map/markers`

All fork-only files — zero upstream server changes.

**Query params:**

| Param         | Type       | Description                     |
| ------------- | ---------- | ------------------------------- |
| `personIds`   | `string[]` | Filter by person faces          |
| `make`        | `string?`  | Camera make                     |
| `model`       | `string?`  | Camera model                    |
| `tagIds`      | `string[]` | Filter by tags                  |
| `rating`      | `number?`  | Minimum star rating             |
| `mediaType`   | `string?`  | `image` or `video`              |
| `takenAfter`  | `string?`  | ISO date, temporal filter start |
| `takenBefore` | `string?`  | ISO date, temporal filter end   |
| `spaceId`     | `string?`  | Scope to shared space           |
| `isFavorite`  | `boolean?` | Only favorites                  |

**Implementation:**

```typescript
searchAssetBuilder(this.db, options)
  .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
  .where('asset_exif.latitude', 'is not', null)
  .where('asset_exif.longitude', 'is not', null)
  .select([
    'asset.id',
    'asset_exif.latitude as lat',
    'asset_exif.longitude as lon',
    'asset_exif.city',
    'asset_exif.state',
    'asset_exif.country',
  ])
  .execute();
```

Uses an explicit `innerJoin` with selective columns instead of `withExif: true` (which would add a wasteful `toJson(asset_exif)` select). The `DeduplicateJoinsPlugin` handles cases where `searchAssetBuilder` also adds the join for exif filter fields.

**Access control:**

- With `spaceId`: validate `SharedSpaceRead` permission
- Without `spaceId`: pass `userIds: [auth.user.id]` — user's own timeline-visible assets

**Returns:** `MapMarkerResponseDto[]` (existing type).

### Files

| File                                                    | Status        |
| ------------------------------------------------------- | ------------- |
| `server/src/controllers/gallery-map.controller.ts`      | New fork-only |
| `server/src/dtos/gallery-map.dto.ts`                    | New fork-only |
| Repository method (shared-space.repository or new file) | Fork-only     |

## Web

### Layout

```
[nav sidebar] [FilterPanel w-64/w-8] [map flex-1] [timeline panel (on cluster click)]
```

- FilterPanel starts **expanded** for discoverability
- `storageKey: 'gallery-filter-visible-sections-map'`
- On mobile (`< sm`): FilterPanel hidden behind toggle button, not inline

### FilterPanel config

New fork-only file: `web/src/lib/utils/map-filter-config.ts`

`buildMapFilterConfig(spaceId?: string): FilterPanelConfig`

- **Sections:** `timeline`, `people`, `camera`, `tags`, `rating`, `media`, `favorites`
- **No location section**, no sort toggle
- **Global providers** (no spaceId): `getAllPeople`, `getSearchSuggestions`, `getAllTags`
- **Space providers** (with spaceId): `getSpacePeople`, space-scoped suggestions

### timeBuckets

Fetched via `getTimeBuckets()` API on mount (with `spaceId` if present) and passed to FilterPanel. Markers don't carry dates so this can't be derived from marker data.

### Favorites toggle

New addition to FilterPanel:

- Add `isFavorite?: boolean` to `FilterState`
- New `FavoritesFilter` component — simple boolean toggle
- Add `'favorites'` to `FilterSection` type
- Maps to `isFavorite` query param on the fork endpoint

### Sort toggle

Hide the sort toggle on the map. Add a `showSort?: boolean` option to `FilterPanelConfig` (default `true`), set to `false` in the map config.

### Dark mode tile toggle

Add a standalone `ControlButton` in `map.svelte`'s control area (alongside zoom, compass, globe). Sun/moon icon that toggles `mapSettings.allowDarkMode`. Visible when `showSettings` is false (i.e., when FilterPanel replaces the settings modal). One small addition to an upstream file.

### Data flow

```
FilterState changes
  → debounce
  → GET /api/gallery/map/markers?params
  → update mapMarkers state
  → map re-renders markers via $bindable prop
```

### Race condition fixes

**Initial load:** Initialize `mapMarkers = []` (not `undefined`) before passing to `map.svelte`. This prevents the component's `onMount` from calling its internal `loadMapMarkers()`. The first `$effect` cycle fetches filtered markers and populates the array.

**Asset deletion:** When a user deletes an asset from the timeline panel, `map.svelte` internally calls `loadMapMarkers()` which fetches unfiltered markers via the upstream endpoint. Fix: the page listens for asset deletion via `OnEvents` and re-fetches filtered markers. Brief flash of unfiltered data is possible but filtered results overwrite via the `$bindable` binding.

### MapTimelinePanel

Forward filter params (`personIds`, `tagIds`, `make`, `model`, `rating`, `mediaType`, `takenAfter`, `takenBefore`, `isFavorite`) into its `timelineOptions` so the timeline panel shows only filtered assets within the cluster bounding box.

### No results indicator

When `mapMarkers.length === 0` and filters are active, show a "No matching photos" overlay on the map.

## Files Summary

| File                                                                   | Fork status       | Change                                                |
| ---------------------------------------------------------------------- | ----------------- | ----------------------------------------------------- |
| `server/src/controllers/gallery-map.controller.ts`                     | New fork-only     | Endpoint                                              |
| `server/src/dtos/gallery-map.dto.ts`                                   | New fork-only     | Query params DTO                                      |
| `server/src/repositories/` (new or shared-space)                       | Fork-only         | searchAssetBuilder + map projection                   |
| `web/src/lib/utils/map-filter-config.ts`                               | New fork-only     | Config builder + API call                             |
| `web/src/lib/components/filter-panel/favorites-filter.svelte`          | New fork-only     | Favorites toggle                                      |
| `web/src/lib/components/filter-panel/filter-panel.ts`                  | Fork-modified     | Add `isFavorite` to FilterState, `favorites` section  |
| `web/src/lib/components/filter-panel/filter-panel.svelte`              | Fork-modified     | Render favorites section, hide sort toggle via config |
| `web/src/routes/(user)/map/.../+page.svelte`                           | Upstream modified | Add FilterPanel, manage markers, forward filters      |
| `web/src/lib/components/shared-components/map/MapTimelinePanel.svelte` | Upstream modified | Accept and apply filter params                        |
| `web/src/lib/components/shared-components/map/map.svelte`              | Upstream modified | Dark mode tile toggle button                          |

**Upstream files touched: 3** (map page route, MapTimelinePanel, map.svelte). Everything else is fork-only or already fork-modified.

## Testing

- **Server:** Unit tests for new endpoint — verify marker shape, access control, filter application
- **Web:** Unit tests for `buildMapFilterConfig`, favorites toggle component
- **E2E:** FilterPanel visible on `/map`, person filter reduces markers, space-scoped providers work on `/map?spaceId=X`
