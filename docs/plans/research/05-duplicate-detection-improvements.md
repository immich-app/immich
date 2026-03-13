# Feature Research: Duplicate Detection Improvements

**Votes:** 275 (8th most requested)
**Status:** Partially shipped — detection works well, resolution workflow is manual-intensive
**Upstream Work:** Active — CLIP-based detection, side-by-side comparison UI, bulk actions

## Overview

Find and merge duplicate photos in your library. The detection algorithm (CLIP embedding vector distance) is solid and fully functional. The main gaps are in automated resolution, bulk operations, and cross-user detection.

## Current Architecture

### Detection Algorithm

**Method: CLIP Embeddings with Vector Distance**

- Uses CLIP embeddings stored in `smart_search` table
- PostgreSQL vector distance operator (`<=>`) via `vectorchord`/`pgvectors` extension
- Configurable `maxDistance` parameter (range: 0.001-0.1)
- Returns up to 64 most similar matches per asset

**Detection Criteria:**

- Same asset type (image/video)
- Non-deleted, non-stacked assets only
- Not hidden or locked visibility
- Must have CLIP embedding computed
- Same owner (no cross-user detection)

### Data Model

**Asset Table:**

- `duplicateId` (UUID, nullable) — grouping identifier
- Assets in the same duplicate group share the same `duplicateId`

**Supporting:**

- `smart_search` table — CLIP embeddings per asset
- `asset_job_status.duplicatesDetectedAt` — timestamp to avoid re-scanning

### Job Pipeline

1. **Queue All** (`AssetDetectDuplicatesQueueAll`): Streams all assets with CLIP embeddings, creates per-asset detection jobs (batched by 1000)
2. **Per-Asset Detection** (`AssetDetectDuplicates`): Validates eligibility, searches similar assets, merges duplicate groups, updates timestamps

### Duplicate Merging Logic

When duplicates found:

1. Extract existing `duplicateId` values from matched assets
2. Use first existing ID as target (or generate new UUID)
3. Update all matched assets to target `duplicateId`
4. Consolidates multiple groups into single group

### Web UI Workflow

**Route:** `/utilities/duplicates`

**Components:**

- Side-by-side comparison with metadata highlighting
- Suggestion algorithm: prefers largest file size + most EXIF data
- Selection state: "Keep" (green) vs "To Trash" (red)
- Bulk actions: "Deduplicate All", "Keep All"
- Stack option (group without deleting)
- Keyboard shortcuts (A/S/D/Shift+C/Shift+S)

**Suggestion Algorithm** (`duplicate-utils.ts`):

1. Sort by file size (ascending)
2. Filter to largest file size group
3. If tied, sort by EXIF metadata count
4. Return highest quality candidate

### API Endpoints

- `GET /duplicates` — List all duplicate groups
- `DELETE /duplicates/:id` — Remove single group
- `DELETE /duplicates` — Bulk delete groups

## Improvement Opportunities

### 1. Auto-Merge with Confidence Scores (High Impact)

**Problem:** Every duplicate group requires manual review, even obvious duplicates (same file, different upload).

**Solution:**

- Add similarity score to `DuplicateResponseDto`
- Define confidence tiers: High (>99%), Medium (95-99%), Low (<95%)
- Auto-resolve "High" confidence duplicates (keep best quality, trash rest)
- Show confidence badge in UI for informed decisions

**Implementation:**

- Return vector distance from `duplicateRepository.search()`
- Map distance to percentage: `similarity = 1 - distance`
- Add `autoResolveThreshold` to admin settings
- Background job: auto-resolve groups above threshold

**Effort:** Medium (1 week)

### 2. Bulk Decision Patterns (Medium Impact)

**Problem:** "Deduplicate All" uses same simple heuristic. Users want custom rules.

**Solution:**

- Rule-based bulk resolution: "Keep newest", "Keep largest", "Keep highest resolution", "Keep with most metadata"
- UI: dropdown for bulk action strategy
- Apply selected strategy across all groups

**Implementation:**

- Extend `suggestDuplicate()` with strategy parameter
- Add strategy selection UI before "Deduplicate All"
- Persist user's preferred strategy

**Effort:** Small-Medium (3-5 days)

### 3. Similarity Score Display (Low Effort, High Value)

**Problem:** Users can't see HOW similar two photos are. Hard to judge edge cases.

**Solution:**

- Show similarity percentage on each duplicate pair
- Visual: progress bar or badge (98% similar, 72% similar)
- Sort groups by similarity (most similar first)

**Implementation:**

- Already available from vector distance query
- Add to response DTO and UI components

**Effort:** Small (1-2 days)

### 4. Hash-Based Pre-Filtering (Performance)

**Problem:** CLIP embedding comparison is compute-intensive for large libraries.

**Solution:**

- First pass: exact checksum match (cheapest)
- Second pass: perceptual hash (pHash) for near-identical images
- Third pass: CLIP embeddings for semantic similarity
- Skip CLIP pass for assets already matched by hash

**Implementation:**

- Add `phash` column to `asset_exif` or dedicated table
- Calculate perceptual hash during metadata extraction
- Pre-filter exact matches before running CLIP

**Effort:** Medium-Large (1-2 weeks, new hash computation pipeline)

### 5. Cross-User Duplicate Detection (Large Feature)

**Problem:** Shared libraries/spaces may have redundant content across users.

**Solution:**

- Admin-only: detect duplicates across all users
- Show: which users have the duplicate
- Resolve: keep one copy, grant access to others (or just flag)

**Implementation:**

- Remove `ownerId` filter from detection query
- Add cross-user resolution permissions
- Complex: ownership transfer or shared reference

**Effort:** Large (2-3 weeks, complex permission model)

### 6. Undo Resolution History (Safety)

**Problem:** Once duplicates are resolved (deleted), no undo beyond trash recovery.

**Solution:**

- Log resolution decisions: `duplicate_resolution_log` table
- "Undo last resolution" button
- History view: what was resolved and when

**Implementation:**

- New table: `(id, groupId, keptAssetId, trashedAssetIds[], resolvedAt, resolvedBy)`
- Service: restore trashed assets and re-create duplicate group

**Effort:** Medium (1 week)

### 7. Mobile Duplicate UI (Feature Parity)

**Problem:** Duplicate resolution is web-only.

**Solution:**

- Basic duplicate list on mobile
- Swipe-based resolution (keep/trash)
- Sync resolution state with server

**Effort:** Large (2-3 weeks, full mobile UI)

### 8. Incremental Detection on Upload (Performance)

**Problem:** Full scan required to find duplicates of newly uploaded assets.

**Solution:**

- After CLIP embedding is computed for a new asset, immediately search for duplicates
- Queue `AssetDetectDuplicates` job as part of the upload pipeline
- Only scan new assets against existing library

**Implementation:**

- Trigger duplicate detection in metadata extraction pipeline
- Already partially supported — just need to wire the job

**Effort:** Small (1-2 days)

## Recommended Priority

| Improvement                     | Effort       | Impact | Priority |
| ------------------------------- | ------------ | ------ | -------- |
| Similarity score display        | Small        | High   | P1       |
| Incremental detection on upload | Small        | High   | P1       |
| Bulk decision patterns          | Small-Medium | Medium | P2       |
| Auto-merge with confidence      | Medium       | High   | P2       |
| Hash-based pre-filtering        | Medium-Large | Medium | P3       |
| Undo resolution history         | Medium       | Low    | P3       |
| Cross-user detection            | Large        | Medium | P4       |
| Mobile UI                       | Large        | Medium | P4       |

## Effort Estimate

**Quick wins (P1):** ~3 days — similarity display + incremental detection
**Automation (P2):** ~2 weeks — auto-merge + bulk patterns
**Advanced (P3-P4):** ~4-6 weeks — hash pre-filtering, cross-user, mobile

## Key Files

- `server/src/services/duplicate.service.ts` — Business logic
- `server/src/repositories/duplicate.repository.ts` — Vector distance queries
- `server/src/controllers/duplicate.controller.ts` — REST API
- `server/src/dtos/duplicate.dto.ts` — Response models
- `server/src/config.ts` — `maxDistance` configuration
- `web/src/routes/(user)/utilities/duplicates/+page.svelte` — Main UI
- `web/src/lib/components/utilities-page/duplicates/` — UI components
- `web/src/lib/utils/duplicate-utils.ts` — Suggestion algorithm
- `server/src/schema/tables/asset.table.ts` — `duplicateId` column
