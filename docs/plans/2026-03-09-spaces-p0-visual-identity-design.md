# Spaces P0: Visual Identity & Information Hierarchy

## Overview

Three quick-win improvements to make Shared Spaces visually distinct from Albums and improve information hierarchy: space colors with gradient placeholders, stat chips, and role badges.

## 1. Space Color System

### Schema

Add a `color` column to the `shared_spaces` table using the existing `UserAvatarColor` enum values: primary, pink, red, yellow, blue, green, purple, orange, gray, amber. Nullable, defaults to `primary`.

### DTOs

- `SharedSpaceCreateDto` — add optional `color: UserAvatarColor`
- `SharedSpaceUpdateDto` — add optional `color: UserAvatarColor`
- `SharedSpaceResponseDto` — add `color: UserAvatarColor`

### Create modal

Add a horizontal row of 10 color swatches below the description field in `SpaceCreateModal.svelte`. Each swatch is a small filled circle (~24px). Clicking selects it (checkmark overlay or ring). Defaults to `primary` pre-selected.

### Gradient placeholder

When a space has no cover photo (`thumbnailAssetId` is null), render a two-tone gradient using the space's color as the base instead of the current gray box with icon. For example, `blue` produces a gradient from `blue-400` to `blue-700`. Applied in `space-card.svelte` replacing the existing empty state `<div>`.

## 2. Stat Chips

### Location

Space detail page (`[spaceId]/+page.svelte`), replacing the current plain text stats line.

### Rendering

A horizontal `flex gap-2` row of pill-shaped badges. Each chip:

- Small MDI icon (16px) on the left
- Text label on the right
- `rounded-full` shape, `bg-gray-100 dark:bg-gray-800`, `text-sm`, `px-3 py-1`

### Chips

- Camera icon (`mdiCameraOutline`) + `"{count} photos"`
- People icon (`mdiAccountMultipleOutline`) + `"{count} members"`

Display only — no click handlers.

## 3. Role Badges

### Members modal

Replace the plain capitalized role text and disabled owner dropdown in `SpaceMembersModal.svelte` with colored pill badges:

- **Owner** — filled with space's color, white text
- **Editor** — outlined with space's color, colored text
- **Viewer** — `bg-gray-200 dark:bg-gray-700`, muted text

The role change dropdown for non-owner members (when viewed by an owner) stays as-is. Only the display of the viewer's own role and the owner's row change to pills.

### Detail page header

Add a small role badge below the stat chips row in `[spaceId]/+page.svelte`, showing "Owner", "Editor", or "Viewer" with the same pill styling. Uses the existing `currentMember.role` derived value.

## Files Touched

| Change                       | Files                                                     |
| ---------------------------- | --------------------------------------------------------- |
| Add `color` column           | `server/src/schema/tables/`, new migration                |
| Update DTOs                  | `server/src/dtos/shared-space.dto.ts`                     |
| Regenerate clients           | `make open-api`                                           |
| Color picker in create modal | `web/src/lib/modals/SpaceCreateModal.svelte`              |
| Gradient placeholder         | `web/src/lib/components/spaces/space-card.svelte`         |
| Stat chips                   | `web/src/routes/(user)/spaces/[spaceId]/.../+page.svelte` |
| Role badges in modal         | `web/src/lib/modals/SpaceMembersModal.svelte`             |
| Role badge in header         | `web/src/routes/(user)/spaces/[spaceId]/.../+page.svelte` |

## Out of Scope

- Click handlers on stat chips
- Activity feeds, collage thumbnails, member contribution cards
- Space emoji/icon picker
- Slide-out members panel
