# Shared Spaces Phase 1 Completion — Design

## Goal

Complete the remaining Phase 1 gaps for shared spaces: map view, search within spaces, and advanced bulk actions. All changes are web + server only (mobile is out of scope).

Delivered as a single PR.

## 1. Space Map View

### Approach

Follow the existing album-map pattern: a map icon button in the space header opens a `MapModal` with markers built client-side from space asset exif data. No backend changes needed.

**New component:** `SpaceMap.svelte` (modeled on `album-map.svelte`)

- Fetches space assets via the timeline/asset endpoint with `spaceId` filter
- Extracts `lat`/`lon` from `exifInfo` on each asset
- Opens `MapModal` with the constructed markers
- Clicking a marker in the modal navigates to the asset viewer

**Placement:** Icon button in the space detail page header, next to the existing members/settings icons.

### Future: Full Server-Side Map Markers

When spaces grow large enough that loading all assets client-side becomes impractical, the approach should be:

1. Add `spaceId` optional parameter to `MapMarkerDto`
2. In `map.service.ts`, when `spaceId` is set, verify `SharedSpaceRead` permission and pass to repository
3. In `map.repository.ts`, add `spaceIds` parameter to `getMapMarkers()` — add an `OR EXISTS (SELECT 1 FROM shared_space_asset WHERE shared_space_asset."assetId" = asset.id AND shared_space_asset."spaceId" = ANY(:spaceIds))` clause, same pattern as the timeline integration
4. On the web, replace the client-side marker construction with a call to `GET /map/markers?spaceId=<id>`

This also enables adding `withSharedSpaces` support to the global map page (showing all space assets on the main map), mirroring the timeline integration from PR #22.

## 2. Search Within Spaces

### Server

**DTOs:** Add optional `spaceId: string` to `MetadataSearchDto` and `SmartSearchDto`.

**`search.service.ts`:**

- When `spaceId` is present, verify `SharedSpaceRead` permission
- Pass `spaceId` through to the search repository

**`search.repository.ts`:**

- When `spaceId` is present in search options, add `JOIN shared_space_asset ON asset.id = shared_space_asset."assetId" WHERE shared_space_asset."spaceId" = :spaceId` to scope results to space assets
- Applies to both `searchMetadata()` and `searchSmart()` methods

### Web

**Space detail page:** Add a search bar in the space header, above the asset grid.

- Single text input that performs **smart search** (CLIP-based) by default via `POST /search/smart` with `spaceId`
- Search results replace the timeline grid temporarily
- Clearing the search bar restores the normal space timeline
- Empty state message when no results match

No metadata/smart toggle — smart search handles both natural language and keyword queries well enough for Phase 1.

## 3. Advanced Bulk Actions

### Actions to add

| Action             | Gate                   |
| ------------------ | ---------------------- |
| Archive            | User owns all selected |
| Change Date        | User owns all selected |
| Change Location    | User owns all selected |
| Change Description | User owns all selected |
| Tag                | User owns all selected |

### Actions explicitly excluded

| Action | Reason                                                                 |
| ------ | ---------------------------------------------------------------------- |
| Delete | Space members should not delete assets they don't own. Remove suffices |

### Implementation

Reuse existing action components (`ArchiveAction`, `ChangeDate`, `ChangeLocation`, `ChangeDescription`, `TagAction`) — these are already built for albums. Wire them into the space detail page's `AssetSelectControlBar`, gated behind `assetInteraction.isAllUserOwned`.

No new server endpoints or components needed.

## Out of Scope

- Mobile UI (separate future effort)
- Statistics endpoint (already have `assetCount` and `memberCount` in `SharedSpaceResponseDto`)
- Asset viewer (already working via URL routing)
- Full server-side map markers (documented above for future)
