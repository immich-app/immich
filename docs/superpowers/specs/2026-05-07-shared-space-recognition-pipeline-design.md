# Shared Space Recognition Pipeline Design

## Problem

Large facial-recognition runs can create a massive `facialRecognition` queue backlog when shared spaces are enabled. The current recognition handler runs once per face, but it queues shared-space matching per asset and per space. Because an asset can have many faces and can belong to multiple spaces, the same asset-level shared-space match can be queued repeatedly during a single full run.

The observed production report showed `SharedSpaceFaceMatch` jobs being appended while the queue was still draining older `FacialRecognition` jobs. Some older Redis wait-list entries also had no job hash, so the queue contained stale IDs from a prior inconsistent state. Even without a true infinite loop, this queue shape can make users wait many hours or days for large libraries.

## Goals

- Make full or force facial recognition scale with shared-space asset pages, not with `faces * spaces`.
- Preserve the current single-queue ordering guarantees for face-related work.
- Preserve shared-space people correctness after force recognition, imports, metadata refresh, library sync, duplicate merge, and manual asset additions.
- Bound Redis job counts for large spaces.
- Coalesce duplicate asset-level shared-space matches.
- Add TDD coverage proving the new pipeline still assigns faces, deduplicates people, and avoids the old fan-out.

## Non-Goals

- Rewriting face clustering or identity matching.
- Adding a new database-backed work-claim table.
- Adding a separate shared-space recognition queue in this phase.
- Changing shared-space membership or asset visibility semantics.
- Removing single-asset shared-space matching for incremental updates.

## Chosen Architecture

Keep all face-related jobs in `QueueName.FacialRecognition`, but change full rebuilds from per-face shared-space fan-out to paged shared-space rebuild jobs.

During force/full recognition, `handleQueueRecognizeFaces` clears obsolete pending `facialRecognition` work, clears the personal and shared-space person state, queues one `FacialRecognition` job per visible face with `skipSharedSpaceMatch: true`, and then queues one `SharedSpaceFaceMatchAll` dispatcher per face-recognition-enabled space. Because all of these jobs stay in the same single-concurrency queue, the shared-space rebuild dispatchers run only after personal recognition has finished.

`SharedSpaceFaceMatchAll` becomes a dispatcher. It does not process all assets in one long job and does not enqueue one job per asset. It queues the first `SharedSpaceFaceMatchPage` job for its space. Each page processes up to `N` assets in stable keyset order with the existing `processSpaceFaceMatch(spaceId, assetId)` helper. If another page exists, the current page queues the next page. The final page queues deduplication and identity reconciliation once for the space.

Incremental changes continue to use asset-level matching. `handleRecognizeFaces` can still queue `SharedSpaceFaceMatch` when `skipSharedSpaceMatch` is false. Direct sources such as metadata import, manual asset additions, library sync, and duplicate merge also queue asset-level `SharedSpaceFaceMatch` jobs when they know the affected assets. Those jobs get stable BullMQ ids by `(spaceId, assetId)` so repeated work collapses while pending.

This option does not preclude a future separate `sharedSpaceRecognition` queue. The new page job boundary and stable asset-level job ids are reusable if the queue is split later.

## Queue Model

Keep handlers on `QueueName.FacialRecognition`:

- `FacialRecognitionQueueAll`
- `FacialRecognition`
- `SharedSpaceFaceMatch`
- `SharedSpaceFaceMatchAll`
- `SharedSpaceFaceMatchPage`
- `SharedSpaceLibraryFaceSync`
- `SharedSpaceIdentityReconciliation`
- `SharedSpacePersonDedup`

Keep `SharedSpacePersonMetadataBackfill` on `QueueName.PeopleBackfill`.

Add or reshape jobs:

- `FacialRecognition`: add `skipSharedSpaceMatch?: boolean` to the job data. Force/full recognition sets it to `true`; incremental recognition leaves it false.
- `SharedSpaceFaceMatch`: asset-level incremental match, data `{ spaceId, assetId }`, stable job id `shared-space-face-match/<spaceId>/<assetId>`, `removeOnComplete: true`.
- `SharedSpaceFaceMatchAll`: dispatcher for all assets in one space, data `{ spaceId }`, stable job id `shared-space-face-match-all/<spaceId>`, `removeOnComplete: true`.
- `SharedSpaceFaceMatchPage`: rebuild page, data `{ spaceId, afterAssetId?, batchSize? }`, stable job id by page cursor, `removeOnComplete: true`.

## Force Recognition Flow

1. User starts `facialRecognition` with `force=true`.
2. The queue start command treats `force=true` on `QueueName.FacialRecognition` as "replace pending work": it drains waiting and delayed jobs before enqueueing `FacialRecognitionQueueAll`, even if one facial-recognition job is currently active. Other queues and non-force starts keep the existing "cannot start while active" behavior.
3. When `FacialRecognitionQueueAll` becomes active, it drains waiting and delayed `facialRecognition` work again. This second drain catches any old active job that finished after the start command and enqueued stale follow-up work.
4. It clears personal and shared-space person state as it does today.
5. It queues one `FacialRecognition` job per visible face with `skipSharedSpaceMatch: true`.
6. It queues one `SharedSpaceFaceMatchAll` dispatcher per face-recognition-enabled space after the personal face jobs.
7. Each `FacialRecognition` job handles personal clustering only.
8. Each `SharedSpaceFaceMatchAll` queues the first page for its space.
9. Each page processes a bounded asset page and queues the next page when needed.
10. The final page queues one dedup job and one identity reconciliation request for the space.

For a space with 220,000 assets and page size 1,000, the rebuild uses about 220 page jobs instead of hundreds of thousands of per-face/per-space jobs.

## Incremental Flow

Incremental events still update shared-space people quickly:

1. Source event identifies affected assets.
2. Service queues `SharedSpaceFaceMatch` for each affected `(spaceId, assetId)`.
3. `JobRepository` supplies stable job ids so duplicate pending asset matches collapse.
4. Handler processes all eligible faces on the asset and queues dedup/reconciliation for affected people.

Because the jobs remain in `facialRecognition`, an asset-level match queued by one face-recognition job waits behind older recognition jobs already in the queue. This preserves the existing ordering model and avoids the cross-queue race where shared-space matching could run before later faces on the same asset are recognized.

## Race-Condition Safeguards

- No new cross-queue ordering boundary is introduced.
- Force recognition drains obsolete waiting and delayed `facialRecognition` work before enqueueing the replacement run and again before deleting shared-space person state.
- `FacialRecognition` stays single-concurrency.
- Page chains are sequential. A page queues the next page only after it finishes processing its current page.
- Page jobs re-check that the space still exists and still has face recognition enabled before each page.
- Asset-level shared-space jobs are idempotent and deduped by `(spaceId, assetId)` while pending.
- Final dedup/reconciliation is queued after the final page only, not after every asset in a rebuild.
- A future split into a separate queue requires a separate design and tests proving cross-queue ordering safety.

## Existing Queue Behavior

Deploying this change does not rewrite existing Redis job data. Already queued `FacialRecognition` jobs that were created before the change will not have `skipSharedSpaceMatch: true`, so if users simply let an old backlog continue, those old jobs can still produce the old fan-out shape.

The supported path for an already-ballooned queue is to start `facialRecognition` again with `force=true` after deploying. That force start replaces pending waiting and delayed work with a new paged rebuild. It does not require a manual server restart beyond the normal deployment restart. It does not remove the currently active job; the active job is allowed to finish, then `FacialRecognitionQueueAll` drains any stale follow-up work before clearing and rebuilding state.

## Error Handling

- Page jobs are idempotent. `processSpaceFaceMatch` already skips faces assigned in the space; tests must preserve that guarantee.
- If a page fails, BullMQ records the failure and the failed page can be retried.
- A retried page may reprocess some assets, but assigned-face checks and insert conflict handling prevent duplicate `shared_space_person_face` rows.
- If a space is deleted or face recognition is disabled between pages, the page exits without queuing the next page, dedup, or reconciliation.
- Stable job ids must not prevent future legitimate work after completion; use `removeOnComplete: true`.
- Failed shared-space match, page, dedupe, and reconciliation jobs remain visible. They should not use `removeOnFail: true`, because silently removing failed work would hide correctness problems. A failed stable-id job can block a duplicate until the failed job is retried or cleared; that is preferable to hiding data-loss symptoms.

## TDD and Test Coverage

Use test-driven development for each behavior change. Every production change must have a failing test first, and the implementation must be the smallest change that turns that test green. Do not batch multiple behavior changes under one broad test.

Unit regression tests must prove:

- Force-starting `facialRecognition` with `force=true` drains obsolete waiting and delayed jobs before enqueueing `FacialRecognitionQueueAll`.
- Force-starting `facialRecognition` with `force=true` is allowed while one facial-recognition job is active; non-force starts and other queues keep the existing active-job rejection.
- `FacialRecognitionQueueAll` drains obsolete waiting and delayed jobs again before clearing shared-space person tables.
- Force recognition queues `FacialRecognition` jobs with `skipSharedSpaceMatch: true`.
- Force recognition queues `SharedSpaceFaceMatchAll` after personal recognition jobs.
- `handleRecognizeFaces` does not queue `SharedSpaceFaceMatch` when `skipSharedSpaceMatch` is true.
- Incremental `handleRecognizeFaces` still queues `SharedSpaceFaceMatch` when `skipSharedSpaceMatch` is false.
- `SharedSpaceFaceMatch` uses stable job ids by `(spaceId, assetId)` and avoids `addBulk`.
- `SharedSpaceFaceMatchAll` dispatches the first `SharedSpaceFaceMatchPage` instead of processing all assets or queueing per-asset jobs.
- `SharedSpaceFaceMatchPage` uses keyset pages and queues the next page only when needed.
- Final page queues dedup and identity reconciliation once per space.
- Empty spaces, deleted spaces, and disabled face recognition do not queue follow-up work.
- Handler metadata confirms all face-related shared-space jobs remain on `QueueName.FacialRecognition`.

Edge-case coverage must include:

- Existing pre-deploy `FacialRecognition` job data without `skipSharedSpaceMatch` keeps incremental behavior unless replaced by a force run.
- Old active job finishing after force-start drain but before `FacialRecognitionQueueAll` is handled by the second drain.
- Asset with multiple faces queues one pending `SharedSpaceFaceMatch` by stable job id, not one distinct job per face.
- Asset in multiple spaces queues one asset match per space.
- A page with zero assets queues no dedup/reconciliation.
- A page with fewer than `batchSize` assets processes once and queues final follow-up once.
- A page with exactly `batchSize` assets queues one follow-up page without duplicating the last asset.
- A page with `batchSize + 1` assets processes the second page and queues final dedup once.
- Retry after partial page progress skips already-assigned faces.
- Space disabled between pages stops the chain and does not queue dedup/reconciliation.
- Failed shared-space jobs remain visible.

Medium/integration tests must prove:

- Existing `processSpaceFaceMatch` scenarios still assign faces and remain idempotent on retry.
- Existing shared-space identity reconciliation and dedup tests still pass.
- A force-style flow with multiple faces on the same asset produces correct shared-space people without duplicate `shared_space_person_face` assignments.
- Direct incremental sources such as metadata import and manual asset add still update shared-space people.

Verification must run:

- Focused unit specs for `job.repository`, `person.service`, `shared-space.service`, and `queue.service` if queue semantics change.
- Medium shared-space/person identity specs that exercise real database behavior.
- Server typecheck.

## Rollout

Implement in two steps:

1. Coalesce asset-level shared-space match jobs with stable job ids.
2. Change force recognition to suppress per-face shared-space fan-out and dispatch paged same-queue shared-space rebuilds.

After deployment, verify on a large instance:

- `facialRecognition` drains without unbounded `SharedSpaceFaceMatch` growth.
- Queue count remains near `enabledSpaces * pages`, not `faces * spaces`.
- Shared-space people still appear after the rebuild completes.
- Failed jobs are meaningful real failures, not stale duplicated work.
