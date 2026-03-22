# Spaces: Potential Improvements

Research into what users are asking for in the sharing/spaces area, compared against our current implementation and competing products.

## Current State

Gallery's Spaces feature already covers many of the top upstream requests (658+ upvotes on [immich-app/immich#12614](https://github.com/immich-app/immich/issues/12614)):

- Shared face recognition within spaces (the #1 most requested sub-feature, 222+ reactions)
- Role-based access control (Owner / Editor / Viewer)
- Smart search scoped to spaces
- Map view per space
- Activity feed with event tracking
- Timeline integration toggle per member
- User groups for quick sharing
- User-specific person aliases
- New-asset badges and "N new" divider

## High-Value Gaps

### 1. Auto-Share by Face Recognition

**What:** Users select which people to auto-share with a space. When new photos are uploaded containing those faces, they automatically flow into the space.

**Why:** This is Google Photos' signature sharing feature and is repeatedly requested upstream (12+ reactions on smart album comments, 179 votes on the auto-share row in POTENTIAL-IMPROVEMENTS.md). It solves the "I don't want to share work screenshots with my family" problem elegantly — only photos of family members get shared.

**Building blocks we already have:** Space face recognition, face matching job pipeline, per-space person entities.

**Rough shape:** Per-member "auto-share rules" (e.g. "share photos containing Person A or Person B"). A background job matches new uploads against rules and adds matching assets to the space.

### 2. Albums Within Spaces

**What:** Organize space assets into sub-collections (e.g. "Vacation 2025", "School Events") without leaving the space context.

**Why:** 4 separate upstream discussions about album hierarchy ([#2073](https://github.com/immich-app/immich/discussions/2073), [#19823](https://github.com/immich-app/immich/discussions/19823), [#26426](https://github.com/immich-app/immich/discussions/26426), [#1010](https://github.com/immich-app/immich/issues/1010)). Spaces with 1,000+ family photos become unmanageable without sub-organization. Users coming from Synology Photos expect folder-like organization within shared spaces.

**Rough shape:** Space albums that inherit space membership/permissions. Assets belong to both the space (flat timeline) and optionally one or more space albums.

### 3. Auto-Add Toggle Per Member

**What:** A per-member toggle: "automatically add all my new uploads to this space."

**Why:** Amazon Photos' simple family vault approach. Eliminates the biggest friction point — manually selecting and adding photos to the family space. Apple does this with proximity-based Bluetooth detection; a simpler version is just a toggle.

**Rough shape:** Boolean flag on `SharedSpaceMember`. Mobile backup job and web upload flow check the flag and auto-add new assets. Could extend to "auto-add from specific device albums" for finer control.

### 4. Shared Favorites / Reactions

**What:** Space members can "heart" or react to shared assets. Favorites are visible to all members and can be used as a filter.

**Why:** Google Photos has 5 emoji reactions on shared content. Apple has shared favorites. Currently there's no way for space members to express preferences, making it harder for families to curate "best of" collections.

**Rough shape:** A `shared_space_asset_reaction` table (spaceId, assetId, userId, type). Simple heart/favorite to start, with a "favorites" filter in the space view.

### 5. Shared Memories

**What:** Space assets appear in the Memories / "On This Day" feature for all members.

**Why:** Both Google Photos and Apple surface shared content in memories. Our spaces assets are invisible to the memories pipeline. For families, the most emotionally resonant memories often come from shared content.

**Rough shape:** Extend the memories query to include assets from spaces where the user has `showInTimeline` enabled.

### 6. Comments on Space Assets

**What:** Members can comment on individual assets within a space.

**Why:** Upstream Immich has album comments. Google Photos has comments + reactions. Spaces currently have an activity feed for space-level events but no per-asset conversation. Families want to say "look at this face!" on a photo.

**Rough shape:** Reuse or extend the existing album comment infrastructure, scoped to space assets. Show comment count badge on assets in the space timeline.

### 7. Notifications for New Content

**What:** Push notifications (mobile) and in-app notifications (web) when new assets are added to a space.

**Why:** [Issue #938](https://github.com/immich-app/immich/issues/938) specifically requests this. We have the activity badge and "N new" divider, but users who don't open the app miss new content. Especially important for less-active family members.

**Rough shape:** Extend the existing notification system. When `AssetAdd` activity is logged, dispatch notifications to space members (respecting per-member preferences).

### 8. Cross-User Deduplication

**What:** Detect when multiple family members upload the same photo and avoid duplicates in spaces.

**Why:** Common pain point — family takes group photos, everyone uploads them, space gets 4 copies of every shot. Users report storage waste from this ([#8252](https://github.com/immich-app/immich/issues/8252), [#17422](https://github.com/immich-app/immich/discussions/17422)).

**Rough shape:** When adding assets to a space, compare checksums against existing space assets. Offer to skip duplicates or auto-deduplicate.

## Lower Priority / Future Ideas

| Feature                     | Description                                                        | Community signal                                                          |
| --------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Query-based dynamic spaces  | Auto-populate a space from a saved search query                    | 12 reactions on smart album comment                                       |
| Cross-user face linking     | "This person in my library = this person in the space"             | [Discussion #7362](https://github.com/immich-app/immich/discussions/7362) |
| Public gallery mode         | Flickr-like public view for a space, indexable by search engines   | Hacker News discussion                                                    |
| View-only global role       | A user role that can browse everything but cannot upload or delete | 7 reactions                                                               |
| Shared tags / labels        | Collaborative tagging within spaces                                | Multiple comments in #12614                                               |
| Location-based auto-sharing | Auto-share when at home (geofencing)                               | Apple's approach, niche                                                   |

## Competitive Comparison

| Feature                 | Google Photos       | Apple iCloud SPL     | Synology Photos       | Amazon Photos     | Gallery             |
| ----------------------- | ------------------- | -------------------- | --------------------- | ----------------- | ------------------- |
| Shared space concept    | Partner library     | Shared Photo Library | Shared Space folder   | Family Vault      | Spaces              |
| Role-based access       | No (all equal)      | No (all equal)       | Folder-level          | Per-member toggle | Owner/Editor/Viewer |
| Auto-share by face      | Yes                 | No                   | No                    | No                | Not yet             |
| Auto-add all photos     | No                  | Yes (proximity)      | One-way move          | Toggle per member | Not yet             |
| Shared face recognition | Private per account | Private per account  | Yes (in shared space) | No                | Yes                 |
| Smart search in shared  | Yes                 | Yes                  | Yes                   | No                | Yes                 |
| Reactions / favorites   | 5 emoji reactions   | Shared favorites     | No                    | No                | Not yet             |
| Shared memories         | Yes                 | Yes                  | No                    | No                | Not yet             |
| Comments on shared      | Yes                 | No                   | No                    | No                | Not yet             |
| Albums within shared    | No                  | No                   | Folder-based          | No                | Not yet             |
| Activity feed           | No                  | No                   | No                    | No                | Yes                 |
| Per-member aliases      | No                  | No                   | No                    | No                | Yes                 |

## Recommended Priority

1. **Auto-share by face** — highest community demand, strongest competitive differentiator, building blocks exist
2. **Albums within spaces** — critical for spaces to scale past a few hundred photos
3. **Auto-add toggle** — simplest to implement, eliminates biggest friction point
4. **Shared favorites** — lightweight, high engagement value
5. **Shared memories** — emotionally resonant, extends existing pipeline
6. **Comments** — reuses existing infrastructure
7. **Notifications** — extends existing system
8. **Cross-user dedup** — nice-to-have, complex
