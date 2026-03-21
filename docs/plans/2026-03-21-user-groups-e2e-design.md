# User Groups E2E Tests Design

## Goal

E2E tests for the user groups API to catch schema/migration bugs (like the missing `updateId` column) and verify ownership-scoped authorization.

## Scope

~16 tests covering CRUD happy paths, member management, ownership enforcement, and unauthenticated access.

## Test file

`e2e/src/specs/server/api/user-group.e2e-spec.ts`

## Setup

3 users (admin, user1, user2). user1 creates groups, user2 is the "other user" for ownership tests.

## Tests

### CRUD

1. Create group with name and color
2. Reject empty name (400)
3. List only my groups (user2 sees none)
4. Get group with members
5. 404 for non-existent group
6. Update name
7. Update color
8. Delete group

### Members

9. Set members
10. Replace members (full replace)
11. Set empty member list

### Authorization (ownership)

12. GET forbidden for non-owner (403)
13. PATCH forbidden for non-owner (403)
14. DELETE forbidden for non-owner (403)
15. PUT members forbidden for non-owner (403)

### Unauthenticated

16. All endpoints return 401 without token

## Infrastructure changes

- Add `user_group` to `resetDatabase()` truncate list in `e2e/src/utils.ts`
- Add `createGroup` helper to `e2e/src/utils.ts`
