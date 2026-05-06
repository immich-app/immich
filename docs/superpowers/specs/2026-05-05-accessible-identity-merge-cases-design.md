# Accessible Identity Merge Cases Design

## Problem

Users expect people they can access through shared spaces to behave like the same person when they upload, browse, filter, and manually merge photos. Today that sameness is incomplete. The system can show duplicates when access arrives after both users already have local people, and some manual merge paths still treat personal people and space people as incompatible row types.

The product rule is:

- A real person or pet should appear once in a viewer's accessible people experience when there is strict evidence that scoped profiles represent the same identity.
- Access changes decide which assets are visible, not whether an already-known identity relationship exists.
- Ambiguous matches must remain separate until a user manually merges them.

## Vocabulary

- **Face identity**: the durable internal sameness key for one real person or pet.
- **Scoped profile**: either a user-owned `person` row or a space-owned `shared_space_person` row.
- **Identity merge**: joining two face identities so their scoped profiles resolve as one visible person when access allows.
- **Physical profile merge**: moving faces between profiles and deleting the source row inside one physical scope, such as `person` to `person` or same-space `shared_space_person` to `shared_space_person`.
- **Strict automatic merge**: an identity merge performed without user confirmation only when the system has one clear compatible candidate.
- **Manual merge**: a user-confirmed merge. Manual merge is required for ambiguous matches.

## Design Direction

Use face identities as the grouping layer. Personal people and space people remain scoped profiles that carry display metadata and access boundaries.

Queries must always enforce current access:

```text
viewer
  -> owned assets and timeline-enabled shared-space assets
  -> visible faces
  -> face identities
  -> accessible scoped profiles
  -> one visible people result per identity
```

Identity merges may persist after a member leaves a space. That is acceptable because access-scoped queries still remove assets and profiles the viewer can no longer access.

## Strict Automatic Merge Policy

Automatic merge is allowed only when all of these are true:

- The operation has a current access bridge, such as shared-space membership or an asset being added to a space.
- Target and source have the same type, for example person-to-person or pet-to-pet.
- Face distance is within the configured facial-recognition threshold.
- There is a single clear candidate. If more than one candidate is inside the threshold, skip automatic merge.
- The merge would not create two profiles for the same identity in the same owner scope or the same space scope.
- Neither side is hidden or ignored in a way that would make the automatic merge surface something the user deliberately suppressed.
- The merge is not blocked by an explicit manual split or do-not-merge rule if that rule exists.

For the first implementation, "single clear candidate" should be implemented conservatively:

- Search enough results to detect ambiguity, not just the best match.
- Auto-merge only when exactly one compatible candidate is returned within threshold.
- If two space people point at the same local candidate, or two local people point at the same space identity in the same pass, skip those candidates and leave them for manual merge.

No suggested-merge state is required in this pass. Ambiguous duplicates remain visible and can be manually merged.

## Reconciliation Scope

Automatic reconciliation must use the same visibility scope as the event that triggered it:

- A personal upload uses the uploader's global people scope. Shared-space evidence is eligible only from spaces that currently contribute to that user's global timeline.
- Adding an asset to a specific space uses that explicit space as the access bridge, even if that member has disabled the space in their global timeline.
- Joining or rejoining a space reconciles the joined space against the new member's local people because membership now grants explicit space access.
- Explicit space jobs must not use people from unrelated spaces unless the user has a separate current access bridge to those spaces.

This keeps `showInTimeline` semantics intact: a timeline-disabled space does not influence global recognition, search, filters, or labels, but it can still be used when the user is acting inside that space.

## Job Semantics

Reconciliation should run as background work wherever it could be expensive:

- Add-member and rejoin flows should queue a member identity reconciliation job after membership is persisted.
- Shared-space face match jobs should queue reconciliation for affected space people after they create or update space evidence.
- Dedup and reconciliation jobs must be idempotent. Re-running the same job should not create duplicate profiles, duplicate face links, or additional visible people.
- Concurrent jobs must be safe. If two jobs try to merge the same identity pair, one should win and the other should observe the merged state or no-op.
- User-facing operations such as adding a member or adding assets should not fail just because reconciliation skipped or failed a candidate.

Identity target selection should be deterministic:

- Manual personal merge targets the selected personal target identity.
- Manual same-space merge targets the selected space target identity after physical profile merge.
- Automatic shared-space reconciliation should prefer the already-accessible space identity as the target when merging a newly created or pre-existing local identity into shared evidence.
- If neither side is clearly preferred, choose the identity with stronger evidence, then by stable id as a tie-breaker.

## Automatic Merge Cases

### Upload After Shared Access, No Local Profile Yet

B is already a member of a space containing A's person. B uploads a new photo of that same person, but B has never had a personal profile for them.

Expected behavior:

- B does not see a second visible person in `/people` or `/explore`.
- The uploaded face is attached to the accessible identity.
- B's uploaded photo appears on the identity-wide person view.
- If B later leaves the space, B still sees B's uploaded photo and loses A's shared-space photos.

The backend may still create a B-owned `person` row as the backing profile for B's face because `asset_face.personId` is owner-scoped. If it does, that profile must be linked to the existing accessible identity before user-facing people results can surface it as a duplicate.

### Upload After Shared Access, Existing Local Duplicate

B is already a member of a space containing A's person. B already has a local profile for the same person from earlier uploads. B uploads another photo of them.

Expected behavior:

- Recognition can use B's local person for `asset_face.personId`.
- The local identity should still be compared with accessible shared identities.
- If the match is strict, B's local identity merges into the accessible shared identity.
- B sees one identity, not one local person and one space person.

### Join After Both Users Already Have Local People

A uploads a photo of a person. B uploads a photo of the same person. A creates space X, adds A's photo to it, then invites B.

Expected behavior:

- Joining or rejoining space X triggers reconciliation for the new member.
- Existing space people in X are compared against B's local people.
- Strict matches merge identities.
- Ambiguous or conflicting matches remain separate for manual merge.

This reconciliation must run after the membership exists, because the membership is the access bridge that makes the comparison valid.

### New Space Evidence While Members Already Exist

A and B are already members of space X. A later adds a photo of the same person to the space, or a linked library sync adds new evidence for that person.

Expected behavior:

- Shared-space face matching creates or updates the space person.
- The new or updated space person is reconciled against existing members' local people.
- Strict local matches merge identities.
- Ambiguous matches remain separate.

This covers the inverse of the join case: access already exists, but the space evidence arrives later.

### Member Adds Their Own Photo To A Space With An Existing Person

Space X already has A's profile for a person. B adds a B-owned photo of the same person to X.

Expected behavior:

- B's face keeps a B-owned backing person profile.
- The space should not keep two space people when the match is strict.
- The B-owned identity and A-backed space identity merge.
- The shared-space profile remains scoped to X and continues to use only faces/assets visible in X.

### Space-Person Dedup

Two space people in the same space can represent the same real person.

Expected behavior:

- If both are identity-less and are a strict match, physically merge the space profiles.
- If one or both already have identities and are a strict match, physically merge the same-space profiles first, then merge supporting identities after the same-space profile conflict has been removed.
- If physical profile merge cannot safely resolve the same-space conflict first, skip automatic identity merge.

The current "skip identity-backed space people" behavior is too conservative for this policy.

### Asset Or Face Removal

A shared-space asset can be removed from a space, deleted, hidden, or lose face evidence after a recognition reset.

Expected behavior:

- Identity links do not need to be undone solely because evidence was removed.
- Removed or inaccessible assets stop contributing to visible counts, thumbnails, filters, and detail timelines.
- If a space person loses all backing faces, cleanup or backfill should prevent it from appearing as a visible global person.
- If face evidence is regenerated later, reconciliation should be able to reattach to the existing identity without creating duplicates.

### Manual Personal Merge

Two B-owned personal people are merged.

Expected behavior:

- Keep the existing physical personal merge behavior: reassign faces from source to target and delete the source person.
- Merge the source identity into the target identity.
- Backfill shared-space metadata for affected identities.

### Manual Same-Space Merge

Two space people inside the same space are merged by an editor.

Expected behavior:

- Keep the existing physical same-space merge behavior: reassign `shared_space_person_face` rows, migrate aliases, and delete the source space person.
- Merge supporting identities when compatible.
- Re-run dedup and metadata backfill for affected identities.

## Cross-Scope Manual Merge

Manual merge must support scoped profiles from different physical tables:

- personal person + space person
- space person + space person across different spaces
- mixed batches containing personal and space profiles

Expected behavior:

- Use scoped identity repair, not physical row merge.
- Validate current access to every selected scoped profile.
- Validate same type.
- Validate that the identity merge would not leave two different personal profiles for the same owner on one identity.
- Validate that the identity merge would not leave two different space profiles in the same space on one identity.
- Merge identities with source `manual`.
- Do not reassign shared-space faces into a personal person.
- Do not delete a space person row in a cross-scope merge.

The old scope-specific APIs remain valid for same-scope physical merges:

- `/people/:id/merge` is personal-to-person.
- `/spaces/:spaceId/people/:personId/merge` is same-space space-person-to-space-person.
- `POST /people/same-person` is the cross-scope identity repair path.

Any UI that allows mixed candidates must call the scoped identity repair endpoint. It must not send a space-person id to the personal merge endpoint or a personal person id to the same-space merge endpoint.

## Leaving Or Losing Access

Identity merges are not undone when access changes.

When B leaves or is removed from a space:

- B keeps B-owned photos and B-owned personal profiles.
- B loses A's shared-space photos and space-only profiles from global people, search, filters, and timeline.
- If B had uploaded photos of the same person while access existed, B still sees B's uploaded photos under the same local identity-backed profile.
- If B rejoins later, the previously merged identity becomes unified again through current access.

When a space is deleted or face recognition is disabled:

- Personal profiles and identity links remain.
- Space profiles stop contributing to global results once access or space evidence is gone.
- Backfill should refresh metadata so inaccessible space profiles no longer determine visible labels or thumbnails.

When a member disables `showInTimeline` for a space:

- That space stops contributing to global people, search, filters, metadata inheritance, and personal-upload reconciliation.
- Explicit space pages and explicit space jobs may still use that space's people because the user still has direct membership access.
- Re-enabling `showInTimeline` should restore global contribution after normal sync or backfill.

## Non-Merge Cases

Automatic merge must not happen for:

- person-to-pet or any incompatible type pair
- no current access bridge
- no face embedding
- no candidate within threshold
- multiple candidates within threshold
- same-owner personal profile conflicts
- same-space space profile conflicts that cannot be physically resolved first
- hidden or ignored profiles that should not be surfaced automatically
- profiles blocked by a manual split or do-not-merge rule

Names alone must not drive automatic merging. Names may help display metadata after identities are merged, but face evidence and access are the merge gates.

## TDD Requirements

Implementation must follow red-green-refactor:

1. Add the smallest failing test for one behavior.
2. Run that focused test and verify it fails for the expected reason.
3. Write the minimal production code to pass that test.
4. Re-run the focused test and the nearest affected suite.
5. Refactor only after the tests are green.
6. Repeat for the next behavior.

New or still-broken behaviors must be captured as red tests before implementation. Behaviors already fixed on this branch should keep their existing regression tests and get additional red tests only when new edge-case behavior is added.

- Joining a space after A and B already have separate local profiles for the same person does not reconcile them.
- Adding new evidence for a person to a space after A and B are already members does not reconcile B's existing local profile for that person.
- Automatic reconciliation does not yet prove ambiguity, hidden-profile, timeline-disabled, idempotency, and concurrency behavior.
- Any UI path that can select a personal + space-person merge candidate must use scoped identity repair and must not fall through to the legacy physical merge endpoints.

Do not add production reconciliation code until its red test has been observed failing. Commit history does not need one commit per test, but the working sequence should be test-first.

## Error Handling

Automatic reconciliation should be best-effort:

- Skip ambiguous candidates without failing the user action.
- Log incompatible identity or profile conflicts at debug or warn level with profile ids and space id.
- Do not block adding a member or adding an asset because reconciliation could not merge a candidate.
- Queue metadata backfill for identities that were merged.

Manual merge should fail clearly:

- inaccessible selected profile: bad request or forbidden, depending on the existing access semantics
- incompatible type: bad request
- same-scope conflict: bad request explaining that the conflicting profiles must be merged in their scope first
- stale profile id: not found or bad request

## Testing

Add focused unit tests first, then medium or route tests where the behavior depends on query access rules.

The implementation plan should name the exact test file for each behavior and should not mark an implementation step complete until its red and green runs have both been observed.

Required automatic merge tests:

- B uploads a photo of a person after joining a space with that same accessible person and has no local profile yet; one visible identity is produced and B keeps B's photo after leaving.
- B uploads a photo of a person after joining a space with that same accessible person and already has a local duplicate; strict match merges the local identity into the accessible shared identity.
- A and B already have local profiles for the same person, then B joins A's space; add-member reconciliation merges strict matches.
- A adds evidence for a person to a space after B is already a member; new-space-evidence reconciliation merges B's existing local profile for that person.
- B adds a B-owned photo of a person to a space with A's profile for that same person; space dedup and identity merge produce one visible identity.
- Ambiguous matches within threshold are skipped.
- Type mismatches are skipped.
- Same-owner and same-space conflicts are skipped.
- Hidden or ignored profiles are not automatic merge targets.
- Re-running the same reconciliation job is idempotent.
- Two concurrent reconciliation jobs for the same identity pair do not produce duplicate profiles or failed user-visible work.
- A match from a timeline-disabled space is not used for personal-upload reconciliation, but is eligible in explicit space scope.

Required lifecycle tests:

- After B leaves a space, B still sees B-owned photos of the person and no longer sees A's shared-space photos of that person.
- A shared-space profile id stops resolving for B after B loses access.
- B rejoins later and the identity resolves as unified again.
- Disabling `showInTimeline` removes the space from global people and personal-upload reconciliation.
- Re-enabling `showInTimeline` restores global identity grouping after sync or backfill.
- Removing an asset from a space removes its contribution from counts, thumbnails, filters, and detail timelines without splitting identities.
- Face-detection reset or missing representative faces do not make stale space people visible globally.

Required manual merge tests:

- personal + personal still uses physical personal merge and identity merge.
- same-space space + space still uses physical space merge and identity merge.
- personal + space-person uses scoped identity repair and does not throw.
- space-person + space-person across different spaces uses scoped identity repair.
- mixed batch uses scoped identity repair unless every profile is in the same physical scope.
- cross-scope merge rejects inaccessible profiles, type mismatches, and same-scope conflicts.

Required web tests:

- The personal detail merge UI calls `mergeScopedPeople` when a selected candidate has a space primary profile.
- The space person detail merge UI calls `mergeScopedPeople` for mixed personal/space candidates.
- Any remaining merge modal that can receive mixed candidates uses scoped refs instead of raw `/people/:id/merge`.
- Cross-scope manual merge refreshes the visible identity row and does not navigate to an inaccessible profile after merge.
- Leaving a space or disabling `showInTimeline` updates the people/detail page to show only currently accessible assets.

Required API and repository tests:

- Scoped repair rejects raw identity ids and inaccessible scoped profile refs.
- Identity merge refuses incompatible types before moving face links.
- Identity merge either preflights same-scope conflicts or reports them so automatic reconciliation can skip safely.
- Accessible people, filter suggestions, search suggestions, and person detail timelines all return one row per accessible identity and only accessible assets.
- Shared-space thumbnail selection never uses a face asset outside the explicit space.

## Non-Goals

- Do not add suggested duplicates in this pass.
- Do not expose raw `face_identity.id` values.
- Do not unmerge identities on space leave.
- Do not publish private personal metadata beyond the existing metadata inheritance rules.
- Do not make names or aliases automatic merge evidence.
