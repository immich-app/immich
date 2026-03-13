# Shared Spaces Phase 3: Activity Feed & New-Since-Last-Visit — Design

## Goal

Add two features to shared spaces (web only):

1. **Unified side panel** — replaces the existing `SpaceMembersPanel` with a tabbed panel containing an Activity feed (default) and Members tab
2. **"New since last visit" timeline marker** — divider + background tint showing assets added since the user's last visit

## Methodology

**Test-Driven Development throughout.** Every component, service method, and repository query is written test-first. The cycle is: write failing test → implement minimum code to pass → refactor. No implementation code without a preceding test.

---

## Feature 1: Unified Side Panel

### Server

#### New table: `shared_space_activity`

| Column      | Type         | Description                                  |
| ----------- | ------------ | -------------------------------------------- |
| `id`        | uuid v7 (PK) | Auto-generated                               |
| `spaceId`   | uuid (FK)    | Reference to `shared_space`, CASCADE delete  |
| `userId`    | uuid (FK)    | Who performed the action, SET NULL on delete |
| `type`      | varchar(30)  | Event type enum                              |
| `data`      | jsonb        | Event-specific payload                       |
| `createdAt` | timestamptz  | When it happened                             |

Indexes: `shared_space_activity_spaceId_createdAt_idx` (compound, for feed queries sorted by time).

#### Event types

| Type                 | Logged in                                  | `data` payload                                                                         |
| -------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `asset_add`          | `addAssets()`                              | `{ count: 12, assetIds: ["id1","id2","id3","id4"] }` (first 4 IDs for thumbnail strip) |
| `asset_remove`       | `removeAssets()`                           | `{ count: 3 }`                                                                         |
| `member_join`        | `addMember()`                              | `{ role: "editor", invitedById: "..." }`                                               |
| `member_leave`       | `removeMember()` (self)                    | `{}`                                                                                   |
| `member_remove`      | `removeMember()` (by owner)                | `{ removedUserId: "..." }`                                                             |
| `member_role_change` | `updateMember()`                           | `{ targetUserId: "...", oldRole: "viewer", newRole: "editor" }`                        |
| `cover_change`       | `update()` when `thumbnailAssetId` changes | `{ assetId: "..." }`                                                                   |
| `space_rename`       | `update()` when `name` changes             | `{ oldName: "...", newName: "..." }`                                                   |
| `space_color_change` | `update()` when `color` changes            | `{ oldColor: "...", newColor: "..." }`                                                 |

One row per API call. No time-window aggregation.

#### Repository methods

- `logActivity(spaceId, userId, type, data)` — insert row
- `getActivities(spaceId, { limit, offset })` — paginated feed, ordered by `createdAt DESC`, joined with `users` table for avatar/name

#### Service changes

Inline logging in existing methods. Each method calls `logActivity()` after the primary operation succeeds. No separate job queue — synchronous insert within the same request.

#### API

- `GET /shared-spaces/:id/activities?limit=50&offset=0` — paginated activity feed. Permission: `SharedSpaceRead`.

### Web

#### Unified panel component: `space-panel.svelte`

Replaces `SpaceMembersPanel`. Same slide-out behavior (right edge, 380px desktop, full-width mobile) but with a tabbed interface.

**Tab system:** Segmented control (pill-shaped toggle) in the header. Active segment uses the space's `UserAvatarColor` as background. Inactive segment is transparent with muted text. Matches existing `rounded-full` language from role badges and stat chips.

```
┌─────────────────────────────────────────┐
│  ╭─────────────────────────────────╮    │
│  │ ● Activity  │    Members (5)   │  ✕ │
│  ╰─────────────────────────────────╯    │
├─────────────────────────────────────────┤
│  (tab content)                          │
└─────────────────────────────────────────┘
```

**Backdrop:** `bg-black/20 backdrop-blur-[2px]` instead of solid opacity — keeps timeline visible but softly defocused.

**Content stagger:** On panel open, header appears immediately, then feed items stagger in with 30ms CSS `animation-delay` per item (max 8 staggered, rest instant).

#### Activity tab: `space-activity-feed.svelte`

Chronological feed grouped by day.

**Day headers:** Sticky date separators using `text-xs font-semibold uppercase tracking-wider text-gray-400`. Pattern matches timeline date headers in the main grid.

```
── Today ──────────────────────────
── Yesterday ──────────────────────
── March 7 ─────────────────────────
```

**Three visual tiers by event type:**

**High-impact** (`asset_add`, `asset_remove`) — full card with avatar + thumbnail strip:

```
┌─────────────────────────────────────┐
│  [Avatar]  Pierre                   │
│            Added 12 photos     2h   │
│  ┌────┬────┬────┬────┐             │
│  │ th │ th │ th │ th │  +8 more    │
│  └────┴────┴────┴────┘             │
└─────────────────────────────────────┘
```

Mini thumbnail strip: up to 4 thumbs (32x32, `rounded-md`). Asset IDs from `data.assetIds`. `+N more` badge if count > 4.

**Medium** (`member_join`, `member_leave`, `member_remove`, `member_role_change`) — single row with avatar + left border accent:

```
│▎ [Avatar]  Alex joined as Editor   │
│▎           Invited by Pierre   3d  │
```

2px left border in member's avatar color (`border-l-2`).

**Low-impact** (`cover_change`, `space_rename`, `space_color_change`) — compact single line, no avatar:

```
│  ●  Marie set a new cover photo 5d │
```

Small dot (●) in space color. `text-sm text-gray-500`.

**Empty state:** Space gradient at 10% opacity behind centered text: "This space just got started. Add photos and invite members to see activity here."

**Pagination:** "Load more" button at the bottom, fetches next page via offset.

#### Members tab: `space-members-tab.svelte`

Existing `SpaceMembersPanel` content extracted into a tab component. Same contribution cards, role management, add member button. No behavioral changes.

#### Trigger button

The header button that opens the panel shows a pulsing unread dot (reuse `ActivityBadge` pattern) when new activity events exist since `lastViewedAt`.

---

## Feature 2: "New Since Last Visit" Timeline Marker

### Server

No new endpoints needed. The existing `markSpaceViewed()` (fires on mount) and `lastViewedAt` / `newAssetCount` in the space response provide all necessary data.

Add one field to `SharedSpaceResponseDto`: `lastViewedAt` (timestamp) — needed by the client to position the divider in the timeline.

### Web

#### Divider component: `space-new-assets-divider.svelte`

A pill-shaped label centered on a horizontal rule, inserted into the timeline at the `lastViewedAt` boundary.

```
         ╭──────────────────────────╮
─────────│  8 new · since Mar 8    │─────────
         ╰──────────────────────────╯
```

- Pill uses the space's color as background (`rounded-full px-3 py-1`), matching hero stat chips
- Icon: `mdiNewBox` left of text
- **Sticky behavior:** Pins to viewport top while scrolling through new assets, then scrolls normally once past the last new item (`position: sticky; top: 0`)

#### Background tint on new assets

All assets above the divider (added after `lastViewedAt`) get:

- Background wash using the space's color at 5% opacity (`bg-{spaceColor}/5`)
- Left border rail: `border-l-2 border-{spaceColor}/30` on the timeline grid section
- Ties the highlight to the space's visual identity, not a generic blue

**Entry animation:** Timeline renders normally → after 300ms delay, tint fades in (`transition-colors duration-500`) and divider pill scales up (`scale-95` → `scale-100`).

**Persistence:** Tint stays for the entire session. Clears on next page load because `markSpaceViewed()` fires on mount, advancing `lastViewedAt`.

#### Edge cases

- **All assets are new** (first visit after bulk add): no divider, just tint on everything with a subtle top label: "All photos are new since your first visit"
- **No new assets**: nothing rendered (no divider, no tint)
- **0 assets total**: handled by onboarding banner

---

## Testing Strategy

### TDD Cycle

Every piece of implementation follows red-green-refactor:

1. **Write the failing test first** — define the expected behavior
2. **Write minimum code to pass** — no extras
3. **Refactor** — clean up while tests stay green

### Server tests (Vitest, `newTestService()`)

- **Activity logging:** test that each service method (`addAssets`, `removeAssets`, `addMember`, `removeMember`, `updateMember`, `update`) calls `logActivity` with correct type and data payload
- **Activity feed query:** test pagination, ordering, user join, permission check
- **Edge cases:** activity logged even when space has no other members, activity user join returns name/avatar, deleted user shows as null
- **`lastViewedAt` in response:** test that `get()` includes `lastViewedAt` for the requesting user

### Web tests (Vitest, @testing-library/svelte)

- **`space-panel.svelte`:** tab switching, active tab styling with space color, close on Escape, close button, responsive width, backdrop blur
- **`space-activity-feed.svelte`:** renders day headers, three event tiers (high/medium/low impact), thumbnail strip for asset_add, empty state, load more button, stagger animation classes
- **`space-new-assets-divider.svelte`:** renders pill with correct count and date, uses space color, sticky class, not rendered when `newAssetCount === 0`
- **Timeline tint integration:** tint wrapper applies correct opacity class, tint not present when no new assets, "all new" variant

### E2E tests (Playwright)

- Create space → add assets → open panel → verify activity feed shows "added N photos"
- Second user views space → first user adds photos → second user revisits → verify divider with correct count
- Panel tab switching between Activity and Members

---

## Scope

- **Web only** — mobile catches up in a future phase
- **No time-window aggregation** — one activity row per API call
- **No activity for space creation** — the creation event is implicit (the space exists)

## Non-goals

- Activity notifications (push/email)
- Activity feed on the spaces list page
- Mobile implementation
- Real-time updates via WebSocket (feed refreshes on panel open)
