# Shared Spaces Timeline Integration Design

**Goal:** Merge shared space assets into a member's personal timeline, with a per-space opt-in toggle.

**Context:** The original family sharing design doc planned this feature (`showInTimeline` on `shared_space_member`), but it was not included in the phase 2 implementation. This follows the established partner timeline integration pattern.

---

## Schema

Add `showInTimeline` boolean column to `shared_space_member`, defaulting to `true`:

```
shared_space_member
├── spaceId (FK)
├── userId (FK)
├── role (enum)
├── joinedAt (timestamp)
└── showInTimeline (boolean, default: true)  ← NEW
```

Migration adds the column with `DEFAULT TRUE` so existing members see space assets in their timeline immediately.

`SharedSpaceMemberResponseDto` gains a `showInTimeline` field. The existing `updateMember` endpoint (`PUT /shared-spaces/:id/members/:userId`) accepts the new field to toggle it.

## Server — Timeline Query Integration

**Timeline DTO:** Add `withSharedSpaces?: boolean` optional flag to `TimeBucketDto`, mirroring `withPartners`.

**Timeline Service:** In `buildTimeBucketOptions()`, when `withSharedSpaces` is true:

1. Query all spaces where the authenticated user is a member AND `showInTimeline = true`.
2. Pass those space IDs as `timelineSpaceIds` in the options object.

**Asset Repository — UNION approach:** To avoid performance issues with `OR EXISTS` degrading index usage, use a UNION strategy:

- `getTimeBuckets()`: UNION two queries — one for user/partner assets (existing `ownerId` filter), one for space assets via `shared_space_asset` join — then aggregate time buckets from the combined result.
- `getTimeBucket()`: Same UNION approach for fetching individual bucket pages. Each branch is independently optimized with proper indexes.

This avoids the `OR` query plan problem where PostgreSQL can't use indexes effectively when combining ownership and join-table conditions.

**Validation:** Same restrictions as partners — `withSharedSpaces` throws `BadRequestException` if combined with archive, favorites, or trash filters. Space assets don't have per-user favorite/archive/trash state, so filtering them in those views would be meaningless.

**Access control:** Space IDs are derived from the authenticated user's own memberships, not from user input. No additional permission check needed.

## Web Frontend

**Main timeline page** (`web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`): Add `withSharedSpaces: true` to the timeline options alongside `withPartners: true`.

**Space members modal** (`SpaceMembersModal.svelte`): On the current user's own membership row, add a "Show in timeline" toggle. Toggling calls `updateMember` with the new `showInTimeline` field. The toggle only appears on your own row — you cannot control other members' timeline preferences.

No new settings page needed.

## Testing

**Server unit tests:**

- `timeline.service.spec.ts`: Test `buildTimeBucketOptions` with `withSharedSpaces: true` — verify space ID resolution and pass-through. Test validation throws when combined with archive/favorites/trash.
- `shared-space.service.spec.ts`: Test `updateMember` with `showInTimeline` field.

**Server medium tests:**

- Test the UNION query with real DB — verify space assets appear in time buckets alongside user-owned assets, and disappear when `showInTimeline` is toggled off.

**Web unit tests:**

- `SpaceMembersModal.spec.ts`: Test that the "Show in timeline" toggle renders for the current user's row only.

**Regeneration:**

- OpenAPI SDK regeneration for new DTO fields.
- SQL query docs regeneration.
