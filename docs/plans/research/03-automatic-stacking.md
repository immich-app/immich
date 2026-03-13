# Feature Research: Automatic Stacking

**Votes:** 374 (6th most requested)
**Status:** Manual stacking exists; auto-stacking infrastructure partially built but unused
**Upstream Work:** `autoStackId` field extracted from EXIF but never used for grouping

## Overview

Automatically group related photos into stacks: burst shots, RAW+JPG pairs, HDR brackets, and similar sequences. Currently Immich supports manual stacking only — users must select assets and explicitly stack them.

## Current State in Immich

### Stack Schema

**Stack Table** (`server/src/schema/tables/stack.table.ts`):

- `id` (UUID), `primaryAssetId` (unique FK to asset), `ownerId`
- One-to-many: stack contains many assets via `asset.stackId` FK
- `stack_audit` table for deletion tracking
- Constraint: one primary asset per stack, primary must be unique

**Asset Table** has `stackId` FK — an asset belongs to at most one stack.

### Manual Stack Service

`server/src/services/stack.service.ts`:

- `create(auth, { assetIds })` — requires explicit asset IDs from user
- `update()` — change primary asset
- `delete()` / `removeAsset()` — remove from stack
- **No auto-detection logic exists**

`server/src/repositories/stack.repository.ts`:

- `create()` merges existing stacks if input assets are already primary assets of other stacks
- Uses transactions for consistency
- No grouping/discovery queries

### Auto-Stack Metadata (Extracted but Unused)

**Key finding:** The `autoStackId` field in `asset_exif` is already populated but never used.

`server/src/services/metadata.service.ts` (line ~1063):

```typescript
private getAutoStackId(tags: ImmichTags | null): string | null {
  if (!tags) return null;
  return tags.BurstID ?? tags.BurstUUID ?? tags.CameraBurstID ?? tags.MediaUniqueID ?? null;
}
```

Supported EXIF tags (priority order):

1. **BurstID** — Canon burst shots
2. **BurstUUID** — Apple burst shots
3. **CameraBurstID** — Sony/Panasonic burst
4. **MediaUniqueID** — Generic burst grouping

This is upserted into `asset_exif` during metadata extraction (line ~333) but **no job follows** to create stacks from matching IDs.

### Available Metadata for Grouping

| Grouping Type | Available Metadata                              | Current Use                   |
| ------------- | ----------------------------------------------- | ----------------------------- |
| Burst shots   | `autoStackId` (BurstID/BurstUUID/CameraBurstID) | Extracted, not used           |
| RAW+JPG pairs | `originalFileName`, file extension              | Not matched                   |
| HDR brackets  | `exposureTime`, `iso`, `fNumber`, timestamps    | Not compared                  |
| Live photos   | `livePhotoCID`, `MediaGroupUUID`                | Already linked (not stacking) |

### Web UI for Stacks

- `mdiCameraBurst` icon on thumbnails when asset is in a stack
- Manual actions: add-to-stack, remove, set-primary, unstack, keep-this-delete-others
- No UI for auto-stacking triggers or configuration

## Proposed Implementation

### Phase 1: Burst Detection via `autoStackId` (MVP)

Use the already-extracted `autoStackId` field to automatically create stacks.

**New Job:** `JobName.AutoStack` (or integrate into existing metadata extraction flow)

**Algorithm:**

1. After metadata extraction completes for an asset, check if `autoStackId` is non-null
2. Query: find all other assets with same `autoStackId` and same `ownerId`
3. If 2+ assets match and none are already in a stack, create a new stack
4. If some are already stacked, merge the new asset into the existing stack
5. Primary asset: earliest `fileCreatedAt` in the group

**Index needed:** `(ownerId, autoStackId)` on `asset_exif` table for efficient lookups

### Phase 2: RAW+JPG Filename Matching

**Algorithm:**

1. On metadata extraction, extract base filename (strip extension)
2. Check for other assets with same base filename, same owner, within a time window
3. Match RAW extensions (CR2, CR3, NEF, ARW, DNG, RAF, RW2, ORF) with JPG/JPEG/HEIC
4. Create stack with JPG as primary (most viewable format)

**Camera-specific patterns:**

- Canon: `IMG_1234.CR2` + `IMG_1234.JPG`
- Sony: `DSC01234.ARW` + `DSC01234.JPG`
- Nikon: `DSC_1234.NEF` + `DSC_1234.JPG`

### Phase 3: HDR Bracket Detection

**Algorithm:**

1. Group assets by owner + camera + timestamp proximity (within ~5 seconds)
2. Check for 3+ photos with different exposure values but same scene
3. Look for exposure bracketing pattern (e.g., -2EV, 0EV, +2EV)
4. Create stack with the 0EV (middle exposure) as primary

### Batch Backfill Job

For existing libraries, a one-time batch job to scan all assets and create auto-stacks:

- Scan all assets where `autoStackId IS NOT NULL AND stackId IS NULL`
- Group by `(ownerId, autoStackId)`
- Create stacks in bulk

## Implementation Details

### Backend Changes

**New Job** (in `server/src/enum.ts`):

```
JobName.AutoStack = 'auto-stack'
```

**Service** — new `AutoStackService` or extend `StackService`:

```
handleAutoStack(assetId):
  1. Get asset's autoStackId from exif
  2. Find matching assets (same owner, same autoStackId)
  3. Check if any matches already in a stack
  4. Create or merge into stack
```

**Trigger Points:**

- After `handleMetadataExtraction` completes → queue `AutoStack` job
- Race condition mitigation: use database transaction + advisory lock on `autoStackId`

**Configuration:**

- Admin setting: enable/disable auto-stacking globally
- Per-user setting: enable/disable auto-stacking
- Stacking rules: which types (burst, RAW+JPG, HDR) to auto-detect

### Frontend Changes

**Web:**

- Admin settings: auto-stacking toggle + rule configuration
- User settings: opt-in/out of auto-stacking
- Visual indicator: "Auto-stacked" badge vs manual stacks
- Notification when new auto-stacks are created

**Mobile:**

- Same settings and indicators
- Stack viewer already works — auto-stacked assets display the same way

### Database Migration

```sql
-- Index for efficient autoStackId lookups
CREATE INDEX asset_exif_ownerId_autoStackId_idx
ON asset_exif ("ownerId", "autoStackId")
WHERE "autoStackId" IS NOT NULL;
```

For RAW+JPG matching:

```sql
-- Index for filename-based matching (Phase 2)
CREATE INDEX asset_originalFileName_idx ON asset ("originalFileName");
```

## Design Decisions Needed

1. **Default behavior**: Auto-stacking on or off by default?
   - Recommendation: On for burst detection (uses existing EXIF data), off for RAW+JPG and HDR (more aggressive)

2. **Primary asset selection**: Which photo becomes the stack primary?
   - Recommendation: Earliest timestamp for bursts, JPG for RAW+JPG pairs

3. **Undo mechanism**: Can users easily undo auto-stacking?
   - Recommendation: Yes — unstack action already exists, just need a way to prevent re-stacking

4. **Re-stacking prevention**: If user manually unstacks, should auto-stacking re-create it?
   - Recommendation: Track a `noAutoStack` flag on the asset or use a separate table

5. **Race conditions**: Multiple burst photos uploaded simultaneously?
   - Recommendation: Use database advisory locks on `autoStackId` value, or process auto-stacking in a batch job with debounce

## Effort Estimate

| Component                 | Effort       | Notes                                                 |
| ------------------------- | ------------ | ----------------------------------------------------- |
| Phase 1 (Burst detection) | Small-Medium | autoStackId already extracted, just need grouping job |
| Index + migration         | Small        | 1 index on asset_exif                                 |
| Stack creation logic      | Small        | Reuse existing `stackRepository.create()`             |
| Job integration           | Small        | Wire into metadata extraction pipeline                |
| Phase 2 (RAW+JPG)         | Medium       | Filename parsing, extension matching                  |
| Phase 3 (HDR brackets)    | Medium-Large | Exposure analysis, timestamp proximity                |
| Admin/user settings       | Small-Medium | Toggle UI + server config                             |
| Batch backfill            | Medium       | One-time scan of existing library                     |
| Tests                     | Medium       | Unit tests for grouping algorithms                    |

**Phase 1 Total: Small-Medium effort (~3-5 days)**
**All Phases Total: Medium-Large effort (~2-3 weeks)**

Phase 1 is notably low-effort because the hardest part (EXIF extraction) is already done.

## Key Technical Challenges

1. **Race conditions**: Burst photos arrive as separate uploads, each triggering metadata extraction independently. The auto-stack job may run before all burst photos are processed.
   - Mitigation: Debounce auto-stacking by 30 seconds after last metadata extraction for a given `autoStackId`

2. **Idempotency**: Auto-stacking must be safe to run multiple times without creating duplicate stacks.
   - Check: skip if all matched assets are already in the same stack

3. **Large burst sequences**: Some cameras shoot 20+ frames per second. Stacks of 50+ photos need efficient handling.

4. **Cross-library**: External libraries may have burst photos scattered across directories.

5. **RAW filename ambiguity**: Some cameras use different naming for RAW vs JPG. Need a comprehensive pattern list.

6. **User expectations**: Users may not want all bursts stacked. Need easy undo and opt-out.

## Files to Modify

- `server/src/enum.ts` (new JobName)
- `server/src/services/stack.service.ts` or new `auto-stack.service.ts`
- `server/src/services/metadata.service.ts` (trigger auto-stack after extraction)
- `server/src/repositories/stack.repository.ts` (bulk create/merge)
- `server/src/schema/migrations/` (new index migration)
- `server/src/schema/tables/asset-exif.table.ts` (verify index)
- Web admin settings component
- Web user settings component
