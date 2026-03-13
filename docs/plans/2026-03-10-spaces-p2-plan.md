# Spaces P2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add activity recency badges, member contribution cards, slide-out members panel, and empty state onboarding to shared spaces.

**Architecture:** Four features layered on the existing shared spaces system. Feature 1 (recency badge) adds a `lastViewedAt` column and a view-tracking endpoint. Feature 2 (contribution cards) enriches member DTOs with contribution stats. Feature 3 (slide-out panel) replaces the members modal with a right-edge panel. Feature 4 (empty state) adds role-aware onboarding steps. All follow strict TDD.

**Tech Stack:** NestJS + Kysely (server), Svelte 5 + Tailwind (web), Playwright (E2E), Vitest (unit tests)

**Worktree:** `/home/pierre/dev/immich/.claude/worktrees/spaces-p2` (branch: `design/spaces-p2`, based on `feat/spaces-p1-design`)

**Key file references:**

- Service: `server/src/services/shared-space.service.ts`
- Service tests: `server/src/services/shared-space.service.spec.ts`
- Repository: `server/src/repositories/shared-space.repository.ts`
- DTOs: `server/src/dtos/shared-space.dto.ts`
- Controller: `server/src/controllers/shared-space.controller.ts`
- Schema tables: `server/src/schema/tables/shared-space-member.table.ts`
- Database types: `server/src/database.ts` (lines ~320-347)
- Factory: `server/test/small.factory.ts`
- Space card: `web/src/lib/components/spaces/space-card.svelte`
- Space card tests: `web/src/lib/components/spaces/space-card.spec.ts`
- Members modal: `web/src/lib/modals/SpaceMembersModal.svelte`
- Detail page: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- List page: `web/src/routes/(user)/spaces/+page.svelte`
- E2E tests: `e2e/src/specs/web/spaces-p1.e2e-spec.ts` (pattern reference)
- E2E utils: `e2e/src/utils.ts`

---

## Feature 1: Activity Recency Badge

### Task 1: Database migration — add `lastViewedAt` to `shared_space_member`

**Files:**

- Create: `server/src/schema/migrations/1772800000000-AddLastViewedAtToSharedSpaceMember.ts`
- Modify: `server/src/schema/tables/shared-space-member.table.ts`
- Modify: `server/src/database.ts` (~line 337, `SharedSpaceMember` type)

**Step 1: Create the migration file**

```typescript
import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('shared_space_member').addColumn('lastViewedAt', 'timestamptz').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('shared_space_member').dropColumn('lastViewedAt').execute();
}
```

**Step 2: Add column to schema table class**

In `shared-space-member.table.ts`, add the `lastViewedAt` column following the existing pattern. Look at how `showInTimeline` is defined — add a nullable `timestamp with time zone` column.

**Step 3: Add to database.ts manual types**

In the `SharedSpaceMember` type (around line 337), add:

```typescript
lastViewedAt: Date | null;
```

**Step 4: Update factory**

In `server/test/small.factory.ts`, find `sharedSpaceMemberFactory` and add:

```typescript
lastViewedAt: null,
```

**Step 5: Commit**

```bash
git add server/src/schema/migrations/1772800000000-AddLastViewedAtToSharedSpaceMember.ts \
        server/src/schema/tables/shared-space-member.table.ts \
        server/src/database.ts \
        server/test/small.factory.ts
git commit -m "feat(server): add lastViewedAt column to shared_space_member"
```

---

### Task 2: Repository — add `getNewAssetCount`, `getLastContributor`, and `updateMemberLastViewed` methods

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts`

**Step 1: Add `getNewAssetCount` method**

After the `getLastAssetAddedAt` method (~line 196), add:

```typescript
@GenerateSql({ params: [DummyValue.UUID, DummyValue.DATE] })
async getNewAssetCount(spaceId: string, since: Date): Promise<number> {
  const result = await this.db
    .selectFrom('shared_space_asset')
    .select((eb) => eb.fn.countAll().as('count'))
    .where('spaceId', '=', spaceId)
    .where('addedAt', '>', since)
    .executeTakeFirstOrThrow();
  return Number(result.count);
}
```

**Step 2: Add `getLastContributor` method**

```typescript
@GenerateSql({ params: [DummyValue.UUID, DummyValue.DATE] })
async getLastContributor(spaceId: string, since: Date): Promise<{ id: string; name: string } | undefined> {
  return this.db
    .selectFrom('shared_space_asset')
    .innerJoin('user', (join) =>
      join.onRef('user.id', '=', 'shared_space_asset.addedById').on('user.deletedAt', 'is', null),
    )
    .where('shared_space_asset.spaceId', '=', spaceId)
    .where('shared_space_asset.addedAt', '>', since)
    .orderBy('shared_space_asset.addedAt', 'desc')
    .select(['user.id', 'user.name'])
    .limit(1)
    .executeTakeFirst();
}
```

**Step 3: Add `updateMemberLastViewed` method**

```typescript
@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
async updateMemberLastViewed(spaceId: string, userId: string): Promise<void> {
  await this.db
    .updateTable('shared_space_member')
    .set({ lastViewedAt: new Date() })
    .where('spaceId', '=', spaceId)
    .where('userId', '=', userId)
    .execute();
}
```

**Step 4: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "feat(server): add recency badge repository methods"
```

---

### Task 3: DTOs — add recency fields to `SharedSpaceResponseDto`

**Files:**

- Modify: `server/src/dtos/shared-space.dto.ts`

**Step 1: Add new fields to `SharedSpaceResponseDto`**

After the `members` field (~line 144), add:

```typescript
@ApiPropertyOptional({ description: 'Number of new assets since last viewed' })
newAssetCount?: number;

@ApiPropertyOptional({ description: 'Last contributor since last viewed' })
lastContributor?: { id: string; name: string } | null;
```

**Step 2: Commit**

```bash
git add server/src/dtos/shared-space.dto.ts
git commit -m "feat(server): add recency badge fields to SharedSpaceResponseDto"
```

---

### Task 4: Service — write failing tests for `markSpaceViewed`

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`

**Step 1: Add test cases**

At the end of the test file, before the closing `});`, add a new describe block:

```typescript
describe('markSpaceViewed', () => {
  it('should update lastViewedAt for the calling user', async () => {
    mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Viewer }));

    await sut.markSpaceViewed(authStub.user1, 'space-1');

    expect(mocks.sharedSpace.updateMemberLastViewed).toHaveBeenCalledWith('space-1', authStub.user1.user.id);
  });

  it('should throw for non-members', async () => {
    mocks.sharedSpace.getMember.mockResolvedValue(undefined);

    await expect(sut.markSpaceViewed(authStub.user1, 'space-1')).rejects.toThrow('Not a member of this space');
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: FAIL — `sut.markSpaceViewed is not a function`

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.spec.ts
git commit -m "test(server): add failing tests for markSpaceViewed"
```

---

### Task 5: Service — implement `markSpaceViewed`

**Files:**

- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Add the method**

After `removeAssets` (~line 221), add:

```typescript
async markSpaceViewed(auth: AuthDto, spaceId: string): Promise<void> {
  await this.requireMembership(auth, spaceId);
  await this.sharedSpaceRepository.updateMemberLastViewed(spaceId, auth.user.id);
}
```

**Step 2: Run tests to verify they pass**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: PASS

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.ts
git commit -m "feat(server): implement markSpaceViewed service method"
```

---

### Task 6: Service — write failing tests for recency data in `getAll`

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`

**Step 1: Add tests inside the existing `describe('getAll')` block**

Add these tests after the existing `getAll` tests:

```typescript
it('should return newAssetCount when member has lastViewedAt', async () => {
  const lastViewed = new Date('2024-01-01');
  const space = factory.sharedSpace();
  mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
  mocks.sharedSpace.getMembers.mockResolvedValue([]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(5);
  mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
  mocks.sharedSpace.getMember.mockResolvedValue(
    makeMemberResult({ role: SharedSpaceRole.Owner, lastViewedAt: lastViewed }),
  );
  mocks.sharedSpace.getNewAssetCount.mockResolvedValue(3);
  mocks.sharedSpace.getLastContributor.mockResolvedValue({ id: 'user-2', name: 'Marie' });

  const result = await sut.getAll(authStub.user1);

  expect(result[0].newAssetCount).toBe(3);
  expect(result[0].lastContributor).toEqual({ id: 'user-2', name: 'Marie' });
});

it('should return newAssetCount equal to assetCount when lastViewedAt is null', async () => {
  const space = factory.sharedSpace();
  mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
  mocks.sharedSpace.getMembers.mockResolvedValue([]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(5);
  mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
  mocks.sharedSpace.getMember.mockResolvedValue(makeMemberResult({ role: SharedSpaceRole.Owner, lastViewedAt: null }));

  const result = await sut.getAll(authStub.user1);

  expect(result[0].newAssetCount).toBe(5);
  expect(result[0].lastContributor).toBeNull();
});

it('should return newAssetCount 0 when no new assets since lastViewedAt', async () => {
  const space = factory.sharedSpace();
  mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
  mocks.sharedSpace.getMembers.mockResolvedValue([]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(5);
  mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);
  mocks.sharedSpace.getMember.mockResolvedValue(
    makeMemberResult({ role: SharedSpaceRole.Owner, lastViewedAt: new Date() }),
  );
  mocks.sharedSpace.getNewAssetCount.mockResolvedValue(0);

  const result = await sut.getAll(authStub.user1);

  expect(result[0].newAssetCount).toBe(0);
  expect(result[0].lastContributor).toBeNull();
});
```

**Step 2: Run tests to verify they fail**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: FAIL — `newAssetCount` is undefined on the response

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.spec.ts
git commit -m "test(server): add failing tests for recency data in getAll"
```

---

### Task 7: Service — implement recency data in `getAll`

**Files:**

- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Update `getAll` to include recency data**

Replace the `getAll` method body. After fetching members/assetCount/recentAssets, add recency logic:

```typescript
async getAll(auth: AuthDto): Promise<SharedSpaceResponseDto[]> {
  const spaces = await this.sharedSpaceRepository.getAllByUserId(auth.user.id);

  const results: SharedSpaceResponseDto[] = [];
  for (const space of spaces) {
    const members = await this.sharedSpaceRepository.getMembers(space.id);
    const assetCount = await this.sharedSpaceRepository.getAssetCount(space.id);
    const recentAssets = await this.sharedSpaceRepository.getRecentAssets(space.id);

    // Recency badge data
    const membership = await this.sharedSpaceRepository.getMember(space.id, auth.user.id);
    let newAssetCount = 0;
    let lastContributor: { id: string; name: string } | null = null;

    if (membership?.lastViewedAt) {
      newAssetCount = await this.sharedSpaceRepository.getNewAssetCount(space.id, membership.lastViewedAt);
      if (newAssetCount > 0) {
        const contributor = await this.sharedSpaceRepository.getLastContributor(space.id, membership.lastViewedAt);
        lastContributor = contributor ?? null;
      }
    } else {
      // Never viewed — all assets are "new"
      newAssetCount = assetCount;
    }

    results.push({
      ...this.mapSpace(space),
      memberCount: members.length,
      assetCount,
      recentAssetIds: recentAssets.map((a) => a.id),
      recentAssetThumbhashes: recentAssets.map((a) =>
        a.thumbhash ? Buffer.from(a.thumbhash).toString('base64') : null,
      ),
      members: members.map((m) => this.mapMember(m)),
      newAssetCount,
      lastContributor,
    });
  }
  return results;
}
```

**Step 2: Run tests to verify they pass**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: PASS (new tests and all existing tests)

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.ts
git commit -m "feat(server): implement recency data in getAll"
```

---

### Task 8: Controller — add `markSpaceViewed` endpoint

**Files:**

- Modify: `server/src/controllers/shared-space.controller.ts`

**Step 1: Add the endpoint**

After the `updateMemberTimeline` endpoint (~line 126), add:

```typescript
@Patch(':id/view')
@Authenticated({ permission: Permission.SharedSpaceRead })
@HttpCode(HttpStatus.NO_CONTENT)
@Endpoint({
  summary: 'Mark space as viewed',
  description: 'Update the last viewed timestamp for the current user in this space.',
  history: new HistoryBuilder().added('v1').beta('v1'),
})
markSpaceViewed(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
  return this.service.markSpaceViewed(auth, id);
}
```

**Step 2: Run server tests to verify nothing broke**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

**Step 3: Commit**

```bash
git add server/src/controllers/shared-space.controller.ts
git commit -m "feat(server): add PATCH /shared-spaces/:id/view endpoint"
```

---

### Task 9: OpenAPI regeneration

**Step 1: Build server and regenerate OpenAPI clients**

```bash
cd server && pnpm build
cd server && pnpm sync:open-api
make open-api
```

**Step 2: Verify SDK has new methods**

Check that the generated TypeScript SDK includes `markSpaceViewed` and that the DTOs include `newAssetCount` and `lastContributor`.

**Step 3: Clean up any `.rej` files**

```bash
find open-api/ -name '*.rej' -delete
```

**Step 4: Commit**

```bash
git add open-api/ server/src/queries/ mobile/openapi/
git commit -m "chore: regenerate OpenAPI clients for recency badge"
```

---

### Task 10: Web — write failing tests for activity badge on space card

**Files:**

- Modify: `web/src/lib/components/spaces/space-card.spec.ts`

**Step 1: Add test cases**

Add tests to the existing space-card describe block. The `makeSpace` factory needs to be updated to include `newAssetCount` and `lastContributor` fields:

```typescript
it('should not render activity dot when newAssetCount is 0', () => {
  render(SpaceCard, { space: makeSpace({ newAssetCount: 0 }) });
  expect(screen.queryByTestId('activity-dot')).not.toBeInTheDocument();
});

it('should render activity dot when newAssetCount > 0', () => {
  render(SpaceCard, { space: makeSpace({ newAssetCount: 3 }) });
  expect(screen.getByTestId('activity-dot')).toBeInTheDocument();
});

it('should show contributor name with count', () => {
  render(SpaceCard, {
    space: makeSpace({
      newAssetCount: 3,
      lastContributor: { id: 'user-1', name: 'Pierre' },
    }),
  });
  expect(screen.getByTestId('activity-line')).toHaveTextContent('Pierre added 3 new');
});

it('should show count only without contributor', () => {
  render(SpaceCard, {
    space: makeSpace({ newAssetCount: 5, lastContributor: null }),
  });
  expect(screen.getByTestId('activity-line')).toHaveTextContent('5 new photos');
});

it('should cap display at 99+', () => {
  render(SpaceCard, {
    space: makeSpace({ newAssetCount: 150, lastContributor: null }),
  });
  expect(screen.getByTestId('activity-line')).toHaveTextContent('99+ new photos');
});
```

**Step 2: Run tests to verify they fail**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-card.spec.ts
```

**Step 3: Commit**

```bash
git add web/src/lib/components/spaces/space-card.spec.ts
git commit -m "test(web): add failing tests for activity badge on space card"
```

---

### Task 11: Web — implement activity badge on space card

**Files:**

- Modify: `web/src/lib/components/spaces/space-card.svelte`

**Step 1: Add activity badge to the card**

In the script section, add derived values:

```typescript
let hasActivity = $derived((space.newAssetCount ?? 0) > 0);
let activityText = $derived(() => {
  const count = space.newAssetCount ?? 0;
  const displayCount = count > 99 ? '99+' : String(count);
  if (space.lastContributor) {
    return `${space.lastContributor.name} added ${displayCount} new`;
  }
  return `${displayCount} new photos`;
});
```

In the template, add the activity dot inside the collage container (make it `relative` if not already):

```svelte
{#if hasActivity}
  <div data-testid="activity-dot" class="absolute -right-1 -top-1 z-10 h-2 w-2 rounded-full bg-immich-primary">
    <div class="absolute inset-0 animate-ping rounded-full bg-immich-primary opacity-40"></div>
  </div>
{/if}
```

Below the space name, add the activity line (before the stats line):

```svelte
{#if hasActivity}
  <p data-testid="activity-line" class="truncate text-xs font-medium text-immich-primary">
    {activityText()}
  </p>
{/if}
```

**Step 2: Run tests to verify they pass**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-card.spec.ts
```

**Step 3: Commit**

```bash
git add web/src/lib/components/spaces/space-card.svelte
git commit -m "feat(web): implement activity recency badge on space card"
```

---

### Task 12: Web — call `markSpaceViewed` on detail page load

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Add view tracking**

Import the SDK function and call it when the space loads. In the script section, add an `$effect` that fires once when the space is loaded:

```typescript
import { markSpaceViewed } from '@immich/sdk';

$effect(() => {
  if (space?.id) {
    markSpaceViewed({ id: space.id }).catch(() => {
      // Silent fail — view tracking is non-critical
    });
  }
});
```

**Step 2: Commit**

```bash
git add web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte
git commit -m "feat(web): call markSpaceViewed on space detail page load"
```

---

### Task 13: Run full server test suite

**Step 1: Run all server tests**

```bash
cd server && pnpm test -- --run
```

Expected: All 3100+ tests passing

**Step 2: Run lint and typecheck**

```bash
make lint-server && make check-server
```

Fix any issues before proceeding.

---

## Feature 2: Member Contribution Cards

### Task 14: Repository — add `getContributionCounts` and `getMemberActivity` methods

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts`

**Step 1: Add `getContributionCounts` method**

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
getContributionCounts(spaceId: string) {
  return this.db
    .selectFrom('shared_space_asset')
    .where('spaceId', '=', spaceId)
    .groupBy('addedById')
    .select(['addedById', (eb) => eb.fn.countAll().as('count')])
    .execute();
}
```

**Step 2: Add `getMemberActivity` method**

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
getMemberActivity(spaceId: string) {
  return this.db
    .selectFrom('shared_space_asset')
    .where('spaceId', '=', spaceId)
    .groupBy('addedById')
    .select([
      'addedById',
      (eb) => eb.fn.max('addedAt').as('lastAddedAt'),
      (eb) =>
        eb
          .selectFrom('shared_space_asset as ssa2')
          .whereRef('ssa2.addedById', '=', 'shared_space_asset.addedById')
          .where('ssa2.spaceId', '=', spaceId)
          .orderBy('ssa2.addedAt', 'desc')
          .select('ssa2.assetId')
          .limit(1)
          .as('recentAssetId'),
    ])
    .execute();
}
```

**Step 3: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "feat(server): add contribution count and member activity repository methods"
```

---

### Task 15: DTOs — add contribution fields to `SharedSpaceMemberResponseDto`

**Files:**

- Modify: `server/src/dtos/shared-space.dto.ts`

**Step 1: Add new fields to `SharedSpaceMemberResponseDto`**

After `showInTimeline` (~line 100), add:

```typescript
@ApiPropertyOptional({ description: 'Number of photos contributed by this member' })
contributionCount?: number;

@ApiPropertyOptional({ description: 'Last time this member added a photo' })
lastActiveAt?: string | null;

@ApiPropertyOptional({ description: 'Most recently added asset ID by this member' })
recentAssetId?: string | null;
```

**Step 2: Commit**

```bash
git add server/src/dtos/shared-space.dto.ts
git commit -m "feat(server): add contribution fields to SharedSpaceMemberResponseDto"
```

---

### Task 16: Service — write failing tests for enriched `getMembers`

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`

**Step 1: Replace the existing `getMembers` test with enriched tests**

Find the existing `describe('getMembers')` block and replace/extend it:

```typescript
describe('getMembers', () => {
  it('should return members with contribution counts', async () => {
    const member = makeMemberResult({ userId: 'user-1', role: SharedSpaceRole.Owner });
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.sharedSpace.getMembers.mockResolvedValue([member]);
    mocks.sharedSpace.getContributionCounts.mockResolvedValue([{ addedById: 'user-1', count: BigInt(42) }]);
    mocks.sharedSpace.getMemberActivity.mockResolvedValue([
      { addedById: 'user-1', lastAddedAt: newDate(), recentAssetId: 'asset-1' },
    ]);

    const result = await sut.getMembers(authStub.user1, 'space-1');

    expect(result[0].contributionCount).toBe(42);
    expect(result[0].recentAssetId).toBe('asset-1');
    expect(result[0].lastActiveAt).toBeDefined();
  });

  it('should return 0 contribution count for members with no contributions', async () => {
    const member = makeMemberResult({ userId: 'user-1', role: SharedSpaceRole.Viewer });
    mocks.sharedSpace.getMember.mockResolvedValue(member);
    mocks.sharedSpace.getMembers.mockResolvedValue([member]);
    mocks.sharedSpace.getContributionCounts.mockResolvedValue([]);
    mocks.sharedSpace.getMemberActivity.mockResolvedValue([]);

    const result = await sut.getMembers(authStub.user1, 'space-1');

    expect(result[0].contributionCount).toBe(0);
    expect(result[0].recentAssetId).toBeNull();
    expect(result[0].lastActiveAt).toBeNull();
  });

  it('should sort members: owner first, then by contribution count desc', async () => {
    const owner = makeMemberResult({ userId: 'user-1', role: SharedSpaceRole.Owner, name: 'Owner' });
    const editor = makeMemberResult({ userId: 'user-2', role: SharedSpaceRole.Editor, name: 'Editor' });
    const viewer = makeMemberResult({ userId: 'user-3', role: SharedSpaceRole.Viewer, name: 'Viewer' });
    mocks.sharedSpace.getMember.mockResolvedValue(owner);
    mocks.sharedSpace.getMembers.mockResolvedValue([viewer, editor, owner]);
    mocks.sharedSpace.getContributionCounts.mockResolvedValue([
      { addedById: 'user-3', count: BigInt(100) },
      { addedById: 'user-2', count: BigInt(50) },
      { addedById: 'user-1', count: BigInt(10) },
    ]);
    mocks.sharedSpace.getMemberActivity.mockResolvedValue([]);

    const result = await sut.getMembers(authStub.user1, 'space-1');

    expect(result[0].name).toBe('Owner');
    expect(result[1].name).toBe('Viewer');
    expect(result[2].name).toBe('Editor');
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: FAIL — `contributionCount` is undefined

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.spec.ts
git commit -m "test(server): add failing tests for enriched getMembers"
```

---

### Task 17: Service — implement enriched `getMembers`

**Files:**

- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Replace the `getMembers` method**

```typescript
async getMembers(auth: AuthDto, spaceId: string): Promise<SharedSpaceMemberResponseDto[]> {
  await this.requireMembership(auth, spaceId);

  const members = await this.sharedSpaceRepository.getMembers(spaceId);
  const contributions = await this.sharedSpaceRepository.getContributionCounts(spaceId);
  const activity = await this.sharedSpaceRepository.getMemberActivity(spaceId);

  const countMap = new Map(contributions.map((c) => [c.addedById, Number(c.count)]));
  const activityMap = new Map(activity.map((a) => [a.addedById, a]));

  const enriched = members.map((member) => ({
    ...this.mapMember(member),
    contributionCount: countMap.get(member.userId) ?? 0,
    lastActiveAt: activityMap.get(member.userId)?.lastAddedAt
      ? (activityMap.get(member.userId)!.lastAddedAt as unknown as Date).toISOString()
      : null,
    recentAssetId: activityMap.get(member.userId)?.recentAssetId ?? null,
  }));

  // Sort: owner first, then by contribution count desc
  return enriched.sort((a, b) => {
    const aIsOwner = a.role === SharedSpaceRole.Owner ? 1 : 0;
    const bIsOwner = b.role === SharedSpaceRole.Owner ? 1 : 0;
    if (aIsOwner !== bIsOwner) {
      return bIsOwner - aIsOwner;
    }
    return (b.contributionCount ?? 0) - (a.contributionCount ?? 0);
  });
}
```

**Step 2: Run tests to verify they pass**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.ts
git commit -m "feat(server): implement enriched getMembers with contribution data"
```

---

### Task 18: OpenAPI regeneration for contribution data

**Step 1: Build and regenerate**

```bash
cd server && pnpm build && pnpm sync:open-api
make open-api
find open-api/ -name '*.rej' -delete
```

**Step 2: Commit**

```bash
git add open-api/ server/src/queries/ mobile/openapi/
git commit -m "chore: regenerate OpenAPI clients for member contributions"
```

---

## Feature 3: Slide-out Members Panel

### Task 19: Web — write failing tests for `SpaceMembersPanel`

**Files:**

- Create: `web/src/lib/components/spaces/space-members-panel.spec.ts`

**Step 1: Write component tests**

Create the test file with these test cases. Use the same patterns as `space-card.spec.ts` — import `render`, `screen` from `@testing-library/svelte`, mock SDK functions.

Test cases:

1. Panel has `translate-x-full` class when `open` is false
2. Panel has `translate-x-0` class when `open` is true
3. Panel shows "Members (N)" in header with correct count
4. Close button calls `onClose` callback
5. Add member button is visible when `isOwner` is true
6. Add member button is not visible when `isOwner` is false
7. Renders all members passed via props
8. Members display contribution count text
9. Members display "No photos added yet" when contributionCount is 0
10. Members display recent asset thumbnail when recentAssetId exists

**Step 2: Run tests to verify they fail**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-members-panel.spec.ts
```

Expected: FAIL — module not found

**Step 3: Commit**

```bash
git add web/src/lib/components/spaces/space-members-panel.spec.ts
git commit -m "test(web): add failing tests for SpaceMembersPanel"
```

---

### Task 20: Web — implement `SpaceMembersPanel`

**Files:**

- Create: `web/src/lib/components/spaces/space-members-panel.svelte`

**Step 1: Implement the panel component**

Create a Svelte 5 component with these sections:

1. **Backdrop** (mobile only): `fixed inset-0 z-40 bg-black/30 lg:hidden`, with `transition:fade`, click triggers `onClose`
2. **Panel container**: `fixed right-0 top-0 z-50 h-full w-full sm:w-[380px] border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-immich-dark-bg shadow-xl transform transition-transform duration-300 ease-out`
   - `class:translate-x-0={open}` / `class:translate-x-full={!open}`
3. **Header**: `flex items-center justify-between px-5 py-4 border-b` — title "Members (N)" + close button (`mdiClose`)
4. **Add member button** (owner only): `px-5 py-3 border-b` with `mdiAccountPlusOutline`
5. **Member list**: `flex-1 overflow-y-auto` — each member rendered as a contribution card:
   - Avatar (40px) + name/email + role badge
   - Contribution stats: thumbnail (48x48) + `"{count} photos added · Active {timeago}"` or `"No photos added yet"`
   - Owner: role badge only (no dropdown). Non-owner (when viewer is owner): role dropdown (Editor/Viewer/Remove)

6. **Keyboard handler**: Listen for `Escape` to close

Props interface:

```typescript
interface Props {
  space: SharedSpaceResponseDto;
  members: SharedSpaceMemberResponseDto[];
  currentUserId: string;
  isOwner: boolean;
  open: boolean;
  onClose: () => void;
  onMembersChanged: () => void;
}
```

**Step 2: Run tests to verify they pass**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-members-panel.spec.ts
```

**Step 3: Commit**

```bash
git add web/src/lib/components/spaces/space-members-panel.svelte
git commit -m "feat(web): implement SpaceMembersPanel slide-out component"
```

---

### Task 21: Web — integrate panel into detail page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Replace modal with panel**

1. Add `import SpaceMembersPanel from '$lib/components/spaces/space-members-panel.svelte'`
2. Add state: `let membersPanelOpen = $state(false);`
3. Replace the `handleShowMembers` function — instead of `modalManager.show(SpaceMembersModal, ...)`, toggle `membersPanelOpen = !membersPanelOpen`
4. Add the panel component at the bottom of the template:

```svelte
<SpaceMembersPanel
  {space}
  {members}
  currentUserId={$user.id}
  isOwner={isOwner}
  open={membersPanelOpen}
  onClose={() => (membersPanelOpen = false)}
  onMembersChanged={async () => {
    const updatedMembers = await getMembers({ id: space.id });
    members = updatedMembers;
  }}
/>
```

5. Remove the `SpaceMembersModal` import if no longer used elsewhere

**Step 2: Verify it works with existing tests**

```bash
cd web && pnpm test -- --run
```

**Step 3: Commit**

```bash
git add web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte
git commit -m "feat(web): integrate SpaceMembersPanel into space detail page"
```

---

## Feature 4: Empty State Onboarding

### Task 22: Web — write failing tests for `SpaceEmptyState`

**Files:**

- Create: `web/src/lib/components/spaces/space-empty-state.spec.ts`

**Step 1: Write component tests**

Test cases:

1. Renders "Get started with your space" title for owner
2. Shows all 3 steps for owner role
3. Shows only "Add photos" step for editor role
4. Shows passive "No photos yet" message for viewer role — no steps
5. Step 1 click triggers `onAddPhotos` callback
6. Step 2 click triggers `onInviteMembers` callback
7. Step 3 has disabled styling (opacity-50)
8. Renders gradient icon with correct `data-testid`

**Step 2: Run tests to verify they fail**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-empty-state.spec.ts
```

**Step 3: Commit**

```bash
git add web/src/lib/components/spaces/space-empty-state.spec.ts
git commit -m "test(web): add failing tests for SpaceEmptyState"
```

---

### Task 23: Web — implement `SpaceEmptyState`

**Files:**

- Create: `web/src/lib/components/spaces/space-empty-state.svelte`

**Step 1: Implement the component**

Props:

```typescript
interface Props {
  space: SharedSpaceResponseDto;
  currentRole: string;
  gradientClass: string;
  onAddPhotos: () => void;
  onInviteMembers: () => void;
}
```

Template structure:

- Container: `max-w-md mx-auto py-16 text-center`
- Gradient icon: 80x80 `rounded-2xl` with `gradientClass`, `mdiCameraOutline` icon (32px, white, 80% opacity)
- Title: `"Get started with your space"` (`text-xl font-semibold`) — only for owner/editor
- Viewer message: `"No photos yet"` title + `"Photos added to this space will appear here"` body

Step rows (owner):

1. `mdiImagePlusOutline` — "Add photos from your timeline" → `onAddPhotos()`
2. `mdiAccountPlusOutline` — "Invite members to collaborate" → `onInviteMembers()`
3. `mdiImageFilterHdrOutline` — "Set a cover photo to personalize" → disabled (`opacity-50 cursor-default`)

Step rows (editor): only step 1

Each row: `flex items-center gap-3 px-4 py-3.5 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors duration-150`

**Step 2: Run tests to verify they pass**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-empty-state.spec.ts
```

**Step 3: Commit**

```bash
git add web/src/lib/components/spaces/space-empty-state.svelte
git commit -m "feat(web): implement SpaceEmptyState onboarding component"
```

---

### Task 24: Web — integrate empty state into detail page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Replace EmptyPlaceholder with SpaceEmptyState**

1. Import `SpaceEmptyState` from `'$lib/components/spaces/space-empty-state.svelte'`
2. In the timeline's empty snippet, replace the `EmptyPlaceholder` usage with:

```svelte
<SpaceEmptyState
  {space}
  currentRole={currentMember?.role ?? 'viewer'}
  gradientClass={gradientClasses[Math.abs(space.id.codePointAt(0) ?? 0) % gradientClasses.length]}
  onAddPhotos={handleAddAssets}
  onInviteMembers={() => (membersPanelOpen = true)}
/>
```

**Step 2: Run web tests**

```bash
cd web && pnpm test -- --run
```

**Step 3: Commit**

```bash
git add web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte
git commit -m "feat(web): integrate SpaceEmptyState into space detail page"
```

---

## Quality Assurance

### Task 25: Playwright E2E tests

**Files:**

- Create: `e2e/src/specs/web/spaces-p2.e2e-spec.ts`

**Step 1: Write E2E tests**

Follow the pattern from `spaces-p1.e2e-spec.ts`. Use `utils.createSpace`, `utils.createAsset`, `utils.addSpaceAssets`, `utils.setAuthCookies`, `utils.addSpaceMember`.

For the `markSpaceViewed` helper, add it to `e2e/src/utils.ts`:

```typescript
markSpaceViewed: (accessToken: string, spaceId: string) =>
  markSpaceViewed({ id: spaceId }, { headers: asBearerAuth(accessToken) }),
```

**Test sections:**

```typescript
test.describe('Spaces P2', () => {
  // Setup: create admin + second user

  test.describe('Activity Recency Badge', () => {
    test('should show activity badge when new assets added since last view');
    test('should clear activity badge after visiting space');
    test('should not show badge when no new activity');
    test('should show contributor name in activity line');
  });

  test.describe('Member Contributions', () => {
    test('should show contribution count in members panel');
    test('should show "No photos added yet" for member with no contributions');
    test('should sort members by contribution count');
  });

  test.describe('Slide-out Members Panel', () => {
    test('should open panel when members button clicked');
    test('should close panel when close button clicked');
    test('should close panel when Escape pressed');
    test('should allow owner to add member via panel');
    test('should allow owner to change member role');
  });

  test.describe('Empty State Onboarding', () => {
    test('should show onboarding steps for owner in empty space');
    test('should show single step for editor in empty space');
    test('should show passive message for viewer in empty space');
    test('should open asset picker when "Add photos" clicked');
    test('should hide empty state after photos added');
  });
});
```

**Step 2: Run E2E tests**

```bash
cd e2e && pnpm test:web -- --grep "Spaces P2"
```

**Step 3: Commit**

```bash
git add e2e/src/specs/web/spaces-p2.e2e-spec.ts e2e/src/utils.ts
git commit -m "test(e2e): add Playwright E2E tests for spaces P2 features"
```

---

### Task 26: Full test suite + lint + format + typecheck

**Step 1: Run all checks**

```bash
cd server && pnpm test -- --run
cd web && pnpm test -- --run
make lint-server && make lint-web
make format-server && make format-web
make check-server && make check-web
```

**Step 2: Fix any issues**

Fix lint errors, format issues, type errors.

**Step 3: Final commit if needed**

```bash
git add -A
git commit -m "chore: fix lint, format, and type issues"
```

---

### Task 27: Final verification

**Step 1: Run full E2E suite**

```bash
cd e2e && pnpm test:web
```

**Step 2: Verify all existing tests still pass**

```bash
cd server && pnpm test -- --run
cd web && pnpm test -- --run
```

**Step 3: Review all changes**

```bash
git log --oneline design/spaces-p2..HEAD
git diff --stat feat/spaces-p1-design..HEAD
```

Verify the diff is clean and all features are implemented.
