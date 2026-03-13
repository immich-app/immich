# Shared Spaces P2 — Design Document

## Overview

P2 adds four features that make spaces feel alive and collaborative, building on P0 (visual identity) and P1 (collage cards, hero section, sort controls). The focus shifts from **visual polish** to **social signals and usability**.

| Feature                   | Effort | Impact                  |
| ------------------------- | ------ | ----------------------- |
| Activity recency badge    | Medium | Sense of life on cards  |
| Member contribution cards | Medium | Collaborative feel      |
| Slide-out members panel   | Medium | Better UX pattern       |
| Empty state onboarding    | Low    | Better first experience |

## Development Methodology

**Test-Driven Development (TDD) is mandatory for all implementation work.** Every feature follows the red-green-refactor cycle:

1. **Write failing tests first** — unit tests (Vitest) for server services/repositories and web components
2. **Implement minimum code** to make tests pass
3. **Refactor** while keeping tests green

**Testing requirements:**

- **Server unit tests**: Every new service method, repository query, and DTO field must have corresponding test coverage. Use `newTestService()` factory with auto-mocked dependencies.
- **Web component tests**: Every new Svelte component must have a companion `.spec.ts` file using `@testing-library/svelte` + Vitest. Test all visual states, interactions, and edge cases.
- **Playwright E2E tests**: Every feature must have end-to-end tests in `e2e/src/web/specs/spaces-p2.e2e-spec.ts` covering the full user flow — from navigation through interaction to visual verification. E2E tests validate that server + web integrate correctly and that the UI works as a real user would experience it.
- **All existing tests must continue passing.** Run full suites (`pnpm test` in both `server/` and `web/`) before considering any task complete.

---

## Feature 1: Activity Recency Badge

### Problem

Space cards are static. There's no indication that anything has changed since the user last looked. Users must open each space to discover new content.

### Data Model

**Migration: add `lastViewedAt` to `shared_space_member`**

```sql
ALTER TABLE shared_space_member ADD COLUMN "lastViewedAt" timestamp;
```

- Updated via `PATCH /shared-spaces/:id/view` when user opens a space detail page
- Nullable — `null` means the user has never viewed the space (treat everything as new on first visit, then reset)

**New repository methods:**

```typescript
getNewAssetCount(spaceId: string, since: Date): Promise<number>
// → SELECT COUNT(*) FROM shared_space_asset WHERE spaceId = ? AND addedAt > ?

getLastContributor(spaceId: string, since: Date): Promise<{ id: string; name: string } | null>
// → SELECT u.id, u.name FROM shared_space_asset ssa
//   JOIN users u ON u.id = ssa.addedById
//   WHERE ssa.spaceId = ? AND ssa.addedAt > ?
//   ORDER BY ssa.addedAt DESC LIMIT 1
```

**New endpoint:**

```
PATCH /shared-spaces/:id/view
```

- Any member can call this (uses `SharedSpaceRead` permission)
- Sets `lastViewedAt = NOW()` for the calling user's membership row
- Returns 204 No Content

**Extended `SharedSpaceResponseDto`:**

```typescript
newAssetCount?: number;                                    // assets added since lastViewedAt
lastContributor?: { id: string; name: string } | null;    // who added most recently (since lastViewedAt)
```

- `getAll()` computes these per-space for the requesting user
- `get()` also returns them (for consistency), then triggers view tracking client-side

### Visual Design

**Card with activity:**

```
┌──────────────────────────────────┐
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │      [collage/thumb]     ● │  │  ← 8px dot, top-right of collage
│  │                            │  │    bg-immich-primary with ping animation
│  └────────────────────────────┘  │
│                                  │
│  Family Trip                     │
│  Pierre added 3 new             │  ← text-xs text-immich-primary font-medium
│  12 photos · 5 members          │
└──────────────────────────────────┘
```

**Card without activity (unchanged):**

```
┌──────────────────────────────────┐
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │      [collage/thumb]       │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  Family Trip                     │
│  12 photos · 5 members          │
└──────────────────────────────────┘
```

**States:**

| Condition           | Dot | Activity line            |
| ------------------- | --- | ------------------------ |
| No new assets       | No  | Hidden — stats line only |
| 1-99 new, 1 person  | Yes | `"{name} added {n} new"` |
| 1-99 new, 2+ people | Yes | `"{n} new photos"`       |
| 100+ new            | Yes | `"99+ new photos"`       |

**Animation — pulsing dot:**

```css
.activity-dot {
  @apply absolute -top-1 -right-1 h-2 w-2 rounded-full bg-immich-primary;
}
.activity-dot::after {
  content: '';
  @apply absolute inset-0 rounded-full bg-immich-primary animate-ping opacity-40;
}
```

**Behavior:**

- Badge clears when user navigates to the space detail page (client calls `PATCH /shared-spaces/:id/view`)
- `lastViewedAt` is per-member — each user sees their own unread count
- On first visit (`lastViewedAt = null`): all assets appear as "new", then resets after view

### Tests

**Server unit tests:**

- `markSpaceViewed` updates `lastViewedAt` for the calling user
- `markSpaceViewed` rejects non-members
- `getAll` returns `newAssetCount: 0` when no new assets
- `getAll` returns correct `newAssetCount` when assets added after `lastViewedAt`
- `getAll` returns `lastContributor` name when single contributor
- `getAll` returns `null` lastContributor when multiple contributors
- `getAll` treats `lastViewedAt: null` as "everything is new"

**Web component tests:**

- Card renders without activity dot when `newAssetCount` is 0
- Card renders activity dot when `newAssetCount > 0`
- Card shows `"{name} added {n} new"` with single contributor
- Card shows `"{n} new photos"` without contributor
- Card shows `"99+ new photos"` when count exceeds 99
- Activity dot has `animate-ping` animation class

**Playwright E2E tests:**

- User A adds photos to a space → User B sees activity badge on space card
- User B opens the space → badge clears
- User B returns to space list → no badge shown (lastViewedAt updated)
- Space with no new activity shows no badge

---

## Feature 2: Member Contribution Cards

### Problem

The members list is a flat admin-style table — name, email, role dropdown. It tells you nothing about who participates, how much they contribute, or when they were last active. Members feel like database rows, not collaborators.

### Data Model

**New repository methods:**

```typescript
getContributionCounts(spaceId: string): Promise<{ userId: string; count: number }[]>
// → SELECT "addedById" as "userId", COUNT(*) as count
//   FROM shared_space_asset WHERE "spaceId" = ?
//   GROUP BY "addedById"

getMemberActivity(spaceId: string): Promise<{ userId: string; lastAddedAt: Date | null; recentAssetId: string | null }[]>
// → SELECT "addedById" as "userId",
//          MAX("addedAt") as "lastAddedAt",
//          (SELECT "assetId" FROM shared_space_asset ssa2
//           WHERE ssa2."addedById" = ssa."addedById" AND ssa2."spaceId" = ssa."spaceId"
//           ORDER BY "addedAt" DESC LIMIT 1) as "recentAssetId"
//   FROM shared_space_asset ssa WHERE "spaceId" = ?
//   GROUP BY "addedById"
```

**Extended `SharedSpaceMemberResponseDto`:**

```typescript
// Existing fields
user: UserResponseDto;
role: SharedSpaceRole;
joinedAt: string;

// New fields
contributionCount: number;         // photos this member has added
lastActiveAt?: string | null;      // ISO timestamp of most recent addedAt
recentAssetId?: string | null;     // their most recently added asset
```

**Service changes:**

- `getMembers()` enriches each member with contribution data by joining the two new repo queries
- No new endpoints — data comes alongside existing member list responses

### Visual Design

**Current member row:**

```
[Avatar 32px]  Pierre  pierre@email.com    [Owner badge]
```

**New contribution card:**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [Avatar 40px]   Pierre               [Owner]       │
│                  pierre@email.com                   │
│                                                     │
│  ┌──────┐  127 photos added · Active 2h ago         │
│  │recent│                                           │
│  │thumb │                                           │
│  │48x48 │                                           │
│  └──────┘                                           │
│                                                     │
├─────────────────────────────────────────────────────┤
```

**Layout:**

- Top row: avatar (40px, up from 32px) + name/email + role badge — same horizontal layout
- Bottom section: `mt-2 flex items-center gap-2.5`
  - Thumbnail: 48x48px, `rounded-lg object-cover` — uses `getAssetThumbnailUrl(recentAssetId)`
  - Stats: `text-xs text-gray-500 dark:text-gray-400`
  - Format: `"{count} photos added · Active {relative time}"`
- Zero contributions: no thumbnail, shows `"No photos added yet"` in `text-xs italic text-gray-400`
- Card padding: `px-4 py-3`
- Divider: `border-b border-gray-200 dark:border-gray-800`

**Sort order within the panel:**

1. Owner first (always)
2. Then by `contributionCount` descending
3. Members with 0 contributions last

### Tests

**Server unit tests:**

- `getMembers` returns `contributionCount` for each member
- `getMembers` returns 0 for members with no contributions
- `getMembers` returns `lastActiveAt` as ISO string
- `getMembers` returns `recentAssetId` for the most recent asset
- `getMembers` returns `null` for `lastActiveAt` and `recentAssetId` when no contributions
- Members are sorted: owner first, then by contribution count desc

**Web component tests:**

- Renders member name, email, and role badge
- Shows contribution count and relative time for active members
- Shows recent asset thumbnail when `recentAssetId` is present
- Shows "No photos added yet" when `contributionCount` is 0
- Does not render thumbnail when `recentAssetId` is null
- Renders owner first regardless of contribution count

**Playwright E2E tests:**

- Member panel shows contribution counts for each member
- Member with photos shows recent thumbnail
- Member with no photos shows "No photos added yet"
- Members are sorted by contribution count (owner first)

---

## Feature 3: Slide-out Members Panel

### Problem

The members modal blocks the space content entirely. Users can't reference the timeline while managing members. It feels like an admin action rather than a natural part of the space experience.

### Architecture

**Replace `SpaceMembersModal` with `SpaceMembersPanel`** — a new overlay component that slides in from the right edge. The existing `SpaceAddMemberModal` is still used as a sub-modal triggered from within the panel.

No server changes required.

### Visual Design

```
┌────────────────────────────────────────┬──────────────────────┐
│                                        │                      │
│  ◀ Spaces / Family Trip                │   Members (5)    ✕   │
│                                        │                      │
│  ┌──────────────────────────────────┐  │  ┌────────────────┐  │
│  │                                  │  │  │ [Search users] │  │
│  │        Hero Section              │  │  └────────────────┘  │
│  │                                  │  │                      │
│  └──────────────────────────────────┘  │  ┌────────────────┐  │
│                                        │  │ [Avatar] Pierre │  │
│  ┌──┬──┬──┬──┬──┬──┐                  │  │ 127 photos      │  │
│  │  │  │  │  │  │  │ ← timeline       │  │ [Owner]         │  │
│  ├──┼──┼──┼──┼──┼──┤   visible        │  ├────────────────┤  │
│  │  │  │  │  │  │  │   behind panel   │  │ [Avatar] Marie  │  │
│  ├──┼──┼──┼──┼──┼──┤                  │  │ 89 photos       │  │
│  │  │  │  │  │  │  │                  │  │ [Editor ▾]      │  │
│  └──┴──┴──┴──┴──┴──┘                  │  ├────────────────┤  │
│                                        │  │ [+ Add member] │  │
│                                        │  └────────────────┘  │
└────────────────────────────────────────┴──────────────────────┘
```

### Component: `SpaceMembersPanel`

**Props:**

```typescript
interface Props {
  space: SharedSpaceResponseDto;
  members: SharedSpaceMemberResponseDto[];
  currentUserId: string;
  isOwner: boolean;
  open: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
  onMemberRemoved: () => void;
  onRoleChanged: () => void;
}
```

**Panel structure:**

```svelte
<!-- Backdrop (mobile only) -->
{#if open}
  <div
    class="fixed inset-0 z-40 bg-black/30 lg:hidden"
    transition:fade={{ duration: 200 }}
    onclick={onClose}
  />
{/if}

<!-- Panel -->
<aside
  class="fixed right-0 top-0 z-50 h-full w-full sm:w-[380px]
         border-l border-gray-200 dark:border-gray-800
         bg-white dark:bg-immich-dark-bg
         shadow-xl
         transform transition-transform duration-300 ease-out"
  class:translate-x-0={open}
  class:translate-x-full={!open}
>
```

**Dimensions:**

| Property | Value                                   |
| -------- | --------------------------------------- |
| Width    | `w-full` mobile, `sm:w-[380px]` tablet+ |
| Height   | `h-full` (viewport)                     |
| Z-index  | `z-50` (above hero, below toasts)       |
| Shadow   | `shadow-xl`                             |

**Panel sections (top to bottom):**

1. **Header** — `flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800`
   - Left: `"Members"` + `"(5)"` count — `text-lg font-semibold`
   - Right: close button — `IconButton` with `mdiClose`

2. **Add member** (owner only) — `px-5 py-3 border-b border-gray-100 dark:border-gray-800/50`
   - Button: `+ Add member` using existing `Button` component with `mdiAccountPlusOutline` icon
   - Opens `SpaceAddMemberModal` (reused — focused action deserves a modal)

3. **Member list** — `flex-1 overflow-y-auto`
   - Scrollable list of contribution cards (Feature 2)
   - Each card separated by `border-b border-gray-100 dark:border-gray-800/50`

### Animation

| Transition | Duration | Easing   |
| ---------- | -------- | -------- |
| Open       | 300ms    | ease-out |
| Close      | 200ms    | ease-in  |
| Backdrop   | 200ms    | fade     |

Content behind is not shifted — panel overlays. This avoids layout reflow and keeps the timeline stable.

### Responsive behavior

| Breakpoint       | Behavior                                           |
| ---------------- | -------------------------------------------------- |
| Mobile (< 640px) | Full-width overlay + backdrop, tap backdrop closes |
| Tablet (640px+)  | 380px panel, no backdrop, overlays content         |

**Keyboard:** `Escape` closes the panel.

**Click-outside (desktop):** Does NOT close — users should be able to interact with the timeline while the panel is open. Panel stays until explicitly closed via close button or Escape.

### Migration

- `SpaceMembersModal.svelte` is replaced by `SpaceMembersPanel.svelte` on the detail page
- The detail page header's members button toggles the panel open/closed instead of calling `modalManager.open()`
- `SpaceAddMemberModal` continues to be used as a sub-modal from within the panel
- Existing `SpaceMembersModal` tests are adapted for the new panel component

### Tests

**Web component tests:**

- Panel renders with `translate-x-full` when `open` is false
- Panel renders with `translate-x-0` when `open` is true
- Panel shows member count in header
- Close button calls `onClose`
- Escape key calls `onClose`
- Add member button visible only for owners
- Add member button opens `SpaceAddMemberModal`
- Member list renders all members with contribution cards
- Members sorted: owner first, then by contribution count
- Backdrop renders on mobile breakpoints only
- Backdrop click calls `onClose`
- Role change dropdown works for owner viewing non-owner members

**Playwright E2E tests:**

- Members button opens slide-out panel
- Panel shows all space members with contribution stats
- Close button closes the panel
- Escape key closes the panel
- Owner can add a member via panel → modal flow
- Owner can change member role in the panel
- Owner can remove a member from the panel
- Panel content scrolls when member list is long
- Panel overlay does not shift page content

---

## Feature 4: Empty State Onboarding

### Problem

Empty spaces show a generic placeholder identical to albums. New users don't understand what to do next. The empty state is a missed opportunity to guide the user through space setup.

### Architecture

No server changes required. New `SpaceEmptyState` component replaces the existing `EmptyPlaceholder` usage in the space detail page when `assetCount === 0`.

### Visual Design

**Owner view (all 3 steps):**

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│            ┌──────────────────────────┐               │
│            │   [Space color gradient  │               │
│            │    80x80 rounded-2xl     │               │
│            │    camera icon centered] │               │
│            └──────────────────────────┘               │
│                                                      │
│            Get started with your space                │
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │  📷 ── Add photos from your timeline      →  │   │
│   ├──────────────────────────────────────────────┤   │
│   │  👥 ── Invite members to collaborate      →  │   │
│   ├──────────────────────────────────────────────┤   │
│   │  🖼 ── Set a cover photo to personalize   →  │   │
│   └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Viewer view:**

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│            [Same gradient icon]                       │
│                                                      │
│            No photos yet                             │
│            Photos added to this space will            │
│            appear here                               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Component: `SpaceEmptyState`

**Props:**

```typescript
interface Props {
  space: SharedSpaceResponseDto;
  currentRole: SharedSpaceRole;
  gradientClass: string;
  onAddPhotos: () => void;
  onInviteMembers: () => void;
}
```

### Step definitions

| Step | Icon                       | Label                            | Action                        | Visible to    |
| ---- | -------------------------- | -------------------------------- | ----------------------------- | ------------- |
| 1    | `mdiImagePlusOutline`      | Add photos from your timeline    | Triggers asset picker         | Editor, Owner |
| 2    | `mdiAccountPlusOutline`    | Invite members to collaborate    | Opens `SpaceAddMemberModal`   | Owner only    |
| 3    | `mdiImageFilterHdrOutline` | Set a cover photo to personalize | Disabled — "Add photos first" | Owner only    |

**Editor:** sees step 1 only.
**Viewer:** no steps — passive message `"No photos yet"` / `"Photos added to this space will appear here"`.

### Layout details

**Container:**

```
max-w-md mx-auto py-16 text-center
```

**Gradient icon:**

- 80x80px `rounded-2xl` with space's gradient background (reuses `gradientClass` from P0)
- `mdiCameraOutline` icon centered, 32px, white at 80% opacity
- `mx-auto mb-6`

**Title:**

- `"Get started with your space"` — `text-xl font-semibold text-gray-800 dark:text-gray-100`
- `mb-6`

**Steps container:**

```
rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden
```

**Each step row:**

```
flex items-center gap-3 px-4 py-3.5
border-b border-gray-100 dark:border-gray-800 last:border-b-0
hover:bg-gray-50 dark:hover:bg-gray-800/50
cursor-pointer transition-colors duration-150
```

- Left: MDI icon, `text-gray-400 dark:text-gray-500`, 20px
- Center: label, `text-sm font-medium text-gray-700 dark:text-gray-300`, `flex-1`
- Right: `mdiChevronRight`, `text-gray-300 dark:text-gray-600`

**Step 3 disabled state:**

- `opacity-50 cursor-default` — no hover effect
- Tooltip: `"Add photos first"`

### Behavior

- Replaces `EmptyPlaceholder` in space detail page when `assetCount === 0`
- Steps trigger existing flows — no new modals or workflows
- Once photos are added, the empty state disappears (timeline renders instead)
- Step 3 is disabled while `assetCount === 0` — becomes active when photos exist but the empty state would already be hidden at that point, so this is purely a visual hint

### Tests

**Web component tests:**

- Renders gradient icon with space color
- Shows "Get started with your space" title for owner
- Shows all 3 steps for owner role
- Shows only step 1 for editor role
- Shows passive message for viewer role — no steps
- Step 1 click triggers `onAddPhotos` callback
- Step 2 click triggers `onInviteMembers` callback
- Step 3 is disabled (opacity-50, no click handler)
- Each step has correct icon and label text

**Playwright E2E tests:**

- Empty space shows onboarding steps for owner
- Empty space shows single step for editor
- Empty space shows passive message for viewer
- Clicking "Add photos" opens asset picker
- Clicking "Invite members" opens add member modal
- Adding photos removes empty state and shows timeline

---

## Implementation Order

Features should be implemented in this order due to dependencies:

1. **Activity recency badge** — independent, adds `lastViewedAt` column and view endpoint
2. **Member contribution cards** — independent, adds contribution data to member DTOs
3. **Slide-out members panel** — depends on contribution cards (feature 2) for the enriched member display
4. **Empty state onboarding** — independent, but best done last as it's the simplest

Each feature follows the same pattern:

1. Write failing server unit tests
2. Implement server changes (migration, repository, service, DTOs)
3. Regenerate OpenAPI clients (`make open-api`)
4. Write failing web component tests
5. Implement web components
6. Write Playwright E2E tests
7. Run full test suites, lint, format, typecheck
