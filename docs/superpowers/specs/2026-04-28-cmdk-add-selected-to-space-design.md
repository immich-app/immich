# Design: cmdk Add Selected To Space

## Context

cmdk v1.5A added selection commands for the current asset selection, including
"Add selected to album..." and a page-local "Add selected to this space" command
when the user is already inside a writable space's add-photos mode.

That still leaves the main timeline without a direct command for adding selected
photos to a shared space. Users currently have to navigate into a space, enter
that space's add-photos mode, and select assets there.

## Goal

Add a command-palette command:

| Command id                   | Label                      | Scope                                       | Behavior                                                                                               |
| ---------------------------- | -------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `cmd:selection_add_to_space` | `Add selected to space...` | Selected assets on supported timeline pages | Open a modal space picker, choose a writable target space, then add the selected assets to that space. |

This command is a target-space picker. It is separate from
`cmd:selection_add_to_current_space`, which only adds to the current space from
that space page's existing add-photos mode.

## Non-Goals

- Do not build an in-palette secondary picker yet. Reuse the existing modal
  pattern used by `Add selected to album...`.
- Do not allow viewer/reader spaces as targets.
- Do not change backend authorization. The server remains the source of truth
  for write permission and asset-read permission.
- Do not add multi-target spaces in this slice. Choose one target space per run.

## Permission Model

The picker must list only spaces where the current user can write:

- `SharedSpaceRole.Owner`
- `SharedSpaceRole.Editor`
- The current user is `space.createdById`, as a defensive owner fallback if a
  list response omits the current user's member row.

Spaces where the current user is `SharedSpaceRole.Viewer` must not be shown.

The command itself may be visible when selected assets exist on a supported page,
because writable spaces are fetched only after the modal opens. If the user has
no writable spaces, the modal shows an empty state and performs no add.

## UI Design

Follow the `AssetAddToAlbumModal` shape:

1. `cmd:selection_add_to_space` calls a selection-command handler.
2. The handler opens `AssetAddToSpaceModal` with the selected asset ids.
3. `AssetAddToSpaceModal` opens `SpacePickerModal`.
4. `SpacePickerModal` fetches spaces, filters to writable spaces, supports
   search, and returns the selected `SharedSpaceResponseDto`.
5. `AssetAddToSpaceModal` calls a shared add-to-space service with the chosen
   space id and selected asset ids.

The modal should be simple and utilitarian:

- Search input at the top.
- Writable spaces as single-select rows.
- Owner/editor role visible on each row.
- Empty state when no writable spaces match.
- Enter/arrow keyboard support matching the album picker's expected behavior.

## Service Design

Create a small `addAssetsToSpace(spaceId, assetIds, { notify })` helper:

- Calls `addAssets({ id: spaceId, sharedSpaceAssetAddDto: { assetIds } })`.
- Emits `SpaceAddAssets` on success so open space pages and recent-space caches
  refresh consistently.
- Shows a success toast when `notify` is true.
- Handles failures with `errors.error_adding_assets_to_space`.
- Returns `true` on success and `false` on failure.

## Page Wiring

Add a `canAddToSpace` capability to `SelectionCommandContext`.

Initial supported page:

- Main photos timeline: `canAddToSpace: () => true`.

Do not infer target-space permissions in page wiring. The picker owns the
writable-space filter because it has the fetched target-space list.

## Test Plan

Use TDD with focused behavior tests first, then broader regression checks.

Required tests:

- `selection-command-handlers.spec.ts`
  - `canAddSelectedToSpace` is true only when selection exists and
    `selection.canAddToSpace` is true.
  - Handler opens `AssetAddToSpaceModal` with selected asset ids.
  - Handler no-ops when `canAddToSpace` is false.
- `command-items.spec.ts`
  - Registers `cmd:selection_add_to_space`.
  - Command delegates to `handleAddSelectedToSpace`.
  - Command is non-destructive.
  - Command availability follows `selection.canAddToSpace`.
- `command-context-manager.spec.ts`
  - `canAddToSpace` resolves through the live registered getter.
- `photos-page.spec.ts`
  - Main photos page registers `canAddToSpace: () => true`.
- `SpacePickerModal.spec.ts`
  - Shows owner/editor writable spaces.
  - Hides viewer spaces.
  - Search filters writable spaces.
  - Empty state appears when no writable spaces match.
  - Selecting a row returns that space via `onClose`.
- `space.service.spec.ts`
  - Success calls SDK, emits `SpaceAddAssets`, and toasts when requested.
  - Failure calls `handleError`, returns `false`, and does not emit.
- `AssetAddToSpaceModal.spec.ts`
  - Closing without a selected space closes without API work.
  - Selecting a space calls the service with the selected asset ids and closes on
    success.
  - Failed add keeps the modal open.

Manual testing:

1. On the main timeline, select photos, open cmdk, search
   `Add selected to space...`, choose an owner/editor space, and verify the
   assets appear in that space.
2. Confirm viewer-only spaces do not appear in the picker.
3. Confirm a user with no writable spaces sees the empty state.
4. Confirm the existing in-space `Add photos to this space` and
   `Add selected to this space` commands still behave as before.
