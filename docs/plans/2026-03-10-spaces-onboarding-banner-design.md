# Persistent Onboarding Banner — Design

## Problem

The current empty state onboarding in shared spaces shows a 3-step checklist (add photos, invite members, set cover) only when the space has zero assets. Once the user completes step 1 (add photos), the empty state disappears and the remaining steps are lost. Users must discover the invite and cover features on their own.

## Solution

Replace the empty state checklist with a persistent progress banner that stays visible until all 3 setup steps are complete. The banner sits between the hero section and the timeline grid on the space detail page.

## Rules

- **Owners only** — editors and viewers never see the banner
- **Shows every visit** until all 3 steps are done
- **No dismiss button** — auto-hides when all steps complete
- **No server state** — completion derived from existing `SharedSpaceResponseDto` fields

## Completion Detection

| Step           | Field              | Complete when |
| -------------- | ------------------ | ------------- |
| Add photos     | `assetCount`       | `> 0`         |
| Invite members | `memberCount`      | `> 1`         |
| Set a cover    | `thumbnailAssetId` | `!== null`    |

## Visual Design

### Expanded State (default)

Card with rounded corners and subtle border, positioned below the hero. Components:

- **Progress bar**: Thin bar at top of the card, colored with the space's gradient, fills proportionally (0%/33%/66%/100%)
- **Steps row**: Three steps in a horizontal row (stacks vertical on mobile)
  - Each step: circular icon (numbered or checkmark), label, one-line description, action button for incomplete steps
  - Completed steps: filled circle with checkmark in space color, muted text treatment
  - Incomplete steps: outlined circle with number
- **Collapse chevron**: Toggles between expanded and collapsed states

### Collapsed State

User clicks chevron to collapse. Shows:

- Progress bar (same as expanded)
- Text: "2 of 3 setup steps done"
- Chevron to re-expand

Collapse preference is ephemeral — resets on page reload (always starts expanded).

### Completion Animation

When the third step completes, the final step circle animates from number to checkmark with a scale+fade effect, then the entire banner smoothly collapses out of the page with a height transition.

### Dark Mode

- Card background uses `@immich/ui` surface colors
- Progress bar uses space color gradients from P0
- Circles and text adapt to dark theme

### Mobile

- Steps stack vertically
- Full-width card with standard padding
- Same collapse/expand behavior

## Behavior Change: Remove Auto-Assign Thumbnail

Currently `addAssets()` auto-sets `thumbnailAssetId` to the first photo added. This would cause steps 1 and 3 to complete simultaneously, making the checklist feel broken.

**Change**: Remove auto-assign from `addAssets()`. Covers must be explicitly set via the "Set as space cover" asset menu action. The hero section already falls back to `getMostRecentAssetId` for display, so the visual experience is unchanged — the space detail page still shows a photo in the hero without an explicit cover.

## Empty State Replacement

- The current `space-empty-state.svelte` component is replaced by this banner
- When the space is empty AND the owner is viewing, they see the banner (0/3 steps done) plus an empty timeline below
- The banner's "Add photos" action button triggers the same add-photos flow
- Viewers in an empty space still see a passive "No photos yet" inline message (not the banner)
