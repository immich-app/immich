# Spaces List/Grid View Toggle & Pinned Spaces — Design

## Overview

Two UX improvements for the spaces list page: a list/grid view toggle (matching the album page pattern) and client-side pinned spaces.

**Methodology:** TDD — write tests first, then implement to pass them.

## Feature 1: List/Grid View Toggle

### Store Changes

Add `viewMode: 'card' | 'list'` to `SpaceViewSettings` in `space-view.store.ts`, defaulting to `'card'`. Persisted via existing `persisted` store.

### Controls

Add a toggle button in `spaces-controls.svelte` (right side, next to sort dropdown). Uses the album page pattern:

- In card mode: shows list icon (`mdiFormatListBulletedSquare`) to switch to list
- In list mode: shows grid icon (`mdiViewGridOutline`) to switch to cards

### Card Mode Changes

Increase grid size from `grid-auto-fill-56` (14rem) to `grid-auto-fill-72` (18rem). Space cards carry more information than album cards (activity badges, member avatars, stats, activity text) and need more room. At 288px minimum, collage photos are recognizable and text doesn't need aggressive clamping. Yields 3–4 cards per row on a 1440px screen.

### List Mode — `spaces-table.svelte`

New component rendering a `<table>` with 6 columns:

| Name            | Role   | Photos | Members | New    | Last Activity |
| --------------- | ------ | ------ | ------- | ------ | ------------- |
| Family Vacation | Owner  | 342    | 5       | 12 new | 2h ago        |
| NYC Trip        | Editor | 89     | 3       | —      | 5d ago        |

**Row anatomy:**

```
┌─color-bar─┬──────────────────────┬────────┬────────┬─────────┬──────────┬──────────────┐
│ ███       │ [collage] Name       │ Owner  │   342  │    5    │  12 new  │    2h ago    │
│ ███       │ 32x32     Family...  │ badge  │        │         │  pill    │              │
└───────────┴──────────────────────┴────────┴────────┴─────────┴──────────┴──────────────┘
```

Column details:

- **Color bar**: 3px vertical left-edge bar using the space's gradient color. Carries space color identity from cards into list mode.
- **Name**: 32x32 rounded-lg `SpaceCollage` thumbnail + clickable link to space detail.
- **Role**: Reuses existing `role-badge.svelte`.
- **Photos / Members**: Plain numbers, right-aligned.
- **New**: Pill badge using the space's own color when `newAssetCount > 0`, em-dash `—` in muted text otherwise.
- **Last Activity**: Relative time via `formatTimeAgo`.

Rows are fully clickable (navigate to space). Hover state: `hover:bg-gray-100 dark:hover:bg-gray-900` with color bar intensification.

Column headers are clickable to change sort — updates `spaceViewSettings.sortBy` directly. Active sort column shows arrow indicator. Sort dropdown in controls toolbar remains visible in both modes.

### Page Integration

`+page.svelte` conditionally renders either the card grid or `SpacesTable` based on `viewMode`.

## Feature 2: Pinned Spaces

### Store

New persisted store in `space-view.store.ts`:

```ts
export const pinnedSpaceIds = persisted<string[]>('pinned-space-ids', []);
```

Client-only (localStorage). No server changes — pinning is a personal UI preference like sort order.

### Pin/Unpin Interaction

Two access methods:

1. **Three-dot menu on hover** — top-right of card (or row), shows on hover. Options: "Pin to top" / "Unpin".
2. **Right-click context menu** — on cards and list rows with the same options.

Three-dot pattern matches people page hover menus. Right-click pattern matches album context menus.

### Visual Treatment — Card Mode

- **"Pinned" section label** above pinned cards: small muted text + `mdiPinOutline` icon, left-aligned.
- Pinned cards in the same `grid-auto-fill-72` grid.
- **Pin icon overlay**: top-left corner of collage, semi-transparent white bg pill.
- **Thin separator** (`border-b`) between pinned and unpinned sections.
- Unpinned section has no label.

### Visual Treatment — List Mode

- Same "Pinned" section label above pinned rows.
- Pin icon in the name cell (small, before the color bar).
- Same thin separator line.
- Unpinned rows below, sorted normally.

### Sort Behavior

Pinned spaces respect the active sort among themselves. Unpinned spaces sort separately. Pinned always appear above unpinned regardless of sort order.

### Edge Cases

- Pinned space deleted or user removed → stale ID silently ignored (filtered out during render).
- All spaces pinned → no separator, no "Pinned" label.
- Zero spaces → empty state unchanged, pinning UI doesn't appear.

## Files Affected

**Modified:**

- `web/src/lib/stores/space-view.store.ts` — add `viewMode`, `pinnedSpaceIds`
- `web/src/lib/components/spaces/spaces-controls.svelte` — add view toggle button
- `web/src/routes/(user)/spaces/+page.svelte` — conditional rendering, pinned section, larger grid, context menus

**New:**

- `web/src/lib/components/spaces/spaces-table.svelte` — list view table component
