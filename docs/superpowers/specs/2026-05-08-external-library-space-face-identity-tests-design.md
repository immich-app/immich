# External Library Space Face Identity Tests Design

Date: 2026-05-08

## Context

Global People and Space People statistics classify faces through different backing data:

- Global People uses `face_identity_face` identity links across the user's accessible timeline scope.
- Space People uses `shared_space_person_face` rows scoped to the selected shared space.

This difference is correct in principle, but it is easy for linked/external-library spaces to drift. A face can have a valid global identity while the selected space has no space-person link, a stale link, or a link to the wrong space person. In that state the global People view reports the face as assigned, while the Space view reports it as unassigned.

The personal instance investigation found a small version of this condition, and a larger report showed the same detected-face count but dramatically different assigned/unassigned buckets between global and space views. Multiple external libraries linked into one shared space are the likely high-volume path that exposes the problem.

## Goals

- Add durable regression coverage for spaces that link multiple external libraries.
- Prove face identity statistics stay consistent when the same identity has faces spread across several linked libraries.
- Prove direct space assets and linked-library assets are de-duplicated by face/asset identity.
- Cover both read-side aggregate invariants and mutation/job behavior that creates or repairs space-person links.
- Reproduce the stale or wrong `shared_space_person_face` condition that makes Space People show globally assigned faces as unassigned.
- Require red-first TDD checkpoints for every regression and repair behavior.
- Keep tests targeted and deterministic; use medium repository tests for real SQL invariants and service specs for job orchestration.

## Non-Goals

- Do not redesign face identity reconciliation rules in this test-suite work.
- Do not add slow full-stack browser tests for this coverage.
- Do not rely on real ML inference, real filesystem scans, or external-library watcher behavior.
- Do not assert exact production-size performance characteristics; this suite checks correctness with compact fixtures.

## Test Strategy

Use a layered suite.

Repository medium tests are the source of truth for database behavior. They should construct real rows with `ctx.newUser`, `ctx.newLibrary`, `ctx.newAsset`, `ctx.newAssetFace`, `ctx.newSharedSpace`, `ctx.newSharedSpaceLibrary`, `face_identity_face`, `shared_space_person`, and `shared_space_person_face`.

Service tests should cover orchestration decisions that are awkward to prove through repository methods alone: `SharedSpaceLibraryFaceSync`, `SharedSpaceFaceMatchAll`, stale assignment handling, dedup/reconciliation queueing, and face-recognition-disabled skips.

Avoid one giant end-to-end test. Prefer small scenarios where each test has one reason to fail.

## TDD Execution

Implementation must follow red-green-refactor for each behavior cluster.

1. Add the smallest failing test for the behavior.
2. Run the targeted spec and capture the expected failure.
3. Implement only enough production code to satisfy that test.
4. Rerun the same targeted spec and confirm it passes.
5. Run the adjacent regression suite for the touched layer.
6. Refactor only after the tests are green, then rerun the same targeted suite.

Required red-first checkpoints:

- **Counting fixtures:** add repository medium tests before changing aggregate SQL.
- **Stale/missing repair:** add the failing stale-link, missing-link, and wrong-identity repair tests before changing matching or repair logic.
- **Job-path integration:** add a real DB service invocation test before changing `SharedSpaceLibraryFaceSync` or `SharedSpaceFaceMatchAll`.
- **Scope boundaries:** add archived, timeline opt-out, unlink/relink, and multi-space tests before changing scope filters or cleanup behavior.

Do not batch several production fixes before seeing at least one targeted test fail for the bug it is meant to catch.

## Fixture Model

The canonical fixture for multi-library space identity tests:

```text
owner A
member B
space S, faceRecognitionEnabled = true
library L1 owned by A, linked to S
library L2 owned by A, linked to S
optional library L3 owned by another accessible user, linked to S
outside library LX, not linked to S
identity I1 with faces in L1 and L2
identity I2 with faces in one library only
unassigned face U in a linked library
optional direct asset D added to S and also reachable through L1
```

Each fixture should explicitly create:

- personal `person` rows where global identity membership is required
- `face_identity`/`face_identity_face` rows for identity-backed faces
- `shared_space_person` rows for space identities
- `shared_space_person_face` rows when the test needs the space assignment to be correct

When a test is about matching jobs, let the service under test create or attach the `shared_space_person_face` rows instead of pre-seeding them.

## Test Groups

### A. Multi-Library Identity Counting

Add repository medium tests for global and space statistics.

1. **Same identity across multiple linked libraries counts once**
   - Create one identity with faces in `L1` and `L2`.
   - Link both libraries into one space.
   - Seed a single space person with the same identity and link all relevant faces.
   - Assert global accessible People stats count one visible identity.
   - Assert Space People stats count one visible person key.
   - Assert detailed face stats classify all identity faces as assigned visible.

2. **Multiple identities across multiple libraries preserve buckets**
   - Create identity `I1` in `L1` and `L2`, identity `I2` in `L2`, plus one unassigned face.
   - Assert detected equals assigned visible plus assigned hidden plus unassigned for both global and space detailed stats.
   - Assert global and space assigned/unassigned counts match when their asset scopes are intentionally identical.

3. **Direct plus linked-library paths dedupe faces once**
   - Add the same asset directly to the space and also include it through a linked library.
   - Assert detected face count is one per face ID, not one per access path.
   - Assert person count is one per identity/person key.

4. **Outside libraries stay out of space and global member scope**
   - Create library `LX` with identity-backed faces but do not link it into the space.
   - Assert member-facing global accessible stats do not include `LX`.
   - Assert selected-space stats do not include `LX`.

### B. External Library Face Sync

Add service tests around `SharedSpaceService`.

1. **One linked library attaches identity-backed faces to an existing space person**
   - Mock a library batch with one asset.
   - Mock `getAssetFacesForMatching` returning a face with `personId` and `identityId`.
   - Mock `getSpacePersonByIdentity` returning an existing space person.
   - Assert `addPersonFaces` is called with that space person and the face.

2. **Multiple linked libraries feed the same identity-backed space person**
   - Exercise two `SharedSpaceLibraryFaceSync` calls or a compact helper that invokes matching for assets from `L1` and `L2`.
   - Assert both faces attach to the same identity-backed space person.
   - Assert no duplicate space person is created for the second library.

3. **Library sync queues follow-up work when assignments change**
   - Assert `SharedSpacePersonDedup` is queued after sync.
   - Assert `SharedSpaceIdentityReconciliation` is queued when any space person was affected.

4. **No faces or disabled recognition are no-ops**
   - Library has no assets with faces: no people created, dedup may still be queued according to current behavior.
   - Space has face recognition disabled: sync is skipped.

### B2. Real DB Job-Path Integration

Add at least one medium integration test that invokes the real service path against real repository state. The job queue may remain mocked, but the DB reads and writes must be real.

1. **Library face sync creates real space-person links across multiple linked libraries**
   - Create `L1` and `L2`, both linked to one space.
   - Create identity-backed faces in both libraries for the same identity.
   - Invoke `handleSharedSpaceLibraryFaceSync` once for each linked library.
   - Assert the database has one identity-correct `shared_space_person` for the identity in the selected space.
   - Assert all relevant faces have exactly one selected-space `shared_space_person_face` row pointing to that space person.
   - Assert detailed Space People stats classify those faces as assigned visible.

2. **Full-space rematch repairs existing production drift**
   - Seed a stale or missing assignment for an identity-backed linked-library face.
   - Invoke `handleSharedSpaceFaceMatchAll` with real repositories.
   - Assert the stale selected-space assignment is replaced by the identity-correct assignment.
   - Assert affected space people are recounted and orphaned stale people are removed when they no longer own any faces.

### C. Stale Or Wrong Space-Person Links

Add focused regression tests for the suspected count mismatch.

1. **Global identity assigned but space link points to an ineligible person**
   - Create face `F` with `face_identity_face.identityId = I1`.
   - Create correct space person `P1` for `I1`.
   - Create stale space person `P2` with no name and below `minFaces`.
   - Link `F` to `P2` through `shared_space_person_face`.
   - Assert current space detailed stats classify `F` as unassigned while global classifies it assigned. This is the failing reproduction.

2. **Global identity assigned but space link is missing**
   - Create face `F` with `face_identity_face.identityId = I1`.
   - Create correct space person `P1` for `I1`, or allow the repair path to create it.
   - Do not create a `shared_space_person_face` row for `F`.
   - Assert current Space People stats classify `F` as unassigned while global classifies it assigned.
   - Repair should add the selected-space `F -> I1` assignment.

3. **Repair path replaces the stale face link with the identity-correct space person**
   - For a single asset, invoke `SharedSpaceFaceMatch`.
   - For existing production drift, invoke `SharedSpaceFaceMatchAll`.
   - Assert `F` is assigned to `P1` in the space.
   - Assert the stale `F -> P2` link for the selected space is removed.
   - Assert `F` is no longer counted as unassigned in Space People stats.
   - Assert stale/ineligible links do not inflate assigned visible counts.

4. **Wrong identity link is corrected**
   - Link `F` to a space person for identity `I2`.
   - `F` remains globally linked to `I1`.
   - Repair should delete the selected-space `F -> I2` assignment and add the selected-space `F -> I1` assignment.

5. **Incompatible type is not repaired into the wrong space person**
   - Create a human face `F` linked to a human identity `I1`.
   - Create a stale selected-space assignment to a pet `shared_space_person`, or create a pet identity conflict.
   - Repair must not attach the human face to a pet space person.
   - If a compatible human `I1` space person can be resolved or created, repair assigns `F` to that person.
   - If compatible identity resolution is impossible, repair leaves `F` unassigned in the space rather than assigning it to an incompatible pet person.
   - Assert type-incompatible rows do not cause hidden assigned counts, visible assigned counts, or person counts to inflate.

The mutation contract is delete-and-recreate for the selected face/space: stale `shared_space_person_face` rows for the face in that space are removed, then the identity-correct link is inserted. This keeps stats honest and avoids duplicate face membership inside one space.

Repair triggers to cover:

- `SharedSpaceLibraryFaceSync`: repairs drift for assets in a newly linked or newly synced linked library.
- `SharedSpaceFaceMatch`: repairs drift for an individual asset when the asset is added, imported, or reprocessed.
- `SharedSpaceFaceMatchAll`: repairs existing production drift for every asset currently in the selected space.
- Manual/admin repair path: document the supported operator action for existing drift. That action must ultimately queue `SharedSpaceFaceMatchAll` for the affected space, whether through an existing manual job or a new explicit repair job.

### D. Scope Boundaries

Add medium tests that pin external-library scope rules.

1. **Timeline opt-out affects global People but not selected Space view**
   - Member `showInTimeline = false`.
   - The selected space still counts linked-library faces.
   - Global accessible People stats for that member exclude the space library.

2. **Archived assets are intentionally different between global and space**
   - Create an archived linked-library asset with faces.
   - Assert Space People stats include it if the current `visibleSpaceAssetVisibilities` rule remains `archive + timeline`.
   - Assert global People stats exclude it because global accessible stats filter to timeline assets.

3. **Unlinking a library removes or ignores its space face assignments**
   - Seed assignments for a linked library.
   - Unlink the library.
   - Assert selected-space statistics no longer include those faces.
   - Assert orphaned space people do not remain counted if all their faces came from the unlinked library.

4. **Relinking rebuilds assignments**
   - Relink the same library.
   - Run the relevant sync/match job.
   - Assert assignments and stats return to the expected counts.

5. **Multiple spaces linking the same library stay isolated**
   - Link one library to spaces `S1` and `S2`.
   - Assign or repair faces in `S1`.
   - Assert `S2` has independent space people and stats.

### E. Cross-User Access

Add a compact medium test for ownership and membership.

- Library owner A links `L1` into space `S`.
- Member B sees linked-library faces in global accessible stats only when B is a member and `showInTimeline = true`.
- Stranger C sees none of the library faces.
- If a second owner links `L2` into the same space, B sees both libraries through membership but still sees no unlinked libraries.

## Assertions And Invariants

Every detailed stats test should assert:

```text
detectedFaceCount =
  assignedVisibleFaceCount
+ assignedHiddenFaceCount
+ unassignedFaceCount
```

When comparing global and space stats, only assert equality when the fixture intentionally aligns the scopes. Do not expect equality if:

- the space includes archived assets
- the member has `showInTimeline = false`
- direct selected-space view is being compared to global timeline scope
- pets are enabled in one path and disabled in another

For person counts, prefer explicit expectations:

- global uses eligible identities from accessible profiles
- space uses eligible space person keys, coalescing `identityId` and `id`
- unnamed below-threshold people do not count as eligible people

## Implementation Notes

- Place SQL aggregate tests near existing repository specs:
  - `server/test/medium/specs/repositories/shared-space.repository.spec.ts`
  - `server/test/medium/specs/repositories/face-identity.repository.spec.ts`
- Place orchestration tests near existing service specs:
  - `server/src/services/shared-space.service.spec.ts`
  - optionally `server/src/services/library.service.spec.ts` for queueing from library import into linked spaces
- Reuse existing helpers before adding new ones.
- If fixture setup becomes repetitive, add local helper functions inside the spec file first. Promote to `test/medium.factory.ts` only if multiple files need the same setup.
- Keep generated embeddings deterministic with `newEmbedding()` or simple literal vectors used by existing tests.
- Do not call real job queues in medium repository tests. Create rows directly or invoke repository methods.
- For B2 integration tests, use real repositories and the real `SharedSpaceService` handler where possible, while mocking only external boundaries such as the job queue and ML clients.

## Repair Contract

When a face has an eligible identity but an existing selected-space assignment points at no identity, an ineligible person, or a different identity, the repair path should:

1. Resolve the identity-correct `shared_space_person` for the selected space, creating one if needed.
2. Delete stale `shared_space_person_face` rows for that face in the selected space.
3. Insert one `shared_space_person_face` row for the identity-correct space person.
4. Recount affected space people and delete orphaned stale space people when appropriate.

The tests should assert the postcondition rather than every internal step: one selected-space assignment remains for the face, it points to the identity-correct space person, and detailed Space People stats classify the face as assigned.

The repair path must respect identity type. A face linked to a human identity must not be assigned to a pet space person, and a pet identity must not be assigned to a human space person. If the only existing assignment is type-incompatible, it is stale for this repair contract.

## Documentation

Implementation should update documentation when behavior changes user/admin-visible repair semantics.

Required documentation updates:

- Add or update a developer note describing how global identity links and space-person face links interact for linked libraries.
- Document the supported repair route for existing drift, including which job or admin action queues `SharedSpaceFaceMatchAll`.
- If archived asset scope remains intentionally different between global People and selected Space People, document that difference in the people/face statistics design or developer notes.
- If no public/admin-facing docs change is needed, the implementation PR should state that explicitly and point to the developer note or test coverage that captures the behavior.

## Success Criteria

- The suite catches the known class of mismatch where global shows faces as assigned and Space shows the same faces as unassigned due to stale or missing space links.
- Multiple external libraries linked into one space do not duplicate face or person counts.
- Correctly linked fixtures produce matching global/space assignment buckets when scopes are aligned.
- Scope boundary fixtures deliberately document when global and space counts should differ.
- The tests are small enough to diagnose failures without inspecting production data.
