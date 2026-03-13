# Shared Spaces

Shared Spaces are virtual libraries where multiple users can contribute, browse, and view photos together. Unlike [Partner Sharing](partner-sharing.md), which shares your entire library one-way, Shared Spaces let you create focused collaborative areas with fine-grained role-based access.

## Key Features

- **Reference-based sharing** — Photos are linked into a space, not duplicated. Zero additional storage cost.
- **Role-based access** — Three roles: Owner, Editor, and Viewer with different permissions.
- **Multiple spaces** — Create as many spaces as you need (e.g., "Family", "Friends", "Vacation 2025").
- **Works alongside existing sharing** — Partner sharing, album sharing, and shared links continue to work as before.
- **Web and mobile** — Full support on both web and the mobile app.

## Roles and Permissions

| Permission               | Owner | Editor | Viewer |
| ------------------------ | ----- | ------ | ------ |
| View assets in space     | Yes   | Yes    | Yes    |
| Add own assets to space  | Yes   | Yes    | No     |
| Remove assets from space | Yes   | Yes    | No     |
| Invite/remove members    | Yes   | No     | No     |
| Change member roles      | Yes   | No     | No     |
| Delete the space         | Yes   | No     | No     |
| Leave the space          | No    | Yes    | Yes    |

## Creating a Space

### Web

1. Click **Spaces** in the left sidebar.
2. Click the **Create Space** button.
3. Enter a name and optional description.
4. You are automatically added as the Owner.

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

Spaces display as album-style cards with a cover photo, member avatars, and asset/member counts. The cover photo is automatically set to the first photo added to the space, but Owners and Editors can change it:

1. Open the space.
2. Select a single photo.
3. Choose **Set as space cover** from the action menu.

## Differences from Partner Sharing

| Feature         | Partner Sharing    | Shared Spaces              |
| --------------- | ------------------ | -------------------------- |
| What is shared  | Entire library     | Specific photos you choose |
| Direction       | One-way            | Multi-directional          |
| Access control  | All-or-nothing     | Owner/Editor/Viewer roles  |
| Multiple groups | No                 | Yes — unlimited spaces     |
| Storage cost    | None (same assets) | None (reference-based)     |

## API

Shared Spaces are accessible via the REST API under the `/shared-spaces` endpoint group.
