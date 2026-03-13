# Space Card Redesign — Design Document

## Goal

Replace the plain button-like space labels on the spaces list page with album-style cards featuring photo thumbnails, member avatar overlays, and the ability to set a custom cover photo.

## Architecture

User-settable thumbnail with auto-fallback. Spaces store an optional `thumbnailAssetId` FK; the API resolves the thumbnail by preferring the user-set value, falling back to the most recent asset in the space. The web UI renders album-style cards using the existing `AssetCover` component for thumbnails.

## Components

### Database

- Add nullable `thumbnailAssetId` column (UUID FK → `assets.id`, `ON DELETE SET NULL`) to `shared_spaces` table
- Migration to add the column

### Server API

- Extend `SharedSpaceResponseDto` with `thumbnailAssetId: string | null`
- Thumbnail resolution logic: return `thumbnailAssetId` if set, else query the most recent asset in the space
- Extend `PATCH /shared-spaces/:id` to accept `thumbnailAssetId` in the update DTO
- Extend DTO to include basic member info (userId, email, profileImagePath) for avatar rendering

### Web — SpaceCard Component

- New `space-card.svelte` component styled like album cards
- Uses `AssetCover` for the thumbnail image
- Member avatar stack overlay in bottom-right corner (up to 4 avatars + "+N" overflow badge)
- Space name and metadata (asset count, member count) displayed below the thumbnail
- Empty state: gradient placeholder when no assets exist

### Web — Spaces List Page

- Replace text-only grid with responsive card grid (`grid-auto-fill-56`)
- Each space renders a `SpaceCard`

### "Set as Space Cover" Action

- Context menu item on photos in the space detail view
- Available to owners and editors only (permission check)
- Calls existing `PATCH /shared-spaces/:id` with `{ thumbnailAssetId: assetId }`

## Visual Layout

```
┌─────────────────────┐
│                     │
│    [Thumbnail]      │
│                     │
│              ○○○○   │  ← member avatars (bottom-right, overlapping)
├─────────────────────┤
│ Space Name          │
│ 42 photos · 3 members│
└─────────────────────┘
```

## Member Avatar Stack

- Overlapping circular avatars (bottom-right of thumbnail)
- Show up to 4 avatars, then "+N" badge
- Use existing user avatar/profile image paths

## Decisions

- **Thumbnail persistence**: Stored in DB, not computed on every request
- **Auto-fallback**: When no thumbnail is set, use the most recent asset (computed at query time)
- **Deletion handling**: `ON DELETE SET NULL` — if the cover asset is deleted, falls back to auto
- **Permission model**: Owners and editors can set covers; viewers cannot
