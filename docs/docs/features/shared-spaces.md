# Shared Spaces

Shared Spaces are virtual libraries where multiple users can contribute, browse, and view photos together. Unlike [Partner Sharing](partner-sharing.md), which shares your entire library one-way, Shared Spaces let you create focused collaborative areas with fine-grained role-based access.

## Key Features

- **Reference-based sharing** — Photos are linked into a space, not duplicated. Zero additional storage cost.
- **Role-based access** — Three roles: Owner, Editor, and Viewer with different permissions.
- **Multiple spaces** — Create as many spaces as you need (e.g., "Family", "Friends", "Vacation 2025").
- **Works alongside existing sharing** — Partner sharing, album sharing, and shared links continue to work as before.
- **Web and mobile** — Full support on both web and the mobile app.
- **Shared face recognition** — People detected across the space are browsable by all members.
- **Activity log** — A feed of all actions taken in the space (photos added/removed, members joining/leaving, settings changes).
- **New since last visit** — See what changed since you last opened a space, with badges and timeline dividers.
- **Map view** — Browse geotagged photos from a space on an interactive map.
- **Search within a space** — Smart search scoped to a single space's assets.

## Roles and Permissions

| Permission                  | Owner | Editor | Viewer |
| --------------------------- | ----- | ------ | ------ |
| View assets in space        | Yes   | Yes    | Yes    |
| Download assets             | Yes   | Yes    | Yes    |
| Add own assets to space     | Yes   | Yes    | No     |
| Remove assets from space    | Yes   | Yes    | No     |
| Set cover photo             | Yes   | Yes    | No     |
| Invite/remove members       | Yes   | No     | No     |
| Change member roles         | Yes   | No     | No     |
| Toggle face recognition     | Yes   | No     | No     |
| Change space color          | Yes   | No     | No     |
| Delete the space            | Yes   | No     | No     |
| Leave the space             | No    | Yes    | Yes    |
| Search within space         | Yes   | Yes    | Yes    |
| View activity log           | Yes   | Yes    | Yes    |
| View space on map           | Yes   | Yes    | Yes    |
| Manage people (name, merge) | Yes   | Yes    | No     |
| Toggle timeline integration | Yes   | Yes    | Yes    |

## Creating a Space

### Web

1. Click **Spaces** in the left sidebar.
2. Click the **Create Space** button.
3. Enter a name and optional description.
4. Optionally choose a color for the space (used for card gradients and visual identity).
5. You are automatically added as the Owner.

### Mobile

1. Tap the **Spaces** tab in the bottom navigation bar.
2. Tap the **+** button.
3. Enter a name and tap Create.

## Getting Started Banner

When you create a new space, a 3-step onboarding checklist appears at the top of the space page (visible to the Owner only):

1. **Add Photos** — Add your first photos to the space.
2. **Invite Members** — Add at least one other user.
3. **Set Cover** — Choose a cover photo for the space.

The banner shows a progress bar and disappears once all three steps are complete. It can be collapsed if you want to dismiss it early.

## Adding Members

From the space detail page, the Owner can invite other users:

### Web

1. Open the space.
2. Click the **Members** icon in the toolbar.
3. Click **Add Member** and select users from the list.
4. Choose a role: **Editor** (can add/remove photos) or **Viewer** (can only browse).

### Mobile

1. Open the space.
2. Tap the **people icon** in the toolbar.
3. Tap the **+** icon to add members.
4. Select users from the list and tap **Add**.

## Adding Photos to a Space

Editors and Owners can add photos from their personal library into a shared space:

### Web

1. Open the space.
2. Click the **Add photos** button in the toolbar.
3. Your personal timeline appears — select the photos you want to add.
4. Click **Add** to link them into the space.

### Mobile

1. Open the space.
2. Tap the **camera+** icon in the toolbar.
3. Select photos from your library.
4. The selected photos are added to the space.

Photos are linked by reference — they remain in your personal library and appear in the space for all members. Removing a photo from a space does not delete it from your library.

## Removing Photos from a Space

### Web

1. Open the space.
2. Select the photos you want to remove (click to select, shift-click for range).
3. Click the **Remove from space** button in the action bar.
4. Confirm the removal.

### Mobile

1. Open the space.
2. Long-press to select photos.
3. Tap **Remove from Space** in the bottom sheet.

## Timeline Integration

Each member can choose whether a space's photos appear in their personal timeline. Tap or click the **eye icon** in the space header to toggle between **Show on timeline** and **Hide from timeline**.

When enabled, photos from that space are merged into your main Photos timeline alongside your own assets. This is per-member — each user controls their own setting independently.

> Timeline integration cannot be combined with archive, favorites, or trash filters.

## Space Covers

Spaces display as album-style cards with cover photos, collage thumbnails, member avatars, and asset/member counts.

### Setting a Cover Photo

Owners and Editors can set a cover photo:

1. Open the space.
2. Select a single photo.
3. Choose **Set as space cover** from the action menu.

Alternatively, click **Set cover photo** in the hero banner at the top of the space detail page.

### Repositioning the Cover

After setting a cover photo, you can adjust its vertical position within the hero banner:

1. Click **Reposition** on the hero banner.
2. Drag the image up or down to frame it how you like.
3. Click **Save** to keep the position, or **Cancel** to discard.

The cover automatically enters reposition mode after selecting a new cover photo. Position is stored as a percentage (CSS-only — no server-side image processing) and resets when the cover photo changes.

### Collage Cards

On the spaces list page, each space card shows a collage of up to 4 recent photos. The layout adapts based on how many photos the space contains:

- **No photos** — color gradient placeholder
- **1 photo** — single full-bleed thumbnail
- **2–3 photos** — asymmetric layout (3:2 split)
- **4+ photos** — 2×2 grid

## Browsing Spaces

### List and Grid Views

The spaces list page supports two view modes, toggled via icons in the toolbar:

- **Grid view** (default) — album-style collage cards
- **List view** — compact table with columns for name, role, photo count, member count, and last activity

### Sorting

Sort spaces by name, last activity, date created, or asset count. Click the same sort option again to reverse the order.

### Pinning Spaces

Pin frequently used spaces to the top of the list by right-clicking (web) and selecting **Pin to top**. Pinned spaces appear in a separate section above unpinned ones in both grid and list views. Pins are stored locally in the browser — they do not sync between devices.

## Activity Log

Every space has an activity log that tracks actions taken by members. Open it by clicking the **panel icon** in the space toolbar to reveal the side panel, then select the **Activity** tab.

### Tracked Events

The activity log records the following events:

- **Photos added** — Who added photos, how many, with thumbnail previews of the first few.
- **Photos removed** — Who removed photos and how many.
- **Member joined** — Who joined the space, their role, and who invited them.
- **Member left** — Who left the space voluntarily.
- **Member removed** — Who was removed by the Owner.
- **Role changed** — Whose role changed and from what to what (e.g., Viewer to Editor).
- **Cover photo changed** — Who set a new cover photo.
- **Space renamed** — The old and new name.
- **Color changed** — When the space color was updated.

Events are grouped by day (Today, Yesterday, or the date) and displayed with different visual styles based on importance — photo additions and removals show thumbnail strips, member events show avatar rows, and settings changes appear as compact single-line entries.

The log is paginated and loads 50 events at a time with a **Load more** button for older activity.

### Member Contributions

The **Members** tab in the side panel shows each member's contribution stats: how many photos they've added, when they were last active, and a thumbnail of their most recent contribution.

## New Since Last Visit

Spaces track when each member last viewed them. When other members add photos while you're away, you'll see:

- **On the spaces list** — A colored badge showing the number of new photos and the name of the last contributor (e.g., "5 new" with a pulsing dot indicator).
- **Inside the space** — A sticky colored divider in the timeline marking where new photos begin, showing the count and date (e.g., "12 new · since Mar 15").

This tracking is per-member — your "last viewed" timestamp updates each time you open the space.

## Search

When a space has photos, a search bar appears at the top of the space detail page. Searches use smart/semantic search scoped to only that space's assets, so results are limited to photos within the space.

## Map View

View geotagged photos from a space on an interactive map. Click the **map icon** in the space toolbar to open the map filtered to that space's assets. A **Back to space** link lets you return to the space detail page.

## Shared Face Recognition

When enabled, face recognition runs across all photos in the space. Detected people are browsable by all space members in the People section of the space, making it easy to find photos of specific people across everyone's contributions.

The Owner can toggle face recognition on or off from the space detail page header. When disabled, existing face data is preserved but hidden.

### People Page

Click the people count in the space hero banner to open the full People page, which shows a grid of all recognized people in the space. From here:

- **Editors** can rename a person by clicking their name.
- **Editors** can merge duplicate people via the hover context menu.
- Clicking a person opens their detail page with all their photos from the space.

### Face Matching

When face recognition is enabled and new photos are added, a background job automatically matches detected faces against existing people in the space. If no match is found, a new person entry is created. When face recognition is first enabled on a space that already has photos, all existing photos are processed.

## Space Colors

Each space can have an assigned color, chosen during creation or changed later by the Owner. Colors are used for:

- Gradient backgrounds on space cards (when no cover photo or collage is available)
- Hero banner gradients on the space detail page

Ten colors are available, matching the user avatar color palette.

## Differences from Partner Sharing

| Feature          | Partner Sharing    | Shared Spaces              |
| ---------------- | ------------------ | -------------------------- |
| What is shared   | Entire library     | Specific photos you choose |
| Direction        | One-way            | Multi-directional          |
| Access control   | All-or-nothing     | Owner/Editor/Viewer roles  |
| Multiple groups  | No                 | Yes — unlimited spaces     |
| Storage cost     | None (same assets) | None (reference-based)     |
| Face recognition | Separate           | Shared across space        |
| Timeline merging | Partner toggle     | Per-space toggle           |

## API

Shared Spaces are accessible via the REST API under the `/shared-spaces` endpoint group. There are 24 endpoints covering space CRUD, member management, asset management, activity log, map markers, and space-scoped face recognition (people CRUD, merge, aliases, thumbnails).

## Technical Implementation

### Database Schema

Shared Spaces introduces 7 new tables in PostgreSQL:

```
┌──────────────────────┐       ┌──────────────────────────┐
│    shared_space       │       │         user             │
├──────────────────────┤       └──────────┬───────────────┘
│ id (UUID PK)         │                  │
│ name (text)          │                  │
│ description (text?)  │◄─── createdById ─┘
│ color (varchar?)     │
│ faceRecognitionEnabled│
│ thumbnailAssetId ────┼──────► asset
│ thumbnailCropY (int?)│
│ lastActivityAt       │
│ createdAt, updatedAt │
└──────────┬───────────┘
           │
     ┌─────┴──────┬──────────────┬───────────────────┐
     ▼            ▼              ▼                   ▼
┌──────────┐ ┌──────────┐ ┌───────────────┐ ┌────────────────────┐
│  member  │ │  asset   │ │   activity    │ │      person        │
├──────────┤ ├──────────┤ ├───────────────┤ ├────────────────────┤
│ spaceId  │ │ spaceId  │ │ id (UUID PK)  │ │ id (UUID PK)       │
│ userId   │ │ assetId  │ │ spaceId       │ │ spaceId            │
│ role     │ │ addedById│ │ userId        │ │ name               │
│ joinedAt │ │ addedAt  │ │ type (varchar)│ │ thumbnailPath      │
│showIn    │ └──────────┘ │ data (jsonb)  │ │ representativeFace │
│ Timeline │              │ createdAt     │ │ isHidden, birthDate│
│lastViewed│              └───────────────┘ │ createdAt,updatedAt│
│ At       │                                └─────────┬──────────┘
└──────────┘                                    ┌─────┴─────┐
                                                ▼           ▼
                                        ┌────────────┐ ┌──────────┐
                                        │person_face │ │person_   │
                                        ├────────────┤ │alias     │
                                        │ personId   │ ├──────────┤
                                        │ assetFaceId│ │ personId │
                                        └────────────┘ │ userId   │
                                                       │ alias    │
                                                       └──────────┘
```

All tables prefixed `shared_space_` in the actual schema. Composite primary keys are used for member (spaceId, userId), asset (spaceId, assetId), person_face (personId, assetFaceId), and alias (personId, userId).

### Architecture

The feature follows the standard NestJS layered architecture:

- **Controller** (`shared-space.controller.ts`) — 24 REST endpoints under `/shared-spaces`, with role-based permission checks.
- **Service** (`shared-space.service.ts`) — Business logic including role validation (Owner > Editor > Viewer hierarchy), activity logging, and background job orchestration.
- **Repository** (`shared-space.repository.ts`) — Kysely-based data access with 70+ methods covering all 7 tables.

### Key Mechanisms

**Reference-based sharing** — The `shared_space_asset` table is a pure junction table linking spaces to existing assets. No file duplication occurs; the same asset row is referenced by the space and the owner's library.

**Timeline integration** — Each membership row has a `showInTimeline` boolean. When fetching a user's timeline, the server queries `getSpaceIdsForTimeline(userId)` and includes assets from those spaces in the timeline result set alongside the user's own assets.

**Activity log** — Every mutation (add/remove assets, member changes, metadata updates) inserts a row into `shared_space_activity` with a `type` enum and a `data` JSONB column for event-specific metadata (e.g., asset IDs, old/new values, who invited whom). The feed is paginated with a default page size of 50.

**New since last visit** — The `lastViewedAt` timestamp on each membership is updated via `PATCH /shared-spaces/:id/view` when a user opens a space. The `newAssetCount` and `lastContributor` fields in the response DTO are computed by querying assets added after this timestamp.

**Face recognition (space-scoped)** — Space-scoped people are separate from personal people. When face recognition is enabled and assets are added, the service queues `SharedSpaceFaceMatch` jobs. Each job fetches face embeddings from the asset and runs a vectorchord similarity search (`<=>` operator) against existing space people. Matches within the configured distance threshold are linked; unmatched faces create new person entries. Person aliases allow each member to set their own display names for recognized people.
