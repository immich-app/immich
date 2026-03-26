# Video Trimming Design

**Date:** 2026-03-26
**Status:** Approved

## Overview

Add video trimming as the first video editing capability in Gallery. Extends the existing image edit system (crop/rotate/mirror) to support temporal edits on video assets. Uses FFmpeg stream copy for near-instant, lossless trimming at keyframe boundaries.

## Key Decisions

- **Keep original, generate edited copy** — same pattern as image edits. Original untouched, trimmed version stored as edited `EncodedVideo` file.
- **Stream copy only** — no re-encoding. Fast but cuts land on nearest keyframe (potentially several seconds off for sparse GOPs). Known v1 trade-off.
- **Trim as editor tool** — new `EditToolType.Trim` inside the existing editor, not a separate action. Same save/cancel/undo flow as image transforms.
- **Local storage only** — S3-backed videos excluded for v1 to avoid download/upload complexity.

## 1. Backend: Data Model

### EditAction Enum

Add `Trim` to the existing enum:

```typescript
enum EditAction {
  Crop,
  Rotate,
  Mirror,
  Trim,
}
```

### TrimParameters

Client-facing DTO (what the client sends):

```typescript
class TrimParameters {
  @IsNumber() startTime: number; // seconds as float (e.g. 1.5)
  @IsNumber() endTime: number; // seconds as float
}
```

Server enriches with `originalDuration` (float seconds) before storing to JSONB, so the original duration can be restored on undo without re-probing the file.

### Validation Split

- **DTO layer:** `startTime >= 0`, `endTime > startTime`, at most one Trim per edit sequence, must actually trim something (`startTime > 0 OR endTime < duration` — enforced at service layer since DTO doesn't have duration)
- **Service layer:** asset must be `AssetType.Video` (not image, live photo, panorama, GIF), `endTime <= parsedDuration`, no in-progress transcode/edit jobs, local storage only, must have video streams (excludes audio-only files stored as Video type)

### Validation Refactor

The existing `editAsset()` method has a hard gate: `if (asset.type !== AssetType.Image) throw`. This must be restructured to:

1. If edits contain only spatial actions (Crop/Rotate/Mirror) → require `AssetType.Image` (existing behavior)
2. If edits contain a Trim action → require `AssetType.Video` + additional video-specific checks
3. Reject mixed spatial + trim edits (v1 constraint)

The `getForEdit()` query must also be extended to select `asset.duration` (currently not included), needed for trim validation.

### Storage

Same `asset_edit` table, same JSONB `parameters` column. No database migration needed.

### Duration Format

Asset table stores duration as a string (`"0:05:23.456789"`). Service converts between string format and float seconds when validating/applying trims.

### Sequencing

For v1, trim is the only edit action allowed on videos. No sequence ordering constraints needed until spatial video edits are introduced.

## 2. Backend: FFmpeg Execution & Job Pipeline

### MediaRepository.trim()

```typescript
async trim(input: string, output: string, startTime: number, duration: number): Promise<void>
```

Runs: `ffmpeg -ss {startTime} -i {input} -t {duration} -c copy -avoid_negative_ts make_zero {output}`

- `-ss` before `-i` for fast keyframe-seeking
- `-t` for unambiguous duration (`duration = endTime - startTime`)
- `-c copy` copies all streams (video + audio, no re-encoding)

### Video Playback Serving

`getForVideo()` in the asset repository must prefer `isEdited: true` encoded video when one exists. The shared `withFilePath` helper does not filter by `isEdited`, so a **custom subquery** is needed specifically for `getForVideo()` — do not modify `withFilePath` as it is used across many queries. The custom subquery should `ORDER BY isEdited DESC LIMIT 1` to prefer the edited version when it exists.

### Job Handler

Extend `handleAssetEditThumbnailGeneration()` with an explicit **branch for video vs image**. The current handler calls `generateEditedThumbnails()` which has an early return for non-images (`asset.type !== AssetType.Image`). The video path must be a separate code branch, not a modification of the image path.

**Image path (existing, unchanged):**
Calls `generateEditedThumbnails()` → applies spatial transforms → syncs files.

**Video path (new):**

1. Ensure local file availability
2. Select input: **always use the original source** — the non-edited encoded video or the original upload. Never use a previously trimmed (edited) version as input, since widening a trim requires access to the full original content.
3. Run `MediaRepository.trim()` → write to edited `EncodedVideo` path (`isEdited: true`)
4. Re-probe trimmed output for actual resulting duration
5. Update `asset.duration` via `assetRepository.update({ id, duration })` (not done by the existing handler — new call)
6. Extract a frame from the trimmed video (~10% in) via `MediaRepository.probe()` + ffmpeg frame extraction
7. Generate thumbnail/preview/fullsize from that extracted frame
8. Sync files via existing `syncFiles()` mechanism
9. Emit `AssetEditReadyV1` WebSocket event

**Undo video path:** When edits are empty and the asset is a video, skip the image thumbnail logic. `syncFiles()` handles deleting the orphaned edited encoded video. Thumbnails regenerate from the original video via the standard thumbnail generation path.

### Undo Flow

In `removeAssetEdits()` service method, **before clearing edits:**

1. Read current edits → extract `originalDuration` from Trim parameters
2. Restore `asset.duration` to `originalDuration`
3. Clear edits via `replaceAll(id, [])`
4. Queue job → `syncFiles()` deletes orphaned edited encoded video, thumbnails regenerate from original

### Concurrency

Check for in-progress edit jobs before accepting new trim requests. Reject with a clear error if one is already running.

### Trim Eligibility

For v1, trim eligibility is determined **client-side** for basic checks: `asset.type === Video && asset.duration != null && !asset.livePhotoVideoId`. These cover the common cases (images, live photos, unprocessed videos).

**S3 detection requires a server check.** The `isExternal` flag only covers external library imports, not S3-stored uploads. Since the frontend cannot determine the storage backend, the `editAsset()` service method validates storage type and returns a specific error (`"Video trimming is not available for cloud-stored videos"`). The frontend shows this error if it occurs on save. This is an acceptable UX trade-off for v1 — S3 setups are less common, and adding a storage flag to the asset DTO would be a larger API change.

The server also validates all other constraints (job status, video streams, audio-only exclusion) as a second line of defense.

## 3. Frontend: TrimManager & Editor Integration

### TrimManager

New class at `web/src/lib/managers/edit/trim-manager.svelte.ts`. Svelte 5 runes.

**State:**

- `startTime`, `endTime`, `duration` (seconds, float)
- `currentTime`, `isPlaying` — synced from video element via event listeners
- `activeHandle: 'start' | 'end' | null`

**Derived:** `trimmedDuration`, `hasChanges`, `startPercent`, `endPercent`, `currentPercent`

**Video element reference:** AssetViewer holds a `$state<HTMLVideoElement | null>` variable. VideoNativeViewer sets it via `bind:this` through a setter prop. AssetViewer passes the element reference down to EditorPanel as a prop. TrimManager uses an `$effect` that watches the element ref and attaches listeners when it becomes non-null (handles the case where video hasn't mounted yet).

**Seeking:** Handle drag calls `videoElement.currentTime = newTime`, throttled to every 100ms. Final precise seek on drag end.

**Constrained playback:** `$effect` watches `currentTime` — when `>= endTime`, pauses and seeks to `startTime`. ~250ms overshoot from `timeupdate` frequency is acceptable for preview. No loop risk since seeking to `startTime` puts `currentTime < endTime`.

**Handle clamping:** Dragging start past end clamps to `end - 1s`. Dragging end before start clamps to `start + 1s`. Minimum 1-second trimmed duration enforced.

**Keyboard shortcuts:** `I` sets in point, `O` sets out point at current position. Suppressed when `document.activeElement` is an input element.

### Editor Integration

- Add `EditToolType.Trim` to tool types
- `EditorPanel` selects tool based on `asset.type`: Trim for videos, Transform for images. Currently hardcodes `activateTool(EditToolType.Transform)` on mount — must be changed.
- `EditorPanel` becomes a shell delegating to `ImageEditorLayout` (canvas-based, for transform tool) or `VideoEditorLayout` (keeps video player visible, adds timeline below, sidebar has trim controls). Shell handles shared concerns (save/cancel, edit loading, WebSocket wait). **This is the highest-risk frontend change.**
- **`canEdit` split:** The current `canEdit()` guard is used by both the edit button AND rotate actions. Expanding it to allow videos would incorrectly show rotate actions for videos. Solution: split into `canEditImage()` (used by rotate actions, existing logic) and `canEdit()` (used by the edit button, allows both images and eligible videos).
- **Native video controls hidden during editing:** The `<video>` element's `controls` attribute is removed when the trim editor is active, preventing spacebar conflict between browser controls and TrimTimeline's play/pause handler.
- WebSocket timeout for `AssetEditReadyV1` made asset-type-aware (longer for video).

### Sidebar Controls (when Trim is active)

- Trimmed duration (large, prominent)
- Start / end times (editable text inputs, MM:SS.s format, secondary)
- "Set In" / "Set Out" buttons
- Original duration (tertiary, read-only)
- Reset button

## 4. Frontend: TrimTimeline Component

New component `TrimTimeline.svelte`, positioned below the video player in `VideoEditorLayout`.

### Structure

```
┌──────────────────────────────────────────────────┐
│  ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓  │
│  ┊  ├─── kept region (full opacity) ───┤  ┊     │
│  ┊  ▲                    ▲             ┊  ┊     │
│  ┊  in handle         playhead         ┊  ┊     │
│  ┊                                out handle     │
│  └── dimmed ──┘                    └─ dimmed ──┘ │
├──────────────────────────────────────────────────┤
│ 0:00          0:15          0:30          0:45    │
└──────────────────────────────────────────────────┘
```

**Interactive mockup:** `docs/mockups/trim-timeline-mockup.html`

### Layers

1. **Track bar** — full-width, theme's muted/surface color
2. **Trim region overlay** — full opacity between handles, accent border top/bottom. Dimmed+desaturated regions outside.
3. **Playhead** — thin white vertical line with dot cap, moves in real time during playback

### Handles

- Vertical bars with grab affordance (three horizontal grip lines)
- Draggable via `pointerdown` → `pointermove` → `pointerup` on `window`
- `col-resize` cursor on hover/drag
- Drag triggers throttled video seeking via TrimManager

### Interactions

- **Click anywhere on track** → seeks video to that position (moves playhead, not handles)
- **Drag handles** → adjusts trim region, video seeks to handle position
- **Space** → play/pause (loops within trimmed region)
- **I / O keys** → set in/out at current playhead position

### Time Labels

- Start/end times displayed at edges of trim region, update reactively on drag
- Full duration tick marks along bottom
- Format: `M:SS.s` for < 1 hour, `H:MM:SS` for longer

### Sizing & Accessibility

- Full width of video player area, ~48px height
- Handles focusable with `tabindex="0"`, arrow keys nudge ±0.5s
- `aria-label`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on handles

## 5. Permissions & API

**No new endpoints.** Trim uses the existing edit endpoints:

- **PUT** `/assets/:id/edits` — save trim (`AssetEditCreate` permission)
- **GET** `/assets/:id/edits` — load edits (`AssetEditGet` permission)
- **DELETE** `/assets/:id/edits` — undo/clear (`AssetEditDelete` permission)

Shared spaces: same permission model as existing edits. No special handling.

## 6. Edge Cases

| Scenario                 | Behavior                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| No encoded video yet     | Trim operates on original upload, output is edited `EncodedVideo`                               |
| Video still transcoding  | Trim disabled on frontend (duration null), rejected by server if bypassed                       |
| Very short videos (< 2s) | Trim disabled — minimum output is 1 second                                                      |
| Duration not yet known   | Trim disabled until metadata extraction completes                                               |
| Keyframe imprecision     | After trim, server re-probes for actual duration and updates asset                              |
| Live photos              | Trim not available (treated as images)                                                          |
| Concurrent edit requests | Service rejects if edit job already in progress                                                 |
| S3-backed videos         | Trim disabled on frontend, rejected by server                                                   |
| Audio-only files         | Stored as `AssetType.Video` but excluded — server checks for video streams                      |
| Trim to full duration    | Rejected — `startTime > 0 OR endTime < duration` required (no-op prevention)                    |
| Re-trimming              | Always trims from original source, not previous trim output — widening works                    |
| FFmpeg failure           | Job handler catches error, cleans up partial output, surfaces failure via WebSocket error event |

## 7. Not Included (YAGNI)

- No re-encode option (stream copy only)
- No frame-accurate cuts
- No thumbnail strip/filmstrip in the timeline
- No video preview of trimmed result before saving
- No spatial transforms on video (crop/rotate)
- No multi-segment trimming
- No mobile support
- No S3 storage support
- No undo history / multiple versions

## 8. Testing

### Server Unit Tests

**Validation:**

- `editAsset()` accepts Trim on video assets
- `editAsset()` rejects Trim on images, live photos, panoramas, GIFs
- `editAsset()` rejects Trim on audio-only files (no video streams)
- `editAsset()` rejects `startTime < 0`, `endTime <= startTime`, `endTime > duration`
- `editAsset()` rejects Trim when another edit job is in progress
- `editAsset()` rejects Trim when asset is on S3/external storage
- `editAsset()` rejects mixed spatial + trim edits
- `editAsset()` rejects full-duration trim (start=0, end=duration — no-op)
- Duration string-to-float parsing: `"0:00:00.000000"`, `"1:23:45.678901"`, null

**Data flow:**

- `originalDuration` is enriched into JSONB (not sent by client)
- `removeAssetEdits()` reads `originalDuration` and restores `asset.duration` before clearing
- `removeAssetEdits()` handles missing `originalDuration` gracefully

### Repository Tests

- `getForVideo()` returns edited encoded video when both edited and non-edited exist
- `getForVideo()` returns non-edited path when no edited version exists
- `getForEdit()` includes `duration` field in result

### Media Service / Job Handler Tests

- `handleAssetEditThumbnailGeneration()` branches to video path for video assets with Trim
- Video path calls `MediaRepository.trim()` with correct parameters
- Video path extracts frame from trimmed video for thumbnails
- Undo path deletes edited encoded video via `syncFiles()`
- `asset.duration` is updated after trim, restored after undo
- Re-trim uses original source (non-edited encoded video or original upload), not previous trim output
- FFmpeg failure: partial output cleaned up, error surfaced to client

### FFmpeg Command Tests

- Verify exact command: `-ss {start} -i {input} -t {duration} -c copy -avoid_negative_ts make_zero {output}`
- Verify `duration` computed as `endTime - startTime`

### Frontend Unit Tests

- `TrimManager`: initial state from asset duration, `hasChanges` derivation
- Handle clamping: start past end clamps to `end - 1s`, end before start clamps to `start + 1s`
- Constrained playback: pauses at `endTime`, seeks to `startTime`
- Keyboard shortcuts: `I`/`O` set in/out, suppressed on focused inputs
- `canEdit` vs `canEditImage` split: rotate actions hidden for videos, edit button visible
- `EditorPanel` activates Trim for videos, Transform for images

### E2E Tests

- Full trim flow: upload video → open editor → set trim points → save → verify `asset.duration` changed via API
- Re-trim: trim → open editor again → widen trim → save → verify new duration reflects wider range
- Undo: trim then undo → verify original duration restored via API
- Eligibility: very short video (< 2s) shows disabled trim
- Permissions: space member with edit access can trim, member without cannot

### Known Limitations

- `originalDuration` stored in Trim JSONB parameters — works for v1 where trim is the only video edit. If spatial video edits are added later and `replaceAll(id, [])` clears all edits at once, original duration must be preserved differently (e.g., asset-level column).
