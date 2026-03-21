# Spaces Hardening — Design

## Overview

Comprehensive TDD bugfix pass across all 12 issues identified in the spaces
feature audit. Single branch (`fix/spaces-hardening`), single PR. Each fix
follows red-green-refactor: write a failing test first, then implement the
minimal fix.

## Issues

| #   | Severity | Layer  | Summary                                     |
| --- | -------- | ------ | ------------------------------------------- |
| 1   | CRITICAL | web    | Wrong user in editor check on person page   |
| 2   | CRITICAL | web    | No error handling in addMember loop         |
| 3   | HIGH     | server | Missing activity logs for person operations |
| 4   | HIGH     | server | Silent skip of invalid IDs in merge         |
| 5   | HIGH     | server | Activity count inaccuracy for addAssets     |
| 6   | HIGH     | web    | Stale dropdown on role update failure       |
| 7   | MEDIUM   | server | Orphaned named persons never cleaned up     |
| 8   | MEDIUM   | server | Missing null check in removeAssets          |
| 9   | MEDIUM   | web    | Sequential awaits could be parallel         |
| 10  | MEDIUM   | mobile | Unsafe RemoteAsset cast                     |
| 11  | MEDIUM   | mobile | Race between \_loadData and \_refreshAssets |
| 12  | LOW      | server | Type casting through unknown for timestamps |

## Server Fixes

### Issue 3 — Missing activity logs for person operations

- **File:** `server/src/services/shared-space.service.ts`
- **Red:** Unit test — call `updateSpacePerson`, `deleteSpacePerson`,
  `mergeSpacePeople` and assert `mocks.sharedSpace.logActivity` was called with
  correct activity types (`person_update`, `person_delete`, `person_merge`).
- **Green:** Add `logActivity()` calls in each method. Add new
  `SharedSpaceActivityType` enum values.

### Issue 4 — Silent skip of invalid IDs in merge

- **File:** `server/src/services/shared-space.service.ts:569-573`
- **Red:** Unit test — call `mergeSpacePeople` with a mix of valid and invalid
  person IDs. Assert it throws `BadRequestException` for invalid IDs.
- **Green:** Validate all source IDs upfront before processing. Throw if any
  don't belong to the space.

### Issue 5 — Activity count inaccuracy for addAssets

- **File:** `server/src/services/shared-space.service.ts` (addAssets) +
  `server/src/repositories/shared-space.repository.ts:148-159`
- **Red:** Unit test — mock `addAssets` repository to return only 2 rows (out of
  5 requested). Assert `logActivity` is called with `count: 2`, not `count: 5`.
- **Green:** Use the returned array length from the repository's `addAssets`
  (which already uses `returningAll()`) instead of `dto.assetIds.length`.

### Issue 7 — Orphaned named persons never cleaned up

- **File:** `server/src/repositories/shared-space.repository.ts:443-450`
- **Red:** Unit test — create a named person with no faces, call
  `deleteOrphanedPersons`, assert the person is deleted.
- **Green:** Remove the `.where('name', '=', '')` condition from the repository
  query.

### Issue 8 — Missing null check in removeAssets

- **File:** `server/src/services/shared-space.service.ts:416`
- **Red:** Unit test — mock `getById` to return `null`. Assert it throws
  `NotFoundException`.
- **Green:** Add `if (!space) throw new NotFoundException()` after the `getById`
  call.

### Issue 12 — Type casting through unknown for timestamps

- **File:** `server/src/services/shared-space.service.ts:746, 772`
- **Red:** Unit test — assert that `joinedAt` and `createdAt` in response DTOs
  are valid ISO 8601 strings.
- **Green:** Replace `as unknown as string` with `.toISOString()`.

## Web Fixes

### Issue 1 — Wrong user in editor check on person page

- **File:**
  `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/+page.svelte:33-34`
- **Red:** Component test — render the person page with a viewer as the current
  user and a different user as `createdById`. Assert merge button is NOT visible.
  Render with an editor as current user, assert merge button IS visible.
- **Green:** Change `members.find((m) => m.userId === space.createdById)` to
  `members.find((m) => m.userId === currentUserId)` using the logged-in user's
  ID.

### Issue 2 — No error handling in addMember loop

- **File:** `web/src/lib/modals/SpaceAddMemberModal.svelte:84-93`
- **Red:** Component test — mock `addMember` to throw on the second user. Assert
  an error toast is shown. Assert the first successfully-added member is still
  reported.
- **Green:** Wrap each `addMember` call in try-catch. Collect errors. Show toast
  for failures. Return successfully-added members on close.

### Issue 6 — Stale dropdown on role update failure

- **File:** `web/src/lib/modals/SpaceMembersModal.svelte:62-78`
- **Red:** Component test — mock `updateMember` to throw. Change role via
  Select. Assert the dropdown reverts to the original role after the error.
- **Green:** Store previous role before the API call. On catch, map the member
  back to the original role.

### Issue 9 — Sequential awaits could be parallel

- **File:**
  `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte:314-316`
- **Red:** Unit test — spy on both functions, assert they are invoked
  concurrently (both started before either resolves).
- **Green:** Replace sequential `await`s with
  `await Promise.all([refreshSpace(), loadActivities()])`.

## Mobile Fixes

### Issue 10 — Unsafe RemoteAsset cast

- **File:** `mobile/lib/pages/library/spaces/space_detail.page.dart:115`
- **Red:** Unit test — create a selection with a non-RemoteAsset. Assert it
  doesn't crash and only processes RemoteAsset instances.
- **Green:** Replace `(a as RemoteAsset).id` with
  `.whereType<RemoteAsset>().map((a) => a.id)`.

### Issue 11 — Race between \_loadData and \_refreshAssets

- **File:** `mobile/lib/pages/library/spaces/space_detail.page.dart:43-82`
- **Red:** Unit test — trigger both methods concurrently. Assert final state is
  consistent.
- **Green:** Add a `_isLoading` guard to skip concurrent refreshes, or
  consolidate both paths into a single `_refreshAll()` method.

## Commit Structure

One commit per fix, each containing test + implementation:

1. `fix(server): validate merge source IDs before processing`
2. `fix(server): add activity logs for person operations`
3. `fix(server): use actual insert count for addAssets activity log`
4. `fix(server): clean up orphaned persons regardless of name`
5. `fix(server): add null check after getById in removeAssets`
6. `fix(server): use toISOString for timestamp response mapping`
7. `fix(web): check current user role instead of creator on person page`
8. `fix(web): add error handling to addMember loop`
9. `fix(web): revert dropdown on role update failure`
10. `fix(web): parallelize refreshSpace and loadActivities`
11. `fix(mobile): use whereType for safe RemoteAsset filtering`
12. `fix(mobile): prevent concurrent data refresh race condition`

## Test Layers

- Server issues: Vitest unit tests in `shared-space.service.spec.ts` (+
  repository spec for issue 7)
- Web issues: Vitest + `@testing-library/svelte` component tests with factory
  builders
- Mobile issues: Flutter unit tests with mocktail
