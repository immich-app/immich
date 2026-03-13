# Feature Research: Metadata Editor

**Votes:** 184 (14th most requested)
**Status:** Partially implemented — description, rating, date, location editable; camera/image metadata read-only
**Upstream Work:** Active — XMP sidecar write-back, locked properties system

## Overview

Edit EXIF metadata (camera settings, dates, location, descriptions, tags) directly within Immich's UI. Currently, some fields are editable (description, rating, date, GPS) but camera metadata (ISO, aperture, focal length, lens) and image properties are read-only.

## Current State in Immich

### EXIF Schema (`asset_exif` table)

Comprehensive metadata storage:

- **Camera:** `make`, `model`, `lensModel`, `fNumber`, `focalLength`, `iso`, `exposureTime`, `fps`
- **Dates:** `dateTimeOriginal`, `modifyDate`, `timeZone`
- **Location:** `latitude`, `longitude`, `city`, `state`, `country`
- **Image:** `exifImageWidth`, `exifImageHeight`, `orientation`, `projectionType`, `fileSizeInByte`, `colorspace`, `bitsPerSample`
- **Descriptive:** `description` (caption), `rating` (1-5 stars), `tags` (array)
- **Special:** `livePhotoCID`, `autoStackId`, `lockedProperties`

### Currently Editable Fields

| Field          | UI Location             | Write-Back  |
| -------------- | ----------------------- | ----------- |
| Description    | Detail panel text field | XMP sidecar |
| Rating         | Star control (1-5)      | XMP sidecar |
| Date/Time      | Modal editor            | XMP sidecar |
| Location (GPS) | Map modal               | XMP sidecar |
| Tags           | Tag editor              | XMP sidecar |

### Read-Only Fields (Displayed but Not Editable)

- Camera make/model, lens model
- Exposure time, ISO, aperture (f-number), focal length
- Image dimensions, orientation, color space, bit depth
- File size

### Locked Properties System

Immich has a `lockedProperties` mechanism preventing metadata re-extraction from overwriting user edits:

- Supported locked fields: `description`, `dateTimeOriginal`, `latitude`, `longitude`, `rating`, `timeZone`, `tags`
- When a field is locked, metadata re-extraction skips it
- Locks applied automatically when user edits a field

### XMP Sidecar Write-Back

**Already implemented** via `SidecarWrite` job (`metadata.service.ts`):

- Uses `exiftool-vendored` npm package
- Writes to `.xmp` sidecar files (NOT original media files)
- Fields written: Description → `dc:description`, Rating → `xmp:Rating`, DateTimeOriginal → `exif:DateTimeOriginal`, GPS → `exif:GPSLatitude/Longitude`, Tags → `digiKam:TagsList`
- S3 compatible: downloads temp file, writes, uploads back

## Improvement Opportunities

### 1. Camera Metadata Editing (High Demand)

**Problem:** Users can't correct wrong camera metadata (e.g., lens misidentified, wrong camera model from adapted lenses).

**Solution:**

- Add editable fields for: `make`, `model`, `lensModel`, `focalLength`, `fNumber`, `iso`, `exposureTime`
- Store user overrides in database (same as description/date)
- Optionally write back to XMP sidecar

**Implementation:**

- Extend `UpdateAssetDto` with camera fields
- Add locked properties for camera fields
- Update detail panel with edit icons next to camera metadata
- XMP write-back for: `exif:Make`, `exif:Model`, `exif:LensModel`, etc.

**Effort:** Medium (1 week)

### 2. Bulk Metadata Editor (High Demand)

**Problem:** Can't edit the same field across multiple assets (e.g., set location for all vacation photos).

**Solution:**

- Multi-select → "Edit Metadata" action
- Modal with editable fields, checkboxes for which fields to apply
- "Apply to N selected assets" button
- Background job for bulk updates

**Implementation:**

- Extend `AssetBulkUpdateDto` with EXIF fields
- New web component: `BulkMetadataEditor.svelte`
- Job queue for processing bulk updates (avoid timeout)

**Effort:** Medium-Large (1-2 weeks)

### 3. Exposed Lock Properties Toggle (Medium Demand)

**Problem:** Users can't see or control which fields are locked. Locks are invisible.

**Solution:**

- Show lock icon next to each editable field
- Click to toggle lock on/off
- Tooltip: "Locked: won't be overwritten by re-extraction"

**Implementation:**

- Add `lockedProperties` to `ExifResponseDto`
- UI: lock icon per field in detail panel
- API: endpoint to toggle individual property locks

**Effort:** Small (2-3 days)

### 4. Write to Original File (Optional, Risky)

**Problem:** XMP sidecars aren't always portable. Some users want metadata written directly to JPEG/PNG files.

**Solution:**

- Admin setting: "Allow writing to original files"
- Per-write confirmation: "This will modify the original file. Continue?"
- Create backup before writing
- Use exiftool's `-overwrite_original_in_place` flag

**Risk:** File corruption, loss of original quality (JPEG re-encoding for some operations)

**Effort:** Medium (1 week, mostly safety/backup logic)

### 5. Metadata Templates/Presets (Low Demand)

**Problem:** Repetitive metadata entry (same photographer, same event name, same location).

**Solution:**

- Save metadata presets: "Wedding - John & Jane", "Studio Portrait"
- Apply preset to selected assets
- Presets stored in user preferences or dedicated table

**Effort:** Medium (1 week)

### 6. Subsecond Date Precision (Small)

**Problem:** Date editor doesn't support subsecond precision, important for burst sorting.

**Solution:**

- Add millisecond field to date editor modal
- Update `dateTimeOriginal` with subsecond value

**Effort:** Small (1-2 days)

## Recommended Priority

| Improvement                    | Effort       | Impact | Priority |
| ------------------------------ | ------------ | ------ | -------- |
| Exposed lock properties toggle | Small        | Medium | P1       |
| Subsecond date precision       | Small        | Low    | P1       |
| Camera metadata editing        | Medium       | High   | P2       |
| Bulk metadata editor           | Medium-Large | High   | P2       |
| Write to original file         | Medium       | Medium | P3       |
| Metadata templates             | Medium       | Low    | P4       |

## Effort Estimate

**Quick wins (P1):** ~4 days — lock toggle + date precision
**Core features (P2):** ~2-3 weeks — camera editing + bulk editor
**Advanced (P3-P4):** ~2 weeks — write-to-original + templates

## Key Technical Challenges

1. **Exiftool field mapping**: Each EXIF field has specific exiftool tag names. Need comprehensive mapping for all editable fields.
2. **Validation**: Camera metadata has constraints (ISO values, aperture ranges). Need field-specific validation.
3. **Bulk performance**: Editing 1000 assets triggers 1000 XMP writes. Need batch job with progress tracking.
4. **S3 overhead**: Each XMP write requires download-edit-upload cycle.
5. **Source of truth**: When metadata differs between DB, XMP, and original file — which wins?

## Key Files

- EXIF schema: `server/src/schema/tables/asset-exif.table.ts`
- Update DTO: `server/src/dtos/asset.dto.ts` (`UpdateAssetDto`)
- EXIF response: `server/src/dtos/exif.dto.ts` (`ExifResponseDto`)
- Metadata service: `server/src/services/metadata.service.ts` (sidecar write at lines ~471-545)
- Detail panel: `web/src/lib/components/asset-viewer/detail-panel.svelte`
- Date editor: `web/src/lib/modals/AssetChangeDateModal.svelte`
- Location editor: `web/src/lib/components/asset-viewer/detail-panel-location.svelte`
- Description editor: `web/src/lib/components/asset-viewer/detail-panel-description.svelte`
