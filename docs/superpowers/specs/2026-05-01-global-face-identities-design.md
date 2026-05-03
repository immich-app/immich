# Global Face Identities Design

## Problem

Shared spaces currently build `shared_space_person` records from faces in each space. This works inside one space, but it does not provide a durable cross-space identity. If the same person appears in Space A and Space B, a user who belongs to both spaces can still see duplicate people unless both spaces happened to use the same source user's `person.id`.

The product goal is a unified people experience across the viewer's accessible timeline:

- Users should see people from their own library and from all spaces they include in their timeline.
- The same real person should appear once when they are represented across multiple accessible spaces.
- Named source libraries should seed names and birth dates into space people so large spaces do not require renaming thousands of people.
- RBAC must remain strict: users must not infer names, thumbnails, counts, spaces, or private curation from people/assets they cannot access.

## Current Model

- `person` is a user-owned profile. It stores private metadata such as name, hidden state, favorite state, thumbnail, birth date, color, and type.
- `asset_face` is the raw face observation. It points at the owner-scoped `person.id` after native recognition.
- `shared_space_person` is a space-owned profile. It stores space-visible name, hidden state, representative face, birth date, type, and counts.
- `shared_space_person_face` links a space person to concrete `asset_face` rows.
- Existing shared-space matching already waits for `asset_face.personId` and uses that source person as the first signal for assigning faces into a space person.

The missing piece is a stable internal identity that can connect multiple owner-scoped `person` rows and multiple space-scoped `shared_space_person` rows across spaces.

## Domain Language Updates

The implementation plan must update `docs/docs/developer/ubiquitous-language.md` before feature code lands so planning, code review, tests, and UI discussions use the same terms.

Add or revise terms for:

- **Face Identity**: the internal sameness key for one real person or pet across personal and space profiles. Avoid calling it a Global Person because it is not user-visible and must not bypass RBAC.
- **Identity-linked face**: an `asset_face` row linked to a Face Identity through `face_identity_face`.
- **Scoped person profile**: a user-scoped `person` or space-scoped `shared_space_person` profile that carries display metadata for one Face Identity within a permission boundary.
- **Metadata inheritance**: copying permitted fields such as name and birth date from a source profile into a target space profile with provenance.
- **Metadata contribution**: a member's permission-controlled ability to publish selected personal person metadata into a space profile.
- **Identity-grouped person**: a `/people`, filter, or global search result that represents one accessible Face Identity and is rendered from accessible scoped profiles.
- **Scoped primary profile**: the accessible user or space profile chosen as the navigation target for an identity-grouped person.
- **Scoped identity filter token**: an opaque, access-validated filter value for a grouped identity result. Avoid exposing raw `face_identity.id`.

Also update the existing People and recognition, Search and filtering, Relationships, Recommended conversation patterns, and Flagged ambiguities sections so they distinguish Personal People, Space People, Face Identities, and identity-grouped results consistently.

## Design Direction

Add an internal global identity graph underneath existing scoped person tables.

```text
face_identity
  id
  type: person | pet
  representativeFaceId nullable
  createdAt
  updatedAt
  updateId

face_identity_face
  identityId
  assetFaceId
  source: owner-person | space-person | ml | manual | import
  confidence nullable
  createdAt
  updatedAt

person
  existing fields...
  identityId nullable

shared_space_person
  existing fields...
  identityId nullable
  nameSource: manual | inherited | none
  nameSourceProfileType: user-person | space-person nullable
  nameSourceProfileId nullable
  nameSourceUpdatedAt nullable
  birthDateSource: manual | inherited | none
  birthDateSourceProfileType: user-person | space-person nullable
  birthDateSourceProfileId nullable
  birthDateSourceUpdatedAt nullable

shared_space_member
  existing fields...
  sharePersonMetadata boolean default true
```

Required indexes and constraints:

- `face_identity_face.assetFaceId` should be unique so each identity-linked face has one current identity.
- `face_identity_face(identityId, assetFaceId)` should support identity-to-face joins.
- `person(identityId)` should support profile lookup from identity.
- `shared_space_person(spaceId, identityId)` should be unique when `identityId` is not null and should support finding a profile by space and identity.
- `shared_space_person(identityId, spaceId)` should support hydrating accessible space profiles for grouped identity rows.

`face_identity` is not a user-visible person. It is an internal sameness key. Public DTOs must not expose `face_identity.id`.

`person` remains the private user profile for an identity. `shared_space_person` remains the space profile for an identity. A space person must not point directly at another user's `person` row; it may copy the identity and may inherit permitted metadata into the space profile.

## Matching Flow

When an asset is added to a face-recognition-enabled space:

1. Native face recognition assigns `asset_face.personId` for the asset owner's library.
2. The owner `person.identityId` is created if missing.
3. The face is linked to that identity through `face_identity_face`.
4. Shared-space face matching finds `shared_space_person` by `(spaceId, identityId)`.
5. If none exists, it creates a new `shared_space_person` with that `identityId`.
6. It adds the concrete face through `shared_space_person_face`.
7. It applies metadata inheritance for eligible fields if the target field is empty or inherited.

This makes same-owner propagation deterministic: if Bob adds photos of Alice to several spaces, all those space people get the same identity from Bob's source `person`.

For cross-owner dedupe, background identity jobs can merge or link identities when there is strong evidence:

- two owner people are already grouped into the same `shared_space_person`;
- a manual same-person action links accessible rows;
- high-confidence embedding evidence passes stricter thresholds;
- import or migration data provides explicit links.

## Metadata Inheritance

Metadata inheritance is a scoped publication into `shared_space_person`, not a live read of another user's private `person` row.

Metadata contribution is allowed when the source profile belongs to a member of the target space and that member has `shared_space_member.sharePersonMetadata = true`. The first implementation should use this member-level setting for source user `person` profiles. Space profile to space profile inheritance can be added later if there is a clear product need.

For existing spaces, metadata inheritance must not publish private names or birth dates in the same migration that introduces `sharePersonMetadata`. Ship the setting first, then run inheritance through a later job or phase so users/admins can disable sharing before existing metadata is copied into space profiles.

### Name

Auto-inherit `person.name` into `shared_space_person.name` when:

- the target name is empty or currently inherited;
- the source user allows person metadata sharing into that space;
- the source profile has a non-empty name.

Manual edits set `nameSource = manual` and must not be overwritten by background inheritance.

### Birth Date

Auto-inherit `person.birthDate` into `shared_space_person.birthDate` when:

- the target birth date is empty or currently inherited;
- the source user allows person metadata sharing into that space;
- the source profile has a birth date.

Track birth-date provenance separately from name provenance. Manual birth-date edits set `birthDateSource = manual` and lock only that field.

### Type And Species

Type should inherit where compatible. Pet species can inherit when present and when the target is empty or inherited.

### Representative Face And Thumbnail

The representative face for a space person must come from an asset visible in that space. The system must not set a space thumbnail to a private source asset outside the target space.

### Hidden, Favorite, Aliases

Hidden state should not inherit into a space by default. A private hide action should not hide a person for all space members.

Favorite should not inherit into a space profile. It is personal ranking.

Aliases remain user-specific. A user may explicitly promote an alias to a space name, but aliases should not auto-publish.

### Conflict Handling

When multiple allowed source profiles have metadata:

1. Prefer a source profile from a space owner/editor.
2. Prefer the profile belonging to the user who added the asset that created the space person.
3. Prefer the profile with more supporting faces.
4. If conflicting values remain, do not silently guess. Leave the field unchanged in the first implementation; a later suggestions table can surface unresolved conflicts to editors.

## Unified People Resolver

The `/people` page should resolve people from the viewer's accessible timeline scope:

```text
user's own timeline assets
+ assets from shared spaces shown in the user's timeline
+ assets from linked space libraries the user can access
```

The resolver flow is:

```text
accessible assets
  -> visible asset_face rows
  -> face_identity_face.identityId
  -> accessible scoped profiles
  -> one row per identity
```

Display metadata priority:

1. The viewer's own `person` profile for the identity.
2. The viewer's alias on an accessible space profile.
3. The best accessible `shared_space_person` profile.
4. An unnamed fallback.

Counts and thumbnails must be computed only from accessible assets. If an identity has 5,000 total faces and the viewer can access 12, the viewer sees 12.

Navigation from a unified row uses a scoped primary profile:

```text
primaryProfile:
  type: user-person | space-person
  id
  spaceId nullable
```

The frontend can open the user person route when a private profile exists, or a space person route otherwise.

## Filter Panel Support

The filter panel should use the same identity resolver as `/people`.

For global/timeline filtering, person suggestions are grouped by accessible identity. Selecting a grouped person should filter assets by that identity within the same accessible scope, not by one `person.id` or one `shared_space_person.id`.

For a single-space route, suggestions can continue returning space person profiles, but those profiles should be backed by identity. If the route later supports "include all my spaces" or global context, it should switch to identity-grouped suggestions.

Public filter DTOs should not expose raw `face_identity.id`. Use a scoped opaque filter token or a resolver-owned option ID that maps back to the accessible identity set for the request. Existing `personIds` and `spacePersonIds` can remain for backward compatibility, but new identity-grouped filter options should avoid leaking durable internal IDs.

## Global Search Support

Global search should treat people as access-scoped identity groups:

- Person result rows should dedupe across private and space profiles by identity.
- Preview thumbnails should come from accessible assets only.
- Result subtitles or badges may mention accessible source context, such as "Family space", but must not mention spaces the viewer cannot access.
- Clicking a person result should navigate via the scoped primary profile chosen by the resolver.
- Search ranking can use accessible profile names and aliases, but must not rank based on inaccessible names or hidden private profiles.

The global search index can cache identity links internally, but query-time projection must still apply the viewer's asset and space scope.

## Search And Filter Performance

Identity matching must be precomputed by background jobs. The `/people` page, filter panel, and global search must not perform face embedding or vector similarity matching at request time.

Request-time resolvers should use this shape:

```text
accessible asset scope
  -> visible asset_face rows
  -> face_identity_face
  -> grouped identity ids
  -> hydrate only the requested page of scoped profiles
```

The access scope must be applied before grouping by identity. This keeps RBAC and performance aligned: the query only considers assets the viewer can already access.

Resolver guardrails:

- paginate every people and suggestion query; never load all identities for a large account;
- use a two-step query for `/people`: page identity IDs first, then hydrate display metadata/counts/thumbnails for that page;
- limit filter panel people suggestions and global search people rows separately from full people-page pagination;
- choose thumbnails from accessible assets in the page hydration step, not from the global identity representative face;
- avoid `COUNT(DISTINCT ...)` across an unbounded identity set in hot paths unless an `EXPLAIN ANALYZE` proves it is acceptable;
- revalidate any scoped opaque identity filter token against the current viewer's accessible scope before applying it;
- key any cache by user, route scope, timeline-space set, filters, and metadata-sharing version so cached results cannot cross permission boundaries.

Backfill and maintenance jobs should be chunked by `person`, `asset_face`, or `shared_space_person` ranges. They should avoid one large transaction for all identities, and should be retryable/idempotent so partial progress does not corrupt identity links.

If the first implementation cannot keep `/people`, filter suggestions, or global search within acceptable query times on large libraries, add a denormalized read model only after measuring the real query plan. A read model must still be keyed by scoped access inputs or must be projected from accessible assets at read time; it must not become a global list that leaks inaccessible identities.

## Manual Repair

If matching misses a duplicate, users need a same-person repair action.

When a user selects two or more accessible person rows and chooses "Same person":

- the server verifies that the user can access every selected row;
- all selected rows must be type-compatible;
- the merge/link operation must not expose inaccessible source names, assets, counts, or spaces;
- scoped profile metadata remains separate and field locks are respected.

The first implementation can perform a global identity merge when all selected rows are accessible to the actor. Later versions may add reviewable scoped links before global promotion.

Mistakes need a recovery path. At minimum, support detaching a scoped profile from an identity by creating a fresh identity and reassigning that profile's faces. Longer term, retain merge history in a `face_identity_merge` table for more precise splits.

## Implementation Methodology

Implementation must use test-driven development for each phase. For every phase, write the failing tests first, run the focused test command and confirm the expected failure, implement the smallest change that makes the tests pass, then rerun the focused tests and relevant regression suite.

TDD is especially important for RBAC and leakage prevention. Permission tests must be written before resolver or endpoint changes so the implementation proves that names, birth dates, thumbnails, counts, search ranking, filter suggestions, and navigation targets only use data from the viewer's accessible scope.

Each implementation plan should include:

1. the focused red test command;
2. the expected failure before implementation;
3. the green command after implementation;
4. any broader regression command needed for the touched surface;
5. the exact RBAC matrix cases covered by that phase;
6. any ubiquitous-language terms added or changed for that phase.

## Rollout Phases

### Phase 0: Ubiquitous Language Update

Update `docs/docs/developer/ubiquitous-language.md` with the new identity terms and relationship rules before schema or resolver implementation starts. This keeps review language precise: `person` and `shared_space_person` are scoped profiles; `face_identity` is the internal sameness key; identity-grouped results are access-scoped projections.

### Phase 1: Schema And Backfill

Add identity tables and nullable identity/profile source columns.

Add `shared_space_member.sharePersonMetadata` and default it to `true` for new and existing members so current named-library sharing behavior is useful by default. Users can opt out before later metadata inheritance jobs publish their private person labels into spaces.

Backfill:

1. Create one `face_identity` per existing `person`.
2. Set `person.identityId`.
3. Add visible `asset_face` rows for each person to `face_identity_face`.
4. Infer `shared_space_person.identityId` from linked faces.
5. Do not change API behavior yet.

### Phase 2: Space Matching Uses Identity

Change shared-space face matching to find/create space people by `(spaceId, identityId)`.

Auto-inherit name and birth date when permissions and field-source rules allow it.

### Phase 3: Unified People Page

Introduce the access-scoped people resolver and update `/people` to support people from private assets and timeline-enabled spaces.

Return one row per accessible identity, with a scoped primary profile for navigation.

### Phase 4: Filter Panel

Update filter suggestions and filtering to use identity-grouped accessible people in global/timeline contexts.

Keep single-space route compatibility while making space person suggestions identity-backed.

### Phase 5: Global Search

Update person rows and previews in global search to dedupe by accessible identity and choose thumbnails/names from accessible scoped profiles.

### Phase 6: Manual Repair

Add same-person and detach/split actions after the automatic graph is stable.

### Phase 7: Optional Profile Table Unification

Only after the feature stabilizes, consider replacing `person` and `shared_space_person` with a unified `person_profile(scopeType=user|space)` table. This should not be part of the first implementation because it is high-risk for upstream compatibility, OpenAPI, mobile sync, and existing web routes.

## RBAC Rules

- Never expose `face_identity.id` in public DTOs.
- Never resolve display names, thumbnails, counts, favorites, hidden state, aliases, or search ranking from inaccessible profiles or assets.
- `person` remains private user metadata.
- `shared_space_person` remains space-visible metadata.
- Metadata copied from `person` into `shared_space_person` is visible because it has been published into the space profile with permission.
- Counts and thumbnails are always recomputed inside the viewer's accessible asset scope.
- A user in Space A must not infer that the same identity also exists in Space B unless the user can access Space B.

## Testing Plan

### Permission Matrix Tests

Every phase that changes resolver, API, search, filter, or thumbnail behavior must include permission matrix tests. The matrix should cover at least these actor/context combinations:

| Actor                                            | Access                                                    | Expected Result                                                                                           |
| ------------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Owner of source asset and member of target space | Owns named `person`, can access space                     | Space person can inherit permitted name and birth date.                                                   |
| Space owner/editor, not source asset owner       | Can manage space but does not own source `person`         | Can see space-published metadata, cannot read source private profile directly.                            |
| Space viewer, not source asset owner             | Can view space assets only                                | Can see space person fields and accessible thumbnails/counts only.                                        |
| Member of Space A only                           | Cannot access Space B                                     | Does not see Space B names, identities, thumbnails, counts, suggestions, search hits, or ranking effects. |
| Member of Space A and Space B                    | Can access both spaces                                    | Sees one grouped person when both spaces resolve to the same identity.                                    |
| Non-member                                       | No access to space                                        | Receives no people, filter options, thumbnails, search results, or merge targets for that space.          |
| Metadata sharing opt-out member                  | Owns named source `person`, `sharePersonMetadata = false` | Identity can link faces, but name and birth date do not publish into the space profile.                   |
| User with private hidden/favorite/alias state    | Has private curation on source `person`                   | Hidden, favorite, and alias do not leak into shared or global results.                                    |

For each actor/context, tests must assert both positive and negative fields:

- visible names and birth dates come only from allowed scoped profiles;
- inaccessible profile names and birth dates are absent;
- thumbnails are selected from accessible assets only;
- counts include accessible assets only;
- filter suggestions do not include inaccessible identities;
- global search results and ranking do not change because of inaccessible metadata;
- public DTOs never expose `face_identity.id`.

### Phase Coverage

- A newly added asset whose faces already have owner `person.identityId` creates or reuses `shared_space_person.identityId`.
- Same source person added to multiple spaces appears once on `/people` for a viewer in all those spaces.
- Different source users' people dedupe after shared-space evidence links their identities.
- Name and birth date inherit into space people when allowed.
- Manual name and birth-date edits are not overwritten by inheritance.
- Representative faces for space people are selected from assets visible in the target space.
- Filter panel suggestions group accessible people by identity without exposing identity IDs.
- Global search person results dedupe across spaces and private profiles without leaking inaccessible metadata.
- A viewer with access to only one space cannot infer another space's people, counts, names, or thumbnails.
- Hidden, favorite, and alias fields remain scoped and do not leak.
- People, filter, and global search resolvers do not run vector matching at request time.
- Large-library people/filter/search queries are paginated and backed by the required identity/profile indexes.

### Recommended Test Layers

- Repository/medium tests for schema backfill, identity assignment, metadata inheritance, field-source locks, and count/thumbnail scoping.
- Service tests for space matching, people resolver grouping, filter suggestion projection, global search projection, and manual same-person/detach behavior.
- Controller/API tests for DTO shape, forbidden access, non-member behavior, and absence of `face_identity.id`.
- Web tests for `/people`, filter panel, and global search displaying grouped accessible people without rendering inaccessible metadata.
- E2E tests for the highest-risk path: two users, two spaces, one shared identity, one actor with access to both spaces, one actor with access to only one space, and metadata sharing enabled/disabled.
- Performance-oriented repository tests or benchmark scripts for representative large data: at least tens of thousands of people, multiple spaces, overlapping identities, and enough faces/assets to exercise pagination and grouped filtering.
- Query-plan checks for the core `/people`, filter suggestion, and global search identity queries using `EXPLAIN ANALYZE` on representative data before shipping each phase that changes those surfaces.
