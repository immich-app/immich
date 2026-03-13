# Google Photos Import — Web UI Wizard

## Overview

A guided wizard in the web UI for importing Google Takeout exports into Immich. Users select their Takeout zip files or extracted folders, the browser streams through them to parse metadata, presents a preview with album selection, then uploads everything through the existing asset API with metadata injected.

## Goals

- **Zero-prep import**: User drops their Takeout zips and the wizard handles everything
- **Full metadata preservation**: dates, GPS, descriptions, favorites, archived status, albums
- **User control**: preview everything before importing, select which albums to create
- **No server changes**: reuse existing upload API entirely; all parsing is client-side

## Architecture: Client-Side Hybrid

All zip extraction, JSON sidecar parsing, and photo-to-metadata matching happens in the browser using streaming (via `zip.js`). Files upload one-by-one through the existing `POST /assets` API with metadata attached. Albums are created via the existing album API after upload.

### Why client-side?

- No new server endpoints, jobs, or temp storage needed
- User sees a full preview before anything is uploaded
- Zip streaming avoids loading entire archive into memory
- Existing upload infrastructure (deduplication, progress, retry) is reused

## Supported Input

- Single or multiple `.zip` files (Google Takeout splits large exports into 2GB chunks)
- Extracted folders (user already unzipped)
- Mix of both

## Metadata Mapping

| Takeout JSON Field           | Immich Field          | Method                    |
| ---------------------------- | --------------------- | ------------------------- |
| `photoTakenTime.timestamp`   | `dateTimeOriginal`    | Upload DTO                |
| `geoData.latitude/longitude` | `latitude/longitude`  | Post-upload `updateAsset` |
| `description`                | `description`         | Post-upload `updateAsset` |
| `favorited`                  | `isFavorite`          | Upload DTO                |
| `archived`                   | `visibility: archive` | Post-upload `updateAsset` |
| Folder structure             | Album membership      | Album API after upload    |

GPS coordinates of (0, 0) are filtered out (Google's placeholder for "no location").

## Album Handling

Google Takeout folder structure:

```
Takeout/
  Google Photos/
    Summer Trip 2023/        ← real album
      photo1.jpg
      photo1.jpg.json
    Photos from 2023/        ← auto-generated, not a real album
      photo2.jpg
      photo2.jpg.json
```

- All folders detected and shown in the review step
- "Photos from YYYY" folders are unchecked by default
- User can check/uncheck any album before importing
- Albums created via existing Immich album API, assets added after upload

## UI Design

### Page Location

- New route: `/import`
- Sidebar link under Library section (below Utilities) with `mdiDatabaseImportOutline` icon
- Uses existing `UserPageLayout` with `Container size="large" center`

### Step Indicator

Horizontal bar at top of content area with numbered circles connected by lines:

- **Active step**: `bg-primary text-white` filled circle
- **Completed step**: `bg-primary/20 text-primary` with checkmark
- **Future step**: `bg-gray-200 text-gray-400`

### Step 1 — Select Source

Grid of source cards. Only "Google Photos" is active; "Apple Photos" shown as disabled/coming-soon.

- Cards: `Card color="secondary"` with hover border highlight
- Selected: `border-2 border-primary` with `bg-primary/5`
- Info `Alert color="info"` at bottom linking to `takeout.google.com`

### Step 2 — Select Files

Drop zone with two buttons: "Select Zip Files" and "Select Folder".

- Drop zone: `border-2 border-dashed border-gray-300`, hover → `border-primary bg-primary/5`
- File list below shows each selected zip/folder with icon, name, size
- Running total at bottom
- Clear button to reset selection
- Supports adding files incrementally

### Step 3 — Scanning

Automated step. Browser streams through zips, parses JSON sidecars, matches to photos.

- Progress bar with percentage and current file name
- Live-updating stats: photo count, video count, locations found, favorites, albums detected
- Cancel button returns to step 2
- Auto-advances to step 4 when complete

### Step 4 — Review & Configure

The hero step. Three sections:

**Summary card** — 2x3 grid of stat chips (photos, videos, locations, favorites, archived, date range). Warning alert if items are missing date metadata.

**Albums card** — Master toggle "Create albums from Takeout folders", then checkbox list of all detected albums with item counts. "Photos from YYYY" unchecked by default. Select All / Deselect All buttons.

**Options card** — Toggle switches:

- Import favorites (default: on)
- Import archived as archived (default: on)
- Import descriptions (default: on)
- Skip duplicates already in Immich (default: on)

Primary CTA: "Import N items" button with total count.

### Step 5 — Importing

Full-page progress view.

- Large progress bar with percentage and fraction (e.g., "2,331 / 2,989 items")
- Upload speed and ETA
- Status counters: imported (green), skipped/duplicates (yellow), errors (red), remaining (gray)
- Current file name and album shown below
- Pause/Resume button
- On error: expandable error log

### Step 5b — Complete

Success state with final stats.

- Large checkmark icon in primary color
- Summary: items imported, skipped, errors, albums created, favorites marked, archived count
- Action buttons: "View Photos" → `/photos`, "View Albums" → `/albums`
- If errors: "N items failed" with retry option

## Component Structure

```
web/src/routes/(user)/import/
  +page.svelte                — route entry

web/src/lib/components/import/
  import-wizard.svelte         — step orchestration, state management
  import-step-indicator.svelte — horizontal step bar
  import-source-step.svelte    — step 1: source selection
  import-files-step.svelte     — step 2: file/zip picker
  import-scan-step.svelte      — step 3: scanning progress
  import-review-step.svelte    — step 4: preview & configure
  import-progress-step.svelte  — step 5: upload progress & completion

web/src/lib/managers/
  import-manager.svelte.ts     — Svelte 5 runes state for the wizard

web/src/lib/utils/
  google-takeout-parser.ts     — zip streaming, JSON parsing, photo-sidecar matching
```

## Key Technical Decisions

- **Zip library**: `zip.js` — streaming, handles large files, well-maintained, no native deps
- **Upload**: Reuse `file-uploader.ts` upload functions with metadata injection
- **Metadata delivery**: `isFavorite` + `fileCreatedAt` via upload DTO; GPS/description/archived/visibility via follow-up `updateAsset` call
- **Albums**: Created via `createAlbum` API, assets added via `addAssetsToAlbum` after upload
- **Deduplication**: Use existing `POST /assets/check` bulk API before uploading
- **State management**: `import-manager.svelte.ts` using Svelte 5 `$state` runes
- **Concurrency**: 2 concurrent uploads (matching existing upload panel behavior)

## Testing Strategy — TDD Required

All implementation follows strict TDD: write failing tests first, then implement to make them pass.

### Unit Tests (Vitest)

**`google-takeout-parser.ts`** — most critical, pure logic:

- Parse valid Google Takeout JSON sidecar → correct metadata extraction
- Handle missing fields (no GPS, no description, no photoTakenTime)
- Filter GPS (0, 0) as no-location
- Match photo files to their JSON sidecars by name
- Handle Google's filename truncation (47-char limit)
- Detect "Photos from YYYY" folders vs real album folders
- Handle malformed/invalid JSON gracefully (no crash)
- Handle non-Takeout JSON files (e.g. package.json) — must reject
- Multi-zip: merge manifests from multiple zips correctly
- Validate date parsing from Unix timestamps

**`import-manager.svelte.ts`** — state management:

- Step transitions (forward, backward, reset)
- File addition/removal
- Scan progress updates
- Album toggle on/off
- Options toggling
- Import progress tracking (counts, errors, speed)
- Pause/resume state

### Component Tests (@testing-library/svelte)

**Each step component**:

- Renders correctly in default state
- User interactions trigger correct state changes
- Conditional rendering (e.g., disabled source cards, warning alerts)
- Step navigation (next/back buttons enable/disable correctly)

**`import-wizard.svelte`**:

- Renders correct step based on state
- Step indicator reflects current/completed/future steps

**`import-review-step.svelte`** (most complex):

- Albums listed with correct default checked/unchecked state
- "Photos from YYYY" unchecked by default
- Select All / Deselect All work
- Options toggles update state
- Import button shows correct count
- Warning shown when items missing date metadata

### Integration Considerations

- Upload flow reuses existing `file-uploader.ts` — covered by existing upload tests
- Album creation reuses existing album API — covered by existing album tests
- Deduplication reuses existing bulk check API — covered by existing tests
- New code is primarily client-side parsing + UI, so unit + component tests provide full coverage

## Out of Scope (Future)

- Apple Photos import (osxphotos JSON format)
- Live photo pairing (matching .jpg + .mp4 by basename)
- People/face tag mapping
- Server-side zip processing
- CLI integration
