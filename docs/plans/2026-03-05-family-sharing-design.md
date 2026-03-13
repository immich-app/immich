# Family Sharing: Shared Spaces, Collaborative Faces, and Smart Sharing

## Overview

A three-phase feature set that transforms Immich's per-user silo model into a collaborative family photo experience. The core abstraction is a **Shared Space** — a virtual library where multiple users can contribute, browse, search, and collaboratively tag photos and faces. This directly addresses the #1 upstream pain point (828+ votes, 195 comments on the sharing feature freeze) and targets the family/social sharer audience.

## Problem Statement

Immich's current sharing model has three mechanisms — partner sharing, album sharing, and shared links — but all of them share **only the raw photos**. No metadata travels with them:

- Face recognition is per-user. One family member tags 500 faces; their partner sees none of it.
- Smart search, map view, and tags don't work on shared content.
- Partner sharing is all-or-nothing — share your entire library or nothing.
- Shared album photos don't appear in the receiver's timeline.
- Users can't favorite, tag, or "save" shared photos to their own library.

The result: families revert to a single shared account, losing per-user identity, notifications, and preferences.

## Design Principles

- **References, not copies.** Linking a photo into a shared space creates a reference, not a duplicate. Storage cost is zero.
- **Additive schema changes.** New tables alongside existing ones. Partner sharing and album sharing continue to work. No breaking migrations.
- **Upstream merge safety.** Shared space logic lives in new files/tables. Existing services are extended, not rewritten. Merge conflicts should be minimal.
- **Progressive enhancement.** Each phase delivers standalone value. Phase 1 works without Phase 2; Phase 2 works without Phase 3.

---

## Phase 1: Shared Spaces

### Concept

A Shared Space is a virtual library owned by multiple users. It acts as a shared timeline, shared map, shared search scope, and shared album container. Each user retains their private library alongside.

### Data Model

#### New Tables

**`shared_space`**

| Column        | Type        | Description                         |
| ------------- | ----------- | ----------------------------------- |
| `id`          | uuid (PK)   | Auto-generated                      |
| `name`        | text        | Display name (e.g., "Smith Family") |
| `description` | text?       | Optional description                |
| `createdAt`   | timestamptz | Creation timestamp                  |
| `updatedAt`   | timestamptz | Last modified                       |
| `createdById` | uuid (FK)   | User who created the space          |

**`shared_space_member`**

| Column     | Type          | Description                 |
| ---------- | ------------- | --------------------------- |
| `spaceId`  | uuid (FK, PK) | Reference to shared_space   |
| `userId`   | uuid (FK, PK) | Reference to user           |
| `role`     | enum          | `owner`, `editor`, `viewer` |
| `joinedAt` | timestamptz   | When the user joined        |

**`shared_space_asset`**

| Column      | Type          | Description                              |
| ----------- | ------------- | ---------------------------------------- |
| `spaceId`   | uuid (FK, PK) | Reference to shared_space                |
| `assetId`   | uuid (FK, PK) | Reference to asset                       |
| `addedById` | uuid (FK)     | User who linked the asset into the space |
| `addedAt`   | timestamptz   | When the asset was added                 |

#### Role Permissions

| Permission               | Owner | Editor | Viewer |
| ------------------------ | ----- | ------ | ------ |
| View assets in space     | Y     | Y      | Y      |
| Search within space      | Y     | Y      | Y      |
| View map for space       | Y     | Y      | Y      |
| Add own assets to space  | Y     | Y      | N      |
| Remove assets from space | Y     | Y      | N      |
| Create albums in space   | Y     | Y      | N      |
| Invite/remove members    | Y     | N      | N      |
| Change member roles      | Y     | N      | N      |
| Delete the space         | Y     | N      | N      |
| Leave the space          | N     | Y      | Y      |

### Server Architecture

#### New Files

- `server/src/schema/tables/shared-space.table.ts` — Kysely table definitions
- `server/src/schema/tables/shared-space-member.table.ts`
- `server/src/schema/tables/shared-space-asset.table.ts`
- `server/src/repositories/shared-space.repository.ts` — Data access layer
- `server/src/services/shared-space.service.ts` — Business logic
- `server/src/controllers/shared-space.controller.ts` — API endpoints
- `server/src/dtos/shared-space.dto.ts` — Request/response DTOs

#### Migration

Single migration file adding the three tables with foreign keys and indexes on `(spaceId, assetId)` and `(spaceId, userId)`.

#### API Endpoints

```
POST   /shared-spaces                          Create a space
GET    /shared-spaces                          List user's spaces
GET    /shared-spaces/:id                      Get space details + members
PATCH  /shared-spaces/:id                      Update name/description
DELETE /shared-spaces/:id                      Delete space (owner only)

POST   /shared-spaces/:id/members              Add members (with role)
PATCH  /shared-spaces/:id/members/:userId      Change member role
DELETE /shared-spaces/:id/members/:userId      Remove member / leave

POST   /shared-spaces/:id/assets               Link assets into space (bulk)
DELETE /shared-spaces/:id/assets               Unlink assets from space (bulk)
GET    /shared-spaces/:id/assets               Browse assets (paginated, timeline order)

GET    /shared-spaces/:id/search               Smart search within space
GET    /shared-spaces/:id/map                  Map markers within space
GET    /shared-spaces/:id/statistics           Asset counts, member counts
```

#### Access Control Integration

Extend `server/src/utils/access.ts` with new permission types:

```typescript
enum Permission {
  // ... existing permissions ...
  SharedSpaceRead = 'sharedSpace.read',
  SharedSpaceUpdate = 'sharedSpace.update',
  SharedSpaceDelete = 'sharedSpace.delete',
  SharedSpaceMemberCreate = 'sharedSpace.member.create',
  SharedSpaceMemberUpdate = 'sharedSpace.member.update',
  SharedSpaceMemberDelete = 'sharedSpace.member.delete',
  SharedSpaceAssetCreate = 'sharedSpace.asset.create',
  SharedSpaceAssetDelete = 'sharedSpace.asset.delete',
}
```

Extend `access.repository.ts` with:

- `checkSharedSpaceAccess(userId, spaceId)` — Is the user a member?
- `checkSharedSpaceAssetAccess(userId, assetId)` — Is the asset in any space the user belongs to?

Existing asset access checks (`checkAlbumAccess`, `checkPartnerAccess`) remain unchanged. A new `checkSharedSpaceAssetAccess` is added as an additional access path in the permission chain.

#### Timeline Integration

The timeline query in `server/src/services/timeline.service.ts` currently fetches assets by `ownerId` plus partner assets (if `inTimeline` is true). Extend to optionally include assets from the user's shared spaces:

```sql
-- Additional UNION for shared space assets
SELECT a.* FROM assets a
JOIN shared_space_asset ssa ON a.id = ssa.asset_id
JOIN shared_space_member ssm ON ssa.space_id = ssm.space_id
WHERE ssm.user_id = :userId
  AND a.deleted_at IS NULL
```

This is opt-in per space (a `showInTimeline` boolean on `shared_space_member`, defaulting to true).

### Web UI

#### Navigation

Add a new **"Spaces"** entry to the left sidebar, below "Sharing" and above "Albums":

```
Photos
Explore
Map
Sharing
  -> Spaces        <-- NEW
  -> Partners
  -> Shared Links
Albums
```

#### Space List Page (`/spaces`)

- Grid of space cards showing: name, member avatars, asset count, latest thumbnail
- "Create Space" button (opens modal: name, description)
- Each card links to the space detail page

#### Space Detail Page (`/spaces/:id`)

A tabbed view similar to the main app but scoped to the space:

| Tab      | Content                                                    |
| -------- | ---------------------------------------------------------- |
| Timeline | Chronological grid of all assets in the space              |
| Albums   | Albums within the space (Phase 3)                          |
| Map      | Map markers for geotagged assets in the space              |
| People   | Face clusters for this space (Phase 2 — hidden until then) |
| Members  | Member list with roles, invite button, role management     |
| Settings | Name, description, delete space (owner only)               |

#### Adding Assets to a Space

Two entry points:

1. **From the space:** An "Add Photos" button opens the asset picker (existing component), filtered to the user's own library. Selected assets are linked into the space.
2. **From the main library:** Multi-select assets -> context menu -> "Add to Space" -> space picker dropdown.

#### Components

New Svelte 5 components:

- `web/src/lib/components/spaces/space-card.svelte` — Card for space list
- `web/src/lib/components/spaces/space-detail.svelte` — Tabbed detail view
- `web/src/lib/components/spaces/space-members.svelte` — Member management
- `web/src/lib/components/spaces/space-settings.svelte` — Space settings
- `web/src/lib/components/spaces/add-to-space-modal.svelte` — Space picker for adding assets

New routes:

- `web/src/routes/(user)/spaces/+page.svelte` — Space list
- `web/src/routes/(user)/spaces/[spaceId]/+page.svelte` — Space detail

### Mobile UI (Flutter)

#### Navigation

Add a "Spaces" tab to the Library page (alongside Albums, Favorites, etc.):

```
Library
  -> Albums
  -> Favorites
  -> Spaces          <-- NEW
  -> Trash
```

#### Screens

- **Space list screen:** Card grid matching the web layout. Tapping a card opens the space.
- **Space detail screen:** Tab bar with Timeline, Map, Members tabs. Uses the existing asset grid widget scoped to the space's asset IDs.
- **Add to space:** From multi-select mode in the main timeline, a "Add to Space" action in the bottom sheet.
- **Member management screen:** List of members with role badges, invite button (user picker), swipe-to-remove.

#### Data Layer

- New `SharedSpace`, `SharedSpaceMember`, `SharedSpaceAsset` Drift entities
- New `SharedSpaceService` in `mobile/lib/domain/services/`
- API calls via generated OpenAPI client (auto-generated from new endpoints)

---

## Phase 2: Shared Face Recognition

### Concept

Face clusters and labels become **space-scoped**. When an asset is linked into a shared space, its face embeddings are included in the space's face clustering. All members see the same people, the same names, and can collaboratively merge/rename.

### Data Model

#### New Table

**`shared_space_person`**

| Column          | Type        | Description                                  |
| --------------- | ----------- | -------------------------------------------- |
| `id`            | uuid (PK)   | Auto-generated                               |
| `spaceId`       | uuid (FK)   | Reference to shared_space                    |
| `name`          | text?       | Shared display name                          |
| `thumbnailPath` | text?       | Best face thumbnail                          |
| `birthDate`     | date?       | Optional birth date                          |
| `createdAt`     | timestamptz | When this person was first detected in space |

**`shared_space_person_alias`**

| Column     | Type          | Description                                  |
| ---------- | ------------- | -------------------------------------------- |
| `personId` | uuid (FK, PK) | Reference to shared_space_person             |
| `userId`   | uuid (FK, PK) | User who set this alias                      |
| `alias`    | text          | User's local name (e.g., "Mom" vs "Tiffany") |

**`shared_space_face`**

| Column                                             | Type       | Description                                 |
| -------------------------------------------------- | ---------- | ------------------------------------------- |
| `id`                                               | uuid (PK)  | Auto-generated                              |
| `spaceId`                                          | uuid (FK)  | Reference to shared_space                   |
| `personId`                                         | uuid (FK)? | Reference to shared_space_person (nullable) |
| `assetId`                                          | uuid (FK)  | Reference to asset                          |
| `embedding`                                        | vector     | Face embedding (copied from asset_faces)    |
| `imageWidth`, `imageHeight`, `boundingBoxX1`, etc. | int        | Face crop coordinates                       |

### How It Works

1. **When an asset is added to a space**, the system copies its existing face embeddings from `asset_faces` into `shared_space_face` scoped to that space.
2. **Clustering runs per-space** as a background job (BullMQ). It groups `shared_space_face` rows into `shared_space_person` entries using the same DBSCAN/clustering logic as the per-user pipeline.
3. **Naming is collaborative.** Any editor/owner can name a `shared_space_person`. The shared name is the default display.
4. **Aliases are per-user.** A user can set a local alias via `shared_space_person_alias` that overrides the shared name in their UI only. Resolution: alias > shared name > "Unknown".
5. **Privacy boundary:** Only faces on assets _in the space_ are clustered. Personal library face data is never exposed.

### Server Changes

- New `SharedSpacePersonService` with merge, rename, and alias endpoints
- New background job `SharedSpaceFaceClustering` triggered when assets are added/removed from a space
- Face search endpoint scoped to space: `GET /shared-spaces/:id/people`

### Web UI

The **People** tab on the space detail page shows:

- Grid of face thumbnails with names (or aliases)
- Click a person to see all their photos within the space
- Merge faces (drag-and-drop or multi-select + merge button, matching existing UX)
- Rename (inline edit)
- "Set my name" button to create a personal alias without changing the shared name

### Mobile UI

- People tab in the space detail screen, matching the existing People page layout
- Long-press on a person for rename/merge options
- "My name for this person" option in the person detail screen

---

## Phase 3: Smart Sharing and Quality-of-Life

### 3a: "Add to Library"

Allow users to claim shared space assets into their personal library.

- **"Save to My Library" button** on individual assets and bulk-select in a shared space
- Creates a lightweight reference row (new `library_reference` table: `userId`, `assetId`, `sourceSpaceId`) — no file duplication
- The asset now appears in the user's personal timeline, favorites, and search
- If the original owner deletes the asset, referenced copies are preserved (the file is retained as long as any reference exists — reference counting on `assets.referenceCount`)

**Web:** "Save to Library" action in the asset detail view and bulk action bar when browsing a space.

**Mobile:** "Save to Library" in the asset action sheet and multi-select bottom bar.

### 3b: Auto-Share by Face

Automatically link new photos to a space when they contain specific people.

- **Configuration UI:** In space settings, an "Auto-add rules" section:
  - "When a photo of [Person X] is uploaded by any member, add it to this space"
  - Optionally: "Only when ALL selected people are present"
- **Implementation:** A new job (`SharedSpaceAutoLink`) runs after face detection. For each new face match, it checks all spaces' auto-add rules and links matching assets.
- **Notification:** Optional push notification to space members when new photos auto-arrive.

**Web:** Rule editor in space settings tab — person picker + toggle for "all must match".

**Mobile:** Same rule editor in space settings screen.

### 3c: User Groups

Group multiple users for easier sharing.

**`user_group`** table: `id`, `name`, `createdById`
**`user_group_member`** table: `groupId`, `userId`

- When inviting members to a space, select a group to add all its members at once
- When sharing an album, select a group
- Groups are managed in user settings

**Web:** Group management in Settings -> Sharing. Group picker in space member invite and album share modals.

**Mobile:** Group management in Settings. Group picker in invite flows.

### 3d: Nested Albums within Spaces

Albums created inside a shared space are automatically visible to all space members.

- Albums in a space can contain sub-albums (new `parentAlbumId` nullable FK on `albums` table)
- Sharing permissions inherit from the space — no per-album sharing needed
- Tree view in the Albums tab of the space detail page

**Web:** Collapsible tree in the space Albums tab. "Create Sub-album" button inside an album.

**Mobile:** Hierarchical list with indentation. Tap to expand/collapse. "New Sub-album" option.

---

## Migration Path from Existing Features

Shared Spaces coexist with existing sharing. No forced migration:

| Existing Feature   | Interaction with Spaces                                      |
| ------------------ | ------------------------------------------------------------ |
| Partner sharing    | Remains as-is. Users can optionally create a space instead.  |
| Album sharing      | Remains as-is. Space albums are a superset.                  |
| Shared links       | Can be created for space albums and individual space assets. |
| External libraries | Can be linked into a space like any other asset.             |

A future admin tool could offer "Convert partner sharing to space" as a one-click migration for existing users.

## Non-Goals (Explicit)

- **Federation** (cross-instance sharing) — upstream plans this post-rework; out of scope
- **Asset ownership transfer** — complex legal/storage implications; defer
- **Collaborative editing** (rotate, crop, filters) — separate feature
- **Public gallery mode** (no-account browsing) — existing shared links cover this

## Testing Strategy

- **Unit tests:** Service-level tests using `newTestService()` pattern for all CRUD operations, permission checks, and edge cases (delete asset that's in a space, remove last owner, etc.)
- **Medium tests:** Real DB tests for the space-scoped timeline query, face clustering, and access control joins
- **E2E tests:** Full flow — create space, invite member, add assets, verify member sees them in timeline/search/map

## Open Questions

1. **Should spaces have a storage quota?** If references are free, a single 10TB user could link everything into a space with a 1GB user. Probably fine for family use but worth considering.
2. **Should the personal timeline show space assets by default?** Current design says opt-in via `showInTimeline` on membership. Could default to true for simplicity.
3. **Face clustering cost:** Running per-space clustering in addition to per-user clustering increases ML compute. Could optimize by sharing embeddings and only re-clustering the grouping.
