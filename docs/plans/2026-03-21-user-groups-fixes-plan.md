# User Groups Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **REQUIRED:** Follow strict TDD — RED (failing test) → GREEN (minimal code). No production code without a failing test first.

**Goal:** Fix critical and important issues found in PR #123 code review.

**Architecture:** 7 focused fixes across server (service, repository, DTOs, controller) and frontend (sharing modals). Each fix is test-first where applicable.

**Tech Stack:** NestJS + Kysely (server), Svelte 5 (web), Vitest for tests.

---

### Task 1: RED — test that `setMembers` deduplicates user IDs

**Files:**

- Modify: `server/src/services/user-group.service.spec.ts`

**Step 1: Write failing test**

Add to the `setMembers` describe block:

```typescript
it('should deduplicate user IDs', async () => {
  const auth = factory.auth();
  const group = makeGroup({ createdById: auth.user.id });
  const userId = newUuid();
  const member = makeMember({ groupId: group.id, userId });

  mocks.userGroup.getById.mockResolvedValue(group);
  mocks.userGroup.setMembers.mockResolvedValue();
  mocks.userGroup.getMembers.mockResolvedValue([member]);

  await sut.setMembers(auth, group.id, { userIds: [userId, userId, userId] });

  expect(mocks.userGroup.setMembers).toHaveBeenCalledWith(group.id, [userId]);
});
```

**Step 2: Run test — verify RED**

Run: `cd server && npx vitest run src/services/user-group.service.spec.ts --config test/vitest.config.mjs`
Expected: FAIL — `setMembers` called with `[userId, userId, userId]` not `[userId]`.

**Step 3: Commit**

```bash
git add server/src/services/user-group.service.spec.ts
git commit -m "test(server): RED — test that setMembers deduplicates user IDs"
```

---

### Task 2: GREEN — deduplicate in service + wrap repository in transaction

**Files:**

- Modify: `server/src/services/user-group.service.ts` (deduplicate)
- Modify: `server/src/repositories/user-group.repository.ts` (transaction)

**Step 1: Deduplicate in service**

In `server/src/services/user-group.service.ts`, change `setMembers`:

```typescript
  async setMembers(auth: AuthDto, id: string, dto: UserGroupMemberSetDto): Promise<UserGroupMemberResponseDto[]> {
    await this.requireOwnership(auth, id);
    const uniqueUserIds = [...new Set(dto.userIds)];
    await this.userGroupRepository.setMembers(id, uniqueUserIds);
    const members = await this.userGroupRepository.getMembers(id);
    return members.map((m) => this.mapMember(m));
  }
```

**Step 2: Wrap setMembers in a transaction**

In `server/src/repositories/user-group.repository.ts`, change `setMembers`:

```typescript
  async setMembers(groupId: string, userIds: string[]) {
    await this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom('user_group_member').where('groupId', '=', groupId).execute();

      if (userIds.length === 0) {
        return;
      }

      await trx
        .insertInto('user_group_member')
        .values(userIds.map((userId) => ({ groupId, userId })))
        .execute();
    });
  }
```

**Step 3: Run test — verify GREEN**

Run: `cd server && npx vitest run src/services/user-group.service.spec.ts --config test/vitest.config.mjs`
Expected: ALL PASS.

**Step 4: Commit**

```bash
git add server/src/services/user-group.service.ts server/src/repositories/user-group.repository.ts
git commit -m "fix(server): deduplicate user IDs and wrap setMembers in transaction"
```

---

### Task 3: RED — test that non-existent group returns NotFoundException (404)

**Files:**

- Modify: `server/src/services/user-group.service.spec.ts`

**Step 1: Update existing test expectation**

Change the test `'should throw BadRequestException when group not found'` to:

```typescript
it('should throw NotFoundException when group not found', async () => {
  const auth = factory.auth();
  mocks.userGroup.getById.mockResolvedValue(void 0);

  await expect(sut.get(auth, newUuid())).rejects.toThrow('User group not found');
});
```

This test name change documents intent. The actual assertion (`toThrow('User group not found')`) will still pass initially because the message is the same. We need to also verify the exception TYPE. Update to:

```typescript
it('should throw NotFoundException when group not found', async () => {
  const auth = factory.auth();
  mocks.userGroup.getById.mockResolvedValue(void 0);

  await expect(sut.get(auth, newUuid())).rejects.toBeInstanceOf(NotFoundException);
});
```

Add `NotFoundException` to the imports at the top (there are no explicit imports — the test uses `newTestService` which auto-mocks). Add this import:

```typescript
import { NotFoundException } from '@nestjs/common';
```

**Step 2: Run test — verify RED**

Run: `cd server && npx vitest run src/services/user-group.service.spec.ts --config test/vitest.config.mjs`
Expected: FAIL — `BadRequestException` is not `NotFoundException`.

**Step 3: Commit**

```bash
git add server/src/services/user-group.service.spec.ts
git commit -m "test(server): RED — expect NotFoundException for missing group"
```

---

### Task 4: GREEN — change to NotFoundException

**Files:**

- Modify: `server/src/services/user-group.service.ts`

**Step 1: Change the exception**

Add `NotFoundException` to the imports from `@nestjs/common`.

Change `requireOwnership`:

```typescript
  private async requireOwnership(auth: AuthDto, groupId: string) {
    const group = await this.userGroupRepository.getById(groupId);
    if (!group) {
      throw new NotFoundException('User group not found');
    }
    if (group.createdById !== auth.user.id) {
      throw new ForbiddenException('Not the owner of this group');
    }
    return group;
  }
```

**Step 2: Run test — verify GREEN**

Run: `cd server && npx vitest run src/services/user-group.service.spec.ts --config test/vitest.config.mjs`
Expected: ALL PASS.

**Step 3: Update E2E test to expect 404 instead of 400**

In `e2e/src/specs/server/api/user-group.e2e-spec.ts`, change:

```typescript
    it('should return 400 for non-existent group', async () => {
```

to:

```typescript
    it('should return 404 for non-existent group', async () => {
```

And change `expect(status).toBe(400)` to `expect(status).toBe(404)`.

**Step 4: Commit**

```bash
git add server/src/services/user-group.service.ts e2e/src/specs/server/api/user-group.e2e-spec.ts
git commit -m "fix(server): use NotFoundException for missing user group (404 not 400)"
```

---

### Task 5: Fix `createdAt` typing in mapGroup

**Files:**

- Modify: `server/src/services/user-group.service.ts`

**Step 1: Fix the mapGroup signature and conversion**

Change the `mapGroup` method signature and body. Replace:

```typescript
  private mapGroup(
    group: { id: string; name: string; color: string | null; origin: string; createdAt: unknown },
```

With:

```typescript
  private mapGroup(
    group: { id: string; name: string; color: string | null; origin: string; createdAt: Date },
```

And change:

```typescript
      createdAt: group.createdAt as unknown as string,
```

To:

```typescript
      createdAt: group.createdAt.toISOString(),
```

**Step 2: Run tests to confirm nothing broke**

Run: `cd server && npx vitest run src/services/user-group.service.spec.ts --config test/vitest.config.mjs`
Expected: ALL PASS (test factory uses `newDate()` which returns `Date`).

**Step 3: Commit**

```bash
git add server/src/services/user-group.service.ts
git commit -m "fix(server): type createdAt as Date and use toISOString"
```

---

### Task 6: Fix group deselect in sharing modals

**Files:**

- Modify: `web/src/lib/modals/AlbumAddUsersModal.svelte`
- Modify: `web/src/lib/modals/SpaceAddMemberModal.svelte`

**Step 1: Fix handleGroupToggle in AlbumAddUsersModal.svelte**

The deselect path must check if a user is still covered by another active group before removing. Replace the `handleGroupToggle` function:

```typescript
const handleGroupToggle = (group: UserGroupResponseDto) => {
  if (activeGroupIds.has(group.id)) {
    activeGroupIds.delete(group.id);
    for (const member of group.members) {
      if (!excludedUserIds.includes(member.userId)) {
        const coveredByOtherGroup = groups.some(
          (g) => g.id !== group.id && activeGroupIds.has(g.id) && g.members.some((m) => m.userId === member.userId),
        );
        if (!coveredByOtherGroup) {
          selectedUsers.delete(member.userId);
        }
      }
    }
  } else {
    activeGroupIds.add(group.id);
    for (const member of group.members) {
      if (!excludedUserIds.includes(member.userId)) {
        const user = users.find((u) => u.id === member.userId);
        if (user) {
          selectedUsers.set(user.id, user);
        }
      }
    }
  }
};
```

**Step 2: Apply the same fix to SpaceAddMemberModal.svelte**

Same logic — replace `handleGroupToggle` with the version that checks `coveredByOtherGroup`. The only difference is the exclusion source (`existingMemberIds` instead of `excludedUserIds`).

**Step 3: Run web checks**

Run: `make check-web`
Expected: No errors.

**Step 4: Commit**

```bash
git add web/src/lib/modals/AlbumAddUsersModal.svelte web/src/lib/modals/SpaceAddMemberModal.svelte
git commit -m "fix(web): preserve users covered by other active groups on deselect"
```

---

### Task 7: Fix API tag description

**Files:**

- Modify: `server/src/constants.ts`

**Step 1: Fix the description**

Change:

```typescript
  [ApiTag.UserGroups]:
    'A user group is a collection of users that can be used to manage shared spaces and permissions together.',
```

To:

```typescript
  [ApiTag.UserGroups]:
    'Personal user groups for quick selection when sharing albums or inviting members to shared spaces.',
```

**Step 2: Commit**

```bash
git add server/src/constants.ts
git commit -m "fix(server): correct user groups API tag description"
```

---

### Task 8: Regenerate OpenAPI specs and verify

**Step 1: Rebuild server (NotFoundException changes the API spec for the GET endpoint)**

Run: `cd server && pnpm build`
Then: `cd server && pnpm sync:open-api`
Then: `make open-api-typescript`
Then: `make sql`

**Step 2: Run full checks**

Run: `cd server && npx vitest run src/services/user-group.service.spec.ts --config test/vitest.config.mjs`
Run: `make check-server && make lint-server`
Run: `make check-web && make lint-web`
Run: `make format-server && make format-web`

**Step 3: Commit any generated/formatted changes**

```bash
git add -A
git status
# If changes exist:
git commit -m "chore: regenerate OpenAPI specs after review fixes"
```

**Step 4: Push**

```bash
git push
```
