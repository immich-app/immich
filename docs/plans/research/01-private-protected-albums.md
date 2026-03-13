# Feature Research: Private/Protected Albums

**Votes:** 670 (2nd most requested)
**Status:** Not implemented in fork or upstream
**Upstream Work:** PIN/lock infrastructure already exists for individual assets

## Overview

Hidden or locked albums that require PIN or biometric authentication to view. Similar to a "hidden folder" for sensitive content — the album and its contents are invisible or inaccessible without explicit authentication.

## Current State in Immich

### Album Schema

The `album` table (`server/src/schema/tables/album.table.ts`) currently has:

- `id`, `ownerId`, `albumName`, `description`
- `albumThumbnailAssetId`, `isActivityEnabled`, `order`
- `createdAt`, `updatedAt`, `deletedAt` (soft delete)
- **No visibility or protection fields**

Album sharing uses `album_user` table with `(albumId, userId)` composite PK and a `role` enum (Editor/Viewer).

### Existing PIN/Lock Infrastructure (Assets)

Immich already has a fully functional PIN-based session system for **individual assets**:

**AssetVisibility Enum** (`server/src/enum.ts`):

- `Timeline` — visible (default)
- `Archive` — hidden from timeline
- `Hidden` — video part of live/motion photos
- `Locked` — requires PIN authentication

**User Table**: `pinCode` column (hashed, optional)

**Session Table**: `pinExpiresAt` timestamp for elevated session tracking

**Auth Service** (`server/src/services/auth.service.ts`):

- `setupPinCode()`, `changePinCode()`, `resetPinCode()`
- `unlockSession()` — grants 15-minute elevated access
- `lockSession()` — revokes access immediately
- `getAuthStatus()` — returns `isElevated`, `pinExpiresAt`

**Access Control** (`server/src/repositories/access.repository.ts`):

- `AssetAccess.checkOwnerAccess()` filters out `Locked` assets unless `hasElevatedPermission` is true
- Pattern: check `session.pinExpiresAt > now()` for access

**Auth Controller Endpoints**:

- `POST /auth/pin/setup`, `/change`, `/reset`, `/unlock`, `/lock`
- `GET /auth/status`

### Asset Locking Behavior

When assets are marked `Locked`, they're automatically removed from all albums (`server/src/services/asset.service.ts`). This is a design decision — locked assets live outside the album system.

### Shared Link Password

Shared links (`shared_link` table) already support a `password` field, demonstrating password-protected access at the album/link level.

## Proposed Implementation

### Approach A: Album Visibility Column (Recommended)

Add a `visibility` column to the album table using a new enum:

```
AlbumVisibility:
  Public     — fully visible (default)
  Hidden     — hidden from album lists, accessible only by direct link or owner
  Protected  — requires PIN (elevated session) to view
```

**Pros:** Clean, follows existing `AssetVisibility` pattern, single column
**Cons:** Limited granularity (can't mix hidden + protected)

### Approach B: Separate Boolean Flags

Add `isPrivate` and `requiresPin` as separate boolean columns.

**Pros:** More flexible, simpler queries
**Cons:** More fields, potential invalid combinations (private + no PIN = what?)

### Recommended: Approach A

It matches the established pattern in the codebase (`AssetVisibility` enum) and is simpler to reason about.

## Implementation Details

### Backend Changes

**Schema & Migration:**

- Add `visibility` column to `album` table (default: `'public'`)
- Create `AlbumVisibility` enum in `server/src/enum.ts`
- Update `server/src/database.ts` album type

**Repository** (`server/src/repositories/album.repository.ts`):

- `getOwned()` — owners always see all their albums (no change)
- `getShared()` — exclude `protected` albums for non-owners unless session is elevated
- `getNotShared()` — same filtering
- Add visibility parameter to query methods

**Access Control** (`server/src/repositories/access.repository.ts`):

- Enhance `AlbumAccess` class to check visibility + `hasElevatedPermission`
- Pattern: reuse the same `pinExpiresAt > now()` check from `AssetAccess`

**Service** (`server/src/services/album.service.ts`):

- `get()` — check visibility before returning; require elevated permission for protected albums
- `getAll()` — filter based on visibility and auth context
- `update()` — accept visibility changes in DTO

**DTOs** (`server/src/dtos/album.dto.ts`):

- Add `visibility` to `UpdateAlbumDto` and `AlbumResponseDto`

### Frontend Changes

**Web:**

- Album list: lock icon overlay on protected album cards
- Album page: PIN unlock modal (reuse existing auth PIN flow)
- Album settings: visibility dropdown (Public/Hidden/Protected)
- Components to modify: album card, album page layout, album options modal

**Mobile:**

- Regenerate OpenAPI client with new album fields
- Add visibility field to `RemoteAlbum` model
- Lock icon on album cards
- PIN unlock screen when tapping protected album

### Database Migration

```sql
ALTER TABLE album ADD COLUMN visibility character varying DEFAULT 'public';
CREATE INDEX album_visibility_idx ON album (visibility);
```

## Design Decisions Needed

1. **Owner PIN requirement**: Does the owner need PIN to view their own protected album, or only non-owners?
   - Recommendation: Everyone needs PIN (matches asset locking behavior)

2. **Shared album interaction**: If a protected album is shared with users, do they also need PIN?
   - Recommendation: Yes, all viewers need PIN

3. **Shared link interaction**: Can protected albums be shared via links?
   - Recommendation: Yes, but shared link password + album PIN are independent. Link password protects the link; album PIN protects the content.

4. **Asset visibility vs album visibility**: Can a protected album contain already-locked assets?
   - Recommendation: No — locked assets are removed from albums (current behavior). Protected albums are a separate concept.

5. **Timeline exclusion**: Should protected album assets be excluded from the main timeline?
   - Recommendation: Yes, unless session is elevated

## Effort Estimate

| Component          | Effort | Notes                                         |
| ------------------ | ------ | --------------------------------------------- |
| Schema + migration | Small  | 1 column, 1 enum, 1 index                     |
| Repository queries | Medium | ~4 query methods need visibility filtering    |
| Access control     | Medium | Extend AlbumAccess, reuse PIN session pattern |
| Service layer      | Medium | Access checks in get/getAll/update            |
| DTOs + OpenAPI     | Small  | Add field to 2 DTOs, regenerate clients       |
| Web UI             | Medium | Lock icon, PIN modal, settings dropdown       |
| Mobile             | Medium | Model update, lock UI, PIN flow               |
| Tests              | Medium | Unit + medium tests for access control        |

**Total: Medium-Large effort (~2-3 weeks)**

The heavy reuse of existing PIN infrastructure significantly reduces the effort. The main work is in the album repository filtering and UI components.

## Key Technical Challenges

1. **Query complexity**: Every album query must now consider visibility + session elevation state
2. **Caching**: Album lists may be cached — need to invalidate when visibility changes or PIN session expires
3. **Shared Spaces interaction**: Our fork has Shared Spaces — need to decide if spaces can contain protected albums
4. **Timeline integration**: Protected album assets shouldn't appear in timeline unless elevated
5. **Search results**: Protected album assets shouldn't appear in search results unless elevated
6. **Mobile sync**: Album sync must respect visibility and PIN state

## Files to Modify

- `server/src/schema/tables/album.table.ts`
- `server/src/schema/migrations/` (new migration)
- `server/src/enum.ts`
- `server/src/database.ts`
- `server/src/repositories/album.repository.ts`
- `server/src/repositories/access.repository.ts`
- `server/src/services/album.service.ts`
- `server/src/dtos/album.dto.ts`
- `server/src/controllers/album.controller.ts`
- Web album components (list, page, settings modal)
- Mobile album model and UI
- OpenAPI spec regeneration
