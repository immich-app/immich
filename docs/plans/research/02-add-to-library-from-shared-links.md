# Feature Research: Add to Library from Shared Links

**Votes:** 474 (5th most requested)
**Status:** Not implemented in fork or upstream
**Upstream Work:** None found

## Overview

When someone shares photos with you via a shared link, allow you to save/import those photos into your own library. Currently, the only workaround is to download and re-upload, which loses metadata context and is cumbersome.

## Current State in Immich

### Shared Link Architecture

**Schema** (`server/src/schema/tables/shared-link.table.ts`):

- `id`, `userId` (owner), `key` (bytea encryption key for URL)
- `type`: `Album` (shares entire album) or `Individual` (shares specific assets)
- `password` (optional), `expiresAt`, `description`
- Flags: `allowUpload`, `allowDownload`, `showExif`
- Join table: `shared_link_asset` maps individual assets to the link

**Access Model:**

- View-only by default — recipients can view and optionally download
- `allowUpload` lets the link owner add more assets to the link
- No mechanism for recipients to import/claim shared assets
- Auth is stateless: unique `key` in URL like `/share/{key}`

**Web UI:**

- Public share page at `web/src/routes/(user)/share/[key]/...`
- Two viewers: `AlbumViewer` (album shares) and `IndividualSharedViewer`
- No "Save to Library" button exists

### Asset Ownership Model

**Key constraint: Assets are single-owner.**

- Every asset has `ownerId` (FK to user) — exactly one owner
- Checksum must be unique per user+library combination
- Assets cannot be shared as references across users

**Asset Copy Mechanism:**

- `AssetService.copy()` exists but is designed for deduplication, not cross-user import
- Takes `sourceId` and `targetId` — assumes both assets already exist
- Copies metadata: album associations, shared links, favorites, stacks, sidecars

### Partner Sharing (Different Pattern)

Partner sharing allows persistent bidirectional access without asset duplication:

- `partner` table: user-to-user relationship with `inTimeline` flag
- Assets remain owned by original user
- Viewer queries merge partner IDs: `getRandom([userId, ...partnerIds])`
- No duplication — pure access control

## Proposed Implementation

### Approach A: Full File Copy (Recommended)

Create a new asset record with `ownerId = currentUser` and copy the file from the shared link owner's storage.

**Pros:** Simple ownership model, no schema changes to asset table, works with existing access control
**Cons:** Storage duplication (N users = N copies), slower for large imports

### Approach B: Reference-Based Sharing

Add a `sourceAssetId` FK to the asset table, allowing assets to reference another user's file without duplication.

**Pros:** No storage duplication, instant import
**Cons:** Breaks single-owner assumption, complex access control (what if source is deleted?), major schema change, cascade issues

### Approach C: Shared Asset Table

New `shared_asset` join table linking assets to multiple users without duplicating files.

**Pros:** Clean separation, no storage duplication
**Cons:** Every query touching assets needs to also check shared_asset, significant query complexity

### Recommended: Approach A

File copy is the simplest and most robust approach. Storage is cheap, and it avoids the cascading complexity of reference-based models. It also matches how other photo services (Google Photos, iCloud) handle shared album saves.

## Implementation Details

### Backend Changes

**New Endpoint:**

```
POST /shared-links/:key/import
Body: { assetIds: string[] }
Auth: Required (JWT) — user must be logged in
```

**New Permission:** `Permission.SharedLinkImport` or reuse `Permission.AssetUpload`

**Service Logic** (`server/src/services/shared-link.service.ts`):

1. Validate shared link exists, not expired, `allowDownload=true` (or new `allowImport` flag)
2. Verify requesting user is authenticated and is NOT the link owner
3. For each asset ID:
   a. Verify asset is part of the shared link
   b. Check if user already has asset with same checksum (skip duplicates)
   c. Copy file from owner's storage to user's storage path
   d. Create new asset record with `ownerId = currentUser`
   e. Copy EXIF metadata, preserve original dates
   f. Queue thumbnail generation job
4. Optionally create a new album with the shared link's description/name
5. Return list of imported asset IDs

**Shared Link Schema Change** (optional):

- Add `allowImport` boolean flag (default: false)
- Or reuse `allowDownload` as the gate (if you can download, you can import)

### Frontend Changes

**Web:**

- Add "Save to Library" button in `IndividualSharedViewer.svelte` and `AlbumViewer.svelte`
- Button visible only when: user is logged in, not the owner, downloads allowed
- Confirmation dialog: "Import X photos to your library?"
- Progress indicator during import
- Toast: "X photos added to your library"

**Mobile:**

- "Save to Library" button in shared link viewer
- Same visibility conditions as web
- Regenerate OpenAPI client

### Storage Considerations

- Full file copy: each import consumes the full file size
- No deduplication across users (by design — ownership model)
- Thumbnail generation queued as background job
- EXIF extraction re-queued for imported assets (or copied from source)

## Design Decisions Needed

1. **Gate mechanism**: New `allowImport` flag vs reuse `allowDownload`?
   - Recommendation: Reuse `allowDownload` — if you can download, importing is just server-side download

2. **Album creation**: Auto-create album for imported assets?
   - Recommendation: Optional — offer "Import to new album" vs "Import to library"

3. **Metadata preservation**: What transfers?
   - Dates, EXIF, filename: Yes
   - Tags, descriptions: Yes
   - Favorites, archive status: No (user preference)
   - Album associations: No (different user's albums)

4. **Duplicate handling**: What if user already has the same photo?
   - Recommendation: Skip by checksum, report "X already in library"

5. **Authentication requirement**: Must user be logged in?
   - Recommendation: Yes, must have an account — can't give assets to anonymous users

6. **Rate limiting**: Prevent abuse?
   - Recommendation: Standard rate limiting on the endpoint, no special limits

## Effort Estimate

| Component              | Effort       | Notes                                    |
| ---------------------- | ------------ | ---------------------------------------- |
| New endpoint + service | Medium       | File copy logic, permission checks       |
| Shared link DTO update | Small        | Add `allowImport` or reuse download flag |
| File copy utility      | Medium       | Cross-user storage path handling         |
| Job queue integration  | Small        | Thumbnail + metadata extraction jobs     |
| Web UI                 | Small-Medium | Button + confirmation dialog             |
| Mobile UI              | Small-Medium | Button in shared link viewer             |
| Tests                  | Medium       | Unit + integration tests for import flow |
| OpenAPI regeneration   | Small        | New endpoint generates new SDK methods   |

**Total: Medium effort (~1-2 weeks)**

The trickiest part is the file copy across user storage paths, especially with our S3 storage backend.

## Key Technical Challenges

1. **Cross-user file copy**: Source and target may be on different storage backends (local vs S3)
2. **Large imports**: Importing 100+ photos needs background processing, not synchronous API call
3. **Storage quota**: If quotas are enforced, need to check before import
4. **Concurrent imports**: Multiple users importing from the same shared link simultaneously
5. **S3 storage**: Our fork uses S3 — need to handle S3-to-S3 copy (server-side copy is efficient) vs S3-to-local
6. **Live photos**: If shared link contains live photos (image + video), both must be imported and linked

## Files to Modify

- `server/src/services/shared-link.service.ts` (new import method)
- `server/src/controllers/shared-link.controller.ts` (new endpoint)
- `server/src/dtos/shared-link.dto.ts` (optional: `allowImport` flag)
- `server/src/services/asset.service.ts` (file copy utility)
- `server/src/repositories/asset.repository.ts` (create imported asset)
- `web/src/lib/components/share-page/individual-shared-viewer.svelte`
- `web/src/lib/components/album-page/album-viewer.svelte`
- Mobile shared link viewer
- OpenAPI spec regeneration
