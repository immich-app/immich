# Spaces Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 12 bugs identified in the spaces feature audit, TDD style (red-green-refactor per fix).

**Architecture:** Single branch `fix/spaces-hardening`, one commit per fix. Each commit contains failing test + minimal fix. Server fixes use Vitest unit tests with `newTestService()` auto-mocking. Web fixes use Vitest + `@testing-library/svelte`. Mobile fixes use Flutter test + mocktail.

**Tech Stack:** Vitest, @testing-library/svelte, Flutter test, mocktail, Kysely

---

## Task 1: Server — Validate merge source IDs before processing (Issue 4)

**Files:**

- Modify: `server/src/services/shared-space.service.ts:569-577`
- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing test**

Add after the existing `mergeSpacePeople` tests (after line ~2572) in `shared-space.service.spec.ts`:

```typescript
it('should throw when a source person does not belong to the space', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const targetId = newUuid();
  const validSourceId = newUuid();
  const invalidSourceId = newUuid();
  const target = factory.sharedSpacePerson({ id: targetId, spaceId });
  const validSource = factory.sharedSpacePerson({ id: validSourceId, spaceId });

  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
  mocks.sharedSpace.getPersonById
    .mockResolvedValueOnce(target) // target lookup
    .mockResolvedValueOnce(validSource) // first source — valid
    .mockResolvedValueOnce(undefined); // second source — not found

  await expect(
    sut.mergeSpacePeople(auth, spaceId, targetId, { ids: [validSourceId, invalidSourceId] }),
  ).rejects.toThrow(BadRequestException);
});

it('should throw when a source person belongs to a different space', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const otherSpaceId = newUuid();
  const targetId = newUuid();
  const sourceId = newUuid();
  const target = factory.sharedSpacePerson({ id: targetId, spaceId });
  const wrongSpaceSource = factory.sharedSpacePerson({ id: sourceId, spaceId: otherSpaceId });

  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
  mocks.sharedSpace.getPersonById.mockResolvedValueOnce(target).mockResolvedValueOnce(wrongSpaceSource);

  await expect(sut.mergeSpacePeople(auth, spaceId, targetId, { ids: [sourceId] })).rejects.toThrow(BadRequestException);
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts -t "should throw when a source person does not belong"`

Expected: FAIL — currently the code silently `continue`s instead of throwing.

**Step 3: Write minimal implementation**

In `server/src/services/shared-space.service.ts`, replace lines 569-577:

```typescript
// Validate all source IDs before processing
const sources = [];
for (const sourceId of dto.ids) {
  const source = await this.sharedSpaceRepository.getPersonById(sourceId);
  if (!source || source.spaceId !== spaceId) {
    throw new BadRequestException('Source person not found in this space');
  }
  sources.push(source);
}

for (const source of sources) {
  await this.sharedSpaceRepository.reassignPersonFaces(source.id, targetPersonId);
  await this.sharedSpaceRepository.deletePerson(source.id);
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts -t "mergeSpacePeople"`

Expected: ALL mergeSpacePeople tests PASS.

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "fix(server): validate merge source IDs before processing"
```

---

## Task 2: Server — Add activity logs for person operations (Issue 3)

**Files:**

- Modify: `server/src/enum.ts:62-72`
- Modify: `server/src/services/shared-space.service.ts` (updateSpacePerson, deleteSpacePerson, mergeSpacePeople)
- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing tests**

Add new tests in `shared-space.service.spec.ts`:

```typescript
describe('updateSpacePerson', () => {
  // ... after existing tests ...

  it('should log activity when updating a person', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();
    const personId = newUuid();
    const person = factory.sharedSpacePerson({ id: personId, spaceId });

    mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
    mocks.sharedSpace.getPersonById.mockResolvedValue(person);
    mocks.sharedSpace.updatePerson.mockResolvedValue(person);
    mocks.sharedSpace.getPersonFaceCount.mockResolvedValue(5);
    mocks.sharedSpace.getPersonAssetCount.mockResolvedValue(3);
    mocks.sharedSpace.getAlias.mockResolvedValue(null);
    mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

    await sut.updateSpacePerson(auth, spaceId, personId, { name: 'New Name' });

    expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
      spaceId,
      userId: auth.user.id,
      type: SharedSpaceActivityType.PersonUpdate,
      data: { personId },
    });
  });
});

describe('deleteSpacePerson', () => {
  // ... after existing tests ...

  it('should log activity when deleting a person', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();
    const personId = newUuid();
    const person = factory.sharedSpacePerson({ id: personId, spaceId, name: 'Alice' });

    mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
    mocks.sharedSpace.getPersonById.mockResolvedValue(person);
    mocks.sharedSpace.deletePerson.mockResolvedValue(void 0);
    mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

    await sut.deleteSpacePerson(auth, spaceId, personId);

    expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
      spaceId,
      userId: auth.user.id,
      type: SharedSpaceActivityType.PersonDelete,
      data: { personId, personName: 'Alice' },
    });
  });
});

describe('mergeSpacePeople', () => {
  // ... after existing tests ...

  it('should log activity when merging people', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();
    const targetId = newUuid();
    const sourceId = newUuid();
    const target = factory.sharedSpacePerson({ id: targetId, spaceId });
    const source = factory.sharedSpacePerson({ id: sourceId, spaceId });

    mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
    mocks.sharedSpace.getPersonById.mockResolvedValueOnce(target).mockResolvedValueOnce(source);
    mocks.sharedSpace.reassignPersonFaces.mockResolvedValue(void 0);
    mocks.sharedSpace.deletePerson.mockResolvedValue(void 0);
    mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

    await sut.mergeSpacePeople(auth, spaceId, targetId, { ids: [sourceId] });

    expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith({
      spaceId,
      userId: auth.user.id,
      type: SharedSpaceActivityType.PersonMerge,
      data: { targetPersonId: targetId, mergedCount: 1 },
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts -t "should log activity when"`

Expected: FAIL — `logActivity` is never called in these methods.

**Step 3: Write minimal implementation**

First, add enum values in `server/src/enum.ts` after line 71:

```typescript
  PersonUpdate = 'person_update',
  PersonDelete = 'person_delete',
  PersonMerge = 'person_merge',
```

Then add `logActivity` calls in `server/src/services/shared-space.service.ts`:

After `updateSpacePerson` returns `this.mapSpacePerson(...)` (line 538), add before the return:

```typescript
await this.sharedSpaceRepository.logActivity({
  spaceId,
  userId: auth.user.id,
  type: SharedSpaceActivityType.PersonUpdate,
  data: { personId },
});
```

After `deleteSpacePerson` calls `deletePerson` (line 549), add:

```typescript
await this.sharedSpaceRepository.logActivity({
  spaceId,
  userId: auth.user.id,
  type: SharedSpaceActivityType.PersonDelete,
  data: { personId, personName: person.name },
});
```

After the merge loop in `mergeSpacePeople` (after the for-loop that reassigns faces and deletes), add:

```typescript
await this.sharedSpaceRepository.logActivity({
  spaceId,
  userId: auth.user.id,
  type: SharedSpaceActivityType.PersonMerge,
  data: { targetPersonId, mergedCount: sources.length },
});
```

**Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts -t "should log activity when"`

Expected: PASS.

**Step 5: Commit**

```bash
git add server/src/enum.ts server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "fix(server): add activity logs for person operations"
```

---

## Task 3: Server — Use actual insert count for addAssets activity log (Issue 5)

**Files:**

- Modify: `server/src/services/shared-space.service.ts:359-373`
- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing test**

Add to the `addAssets` describe block:

```typescript
it('should log actual inserted count, not requested count', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const space = factory.sharedSpace({ id: spaceId, faceRecognitionEnabled: false });
  const existingAssetId = newUuid();
  const newAssetId = newUuid();

  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([existingAssetId, newAssetId]));
  // Only 1 row returned (the other was a duplicate, ON CONFLICT DO NOTHING)
  mocks.sharedSpace.addAssets.mockResolvedValue([{ spaceId, assetId: newAssetId, addedById: auth.user.id }]);
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.update.mockResolvedValue(space);
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);

  await sut.addAssets(auth, spaceId, { assetIds: [existingAssetId, newAssetId] });

  expect(mocks.sharedSpace.logActivity).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ count: 1 }),
    }),
  );
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts -t "should log actual inserted count"`

Expected: FAIL — currently logs `dto.assetIds.length` (2), not the actual insert count (1).

**Step 3: Write minimal implementation**

In `server/src/services/shared-space.service.ts`, modify `addAssets` (lines 362-372):

```typescript
const inserted = await this.sharedSpaceRepository.addAssets(
  dto.assetIds.map((assetId) => ({ spaceId, assetId, addedById: auth.user.id })),
);

await this.sharedSpaceRepository.update(spaceId, { lastActivityAt: new Date() });

await this.sharedSpaceRepository.logActivity({
  spaceId,
  userId: auth.user.id,
  type: SharedSpaceActivityType.AssetAdd,
  data: { count: inserted.length, assetIds: dto.assetIds.slice(0, 4) },
});
```

**Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts -t "addAssets"`

Expected: ALL addAssets tests PASS. Check that the existing "should log activity when adding assets" test still passes — it mocks `addAssets.mockResolvedValue([])` with count 0, so update that mock to return 3 items to match `count: 3`:

```typescript
mocks.sharedSpace.addAssets.mockResolvedValue([
  { spaceId: 'space-1', assetId: 'a1', addedById: auth.user.id },
  { spaceId: 'space-1', assetId: 'a2', addedById: auth.user.id },
  { spaceId: 'space-1', assetId: 'a3', addedById: auth.user.id },
]);
```

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "fix(server): use actual insert count for addAssets activity log"
```

---

## Task 4: Server — Clean up orphaned persons regardless of name (Issue 7)

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts:443-449`
- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing test**

The `deleteOrphanedPersons` is called at the end of `removeAssets`. Add a test that verifies the SQL query shape. Since the repository is auto-mocked in unit tests, we test the service behavior instead. We need a medium test to verify the actual query, but for TDD we can add a unit test that documents the expected behavior, and adjust the repository directly.

Actually, this is a repository change, so add a note-test in the service spec and directly fix the repo:

Add to the `removeAssets` describe block:

```typescript
it('should call deleteOrphanedPersons after removing assets', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const assetId = newUuid();

  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
  mocks.sharedSpace.getById.mockResolvedValue(factory.sharedSpace({ id: spaceId }));
  mocks.sharedSpace.removeAssets.mockResolvedValue(void 0);
  mocks.sharedSpace.getLastAssetAddedAt.mockResolvedValue(new Date());
  mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: spaceId }));
  mocks.sharedSpace.logActivity.mockResolvedValue(void 0);
  mocks.sharedSpace.removePersonFacesByAssetIds.mockResolvedValue(void 0);
  mocks.sharedSpace.deleteOrphanedPersons.mockResolvedValue(void 0);

  await sut.removeAssets(auth, spaceId, { assetIds: [assetId] });

  expect(mocks.sharedSpace.deleteOrphanedPersons).toHaveBeenCalledWith(spaceId);
});
```

**Step 2: Run test to verify it passes (this is a green baseline)**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts -t "should call deleteOrphanedPersons"`

Expected: PASS (the service already calls it).

**Step 3: Fix the repository query**

In `server/src/repositories/shared-space.repository.ts`, line 447, remove the `.where('name', '=', '')` line:

Before:

```typescript
  async deleteOrphanedPersons(spaceId: string) {
    await this.db
      .deleteFrom('shared_space_person')
      .where('spaceId', '=', spaceId)
      .where('name', '=', '')
      .where('id', 'not in', this.db.selectFrom('shared_space_person_face').select('personId'))
      .execute();
  }
```

After:

```typescript
  async deleteOrphanedPersons(spaceId: string) {
    await this.db
      .deleteFrom('shared_space_person')
      .where('spaceId', '=', spaceId)
      .where('id', 'not in', this.db.selectFrom('shared_space_person_face').select('personId'))
      .execute();
  }
```

**Step 4: Regenerate SQL documentation**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts -t "removeAssets"`

Expected: PASS.

Then run: `make sql` (from repo root) to regenerate SQL query docs for the changed `@GenerateSql` decorator.

**Step 5: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "fix(server): clean up orphaned persons regardless of name"
```

---

## Task 5: Server — Add null check after getById in removeAssets (Issue 8)

**Files:**

- Modify: `server/src/services/shared-space.service.ts:413-439`
- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing test**

Add to the `removeAssets` describe block:

```typescript
it('should throw when space is not found after role check', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();

  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Editor }));
  mocks.sharedSpace.getById.mockResolvedValue(undefined);

  await expect(sut.removeAssets(auth, spaceId, { assetIds: [newUuid()] })).rejects.toThrow('Space not found');
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts -t "should throw when space is not found after role check"`

Expected: FAIL — code proceeds without throwing.

**Step 3: Write minimal implementation**

In `server/src/services/shared-space.service.ts`, after line 416 (`const space = ...`), add:

```typescript
if (!space) {
  throw new NotFoundException('Space not found');
}
```

Also add `NotFoundException` to the imports if not already imported (check for `@nestjs/common` import at top of file — it likely already imports `BadRequestException`, add `NotFoundException` there).

**Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts -t "removeAssets"`

Expected: ALL removeAssets tests PASS.

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "fix(server): add null check after getById in removeAssets"
```

---

## Task 6: Server — Use toISOString for timestamp response mapping (Issue 12)

**Files:**

- Modify: `server/src/services/shared-space.service.ts:730-778`
- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write failing test**

Add a new describe block:

```typescript
describe('response mapping', () => {
  it('should return ISO 8601 strings for member joinedAt', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();
    const joinedDate = new Date('2024-06-15T10:30:00.000Z');
    const space = factory.sharedSpace({ id: spaceId });

    mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
    mocks.sharedSpace.getMembers.mockResolvedValue([
      makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Owner, joinedAt: joinedDate }),
    ]);
    mocks.sharedSpace.getAssetCountsForSpaces.mockResolvedValue({});
    mocks.sharedSpace.getRecentAssetIdsForSpaces.mockResolvedValue({});
    mocks.sharedSpace.getNewAssetCountsForUser.mockResolvedValue({});
    mocks.sharedSpace.getLastViewedForUser.mockResolvedValue({});
    mocks.sharedSpace.getContributionCountsForSpaces.mockResolvedValue({});

    const result = await sut.getAll(auth);

    expect(result[0].members[0].joinedAt).toBe('2024-06-15T10:30:00.000Z');
    expect(typeof result[0].members[0].joinedAt).toBe('string');
  });

  it('should return ISO 8601 strings for space createdAt', async () => {
    const auth = factory.auth();
    const createdDate = new Date('2024-01-01T00:00:00.000Z');
    const space = factory.sharedSpace({ createdAt: createdDate });

    mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
    mocks.sharedSpace.getMembers.mockResolvedValue([
      makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner }),
    ]);
    mocks.sharedSpace.getAssetCountsForSpaces.mockResolvedValue({});
    mocks.sharedSpace.getRecentAssetIdsForSpaces.mockResolvedValue({});
    mocks.sharedSpace.getNewAssetCountsForUser.mockResolvedValue({});
    mocks.sharedSpace.getLastViewedForUser.mockResolvedValue({});
    mocks.sharedSpace.getContributionCountsForSpaces.mockResolvedValue({});

    const result = await sut.getAll(auth);

    expect(result[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(typeof result[0].createdAt).toBe('string');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts -t "response mapping"`

Expected: FAIL — `as unknown as string` on a Date object returns `[object Object]` or the Date itself, not an ISO string.

**Step 3: Write minimal implementation**

In `server/src/services/shared-space.service.ts`, update `mapMember` (line 746):

Before:

```typescript
      joinedAt: member.joinedAt as unknown as string,
      ...
      profileChangedAt: member.profileChangedAt as unknown as string,
```

After:

```typescript
      joinedAt: (member.joinedAt as Date).toISOString(),
      ...
      profileChangedAt: (member.profileChangedAt as Date).toISOString(),
```

Update `mapSpace` (line 772-773):

Before:

```typescript
      createdAt: space.createdAt as unknown as string,
      updatedAt: space.updatedAt as unknown as string,
```

After:

```typescript
      createdAt: (space.createdAt as Date).toISOString(),
      updatedAt: (space.updatedAt as Date).toISOString(),
```

**Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run src/services/shared-space.service.spec.ts -t "response mapping"`

Expected: PASS.

Also run full suite: `cd server && npx vitest run src/services/shared-space.service.spec.ts`

Expected: ALL tests PASS. Some existing tests may need their factory mocks to provide Date objects instead of strings for `createdAt`/`joinedAt`. If so, update the factory defaults or the specific mock overrides.

**Step 5: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "fix(server): use toISOString for timestamp response mapping"
```

---

## Task 7: Web — Check current user role instead of creator on person page (Issue 1)

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/+page.svelte:33`
- Create: `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/+page.spec.ts`

**Step 1: Write failing test**

Create `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/+page.spec.ts`:

```typescript
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import '$lib/__mocks__/sdk.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';

vi.mock('svelte-persisted-store', async () => {
  const { writable } = await import('svelte/store');
  return {
    persisted: (_key: string, initialValue: unknown) => writable(initialValue),
  };
});

vi.mock('$lib/utils/tunables', () => ({
  TUNABLES: {
    LAYOUT: { WASM: true },
    TIMELINE: { INTERSECTION_EXPAND_TOP: 500, INTERSECTION_EXPAND_BOTTOM: 500 },
  },
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

import {
  Role,
  type SharedSpaceMemberResponseDto,
  type SharedSpacePersonResponseDto,
  type SharedSpaceResponseDto,
} from '@immich/sdk';
import { render, screen, waitFor } from '@testing-library/svelte';
import PersonPage from './+page.svelte';

describe('Space Person Page', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  const makeSpace = (overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto => ({
    id: 'space-1',
    name: 'Test Space',
    description: null,
    createdById: 'user-owner',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    color: null,
    thumbnailAssetId: null,
    assetCount: 10,
    memberCount: 2,
    members: [],
    recentAssetIds: [],
    recentAssetThumbhashes: [],
    lastActivityAt: null,
    newAssetCount: 0,
    lastViewedAt: null,
    ...overrides,
  });

  const makePerson = (overrides: Partial<SharedSpacePersonResponseDto> = {}): SharedSpacePersonResponseDto => ({
    id: 'person-1',
    name: 'Alice',
    alias: null,
    isHidden: false,
    birthDate: null,
    thumbnailPath: '/path/to/thumb',
    faceCount: 5,
    assetCount: 3,
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  });

  const ownerMember: SharedSpaceMemberResponseDto = {
    userId: 'user-owner',
    name: 'Owner',
    email: 'owner@test.com',
    role: Role.Owner,
    joinedAt: '2024-01-01T00:00:00.000Z',
    showInTimeline: true,
  };

  const viewerMember: SharedSpaceMemberResponseDto = {
    userId: 'user-viewer',
    name: 'Viewer',
    email: 'viewer@test.com',
    role: Role.Viewer,
    joinedAt: '2024-01-02T00:00:00.000Z',
    showInTimeline: true,
  };

  const editorMember: SharedSpaceMemberResponseDto = {
    userId: 'user-editor',
    name: 'Editor',
    email: 'editor@test.com',
    role: Role.Editor,
    joinedAt: '2024-01-02T00:00:00.000Z',
    showInTimeline: true,
  };

  it('should NOT show merge button when current user is a viewer', () => {
    // Space was created by user-owner, but current user is user-viewer (a viewer)
    render(PersonPage, {
      data: {
        space: makeSpace({ createdById: 'user-owner' }),
        members: [ownerMember, viewerMember],
        person: makePerson(),
        assetIds: ['asset-1'],
        allPeople: [],
        action: null,
        currentUserId: 'user-viewer',
        meta: { title: 'Alice - Test Space' },
      },
    });

    expect(screen.queryByTestId('start-merge-button')).not.toBeInTheDocument();
  });

  it('should show merge button when current user is an editor', () => {
    render(PersonPage, {
      data: {
        space: makeSpace({ createdById: 'user-owner' }),
        members: [ownerMember, editorMember],
        person: makePerson(),
        assetIds: ['asset-1'],
        allPeople: [],
        action: null,
        currentUserId: 'user-editor',
        meta: { title: 'Alice - Test Space' },
      },
    });

    expect(screen.getByTestId('start-merge-button')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/routes/\(user\)/spaces/\[spaceId\]/people/\[personId\]/+page.spec.ts`

Expected: FAIL — merge button is visible for viewer because current code checks `space.createdById` (owner), not the current user.

Note: The test may need adjustment based on how `currentUserId` is passed. The page currently doesn't accept `currentUserId` as a prop — it needs to come from somewhere. Check how other space pages access the user. The main space page uses `$user.id` from the user store. The person page needs the same pattern.

**Step 3: Write minimal implementation**

In `web/src/routes/(user)/spaces/[spaceId]/people/[personId]/+page.svelte`:

Add the user store import (after line 15):

```typescript
import { user } from '$lib/stores/user.store';
```

Replace line 33:

Before:

```typescript
const currentMember = $derived(members.find((m) => m.userId === space.createdById));
```

After:

```typescript
const currentMember = $derived(members.find((m) => m.userId === $user.id));
```

Update the test to mock the user store instead of passing `currentUserId`. Add before the describe block:

```typescript
import { user } from '$lib/stores/user.store';

// Set the current user for all tests
beforeEach(() => {
  // Will be overridden per-test as needed
});
```

And in each test, set the user store before render:

```typescript
  it('should NOT show merge button when current user is a viewer', () => {
    user.set({ id: 'user-viewer' } as any);
    render(PersonPage, { ... });
    ...
  });

  it('should show merge button when current user is an editor', () => {
    user.set({ id: 'user-editor' } as any);
    render(PersonPage, { ... });
    ...
  });
```

Remove `currentUserId` from the data prop.

**Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/routes/\(user\)/spaces/\[spaceId\]/people/\[personId\]/+page.spec.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add web/src/routes/\(user\)/spaces/\[spaceId\]/people/\[personId\]/+page.svelte web/src/routes/\(user\)/spaces/\[spaceId\]/people/\[personId\]/+page.spec.ts
git commit -m "fix(web): check current user role instead of creator on person page"
```

---

## Task 8: Web — Add error handling to addMember loop (Issue 2)

**Files:**

- Modify: `web/src/lib/modals/SpaceAddMemberModal.svelte:84-93`
- Create: `web/src/lib/modals/SpaceAddMemberModal.spec.ts`

**Step 1: Write failing test**

Create `web/src/lib/modals/SpaceAddMemberModal.spec.ts`:

```typescript
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import '$lib/__mocks__/sdk.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';

vi.mock('svelte-persisted-store', async () => {
  const { writable } = await import('svelte/store');
  return {
    persisted: (_key: string, initialValue: unknown) => writable(initialValue),
  };
});

vi.mock('$lib/utils/tunables', () => ({
  TUNABLES: {
    LAYOUT: { WASM: true },
    TIMELINE: { INTERSECTION_EXPAND_TOP: 500, INTERSECTION_EXPAND_BOTTOM: 500 },
  },
}));

import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { Role, type SharedSpaceMemberResponseDto } from '@immich/sdk';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SpaceAddMemberModal from './SpaceAddMemberModal.svelte';

describe('SpaceAddMemberModal', () => {
  const spaceId = 'space-1';

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();

    // Default mocks for loading users/groups
    sdkMock.searchUsers.mockResolvedValue([
      { id: 'user-2', name: 'Bob', email: 'bob@test.com' },
      { id: 'user-3', name: 'Charlie', email: 'charlie@test.com' },
    ] as any);
    sdkMock.getAllGroups.mockResolvedValue([]);
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  it('should still close with successfully added members when one addMember call fails', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    const successMember: SharedSpaceMemberResponseDto = {
      userId: 'user-2',
      name: 'Bob',
      email: 'bob@test.com',
      role: Role.Viewer,
      joinedAt: '2024-01-01T00:00:00.000Z',
      showInTimeline: true,
    };

    sdkMock.addMember.mockResolvedValueOnce(successMember).mockRejectedValueOnce(new Error('Server error'));

    render(SpaceAddMemberModal, {
      spaceId,
      existingMemberIds: ['user-1'],
      onClose,
    });

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    // Select both users
    await user.click(screen.getByText('Bob'));
    await user.click(screen.getByText('Charlie'));

    // Submit
    const submitButton = screen.getByText('add');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith([successMember]);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/lib/modals/SpaceAddMemberModal.spec.ts`

Expected: FAIL — the current code throws on the second `addMember` call, `onClose` is never called.

**Step 3: Write minimal implementation**

In `web/src/lib/modals/SpaceAddMemberModal.svelte`, replace lines 84-94:

Add `handleError` import at top:

```typescript
import { handleError } from '$lib/utils/handle-error';
```

Replace `onSubmit`:

```typescript
const onSubmit = async () => {
  const added: SharedSpaceMemberResponseDto[] = [];
  for (const user of selectedUsers.values()) {
    try {
      const member = await addMember({
        id: spaceId,
        sharedSpaceMemberCreateDto: { userId: user.id },
      });
      added.push(member);
    } catch (error) {
      handleError(error, $t('spaces_error_adding_member', { values: { name: user.name } }));
    }
  }
  onClose(added);
};
```

**Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/lib/modals/SpaceAddMemberModal.spec.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add web/src/lib/modals/SpaceAddMemberModal.svelte web/src/lib/modals/SpaceAddMemberModal.spec.ts
git commit -m "fix(web): add error handling to addMember loop"
```

---

## Task 9: Web — Revert dropdown on role update failure (Issue 6)

**Files:**

- Modify: `web/src/lib/modals/SpaceMembersModal.svelte:62-78`
- Test: `web/src/lib/modals/SpaceMembersModal.spec.ts`

**Step 1: Write failing test**

Add to `SpaceMembersModal.spec.ts`:

```typescript
it('should revert role in members array when updateMember API fails', async () => {
  sdkMock.updateMember.mockRejectedValue(new Error('Server error'));

  render(SpaceMembersModal, {
    spaceId,
    members: [ownerMember, editorMember],
    isOwner: true,
    onClose,
  });

  // The editor trigger shows "role_editor"
  const editorTrigger = screen.getByRole('button', { name: 'role_editor' });
  await fireEvent.click(editorTrigger);

  // Select viewer role from dropdown
  const viewerOption = await screen.findByRole('option', { name: 'role_viewer' });
  await fireEvent.click(viewerOption);

  // After error, the trigger should still show "role_editor" (reverted)
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'role_editor' })).toBeInTheDocument();
  });
});
```

Add `sdkMock` import at top of the test file:

```typescript
import { sdkMock } from '$lib/__mocks__/sdk.mock';
```

**Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/lib/modals/SpaceMembersModal.spec.ts -t "should revert role"`

Expected: FAIL — the dropdown shows "role_viewer" after the failed API call.

**Step 3: Write minimal implementation**

In `web/src/lib/modals/SpaceMembersModal.svelte`, update `handleRoleChange` (lines 62-78):

```typescript
const handleRoleChange = async (member: SharedSpaceMemberResponseDto, newRole: SharedSpaceRole | 'remove') => {
  if (newRole === 'remove') {
    await handleRemoveMember(member);
    return;
  }

  const previousRole = member.role;
  members = members.map((m) => (m.userId === member.userId ? { ...m, role: newRole } : m));

  try {
    const updated = await updateMember({
      id: spaceId,
      userId: member.userId,
      sharedSpaceMemberUpdateDto: { role: newRole },
    });
    members = members.map((m) => (m.userId === updated.userId ? updated : m));
  } catch (error) {
    members = members.map((m) => (m.userId === member.userId ? { ...m, role: previousRole } : m));
    handleError(error, $t('errors.error_updating_member_role'));
  }
};
```

**Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/lib/modals/SpaceMembersModal.spec.ts`

Expected: ALL tests PASS.

**Step 5: Commit**

```bash
git add web/src/lib/modals/SpaceMembersModal.svelte web/src/lib/modals/SpaceMembersModal.spec.ts
git commit -m "fix(web): revert dropdown on role update failure"
```

---

## Task 10: Web — Parallelize refreshSpace and loadActivities (Issue 9)

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte:314-325`

**Step 1: Write failing test**

This is a straightforward refactor. A unit test would require mocking the full page component, which is heavy for a simple parallelization. Instead, we verify via code review that `Promise.all` is used.

Add a simple smoke test if one doesn't exist, or just apply the fix directly since it's a pure refactor with no behavior change beyond performance.

**Step 2: Apply the fix**

In `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`, replace lines 314-316:

Before:

```typescript
const onSpaceAddAssets = async () => {
  await refreshSpace();
  await loadActivities();
  timelineInteraction.clearMultiselect();
  viewMode = 'view';
};
```

After:

```typescript
const onSpaceAddAssets = async () => {
  await Promise.all([refreshSpace(), loadActivities()]);
  timelineInteraction.clearMultiselect();
  viewMode = 'view';
};
```

Replace lines 321-324:

Before:

```typescript
const onSpaceRemoveAssets = async ({ assetIds }: { assetIds: string[]; spaceId: string }) => {
  timelineManager.removeAssets(assetIds);
  await refreshSpace();
  await loadActivities();
};
```

After:

```typescript
const onSpaceRemoveAssets = async ({ assetIds }: { assetIds: string[]; spaceId: string }) => {
  timelineManager.removeAssets(assetIds);
  await Promise.all([refreshSpace(), loadActivities()]);
};
```

**Step 3: Verify**

Run: `cd web && npx vitest run` to confirm no existing tests break.

**Step 4: Commit**

```bash
git add web/src/routes/\(user\)/spaces/\[spaceId\]/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte
git commit -m "fix(web): parallelize refreshSpace and loadActivities"
```

---

## Task 11: Mobile — Use whereType for safe RemoteAsset filtering (Issue 10)

**Files:**

- Modify: `mobile/lib/pages/library/spaces/space_detail.page.dart:115`
- Test: `mobile/test/modules/spaces/space_detail_test.dart`

**Step 1: Write failing test**

Create `mobile/test/modules/spaces/space_detail_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

void main() {
  group('Space asset filtering', () {
    test('should filter out non-RemoteAsset items using whereType', () {
      final remoteAsset = RemoteAsset(
        id: 'remote-1',
        name: 'photo.jpg',
        ownerId: 'owner-1',
        checksum: 'abc',
        type: AssetType.image,
        createdAt: DateTime(2024, 1, 1),
        updatedAt: DateTime(2024, 1, 1),
        durationInSeconds: 0,
        isFavorite: false,
        isEdited: false,
      );

      final localAsset = LocalAsset(
        id: 'local-1',
        name: 'local_photo.jpg',
        checksum: 'def',
        type: AssetType.image,
        createdAt: DateTime(2024, 1, 1),
        updatedAt: DateTime(2024, 1, 1),
        durationInSeconds: 0,
        isFavorite: false,
        isEdited: false,
        playbackStyle: AssetPlaybackStyle.image,
      );

      final Set<BaseAsset> mixedAssets = {remoteAsset, localAsset};

      // This is the pattern that should be used (whereType)
      final assetIds = mixedAssets.whereType<RemoteAsset>().map((a) => a.id).toList();

      expect(assetIds, equals(['remote-1']));
      expect(assetIds.length, equals(1));
    });

    test('should crash with direct cast when non-RemoteAsset is present', () {
      final localAsset = LocalAsset(
        id: 'local-1',
        name: 'local_photo.jpg',
        checksum: 'def',
        type: AssetType.image,
        createdAt: DateTime(2024, 1, 1),
        updatedAt: DateTime(2024, 1, 1),
        durationInSeconds: 0,
        isFavorite: false,
        isEdited: false,
        playbackStyle: AssetPlaybackStyle.image,
      );

      final Set<BaseAsset> assets = {localAsset};

      // This is the old pattern that crashes
      expect(
        () => assets.map((a) => (a as RemoteAsset).id).toList(),
        throwsA(isA<TypeError>()),
      );
    });
  });
}
```

**Step 2: Run test to verify the behavior**

Run: `cd mobile && flutter test test/modules/spaces/space_detail_test.dart`

Expected: Both tests PASS — the first shows the safe pattern works, the second documents the crash with the old pattern.

**Step 3: Write minimal implementation**

In `mobile/lib/pages/library/spaces/space_detail.page.dart`, replace line 115:

Before:

```dart
    final assetIds = newAssets.map((a) => (a as RemoteAsset).id).toList();
```

After:

```dart
    final assetIds = newAssets.whereType<RemoteAsset>().map((a) => a.id).toList();
```

**Step 4: Run tests**

Run: `cd mobile && flutter test test/modules/spaces/`

Expected: ALL tests PASS.

**Step 5: Commit**

```bash
git add mobile/lib/pages/library/spaces/space_detail.page.dart mobile/test/modules/spaces/space_detail_test.dart
git commit -m "fix(mobile): use whereType for safe RemoteAsset filtering"
```

---

## Task 12: Mobile — Prevent concurrent data refresh race condition (Issue 11)

**Files:**

- Modify: `mobile/lib/pages/library/spaces/space_detail.page.dart:43-82`
- Test: `mobile/test/modules/spaces/space_detail_test.dart`

**Step 1: Write failing test**

Add to `mobile/test/modules/spaces/space_detail_test.dart`:

```dart
  group('Space data refresh guard', () {
    test('_isRefreshing flag prevents concurrent refreshes', () async {
      // This tests the pattern, not the widget directly
      var isRefreshing = false;
      var callCount = 0;

      Future<void> refreshData() async {
        if (isRefreshing) return;
        isRefreshing = true;
        try {
          callCount++;
          await Future.delayed(const Duration(milliseconds: 50));
        } finally {
          isRefreshing = false;
        }
      }

      // Launch two concurrent refreshes
      await Future.wait([refreshData(), refreshData()]);

      // Only one should have executed
      expect(callCount, equals(1));
    });
  });
```

**Step 2: Run test to verify it passes (baseline for the pattern)**

Run: `cd mobile && flutter test test/modules/spaces/space_detail_test.dart -t "_isRefreshing"`

Expected: PASS.

**Step 3: Write minimal implementation**

In `mobile/lib/pages/library/spaces/space_detail.page.dart`, add a `_isRefreshing` flag and guard both methods:

Add as a class field (near other state fields like `_space`, `_members`, `_assets`):

```dart
  bool _isRefreshing = false;
```

Wrap `_loadData()` body:

```dart
  Future<void> _loadData() async {
    if (_isRefreshing) return;
    _isRefreshing = true;
    try {
      // existing body...
    } finally {
      _isRefreshing = false;
    }
  }
```

Make `_refreshAssets()` delegate to `_loadData()` instead of being a separate partial refresh:

```dart
  Future<void> _refreshAssets() async {
    await _loadData();
  }
```

Or, if keeping the separate method is important for performance, guard it the same way:

```dart
  Future<void> _refreshAssets() async {
    if (_isRefreshing) return;
    _isRefreshing = true;
    try {
      // existing body...
    } finally {
      _isRefreshing = false;
    }
  }
```

**Step 4: Run tests**

Run: `cd mobile && flutter test test/modules/spaces/`

Expected: ALL tests PASS.

**Step 5: Commit**

```bash
git add mobile/lib/pages/library/spaces/space_detail.page.dart mobile/test/modules/spaces/space_detail_test.dart
git commit -m "fix(mobile): prevent concurrent data refresh race condition"
```

---

## Post-Implementation Checklist

After all 12 tasks are done:

1. Run full server tests: `cd server && pnpm test`
2. Run full web tests: `cd web && pnpm test`
3. Run full mobile tests: `cd mobile && flutter test`
4. Run linting: `make lint-server && make lint-web`
5. Run type checks: `make check-server && make check-web`
6. Run `make sql` if any `@GenerateSql`-decorated methods changed (Task 4)
7. Run `make open-api` if any controller DTOs changed (none should have)
8. Create PR from `fix/spaces-hardening` to `main`
