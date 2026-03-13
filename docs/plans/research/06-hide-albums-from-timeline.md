# Feature Research: Hide Albums from Timeline

**Votes:** 273 (9th most requested)
**Status:** Not implemented (but related patterns exist in fork)
**Upstream Work:** None found
**Fork Precedent:** Shared Spaces `showInTimeline` toggle already implements similar pattern

## Overview

Exclude certain albums from the main timeline view. Assets in "hidden" albums would still be accessible via the album page, search, and other views — just not shown in the default chronological timeline. Useful for organizational/archival albums that clutter the main view.

## Current State in Immich

### Timeline Query Architecture

**Server-side:**

1. `TimelineController` — `GET /timeline/buckets` (date ranges + counts), `GET /timeline/bucket` (assets for a date)
2. `TimelineService` — builds `TimeBucketOptions` from `TimeBucketDto` with filtering options
3. `AssetRepository.getTimeBuckets()` / `getTimeBucket()` — Kysely queries with conditional joins/where clauses

**Client-side:**

1. `TimelineManager` — manages virtual scrolling, month/day grouping, API calls
2. `Timeline.svelte` — displays time-bucketed assets

### Existing Exclusion Mechanisms

| Mechanism                      | Scope                | How It Works                                                  |
| ------------------------------ | -------------------- | ------------------------------------------------------------- |
| Asset Visibility (`Archive`)   | Per-asset            | Sets `visibility = 'archive'`, excluded from default timeline |
| Shared Spaces `showInTimeline` | Per-member-per-space | Boolean toggle on `shared_space_member` table                 |
| Album filtering                | Per-album view       | `albumId` parameter shows only that album's assets            |

**Key gap:** No album-level exclusion from the main timeline exists.

### Current User Workaround

Users manually archive each asset in the album — cumbersome and destructive (changes asset visibility globally, not just in timeline context).

## Proposed Implementation

### Approach A: Album-Level Flag (Recommended)

Add `hideFromTimeline` boolean to the `album` table.

**Schema Change:**

```sql
ALTER TABLE album ADD COLUMN "hideFromTimeline" boolean DEFAULT false;
```

**Query Change** (in `AssetRepository.getTimeBuckets()` and `getTimeBucket()`):

```sql
-- When loading main timeline (no specific albumId filter):
WHERE NOT EXISTS (
  SELECT 1 FROM album_asset aa
  INNER JOIN album a ON aa."albumsId" = a.id
  WHERE aa."assetsId" = asset.id
    AND a."hideFromTimeline" = true
    AND NOT EXISTS (
      -- Asset is also in a visible album
      SELECT 1 FROM album_asset aa2
      INNER JOIN album a2 ON aa2."albumsId" = a2.id
      WHERE aa2."assetsId" = asset.id
        AND a2."hideFromTimeline" = false
    )
)
```

**Edge case:** Asset in both a hidden and visible album → show in timeline (visible album wins).

**Alternative (simpler):** Asset in ANY hidden album → hide from timeline. Users can remove from hidden album to show.

**Pros:** Clean, album-level toggle, follows `showInTimeline` pattern from Shared Spaces
**Cons:** Subquery on every timeline query (performance consideration for large libraries)

### Approach B: User Preference — Excluded Album IDs

Store excluded album IDs in `user_metadata`:

```json
{ "timeline": { "excludedAlbumIds": ["uuid1", "uuid2"] } }
```

**Pros:** Per-user (different users can hide different albums), no schema change to album table, simpler query
**Cons:** Not album-level (owner can't hide for everyone), requires managing preference state

### Approach C: Hybrid

Album has `hideFromTimeline` flag (owner sets), users can override in preferences.

**Pros:** Best of both worlds
**Cons:** More complex, two sources of truth

### Recommended: Approach A

Simplest, matches existing Shared Spaces pattern, and album owners typically want to hide their own albums. Per-user overrides can be added later if needed.

## Implementation Details

### Backend Changes

**Schema + Migration:**

- Add `hideFromTimeline` boolean to `album` table (default: `false`)
- Update `server/src/database.ts` album type

**DTOs:**

- Add `hideFromTimeline` to `UpdateAlbumDto` (optional boolean)
- Add `hideFromTimeline` to `AlbumResponseDto`

**Service:**

- `AlbumService.update()` — accept `hideFromTimeline` changes
- No complex logic needed — just persist the toggle

**Repository** (`AssetRepository`):

- Modify `getTimeBuckets()` and `getTimeBucket()` to exclude assets in hidden albums
- Add conditional: only apply filter when loading main timeline (not when viewing specific album)
- Use `NOT EXISTS` subquery or `LEFT JOIN` + `WHERE NULL` pattern

**Performance optimization:**

- Add index: `CREATE INDEX album_hideFromTimeline_idx ON album ("hideFromTimeline") WHERE "hideFromTimeline" = true`
- Consider materialized view for large libraries if subquery is too slow

### Frontend Changes

**Web:**

- Album settings: toggle "Hide from Timeline"
- Album list: visual indicator (dimmed or icon) for hidden albums
- No changes to timeline component itself (filtering happens server-side)

**Mobile:**

- Album detail page: toggle in album settings
- Regenerate OpenAPI client

### Query Performance Considerations

The `NOT EXISTS` subquery runs for every asset in the timeline. For a library with 100K assets and 50 albums:

- Subquery is cheap if few albums are hidden (partial index helps)
- For large libraries, consider caching the set of "hidden album asset IDs" and using `NOT IN`
- Shared Spaces `showInTimeline` uses similar pattern without reported performance issues

## Design Decisions Needed

1. **Multi-album conflict:** Asset in both hidden and visible album?
   - Recommendation: Show in timeline (visible wins). Only hide if ALL containing albums are hidden.

2. **Shared albums:** Can shared album viewers control visibility?
   - Recommendation: Only album owner can toggle `hideFromTimeline`

3. **Archive interaction:** If asset is in hidden album AND archived?
   - Recommendation: Archive takes precedence (already excluded)

4. **Search results:** Should hidden album assets appear in search?
   - Recommendation: Yes — hiding is timeline-only, not a visibility change

5. **Partner sharing:** If partner's asset is in a hidden album?
   - Recommendation: Partner timeline follows their own album visibility settings

## Effort Estimate

| Component                | Effort | Notes                           |
| ------------------------ | ------ | ------------------------------- |
| Schema + migration       | Small  | 1 boolean column                |
| DTOs + OpenAPI           | Small  | Add field to 2 DTOs             |
| Repository query change  | Medium | Subquery in 2 methods + testing |
| Service layer            | Small  | Passthrough toggle              |
| Web album settings UI    | Small  | Toggle component                |
| Web album list indicator | Small  | Icon/dimming                    |
| Mobile                   | Small  | Toggle in album settings        |
| Tests                    | Medium | Query correctness, edge cases   |

**Total: Small-Medium effort (~1 week)**

This is a relatively straightforward feature with clear precedent in the codebase (Shared Spaces `showInTimeline`).

## Key Files

- `server/src/schema/tables/album.table.ts` — Add column
- `server/src/schema/migrations/` — New migration
- `server/src/database.ts` — Update album type
- `server/src/dtos/album.dto.ts` — Add to DTOs
- `server/src/services/album.service.ts` — Accept toggle
- `server/src/repositories/asset.repository.ts` — Timeline query filter (lines ~696-768)
- `server/src/dtos/time-bucket.dto.ts` — May need flag for "main timeline" context
- `web/src/lib/components/album-page/` — Settings UI
- Mobile album settings
