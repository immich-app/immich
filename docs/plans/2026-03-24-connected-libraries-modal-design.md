# Connected Libraries UI Improvement

## Problem

The "connected libraries" feature in shared spaces is hard to discover — it's buried as the 3rd tab in the members panel (Activity | Members | Libraries), admin-only.

## Solution

1. Remove the Libraries tab from `space-panel.svelte` (members panel goes back to Activity | Members)
2. Add a "Link Libraries" menu item in the existing dropdown menu, next to "Add All Photos"
3. Clicking "Link Libraries" opens a modal dialog containing the library linking UI

## Changes

### 1. Dropdown Menu Restructure (`+page.svelte`)

New menu structure:

```
Show/Hide Timeline (all members)
--- divider ---
Add All Photos (editors+)
Link Libraries (admin only, mdiBookshelf icon)
--- divider ---
People toggle (owners)
Pets toggle (owners)
--- divider ---
Delete (owners)
```

No section label — the two items are grouped between existing dividers.

### 2. New Modal (`SpaceLinkedLibrariesModal.svelte`)

Create `web/src/lib/modals/SpaceLinkedLibrariesModal.svelte` using `Modal` + `ModalBody` from `@immich/ui` (not `FormModal`, which requires `onSubmit`).

- Contains the existing `SpaceLinkedLibraries` component
- Modal keeps local `spaceData = $state(space)` and re-fetches via `getSpace` on each link/unlink so the list updates live
- `onChanged` callback calls both `refreshSpace()` and `loadActivities()` to keep the activity feed in sync

### 3. Remove Libraries Tab from `space-panel.svelte`

- Remove the Libraries tab button from the tab switcher
- Remove the `{:else if activeTab === 'libraries'}` content block
- Remove the `SpaceLinkedLibraries` import
- Remove the `onLibrariesChanged` prop
- Change `activeTab` type from `'activity' | 'members' | 'libraries'` to `'activity' | 'members'`

### 4. Update `+page.svelte`

- Add `handleLinkLibraries()` that opens the modal via `modalManager.show()`
- Add the menu item with `mdiBookshelf` icon, gated on `isAdmin`
- Remove `onLibrariesChanged` prop from `SpacePanel` usage

## Files Touched

- `web/src/lib/modals/SpaceLinkedLibrariesModal.svelte` — **new** (~30 lines)
- `web/src/lib/components/spaces/space-panel.svelte` — remove libraries tab
- `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte` — add menu item + modal handler

## Not Changing

- `space-linked-libraries.svelte` — reused as-is
- No server/API changes
- No new icons (reuse `mdiBookshelf`)

## Edge Cases

- `getAllLibraries()` API is admin-only — menu item must remain gated on `isAdmin`
- Modal re-fetches space data after each link/unlink to keep the list reactive (modalManager passes static props)
- No E2E tests reference `tab-libraries` testid, so removal is safe
