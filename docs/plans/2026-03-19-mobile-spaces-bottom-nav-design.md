# Mobile: Promote Spaces to Bottom Navigation Bar

## Summary

Move Spaces from being a hidden list item inside the Library tab to a first-class tab in the bottom navigation bar, replacing the Albums tab. Albums moves into Library (as a collection card + quick access list item where Spaces used to be).

## Navigation Changes

### Bottom bar: 4 tabs (same count, different content)

| Index | Before          | After           |
| ----- | --------------- | --------------- |
| 0     | Photos/Timeline | Photos/Timeline |
| 1     | Search          | Search          |
| 2     | Albums          | **Spaces**      |
| 3     | Library         | Library         |

### Library page changes

- **Add** Albums as a collection card (same visual treatment as People/Places/Local Albums)
- **Add** Albums as a list item in quick access section (where Spaces currently sits)
- **Remove** Spaces list item from quick access

### Files affected (both tab systems)

- `tab_controller.page.dart` — Replace AlbumsRoute with SpacesRoute at index 2
- `tab_shell.page.dart` — Replace DriftAlbumsRoute with SpacesRoute at index 2
- `library.page.dart` — Add Albums card + list item, remove Spaces list item
- `drift_library.page.dart` — Add Albums card + list item, remove Spaces list item
- `router.dart` — Move SpacesRoute into tab children, adjust route nesting
- `constants.dart` — Rename `kAlbumTabIndex` to `kSpacesTabIndex`
- `tab.provider.dart` — Rename `TabEnum.albums` to `TabEnum.spaces`

## Space Card Redesign

Replace the plain `ListView` of `ListTile`s in `spaces.page.dart` with rich visual cards matching the web implementation.

### Card layout

```
┌─────────────────────────┐
│  ┌───────┬──────┐       │
│  │       │ img2 │  🔴   │  collage area
│  │ img1  ├──────┤       │  activity dot (top-right)
│  │       │ img3 │ 👤👤  │  member avatars (bottom-right)
│  └───────┴──────┘       │
│  Space Name             │
│  "Pierre added 3 new"   │  activity line (accent color)
│  12 photos · 4 members  │
└─────────────────────────┘
```

### Collage thumbnail (4 layouts based on asset count)

1. **0 assets** — Color-coded gradient background with placeholder icon
2. **1 asset** — Single image, full width, square aspect ratio
3. **2-3 assets** — Asymmetric grid (large left, stacked right)
4. **4+ assets** — 2x2 grid of thumbnails

Uses `recentAssetIds` from the DTO with `RemoteImageProvider.thumbnail` for loading. Falls back to `recentAssetThumbhashes` for blur placeholders.

### Color system (10 space colors)

Maps `SharedSpaceResponseDtoColorEnum` to gradient pairs:

- primary, pink, red, yellow, blue, green, purple, orange, gray, amber

### Activity indicators

- **Pulsing dot** (top-right of collage) when `newAssetCount > 0`
- **Activity text** below space name: "{lastContributor.name} added {N} new" in primary accent color
- Count capped at "99+"

### Member avatars

- Overlapping `UserCircleAvatar` stack (bottom-right of collage)
- Max 4 visible, "+N" overflow badge
- Uses existing `UserCircleAvatar` widget

### Page layout

- 2-column grid (matching albums page pattern)
- Pull-to-refresh
- FAB for creating new spaces
- Empty state with illustration + create button
- No AppBar (tab provides its own via `ImmichAppBar` / `ImmichSliverAppBar`)

## Out of scope

- Pin/unpin spaces (mobile-only, not needed yet)
- List/table view toggle (card view only)
- Sort options (default ordering from API)
- Hover states (not applicable on mobile)
