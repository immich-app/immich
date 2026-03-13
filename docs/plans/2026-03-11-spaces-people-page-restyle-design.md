# Spaces People Page Restyle — Design

**Goal:** Make the spaces people page visually identical to the main people page (`/people`) so users get a consistent experience. Keep the page simple (no pagination, search, or infinite scroll) since space people lists are small.

## Current State

The spaces people page uses a custom `SpacePersonCard` component with rectangular thumbnails, name/count text below, and inline alias editing overlaid on the grid. It looks completely different from the main people page, which uses circular thumbnails, hover context menus, and inline name inputs.

## Design

### Card Layout (match main people page exactly)

Each person card replicates the main page's pattern:

- **Wrapper:** `rounded-xl` container with `hover:bg-gray-200`, `hover:border-immich-primary/50`, `hover:shadow-sm` (and dark mode equivalents)
- **Circular thumbnail:** `ImageThumbnail` with `circle` + `shadow` props, brightness filter, linking to person detail page
- **Inline name input below:** Centered text input (`rounded-2xl`, `text-center`, placeholder "add a name"), same styling as main page. On blur/Enter, calls `updateSpacePerson` API to set the person's `name`.
- **Context menu on hover:** 3-dot button (top-right) with:
  1. **Set alias** — prompts for a per-user alias via a modal dialog. Calls `setSpacePersonAlias` / `deleteSpacePersonAlias`.
  2. **Merge** — navigates to `/spaces/{spaceId}/people/{personId}?action=merge` (existing flow).

### What Gets Removed

- `SpacePersonCard` component (`web/src/lib/components/spaces/space-person-card.svelte`)
- Inline alias editing overlay on the grid (the input + save button that appeared over the card)

### What Stays Unchanged

- No pagination or search (space people lists are small)
- Person detail page (`/spaces/[spaceId]/people/[personId]`) — keep as-is
- Merge flow — keep as-is
- Grid responsive columns — keep current breakpoints

### Context Menu vs Main Page

The main page's context menu has: hide, set DOB, merge, toggle favorite. Space people don't support hide/favorite/DOB, so the space context menu only has: set alias, merge.

### Alias UX

Alias editing moves from an inline grid overlay to the context menu. When "Set alias" is clicked, show a `modalManager.showDialog`-style prompt (or a small dedicated modal) with a text input pre-filled with the current alias. Save calls `setSpacePersonAlias`; clearing the input and saving calls `deleteSpacePersonAlias`.

### Name vs Alias Display

- The inline input below the circle shows and edits `name` (the shared person name)
- If a person has an alias set, it could be shown as smaller text below the name input (similar to how the current card shows original name under alias)

## Files Affected

- **Delete:** `web/src/lib/components/spaces/space-person-card.svelte`
- **Rewrite:** `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`
- **No changes:** `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/+page.svelte`
- **No changes:** `web/src/lib/components/faces-page/people-card.svelte` (not reused directly due to different DTO type, but pattern is copied)
