# Space-Library Sync Design

## Problem

External libraries can contain tens or hundreds of thousands of photos, managed by admins.
Users have no visibility into the library concept. Shared Spaces provide collaborative access
to photos but require manually adding assets one by one. There is no way to share an entire
library's worth of photos with other users through spaces.

## Goal

Allow admins to link an external library to a shared space so that all library assets
automatically appear in the space. Space members can then toggle `showInTimeline` to merge
those photos into their main timeline, effectively getting per-library access control through
the existing spaces infrastructure.

## User Story

1. Admin creates a space (e.g., "Mom's Photos") and invites family members
2. In space settings, admin sees a "Connect Library" option (admin-only UI)
3. Admin picks a library from a dropdown of all managed libraries
4. All assets from that library immediately appear in the space
5. Each member toggles "show in timeline" per their preference
6. New photos added to the library via future scans automatically appear in the space

## Design Decisions

### Query-through (not sync-based)

Instead of copying every asset ID into `shared_space_asset`, space queries resolve library
assets at query time by joining through `shared_space_library` to `asset.libraryId`. This
means:

- No duplication of data (no 117k rows in a junction table)
- Zero sync delay — new library assets appear instantly
- No sync jobs to manage, no race conditions with the library scan pipeline
- `UNION` (not `UNION ALL`) deduplicates assets that exist in both `shared_space_asset`
  and a linked library

If per-asset control or materialized performance becomes necessary later, the
`shared_space_library` table stays the same — a sync layer can be added on top.

### Permission Model

Both conditions required to link or unlink a library:

- User is a **server admin** (library management is admin-only)
- User is an **editor or owner** of the target space

This means the admin must be a member of the space. This is intentional — you should not be
able to push photos into a space you are not part of.

### Face Recognition

**Automatic**, triggered in two scenarios:

1. **On library link creation**: A single `SharedSpaceLibraryFaceSync` orchestrator job is
   queued with `{ spaceId, libraryId }`. The handler queries all library assets with detected
   faces and processes them in batches internally. This avoids flooding the queue with 117k
   individual jobs.

2. **On ongoing library scans**: When the library scan creates new assets, individual
   `SharedSpaceFaceMatch` jobs are queued for each new asset against linked spaces. The
   number of new assets per scan is small (tens/hundreds), so individual jobs are fine.

Face matching reuses existing face embeddings computed during normal asset processing — only
the matching step (comparing embeddings to space-scoped people) runs.

## Data Model

One new table. No changes to existing tables.

### `shared_space_library`

| Column      | Type        | Constraints                              |
| ----------- | ----------- | ---------------------------------------- |
| `spaceId`   | uuid        | PK, FK → `shared_space` (CASCADE delete) |
| `libraryId` | uuid        | PK, FK → `library` (CASCADE delete)      |
| `addedById` | uuid / null | FK → `user` (SET NULL)                   |
| `createdAt` | timestamptz | auto-generated                           |

Composite primary key `(spaceId, libraryId)`. A library can be linked to multiple spaces. A
space can have multiple linked libraries.

See `docs/plans/space-library-sync-erd.html` for the full entity relationship diagram.

## API

Two new endpoints on the existing `SharedSpaceController`:

### `PUT /shared-spaces/:id/libraries`

- Body: `{ libraryId: string }`
- Guards: admin + space editor/owner
- Creates row in `shared_space_library`
- Queues `SharedSpaceLibraryFaceSync` orchestrator job
- Returns updated space

### `DELETE /shared-spaces/:id/libraries/:libraryId`

- Guards: admin + space editor/owner
- Deletes row from `shared_space_library`
- Library assets disappear from space immediately (query-through)

## Query Changes

All space asset queries need to UNION library-linked assets. Affected areas:

- **`SharedSpaceRepository`**: `getAssetCount()`, `getRecentAssets()`, `getNewAssetCount()`
- **`AssetRepository`**: `getTimeBuckets()`, `getTimeBucket()` where `timelineSpaceIds` is
  used
- **Space map queries**: include library assets in map markers
- **Space search queries**: include library assets in search results

Pattern for all queries:

```sql
-- Manual assets
SELECT a.id FROM asset a
JOIN shared_space_asset sa ON sa."assetId" = a.id
WHERE sa."spaceId" = :spaceId

UNION

-- Library-linked assets
SELECT a.id FROM asset a
JOIN shared_space_library sl ON sl."libraryId" = a."libraryId"
WHERE sl."spaceId" = :spaceId
```

## Testing Strategy

All implementation follows TDD: write failing tests first, then implement to make them pass.

### Unit Tests — Service Layer (`shared-space.service.spec.ts`)

#### Link Library

- should link a library to a space when user is admin and space editor
- should link a library to a space when user is admin and space owner
- should reject linking when user is not admin
- should reject linking when user is admin but only a space viewer
- should reject linking when user is admin but not a space member
- should reject linking a non-existent library
- should reject linking a library to a non-existent space
- should be idempotent when linking the same library twice (no error, no re-queued face sync)
- should allow linking the same library to different spaces
- should allow linking different libraries to the same space
- should queue SharedSpaceLibraryFaceSync job on link creation
- should not queue face sync job if space has faceRecognitionEnabled = false

#### Unlink Library

- should unlink a library from a space when user is admin and space editor
- should unlink a library from a space when user is admin and space owner
- should reject unlinking when user is not admin
- should reject unlinking when user is admin but only a space viewer
- should reject unlinking a library that is not linked to the space
- should not fail when unlinking from a space with manually added assets from the same library

#### Get Space (with linked libraries)

- should include linked library info in space response
- should return empty libraries array when no libraries linked

### Unit Tests — Repository Layer (`shared-space.repository.spec.ts`)

#### Asset Count

- should count manual assets only when no libraries linked
- should count library assets only when no manual assets
- should count both manual and library assets combined
- should not double-count an asset that exists in both shared_space_asset and a linked library
- should count assets across multiple linked libraries without duplicates

#### Recent Assets

- should return recent assets from linked libraries
- should return recent assets from both manual and library sources, sorted by date
- should deduplicate assets appearing in both sources

#### New Asset Count (recency badge)

- should count new library assets added after member's lastViewedAt
- should use asset.createdAt (not fileCreatedAt) for library assets since there is no addedAt

#### Timeline Queries

- should include library-linked assets in time buckets when withSharedSpaces is true
- should include library-linked assets in time bucket asset queries
- should deduplicate assets in time buckets across manual and library sources

### Unit Tests — Face Recognition

#### SharedSpaceLibraryFaceSync Orchestrator

- should process all library assets with faces in batches
- should skip assets with no detected faces
- should create space persons for unmatched faces
- should match faces to existing space persons
- should be a no-op if the library link was removed before the job runs

#### Ongoing Library Scan Hook

- should queue SharedSpaceFaceMatch for new assets when library is linked to spaces
- should queue jobs for multiple spaces if library is linked to more than one
- should not queue face match jobs if library is not linked to any space
- should not queue face match jobs if linked space has faceRecognitionEnabled = false

### Edge Cases

#### Library Deletion

- should automatically unlink from all spaces when library is deleted (CASCADE)
- library assets should no longer appear in any space after deletion

#### Space Deletion

- should automatically remove library links when space is deleted (CASCADE)

#### Asset Deletion/Offline

- should not include deleted assets from linked libraries in space queries
- should not include offline assets from linked libraries in space queries

#### Library Scan Race Condition

- should include assets created mid-scan when querying space (no sync = no race)

#### Deduplication

- should show an asset once if it exists in shared_space_asset AND a linked library
- should show an asset once if it exists in two linked libraries that both contain it
  (e.g., same asset imported into two libraries via symlinks or overlapping import paths)

#### User Permissions on Library Assets

- space members should be able to view library-linked assets even though they are not the
  library owner
- space viewers should not be able to add/remove library links
- non-space members should not be able to access library-linked assets through the space

### Medium Tests (DB integration)

These require a real database via testcontainers:

- should persist shared_space_library row with correct foreign keys
- should CASCADE delete library link when space is deleted
- should CASCADE delete library link when library is deleted
- should SET NULL addedById when the linking admin is deleted
- should enforce composite PK uniqueness (spaceId, libraryId)
- should return correct UNION results with real data across both asset sources
- should handle UNION deduplication with real data

## What This Does NOT Cover

- **Reverse sync**: Photos added to the space by members are not imported back into the
  library. One-way only (library → space).
- **Per-asset exclusion**: Linking a library is all-or-nothing. To exclude individual assets,
  unlink the library and manually add the desired assets.
- **User-facing library UI**: Libraries remain an admin-only concept. Users see library photos
  through spaces, not through a library browser.
