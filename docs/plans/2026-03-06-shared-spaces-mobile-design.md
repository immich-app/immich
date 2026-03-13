# Shared Spaces — Mobile (iOS) Feature Completeness Design

**Date:** 2026-03-06
**Goal:** Implement all web shared spaces features on mobile (iOS) in one phase.

## Gap Analysis

| Feature                  | Web | Mobile                         |
| ------------------------ | --- | ------------------------------ |
| List spaces              | Yes | Yes                            |
| Create space             | Yes | Yes                            |
| Delete space             | Yes | No (repo exists, no UI)        |
| View space detail        | Yes | Partial (read-only, no photos) |
| Add members              | Yes | No (repo exists, no UI)        |
| Remove members           | Yes | No                             |
| Edit member roles        | Yes | No (repo + API method missing) |
| View space photos (grid) | Yes | No                             |
| Add photos to space      | Yes | No                             |
| Remove photos from space | Yes | No                             |
| Role-based UI gating     | Yes | No                             |

## Approach

Mirror the existing album viewer patterns. Reuse `MultiselectGrid`, `ImmichAssetGrid`, `ControlBottomAppBar`, and the asset/user selection page patterns. This gives consistent UX, minimal new code, and reliable multi-select for free.

## Components

### 1. Repository Layer — Missing Methods

Add to `SharedSpaceApiRepository` (`repositories/shared_space_api.repository.dart`):

- `updateMember(spaceId, userId, role)` — calls `_api.updateMember()` with `SharedSpaceMemberUpdateDto`
- `addAssets(spaceId, assetIds)` — calls `_api.addAssets()` with `SharedSpaceAssetAddDto`
- `removeAssets(spaceId, assetIds)` — calls `_api.removeAssets()` with `SharedSpaceAssetRemoveDto`

### 2. Provider Layer — New Providers

Add to `providers/shared_space.provider.dart`:

- `sharedSpaceTimelineProvider(spaceId)` — provides `RenderList` for the asset grid, using the existing timeline service with `spaceId` parameter (mirrors `albumTimelineProvider`)
- `currentSpaceMemberProvider(spaceId)` — derives the current user's membership/role from `sharedSpaceMembersProvider`

### 3. Space Detail Page — Full Rewrite

Transform `space_detail.page.dart` from read-only ListView into album-viewer-style page:

- **Header section** (above grid): space name, description, member avatar icons (tappable to members page), asset/member counts
- **Photo grid**: `MultiselectGrid` + `ImmichAssetGrid` fed by `sharedSpaceTimelineProvider`
- **App bar actions** (role-gated):
  - Owner: "Add Photos", "Members", overflow menu with "Delete Space"
  - Editor: "Add Photos", "Members"
  - Viewer: "Members" only
- **Multi-select bottom bar**: Reuse `ControlBottomAppBar` with `onRemoveFromSpace` callback (editor+ only), plus share/download
- **Empty state**: "No photos yet" with CTA to add photos (if editor+)

### 4. Add Photos Flow — SpaceAssetSelectionPage

New page mirroring `AlbumAssetSelectionPage`:

- Navigate from "Add Photos" button in space detail
- Shows user's timeline in selection mode via `ImmichAssetGrid(selectionActive: true)`
- App bar: close button, dynamic title with count, "Add" confirm button
- On confirm: `repository.addAssets(spaceId, selectedIds)`, invalidate timeline provider, pop back

### 5. Member Management — SpaceMembersPage

New page combining view + management:

- **Member list**: avatar, name, email, role chip per member
- **Owner actions per member**: tap opens bottom sheet with role picker (editor/viewer) + remove option
- **Owner app bar action**: "Add Member" button navigates to member selection
- **Non-owner**: view-only list, can leave space (remove self)

### 6. Add Member Flow — SpaceMemberSelectionPage

New page mirroring `AlbumAdditionalSharedUserSelectionPage`:

- Lists users from `otherUsersProvider`, filtered to exclude existing members
- Tap to toggle selection, selected users shown as chips at top
- Confirm adds each user via `repository.addMember()` with default role: viewer
- Returns to members page, invalidates members provider

### 7. Spaces List Page — Minor Enhancements

- Show asset count alongside member count in list tiles

### 8. Role-Based Gating

Derived from `currentSpaceMemberProvider`:

- `isOwner` — delete space, manage members/roles, add/remove photos
- `isEditor` — owner OR editor — add/remove photos
- `isViewer` — view only

Gates which buttons appear in app bar and whether `onRemoveFromSpace` is wired into bottom bar.

### 9. Navigation / Routing

New routes in `router.dart`:

- `SpaceMembersRoute(spaceId)` — member management
- `SpaceMemberSelectionRoute(spaceId, existingMemberIds)` — add member picker
- `SpaceAssetSelectionRoute(spaceId)` — add photos picker

Existing routes unchanged: `SpacesRoute`, `SpaceDetailRoute`.

## Key Reference Files

| Pattern                 | Reference File                                                 |
| ----------------------- | -------------------------------------------------------------- |
| Album detail with grid  | `pages/album/album_viewer.dart`                                |
| Album app bar + actions | `pages/album/album_viewer_appbar.dart`                         |
| Asset selection picker  | `pages/album/album_asset_selection.page.dart`                  |
| User selection picker   | `pages/album/album_additional_shared_user_selection.page.dart` |
| Multi-select grid       | `widgets/asset_grid/multiselect_grid.dart`                     |
| Bottom action bar       | `widgets/asset_grid/control_bottom_app_bar.dart`               |
| Timeline provider       | `providers/asset_viewer/render_list.provider.dart`             |
| User avatars            | `widgets/common/user_circle_avatar.dart`                       |
| Shared user icons       | `widgets/album/album_shared_user_icons.dart`                   |
