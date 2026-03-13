# Image Editing Improvements Design

**Date**: 2026-03-05
**Status**: Approved

## Context

Immich has a non-destructive image editing system (crop, rotate, mirror) merged from upstream PR #24155. The system includes a database model (`asset_edit` table), server-side Sharp processing, websocket events, and a web UI with an interactive editor panel. However, there are confirmed bugs and the community's most-requested enhancement (quick one-click rotate) is missing.

## Scope

### Phase 1 — Bug Fixes

#### 1.1 Person thumbnail scalar subquery (#26045)

- **File**: `server/src/repositories/person.repository.ts:287-293`
- **Problem**: Scalar subquery on `asset_file` returns multiple rows when an asset has both original and edited preview files, crashing `PersonGenerateThumbnail`.
- **Fix**: Add `.limit(1)` to the subquery with ordering to prefer non-edited files.

#### 1.2 Download-as-album serves original (#26182)

- **File**: `server/src/repositories/download.repository.ts`
- **Problem**: `editedPath` is not selected in the download query builder, so the conditional logic in `download.service.ts:107` always falls back to `originalPath`.
- **Fix**: Add `editedPath` to the select clause in the download repository.

#### 1.3 Album cover not refreshed after edits (#25803)

- **Files**: `server/src/repositories/album.repository.ts:340-381`, asset file serving logic
- **Problem**: Album cover thumbnails don't refresh when the cover photo is edited; no logic to prefer the edited version.
- **Fix**: When serving album cover thumbnails, prefer the edited preview file when one exists.

### Phase 2 — Quick-Rotate in Viewer

#### Architecture

- **New component**: `web/src/lib/components/asset-viewer/actions/rotate-action.svelte`
- One rotate-right (90 CW) icon button in the viewer toolbar, positioned before the Edit button.
- Rotate-left (90 CCW) and rotate-180 added to the More dropdown menu.
- Only visible for owned images under the same conditions as Edit (no video, GIF, SVG, panorama, live photo).

#### Data Flow

1. User clicks rotate button
2. Client calls `getAssetEdits(id)` to read current edits
3. Append `{ action: 'rotate', angle: 90 }` to the edit list
4. Call `editAsset(id, newEdits)` to save
5. Wait for `AssetEditReadyV1` websocket event
6. Refresh displayed image in the viewer
7. Show loading spinner on button during processing

#### UX Details

- Loading spinner replaces icon during processing
- Success: image refreshes in place, no toast needed
- Error: error toast displayed
- Button disabled while processing

### Phase 3 — Batch Rotate in Timeline

#### Architecture

- **New component**: `web/src/lib/components/timeline/actions/rotate-action.svelte`
- Appears in the multi-select toolbar when images are selected (follows FavoriteAction/ArchiveAction pattern).
- Dropdown with rotate-left, rotate-right, rotate-180 options.

#### Implementation

- Client-side loop iterating selected assets.
- For each asset: read existing edits, append rotation, write back.
- Filters out non-image and non-owned assets before processing.
- Progress feedback via toast ("Rotating 15/200...").
- Continues on individual failures, reports summary at end.

### Out of Scope

- Server-side batch endpoint (future optimization for Phase 3)
- Color adjustments (brightness, contrast, warmth)
- Mobile parity (Flutter editor migration)
- XMP orientation handling (#26433)
- Markup/annotation

## Key Design Decisions

| Decision                  | Choice                                                             | Rationale                                                                      |
| ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Quick-rotate architecture | Read-then-write pattern (client reads edits, appends, writes back) | Simple, no new server endpoints, correctly composes with existing edits        |
| Toolbar placement         | Single rotate-right in toolbar + both directions in More menu      | Balance of discoverability and toolbar cleanliness                             |
| Batch implementation      | Client-side loop                                                   | Matches existing batch action patterns, ships faster, optimize later if needed |
| Edit composition          | Append to existing edits                                           | Preserves user's crop/mirror edits when rotating                               |
