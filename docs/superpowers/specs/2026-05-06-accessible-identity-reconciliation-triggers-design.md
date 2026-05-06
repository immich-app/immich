# Accessible Identity Reconciliation Triggers Design

## Context

This spec extends:

- `docs/superpowers/specs/2026-05-01-global-face-identities-design.md`
- `docs/superpowers/specs/2026-05-05-accessible-identity-merge-cases-design.md`

Those documents define the durable model: `face_identity` is the internal sameness key, while `person` and `shared_space_person` remain scoped profiles. This document focuses on the trigger and convergence rules for member joins, post-join uploads, space evidence, leave/rejoin, and multi-user ordering cases.

## Problem

Users upload photos into personal libraries and shared spaces. When a user gains access to a shared-space person, future uploads of that same real-world subject should link into the accessible identity instead of creating a visible duplicate.

The current bug class is that reconciliation is incomplete across event ordering:

- A user can join a space, upload a matching private photo later, and receive a separate visible personal person.
- A late member can join an already reconciled space and cause existing members' personal people visibility to change incorrectly.
- Global people or explore pages can route to a space-person detail page, which then shows only space-scoped photos instead of all photos for the accessible identity.
- If a space person is not materialized before reconciliation runs, strict matches can be missed and duplicates can persist.

## Design Goals

- One viewer-visible person per strict accessible identity in global people and explore views.
- User-owned uploaded assets remain reachable through that user's personal people view, even when the same identity is represented in a shared space.
- A shared space shows one space person for the subject when the space contains assets with that face.
- Automatic reconciliation is strict only: exactly one compatible accessible candidate can merge automatically.
- Ambiguous cases remain separate for manual merge. No suggestions table is required for this pass.
- Leaving a space removes access to the space profile and space assets, but must not delete, hide, or orphan the leaving user's owned profile or owned assets.
- Reconciliation is convergent and idempotent. Re-running join, upload, face-match, and reconciliation jobs should not create duplicates or remove scoped profiles.

## Non-Negotiable Invariants

- `asset_face.personId` must remain owner-scoped. A face from B's asset must not be assigned to A's `person` row.
- Cross-scope automatic reconciliation merges or links identities. It must not physically merge `person` rows with `shared_space_person` rows.
- Same-owner personal profile conflicts block automatic identity merge. If the merge would put two different personal profiles for the same owner on one identity, skip it.
- Same-space profile conflicts block automatic identity merge unless the same-space physical dedup has already resolved the space profile conflict.
- Hidden or ignored profiles are not automatic merge sources or targets.
- Name, alias, or birth date alone are never merge evidence.
- Access is computed at query time. A persisted identity relationship must not grant access to assets, metadata, thumbnails, counts, or profiles the viewer cannot currently access.
- A/B visibility must be unchanged by C joining a space except where a legitimate identity merge makes already accessible duplicates collapse into one visible row.
- Viewer-owned personal profiles are preferred as global primary profiles when they have visible supporting assets. A space profile must not make the viewer's own person disappear from global people.

## Approaches Considered

### Approach A: Add More Hooks To `SharedSpaceService`

Add missing queue calls around member joins, space face matching, and upload-related code paths while keeping the strict reconciliation code inside `SharedSpaceService`.

Pros:

- Smallest immediate code movement.
- Fits the existing `SharedSpaceIdentityReconciliation` job.
- Low migration risk.

Cons:

- Upload reconciliation is not really owned by shared-space code.
- Strict candidate rules can diverge across join, upload, and explicit space flows.
- Harder to test as a complete identity policy.

### Approach B: Central Accessible Identity Reconciliation Service

Introduce a focused reconciliation policy component that existing job handlers call. The implementation can start as an extracted private helper if needed, but the design boundary should be shared by join, upload, space-add, and rerun jobs.

Pros:

- One strict candidate policy for all triggers.
- Easier to prove ambiguity, access scope, conflict checks, and idempotency.
- Gives post-join upload a natural home without coupling personal upload logic to space internals.
- Supports focused unit tests around claim generation and medium tests around access-visible behavior.

Cons:

- Slightly more refactor surface.
- Needs careful integration with existing job names and repositories.

### Approach C: Query-Only Deduplication

Do not merge identities eagerly. Instead, make global people and explore queries collapse accessible profile rows by embedding or by a runtime grouping layer.

Pros:

- Avoids identity mutation during background jobs.
- Can hide some duplicates quickly.

Cons:

- Does not fix stable identity semantics for detail pages, filters, search, thumbnails, or future uploads.
- Expensive and fragile because query behavior must repeat matching logic.
- Does not solve cross-route consistency.

Recommendation: use Approach B. It is the most consistent with the existing face identity design. Implementation may be incremental, but all triggers should delegate to the same strict reconciliation policy.

## Recommended Architecture

Add or extract an `AccessibleIdentityReconciliationService` policy boundary. Existing services can keep their public job handlers, but they should delegate candidate discovery, ambiguity filtering, conflict preflight, and merge application to this shared policy.

Suggested operations:

```text
reconcileMemberWithSpace(spaceId, userId)
reconcileSpaceEvidence(spaceId, spacePersonId?)
reconcilePersonalFaceUpload(userId, assetFaceId)
reconcilePersonalIdentityAgainstAccessibleSpaces(userId, identityId)
```

The exact class name is flexible. The important part is that all operations use the same candidate rules:

1. Identify the access bridge for the triggering event.
2. Load only profiles visible through that bridge.
3. Search enough strict candidates to detect ambiguity, not just the closest match.
4. Build identity merge claims with source identity, target identity, profile refs, evidence distance, and bridge type.
5. Drop claims where one source maps to multiple targets or one target maps to multiple sources in the same pass.
6. Preflight same-owner and same-space conflicts.
7. Choose a deterministic target identity.
8. Merge identities only after conflicts are clear.
9. Queue metadata and representative-face backfill for affected identities.

Target selection must be stable:

- Join reconciliation merges the joining member's local identity into the already accessible space identity.
- Personal upload reconciliation merges the new or existing local identity into the single accessible shared identity when the access bridge is global people scope.
- Explicit add-to-space reconciliation merges the owner-backed identity into the existing space identity when a matching space identity exists.
- If both sides are local-only or neither side is clearly preferred, choose the identity with stronger evidence, then the stable id as a tie-breaker.

Already-merged identities should no-op, but still allow missing scoped links or metadata backfill to be repaired.

## Trigger Spec

### Member Join Or Rejoin

When a member joins or rejoins a face-recognition-enabled space:

- Persist membership first. Membership is the access bridge.
- Ensure space people for existing space assets are materialized before reconciliation can complete.
- Compare the joined member's local people against the joined space's people.
- Merge only strict unambiguous matches.
- Do not reconcile unrelated spaces through this trigger.
- Do not alter existing members' scoped profiles except through legitimate identity merges.

If reconciliation runs before materialization, the job must be harmless and convergent:

- Either queue or depend on `SharedSpaceFaceMatchAll` first.
- Or detect that no materialized space people exist and requeue/defer reconciliation.
- A later materialization pass must converge to the same one-identity result.

### Personal Upload After Shared Access

When a user uploads a private asset after already having access to a matching shared-space identity:

- The upload pipeline may create an owner-scoped backing `person` row for `asset_face.personId`.
- That backing profile must be linked to the strict accessible identity before it can remain visible as a duplicate after jobs drain.
- Candidate space identities come only from the uploader's global people scope: owned assets plus timeline-enabled spaces.
- Timeline-disabled spaces must not influence global personal-upload recognition.
- If exactly one strict accessible identity matches, create/link/merge the local identity into that identity.
- If zero strict matches exist, keep or create the local identity.
- If multiple plausible matches exist, keep or create the local identity and leave the case for manual merge.

This rule covers the case where the uploader had no prior local person. The implementation must not require a pre-existing local profile before it can link to an accessible shared identity.

### Existing Member Adds An Asset To A Space

When a member adds an asset containing the subject to a specific space:

- The explicit space is the access bridge even if `showInTimeline` is disabled for that member.
- Shared-space face matching should materialize or update the space person for that space.
- The owner-scoped backing person remains owned by the asset owner.
- The space person and owner identity should reconcile if the match is strict and conflict-free.
- Space people in the explicit space should dedup when strict evidence says they are the same subject.

### New Space Evidence While Members Already Exist

When a shared library sync, asset add, or face-match job creates or updates a space person in a space that already has members:

- Reconcile the affected space person against current members' local people.
- The job can scope to the affected space person for efficiency.
- Ambiguity should be evaluated per member and per pass.
- Re-running the full-space reconciliation job must produce the same final state.

### Leave Or Access Loss

When a member leaves a space, is removed, or disables timeline contribution:

- Do not unmerge identities.
- Do not delete or hide the member's owned personal profiles.
- Do not remove the member's owned face links.
- Global people, search, filters, thumbnails, counts, and detail timelines must recompute from currently accessible assets only.
- Explicit space profiles must no longer resolve for the former member.
- Rejoin should restore current-space contribution and allow strict reconciliation to no-op or repair missing links without duplicates.

If the space retains an asset owned by the former member, retention follows existing space asset rules. Regardless of retention, the former member keeps personal access to their owned asset.

## Candidate And Ambiguity Policy

Automatic reconciliation can merge only when all of these are true:

- The trigger provides a current access bridge.
- Both profiles have the same type.
- At least one eligible face embedding exists.
- Exactly one compatible candidate is inside the configured strict threshold.
- The candidate is visible through the trigger scope.
- The merge conflict preflight reports no same-owner personal conflict and no unresolved same-space conflict.
- Neither profile is hidden or ignored.
- No manual split or do-not-merge block exists if such a block is implemented.

Automatic reconciliation must skip:

- zero matches
- more than one strict candidate
- same-name but non-strict embedding matches
- two accessible spaces exposing different identities that both match the uploaded face
- two local profiles for the same user that both match one space person
- same-owner or same-space profile conflicts
- incompatible person/pet type pairs
- hidden or ignored profiles

If two accessible spaces expose profiles that already resolve to the same `face_identity`, they count as one candidate. If they resolve to different identities, the upload is ambiguous and must not auto-merge.

## View And Navigation Semantics

Global `/people` and `/explore` results must be identity-grouped, not scoped-profile grouped.

For each visible identity, select a global primary profile in this order:

1. The viewer's own `person` profile with currently visible supporting assets.
2. The viewer's own `person` profile for that identity, if it exists and is not hidden.
3. The viewer's alias on an accessible space profile.
4. The best accessible `shared_space_person` profile.
5. An unnamed fallback profile.

Global people and explore navigation must open an identity-wide detail view for the viewer's global scope. It must not route to an explicit space-person detail page if that page will show only space-scoped photos.

Acceptable implementation options:

- Add or reuse a scoped identity detail token for global identity rows.
- Make global detail requests resolve by primary scoped profile plus global context.
- Keep explicit `/spaces/:spaceId/people/:personId` routes space-scoped, but do not use them as the global detail target unless the intended result is space-only.

Explicit space people pages remain space-scoped. They should show only assets in that space unless the UI explicitly switches to a global identity context.

## High-Value Scenario Matrix

| ID  | Setup                                                                                                                           | Trigger                                                                       | Expected result                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A has a personal profile, creates a space, adds an asset, B joins with no local profile.                                        | B uploads a matching private photo after joining.                             | B sees one global person. B's owned photo is included. Space counts do not include B's private asset.                                                                       |
| 2   | A has a personal profile, creates a space, adds an asset, B joins with a matching local profile, C joins with no local profile. | C uploads a matching private photo after joining.                             | A, B, and C each see one global person. A and B keep their visible personal people. C gets consistent visibility after upload.                                              |
| 3   | A and B both have matching local profiles before the space exists.                                                              | A creates a space, adds an asset, then B joins after the space person exists. | B's local identity reconciles into the shared identity. B sees one global person.                                                                                           |
| 4   | A and B both have matching local profiles before the space exists.                                                              | A invites B before space people materialize.                                  | Materialization and reconciliation converge. B sees their local person immediately and one grouped identity after jobs drain.                                               |
| 5   | A and B are already in the space. B has no local profile.                                                                       | B uploads a matching private photo and does not add it to the space.          | B does not get a duplicate visible person. Space people/counts do not include B's private asset.                                                                            |
| 6   | A and B are already in the space. B has no local profile.                                                                       | B uploads a matching photo and adds it to the space.                          | B sees one global person. The space person asset count increases. B's asset remains owned by B.                                                                             |
| 7   | C uploads a matching photo before joining, so C has a local profile.                                                            | A invites C to the existing space.                                            | C's local identity reconciles into the accessible shared identity. A and B visibility is unchanged.                                                                         |
| 8   | C joins first with no local profile.                                                                                            | C uploads a matching photo after joining.                                     | Post-upload reconciliation finds the accessible space identity. No visible duplicate remains after jobs drain.                                                              |
| 9   | A and B are reconciled in a space. C has a local matching profile before joining.                                               | C joins the space.                                                            | C sees one global person. A and B still see their personal people before and after C joins. The space still has one space person.                                           |
| 10  | Global explore row has only a space profile as primary profile.                                                                 | Viewer opens the row from global explore.                                     | Detail shows all globally accessible photos for the identity, not only assets from that one space.                                                                          |
| 11  | A and B are reconciled in a space. C has no local matching profile.                                                             | C joins the space and does not upload anything.                               | C sees the accessible space person in global people if the space contributes to C's timeline. No C-owned profile is created. A/B visibility and space people are unchanged. |

## Ambiguous And Manual Cases

| Case                                                                                                                 | Expected result                                                                     |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| C joins a space with two accessible space people whose embeddings both match C's uploaded face inside the threshold. | No automatic merge. C keeps or gets a local profile. Manual merge is required.      |
| C has two local profiles that both strictly match one space person.                                                  | No automatic merge. Manual local cleanup or scoped identity repair is required.     |
| A space has one person with the same name but a non-strict embedding match.                                          | No automatic merge. Name is display metadata only.                                  |
| Two spaces expose different identity ids that both match a new upload.                                               | No automatic merge unless both space profiles already resolve to the same identity. |
| The target merge would create two profiles for one owner or one space on the same identity.                          | No automatic merge. Same-scope merge or manual repair must happen first.            |

## Leave And Rejoin Cases

| Case                                                                                  | Expected result                                                                                                                                                           |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B uploaded matching private photos while linked to A's space identity, then B leaves. | B still sees B's owned person/assets. A's space profile/assets disappear from B's accessible graph.                                                                       |
| B uploaded matching photos and added them to the space, then B leaves.                | B keeps owned personal access. Other members may keep seeing retained space assets according to existing retention rules. B does not see the space profile after leaving. |
| B leaves and later rejoins.                                                           | Reconciliation no-ops or repairs links. B returns to one visible global person without duplicates.                                                                        |
| B disables `showInTimeline` for the space.                                            | The space stops influencing global people and personal-upload reconciliation. Explicit space pages remain available while B is still a member.                            |
| B re-enables `showInTimeline`.                                                        | Global people grouping includes the space again after normal sync/backfill.                                                                                               |

## Race And Ordering Cases

- Join reconciliation before space-person materialization must be prevented or harmless.
- Upload face assignment before shared-space face match must converge after later reconciliation.
- Multiple matching uploads in quick succession must create at most one visible local/global identity result.
- Concurrent reconciliation jobs for the same identity pair must no-op cleanly after one merge wins.
- Re-running `SharedSpaceFaceMatchAll`, `SharedSpacePersonDedup`, metadata backfill, and identity reconciliation must be idempotent.
- Reconciliation failures should not fail the user-facing join, upload, or add-to-space action. They should log and leave visible duplicates for manual repair.

## TDD Requirements

Implementation must follow red-green-refactor:

1. Add the smallest failing test for the behavior.
2. Run the focused test and confirm it fails for the expected reason.
3. Add the minimal production change.
4. Re-run the focused test.
5. Run the nearest affected suite.
6. Refactor only after green.

The implementation plan must map every production change to at least one red test. For each test-first step, record the focused command, the expected red failure, the green run, and the nearest suite run. Do not add production reconciliation code for a behavior until the red failure has been observed.

The first red tests should capture current broken behavior:

- A/B have matching local profiles, A creates a space and invites B, then C with a matching local profile joins; A and B must still see their personal people and the space must still show one space person.
- A/B are already reconciled in a space, C joins with no local profile, then C uploads a matching private photo; C must not get a duplicate and A/B visibility must be unchanged.
- A global explore result backed only by a space profile must open identity-wide global detail, not a space-only detail page.
- A global explore result backed by a space profile must expose a thumbnail URL that resolves for the viewer and uses an accessible face.
- A member uploads a matching private photo after joining a space and having no prior local profile; no duplicate visible person remains after jobs drain.

Required unit coverage for the central reconciliation policy:

- No access bridge produces no merge claim.
- Zero strict candidates produces no merge claim.
- Exactly one strict compatible candidate produces one merge claim with the expected target identity.
- Multiple strict candidates produce no merge claim.
- Multiple scoped profiles that already resolve to the same identity count as one candidate.
- Source-to-multiple-target and target-to-multiple-source claims are filtered out in the same pass.
- Same-owner and same-space conflicts block automatic merge.
- Hidden, ignored, deleted, or missing-profile candidates are skipped.
- Type mismatches are skipped before merge preflight.
- Missing embeddings or missing face links are skipped without throwing.
- Already-merged identities no-op while still allowing backfill to be requested.
- Target selection is deterministic for join, personal upload, explicit space add, and tie-breaker cases.
- Merge-application failure after candidate selection does not fail the user-facing trigger and leaves state retryable.

Required medium or integration coverage:

- Post-join private upload with no prior local profile.
- Post-join upload added to the space with no prior local profile.
- Post-join private upload with an existing local duplicate.
- Late member with no local profile and no upload sees the accessible space person without creating a local profile.
- Late member with prior local profile while existing members remain visible.
- Join before space-person materialization.
- New space evidence while members already exist.
- Existing member adds an owned matching asset to a space.
- Ambiguous multi-space strict match skips automatic merge.
- Two local candidates matching one space person skips automatic merge.
- Same-name non-strict match skips automatic merge.
- Same-owner conflict skips automatic merge.
- Same-space conflict skips automatic merge unless physical dedup resolves it first.
- Hidden or ignored candidates are skipped.
- Type mismatches are skipped.
- Leave preserves owned personal visibility and removes space visibility.
- Leave and rejoin converges without duplicates.
- Timeline-disabled space does not influence global personal-upload reconciliation but remains eligible for explicit space actions.
- Job reruns are idempotent.
- Concurrent reconciliation jobs do not create duplicate profiles or user-visible failures.
- Space disabled, member removed, asset removed, or face deleted while a reconciliation job is running causes a skip or retryable no-op, not stale visibility or a user-facing failure.
- Representative-face repair keeps stale or missing representative faces from making space people disappear from global or explicit space people after jobs drain.

Required API/query/web coverage where applicable:

- Global people and explore return one row per accessible identity.
- Global detail for an identity includes all currently accessible assets and excludes inaccessible assets.
- Space-person detail remains space-scoped.
- Global people, explore, filter, search, and album/map suggestions generate thumbnail URLs that resolve for the viewer and never use inaccessible faces.
- A stale global row whose primary profile was a space person stops resolving for a viewer after they lose access, while the recomputed global row still resolves through owned assets if any remain.
- Filter suggestions and search suggestions group by accessible identity and do not expose raw `face_identity.id`.
- Cross-scope manual merge of personal profile plus space profile uses scoped identity repair and does not throw.
- Manual ambiguity remains visible and mergeable by user-confirmed repair.

## Acceptance Criteria

- Every trigger that can introduce new face evidence also queues or invokes the central strict reconciliation policy.
- Strict automatic merge happens only with one compatible accessible candidate.
- Ambiguous matches never merge automatically.
- User-owned personal profiles and owned assets survive joins, late-member reconciliation, leaves, and re-runs.
- Explicit space views show space-scoped people and assets.
- Global people and explore views show identity-scoped people and identity-wide accessible detail.
- Existing access controls continue to determine what profiles, metadata, thumbnails, counts, and assets are visible.

## Non-Goals

- No fuzzy automatic merge.
- No name-only automatic merge.
- No suggested-duplicates UI in this pass.
- No raw `face_identity.id` exposure in public DTOs.
- No identity unmerge on space leave.
- No change to space asset retention rules.
- No publication of private personal metadata beyond existing metadata inheritance rules.
