# Space Timeline Opt-In Identity Scope Design

## Problem

Identity-backed people now allow names, birthdays, thumbnails, counts, search filters, and person rows to cross personal and shared-space boundaries when the viewer has access. That is useful, but it must respect the member's `showInTimeline` preference.

The product rule is: disabling **Show photos in timeline** for a space means that space should stop contributing outside the space itself. The member can still open the space directly and see its photos and people, but global and cross-space experiences should behave as if that space is not part of the member's personal photo universe.

## Decision

Use `shared_space_member.showInTimeline` as the single opt-in gate for shared-space people and assets outside explicit space scope.

When `showInTimeline = false` for a viewer and space:

- The space's photos are excluded from the viewer's global timeline, global search, global map, and global filter result sets.
- Space-only people are excluded from the viewer's global `/people` page.
- Space-only people are excluded from global search person suggestions and filter-panel people suggestions.
- Selecting a viewer-owned global person must not pull in matching photos from that disabled space.
- Space person names, aliases, birthdays, and other inherited metadata from that disabled space stop contributing to other spaces or global labels.
- If existing inherited metadata came from that space, the next sync or backfill should clear it or fall back to another eligible source.
- Album-scoped search/filter/map also excludes those space assets and people, even if an `album_asset` row exists.

When the viewer explicitly scopes to the space with `spaceId`:

- The space's people page still shows that space's people.
- Space search, filters, and map still show that space's photos and people.
- Space person rename/hide/metadata operations continue to work.

This keeps one exception only: explicit space scope. Albums are not an exception.

## Current Code Shape

The current server already has many pieces of this model:

- `SharedSpaceRepository.getSpaceIdsForTimeline(userId)` returns only spaces where the member has `showInTimeline = true`.
- Timeline, map, and search services pass `timelineSpaceIds` into repository queries for global/shared-space inclusion.
- Identity-backed `/people` queries build a `timeline_spaces` CTE from `shared_space_member.showInTimeline = true`.
- Scoped person token resolution rejects `space-person:` tokens unless the requested space is in the viewer's timeline scope for global shared-space requests.
- Metadata inheritance candidates from source space people already require the source member to have `showInTimeline = true`.

The implementation should preserve those existing gates and fill gaps where album scope, global identity filters, linked libraries, or backfill can still see a disabled space.

## Data Flow

Global or cross-space requests should resolve a viewer scope first:

```text
viewer
  -> own user id and timeline-enabled partner ids
  -> timeline-enabled shared space ids
  -> accessible assets from own library, partners, and timeline-enabled spaces
  -> identity-linked faces
  -> accessible scoped profiles from own people and timeline-enabled space people
```

Explicit space requests use a different scope:

```text
viewer + spaceId
  -> membership check for that space
  -> assets and people in that space
```

Album requests should remain global-scope requests with an album filter:

```text
viewer + albumId
  -> album access check
  -> album assets
  -> intersect with viewer's own/partner/timeline-enabled shared-space scope
```

This means an album may contain a shared-space asset at the database level, but the viewer only sees it in album search/filter/map if that asset's source space is timeline-enabled for that viewer or the asset is otherwise visible through the viewer's own or partner scope.

## Metadata Inheritance

Metadata inheritance should treat `showInTimeline` as a reversible source gate.

Eligible source profiles:

- Viewer-owned personal people for the target space member, when `sharePersonMetadata = true`.
- Source space people from spaces where the asset adder/linker is a member and has `showInTimeline = true`.
- Source profiles must still satisfy existing RBAC, hidden-profile, deleted-space, deleted-member, deleted/offline-asset, and contribution checks.

Ineligible source profiles:

- Space people from spaces hidden from the relevant member's timeline.
- Space people from spaces the relevant member cannot access.
- Space people from deleted spaces or removed memberships.
- Private user-person metadata from members with `sharePersonMetadata = false`.

If a member disables `showInTimeline`, backfill should remove inherited fields that point at now-ineligible source profiles unless another eligible candidate wins. If the member enables it again, backfill or sync should be able to restore inheritance from that source.

Manual metadata remains locked. A manual target space name or birthday must not be cleared just because a source space becomes ineligible.

## Album Future-Proofing

Normal album APIs currently only allow owned and partner assets to be added, because album creation and add-to-album use `Permission.AssetShare`. A plugin path can add assets after checking `AssetRead`, so tests should not assume album rows can only contain owned assets.

Future work may intentionally allow adding shared-space assets to albums. This design sets the people semantics ahead of that feature:

- A shared-space asset in an album does not bypass `showInTimeline`.
- Album people filters should not leak names from timeline-disabled spaces.
- Album search results should not return photos from timeline-disabled spaces.
- Explicit space pages remain the place to see photos from a disabled space.

The separate album-sharing follow-up must decide whether a member can re-share a shared-space asset into an album for users outside the original space. The default should be no unless the asset owner has granted share rights.

## Testing

Add medium tests that seed direct and linked-library space assets, then assert the same behavior across:

- `/people` with `withSharedSpaces=true`
- `searchPerson`
- `getFilterSuggestions`
- `getSearchSuggestions`
- `searchMetadata`
- global and filtered map queries
- album-scoped filter/search/map queries with `album_asset` rows seeded directly
- metadata inheritance during face sync and explicit backfill

Key scenarios:

- Timeline-enabled space contributes people, assets, and inherited metadata globally.
- Disabling `showInTimeline` removes the same space from global people, filters, search, map, album scope, and metadata inheritance.
- Re-enabling `showInTimeline` restores the same contributions after sync or backfill.
- A viewer-owned global person does not pull in matching photos from a disabled space.
- Explicit `spaceId` requests still show that space's people and photos while disabled globally.
- Linked-library spaces follow the same rules as direct `shared_space_asset` rows.
- Existing manual target-space metadata survives source-space visibility changes.

## Non-Goals

- Do not add a second people visibility flag.
- Do not expose raw `face_identity.id` values.
- Do not change the UI label in this pass.
- Do not implement shared-space asset album sharing in this pass.
- Do not make albums an explicit-space override.
