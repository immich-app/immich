# Space Bulk Add Assets — Design

## Problem

Users with large libraries (300k+ photos) cannot add all their assets to a shared space:

1. **10MB JSON body limit** — 300k UUIDs serialized as JSON is ~11MB, rejected by Express
   `server/src/app.common.ts:51`
2. **No chunking on INSERT** — `SharedSpaceRepository.addAssets()` lacks `@Chunked`, so a single INSERT
   with 300k rows exceeds PostgreSQL's 65,535 parameter limit
3. **Sequential face-match queuing** — `addAssets` service method and `handleSharedSpaceFaceMatchAll`
   both queue jobs with `await` in a loop (300k sequential awaits)

## Solution

### New "Add all my assets" background job

Instead of sending asset IDs over the wire, add a `POST /shared-spaces/:id/assets/bulk-add` endpoint
that queues a BullMQ job. The job queries the user's assets server-side via `INSERT...SELECT` — no
parameter limits, no body size issues, no cursor pagination.

### Fix existing `addAssets` path

Harden the row-by-row path for smaller batch additions.

## Server Changes

### 1. New endpoint: `POST /shared-spaces/:id/assets/bulk-add`

- **DTO**: Empty body (no fields needed — server queries assets by owner)
- **Controller**: Validates auth, delegates to service
- **Service** (`queueBulkAdd`):
  1. Validates editor role via `requireRole(auth, spaceId, SharedSpaceRole.Editor)`
  2. Queues `SharedSpaceBulkAddAssets` job with `{ spaceId, userId: auth.user.id }`
  3. Returns immediately
- **Response**: `202 Accepted` with `{ spaceId }`

### 2. New job: `SharedSpaceBulkAddAssets`

- **Enum**: Add to `JobName`, map to `QueueName.BackgroundTask`
- **Type**: `ISharedSpaceBulkAddAssetsJob { spaceId: string; userId: string }`
- **Job options**: Add case in `getJobOptions()` returning
  `{ jobId: \`bulk-add-${spaceId}-${userId}\` }` for deduplication
- **Handler** (`handleSharedSpaceBulkAddAssets`):

```
1. getMember(spaceId, userId) → if missing or role < Editor → JobStatus.Skipped
2. getById(spaceId) → if null → JobStatus.Skipped
3. try { count = bulkAddUserAssets(spaceId, userId) } catch → log error, return JobStatus.Failed
4. if count === 0 → return JobStatus.Success (no activity log, no notification)
5. update lastActivityAt on space
6. logActivity({ spaceId, userId, type: AssetAdd, data: { count, bulk: true } })
7. if space.faceRecognitionEnabled → queue SharedSpaceFaceMatchAll
8. websocketRepository.clientSend('on_notification', userId, notification)
9. return JobStatus.Success
```

### 3. New repository method: `bulkAddUserAssets`

```sql
INSERT INTO shared_space_asset (spaceId, assetId, addedById)
SELECT :spaceId, id, :userId
FROM asset
WHERE ownerId = :userId
  AND deletedAt IS NULL
  AND isOffline = false
ON CONFLICT DO NOTHING
```

Returns `Number(result.numInsertedOrUpdatedRows ?? 0)`.

Uses `executeTakeFirst()` (not `executeTakeFirstOrThrow()`) so FK failures from a
concurrently-deleted space return 0 instead of throwing.

### 4. Fix existing `addAssets` path

- Add `@ChunkedArray({ chunkSize: 20_000 })` to `SharedSpaceRepository.addAssets()`
  (3 params per row → 20k \* 3 = 60k, under 65,535 limit)
- Change face matching in `addAssets` service from sequential `await queue()` loop to
  `this.jobRepository.queueAll(items)`

### 5. Fix `handleSharedSpaceFaceMatchAll`

- Same change: replace sequential `await queue()` loop with batched `queueAll(items)`

### 6. Completion notification

- Uses existing `on_notification` websocket event — no new event types needed
- Persists notification via `notificationRepository.create()` (visible even if websocket disconnected)
- Then broadcasts via `websocketRepository.clientSend('on_notification', userId, payload)`
- Matches the existing pattern in `notification.service.ts` for job failure notifications
- Payload: notification DTO with title "Bulk add complete" and description with count

## Web Frontend Changes

### 7. "Add all my photos" button

- Location: Space action bar (alongside existing add-assets flow)
- Visible to editors and owners only
- On click: Confirmation dialog explaining background operation and estimated wait
- On confirm: Calls bulk-add endpoint, shows toast "Adding all photos... You'll be notified when complete."
- Disabled while a bulk-add job is already queued (optimistic — re-enables after navigation)

### 8. Completion handling

- Existing `on_notification` listener handles the completion toast
- If user is viewing the space when notification arrives, refresh the timeline/asset count

UX details to be designed with /frontend-design during implementation.

## Edge Cases

| Edge case                                          | Handling                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Duplicate adds (re-run)                            | `ON CONFLICT DO NOTHING` — idempotent                                                          |
| User removed between queue and execution           | `getMember` check at job start → `JobStatus.Skipped`                                           |
| User demoted to viewer between queue and execution | Role hierarchy check → `JobStatus.Skipped`                                                     |
| Space deleted mid-job                              | `getById` returns null → `JobStatus.Skipped`; `executeTakeFirst` handles FK failure gracefully |
| Concurrent bulk adds (double-click)                | BullMQ `jobId` deduplication prevents duplicate queuing                                        |
| Same jobId but first job already active            | Second job may queue; `ON CONFLICT DO NOTHING` makes it safe                                   |
| Trashed assets                                     | Filtered by `deletedAt IS NULL`                                                                |
| Offline assets                                     | Filtered by `isOffline = false`                                                                |
| User with zero assets                              | INSERT...SELECT inserts 0 rows, count=0, skip activity/notification                            |
| All assets already in space                        | ON CONFLICT DO NOTHING, count=0, skip activity/notification                                    |
| Assets being trashed concurrently                  | Point-in-time snapshot at query execution — correct                                            |

## Test Plan

### Unit tests — `queueBulkAdd` (5 tests)

1. Should queue `SharedSpaceBulkAddAssets` job with correct spaceId and userId when called by editor
2. Should queue job when called by owner
3. Should throw ForbiddenException when called by viewer
4. Should throw ForbiddenException when called by non-member
5. Should return response containing spaceId

### Unit tests — `handleSharedSpaceBulkAddAssets` (13 tests)

1. Should skip when getMember returns undefined (user removed)
2. Should skip when member role is below editor (demoted)
3. Should skip when getById returns null (space deleted)
4. Should call bulkAddUserAssets with correct spaceId and userId
5. Should update lastActivityAt on the space
6. Should log activity with `{ count, bulk: true }` using repository return value
7. Should NOT log activity when count is 0 (all duplicates)
8. Should NOT log activity when count is 0 (zero assets)
9. Should queue SharedSpaceFaceMatchAll when faceRecognitionEnabled is true
10. Should NOT queue SharedSpaceFaceMatchAll when faceRecognitionEnabled is false
11. Should send websocket notification on completion (count > 0)
12. Should NOT send notification when count is 0
13. Should return JobStatus.Failed when bulkAddUserAssets throws (FK failure)

### Unit tests — existing `addAssets` fixes (1 updated)

1. Update face matching assertion from sequential `mocks.job.queue` to `mocks.job.queueAll`

### Unit tests — `handleSharedSpaceFaceMatchAll` fix (1 updated)

1. Update assertion from sequential `mocks.job.queue` to `mocks.job.queueAll`

### Medium tests — `bulkAddUserAssets` (11 tests)

1. Should insert all non-deleted, non-offline assets owned by user
2. Should return correct inserted row count
3. Should skip soft-deleted assets
4. Should skip offline assets
5. Should not insert assets owned by other users
6. Should handle ON CONFLICT when some assets already exist
7. Should return 0 when all assets already in space
8. Should return 0 when user has no assets
9. Should set addedById to userId
10. Should set spaceId correctly on all inserted rows
11. Should not affect other spaces' assets

### E2E tests — `POST /shared-spaces/:id/assets/bulk-add` (7 tests)

1. Should require authentication (401)
2. Should return 202 with spaceId when called by owner
3. Should return 202 when called by editor
4. Should reject viewer (403)
5. Should reject non-member (403)
6. Should accept when user has zero assets (job queued, not executed inline)
7. Should be idempotent (calling twice returns 202 both times)

### Web component tests (7 tests)

1. Button visible to editors/owners, hidden from viewers
2. Click shows confirmation dialog
3. Confirm calls bulk-add API
4. Cancel does not call API
5. Toast appears after successful API call
6. Button disabled while bulk-add is in progress
7. Error toast on API failure (e.g., 403)

**Total: 43 new tests + 2 updated tests**

## What this does NOT include (YAGNI)

- Progress tracking / percentage
- Cancel job functionality
- Filter-based bulk add ("add all from 2024")
- Retry logic beyond BullMQ built-in
- New websocket event types (uses existing `on_notification`)
