# Shared Space Bulk Add Overload Design

## Problem

Adding roughly 60,000 assets to a shared space overloaded Pierre's personal instance. The initial bulk-add operation used a set-based database insert and completed, but the follow-up work created two bursts:

- `SharedSpaceFaceMatchAll` loaded every asset in the space and enqueued one `SharedSpaceFaceMatch` job per asset in a single `queueAll(...)` call.
- The web UI then requested many shared-space people and asset thumbnails through the API S3 proxy, causing the AWS SDK socket pool to saturate and leave requests queued.

The result was temporary probe timeouts and blank-looking people thumbnails until `gallery-server` was restarted.

## Goals

- Bulk-add large spaces without making the API or worker process unresponsive.
- Keep face recognition and deduplication correct for large spaces.
- Prevent the people page from creating unbounded thumbnail request bursts.
- Preserve existing behavior for small spaces.
- Add regression coverage for large-space fan-out.

## Non-Goals

- Rewriting shared-space face matching from scratch.
- Changing the shared-space data model.
- Removing S3 proxy mode.
- Building a full global rate-limiting system.

## Backend Design

`SharedSpaceFaceMatchAll` should become a bounded batch processor instead of one unbounded fan-out. The handler should page through the space's asset ids by stable ordering and process each page sequentially, using the existing `processSpaceFaceMatch(spaceId, assetId)` helper. This mirrors the safer shape already used by `SharedSpaceLibraryFaceSync`: bounded reads, sequential per-asset work, and one dedup request at the end.

The repository should expose a paginated asset-id method for a space, ordered by a stable key. The method must preserve the current `getAssetIdsInSpace` behavior: include direct `shared_space_asset` rows and assets from linked libraries, exclude deleted/offline library assets, and avoid duplicate asset ids across the direct and linked-library paths. Use keyset pagination over the final combined asset ids rather than offset pagination so large spaces do not become progressively slower and concurrent inserts do not shift later pages.

The service should loop until a page returns fewer than the batch size, with a default batch size of 500 or 1,000. Between pages, yield to the event loop so BullMQ lock renewal and other work remain responsive. Re-check that the space still exists and still has face recognition enabled before each page; if it was disabled or deleted, stop without queuing dedup.

Deduplication should run once after all pages have been processed. `SharedSpaceFaceMatchAll` must not enqueue thousands of `SharedSpaceFaceMatch` child jobs, because even batched child-job enqueueing can still create a huge Redis backlog and allows dedup to run before all face matches have actually finished. The existing single-asset `SharedSpaceFaceMatch` handler can keep its current behavior for single-asset updates.

## S3 Proxy Pressure

The S3 backend should protect the API process from unbounded concurrent reads. Add a small internal read limiter around proxied S3 `getObject` stream creation, with a conservative default such as 32 concurrent reads per process. This is safer than only increasing the AWS SDK max socket count because it creates backpressure before memory and socket queues grow.

The limiter should release its slot when the response stream ends, errors, or is destroyed by a client disconnect. Releasing immediately after `GetObjectCommand` returns is not sufficient, because the socket remains occupied while the API streams the object to the browser. Redirect mode should continue using presigned URLs and should not consume proxy read slots.

If we tune SDK socket settings, they should be explicit and aligned with the limiter. The limiter remains the primary guardrail.

## Frontend Design

The shared-space people grid should avoid eagerly loading thumbnails for every rendered person when the list is large. Native `loading="lazy"` is not enough on its own because browsers can still start many image requests in a large grid. Add an application-level thumbnail loader for this path that only assigns image `src` when a tile is visible or near-visible and caps concurrent active loads. A concurrency range of 6-12 visible thumbnail requests is enough for good perceived speed without flooding the API.

This should apply to shared-space people pages first, since that is the incident path. The visibility modal and other shared-space person thumbnail surfaces should either reuse the loader or keep their own smaller page sizes so they cannot trigger the same burst. The same loader pattern can later be reused for other dense grids.

## Data Flow

1. User triggers bulk add.
2. API queues one `SharedSpaceBulkAddAssets` job.
3. Worker inserts missing shared-space asset rows with a set-based insert.
4. If face recognition is enabled, the worker processes face matching in bounded pages inside `SharedSpaceFaceMatchAll`.
5. Each page runs sequential per-asset matching and yields before reading the next page.
6. Dedup runs once after all pages have completed.
7. People page requests thumbnails lazily with bounded client-side concurrency.
8. API S3 proxy serves thumbnail streams under a bounded backend read limiter.

## Error Handling

- If a batch page fails, the `SharedSpaceFaceMatchAll` job should fail normally and remain visible in the queue.
- Retrying `SharedSpaceFaceMatchAll` must be idempotent. `processSpaceFaceMatch` already skips faces that are assigned in the space; the implementation should preserve that guard and tests should cover retrying after partial progress.
- Dedup should keep its existing job-id deduplication to avoid repeated expensive passes.
- S3 read limiter failures should propagate as existing media-serving errors; it should not swallow missing-object or credential errors.
- Client disconnects during proxied S3 streaming must release limiter slots.

## Testing

Use test-driven development for the implementation:

1. Write failing tests that describe the overload-safe behavior.
2. Confirm the tests fail against the current unbounded implementation.
3. Implement the smallest change that makes those tests pass.
4. Run the focused test suites, then the broader affected backend/frontend suites.

Backend unit tests:

- `SharedSpaceFaceMatchAll` with more assets than one batch processes multiple bounded pages and never calls `queueAll` with per-asset `SharedSpaceFaceMatch` jobs.
- Exact batch-size boundary: `N = batchSize` stops after one full page plus one empty/final check without duplicate processing.
- `N = batchSize + 1` processes a second page and queues one final dedup.
- Zero-asset and face-recognition-disabled paths skip processing and do not queue dedup.
- Space deleted or face recognition disabled between pages stops the workflow and does not queue dedup.
- Retrying after partial progress skips already-assigned faces and does not duplicate `shared_space_person_face` rows.
- The paginated repository method includes direct assets and linked-library assets, filters deleted/offline library assets, deduplicates assets reachable through both paths, and returns a stable keyset order.

S3 backend tests:

- Concurrent proxied reads never exceed the configured read limiter.
- Limiter slots are released on stream `end`, `error`, and `destroy`/client-abort paths.
- Redirect serve mode does not acquire proxy read slots.
- Missing object and credential errors still propagate as before.

Frontend tests:

- The shared-space people grid does not assign thumbnail `src` for offscreen tiles before they enter the preload window.
- The thumbnail loader never exceeds its configured concurrent active load count.
- Failed image loads release a loader slot and allow queued visible thumbnails to proceed.
- Paging through people does not cause all already-fetched people thumbnails to request at once.

## Rollout

Implement backend bounded processing first because it removes the largest server-side fan-out. Then add S3 read limiting to protect the API proxy path. Finally add frontend thumbnail request throttling to reduce user-triggered bursts.

After deployment, verify with a large shared space by checking:

- BullMQ queues remain bounded and drain steadily.
- `gallery-server` liveness/readiness probes do not time out.
- No repeated `@smithy/node-http-handler` socket-capacity warnings appear.
- People thumbnails remain visible without requiring a server restart.
