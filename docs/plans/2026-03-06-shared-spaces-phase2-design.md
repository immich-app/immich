# Shared Spaces Phase 2: Adding Photos to a Space — Design

## Goal

Add asset management UI to Shared Spaces on the web, allowing users to view, add, and remove photos from a shared space.

## Decisions

- **Web only** — Mobile support is a separate phase.
- **Album-style inline mode** for adding assets — a button toggles the user's personal timeline with multi-select. Reuses existing `Timeline`, `AssetInteraction`, and `AssetSelectControlBar` components.
- **Full asset grid replaces current detail page** — Space detail page becomes an asset grid (like album detail), with members accessible via a settings/info panel.
- **Extend timeline infrastructure** for listing space assets — add `spaceId` to the existing timeline endpoint, following the `albumId` pattern. Gives virtual scrolling, date grouping, and lazy loading for free.
- **Minimal bulk actions** — Remove from space (Editor+), Download, Favorite. No advanced actions yet.
- **No asset viewer** — Clicking a thumbnail selects it; no full-screen viewer or deep linking.
- **Update docs** after implementation to reflect the real UI flow.

## Architecture

### Backend

Extend the existing timeline/asset search infrastructure to support a `spaceId` filter. The `TimelineManager` already supports `albumId` — `spaceId` follows the same pattern, providing paginated loading with date grouping and virtual scrolling out of the box.

No new controller needed. The existing timeline endpoint gains a new optional `spaceId` parameter. The `shared_space_asset` join table is used to filter assets belonging to the space.

### Web UI

**Space detail page redesign:**

- Asset grid as the primary content (mirroring album detail page).
- Space name and description as a header above the grid.
- Settings/info icon button opens a panel for member management (reusing existing member list and add-member modal).
- "Add photos" button visible only to Editors and Owners.

**Add assets flow:**

1. User clicks "Add photos" button.
2. Page switches to `SELECT_ASSETS` view mode, showing the user's personal timeline with multi-select enabled.
3. User selects assets via click/shift-click/day-group checkboxes.
4. `AssetSelectControlBar` shows selection count and "Add" button.
5. Clicking "Add" calls the existing `addAssets()` SDK method.
6. Page switches back to space view, grid refreshes to show new assets.

**Bulk actions on space assets:**

- When assets in the space grid are selected, show action bar with:
  - Remove from space (Editor/Owner only)
  - Download
  - Favorite

### Permission enforcement (server-side, already implemented)

| Action             | Viewer | Editor | Owner |
| ------------------ | ------ | ------ | ----- |
| View assets        | Yes    | Yes    | Yes   |
| Add/remove assets  | No     | Yes    | Yes   |
| See add-photos btn | No     | Yes    | Yes   |

## Out of scope

- Mobile app support
- Asset viewer / deep linking (`/spaces/[id]/photos/[assetId]`)
- Advanced bulk actions (archive, change date, add to album, etc.)
- Drag-and-drop
