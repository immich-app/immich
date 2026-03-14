# Shared Spaces

Shared Spaces are virtual libraries where multiple users can contribute, browse, and view photos together. Unlike [Partner Sharing](partner-sharing.md), which shares your entire library one-way, Shared Spaces let you create focused collaborative areas with fine-grained role-based access.

## Key Features

- **Reference-based sharing** — Photos are linked into a space, not duplicated. Zero additional storage cost.
- **Role-based access** — Three roles: Owner, Editor, and Viewer with different permissions.
- **Multiple spaces** — Create as many spaces as you need (e.g., "Family", "Friends", "Vacation 2025").
- **Works alongside existing sharing** — Partner sharing, album sharing, and shared links continue to work as before.
- **Web and mobile** — Full support on both web and the mobile app.
- **Shared face recognition** — People detected across the space are browsable by all members.

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
| Toggle timeline integration | Yes   | Yes    | Yes    |

## Creating a Space

### Web

1. Click **Spaces** in the left sidebar.
2. Click the **Create Space** button.
3. Enter a name and optional description.
4. Optionally choose a color for the space (used for card gradients and visual identity).
5. You are automatically added as the Owner.

### Mobile

1. Go to the **Library** tab.
2. Tap **Spaces**.
3. Tap the **+** button.
4. Enter a name and tap Create.

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

## Shared Face Recognition

When enabled, face recognition runs across all photos in the space. Detected people are browsable by all space members in the People section of the space, making it easy to find photos of specific people across everyone's contributions.

The Owner can toggle face recognition on or off from the space detail page header. When disabled, existing face data is preserved but hidden.

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

Shared Spaces are accessible via the REST API under the `/shared-spaces` endpoint group.
