# Spaces P1: Collage Cards, Hero Section & Sort Controls — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add multi-image collage cards, a hero section on the detail page, and a sort dropdown on the space list page — making Shared Spaces visually distinct from Albums.

**Architecture:** Add a `lastActivityAt` column to `shared_space` (updated on asset add/remove). Add a repository method to fetch recent asset IDs + thumbhashes per space. Thread both through DTOs and service. Build three new Svelte 5 components (`SpaceCollage`, `SpaceHero`, `SpacesControls`) and wire them into existing pages. All server changes follow strict TDD.

**Tech Stack:** NestJS (server), Kysely (DB), Vitest (tests), Svelte 5 (web), Tailwind CSS 4, @testing-library/svelte, Playwright (E2E), OpenAPI codegen

---

### Task 1: Database Migration — Add `lastActivityAt` column

**Files:**

- Create: `server/src/schema/migrations/1772790000000-AddLastActivityAtToSharedSpace.ts`
- Modify: `server/src/schema/tables/shared-space.table.ts:31`
- Modify: `server/src/database.ts:320-330`

**Step 1: Create the migration file**

```typescript
// server/src/schema/migrations/1772790000000-AddLastActivityAtToSharedSpace.ts
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space" ADD "lastActivityAt" timestamp with time zone`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "shared_space" DROP COLUMN "lastActivityAt"`.execute(db);
}
```

**Step 2: Add column to schema table**

In `server/src/schema/tables/shared-space.table.ts`, add after the `thumbnailAssetId` column (line 31):

```typescript
@Column({ type: 'timestamp with time zone', nullable: true })
lastActivityAt!: Timestamp | null;
```

Import `Timestamp` (already imported on line 8).

**Step 3: Update database.ts types**

In `server/src/database.ts`, add `lastActivityAt` to the `SharedSpace` type (after `thumbnailAssetId`, line 325):

```typescript
lastActivityAt: Date | null;
```

**Step 4: Commit**

```bash
git add server/src/schema/migrations/1772790000000-AddLastActivityAtToSharedSpace.ts server/src/schema/tables/shared-space.table.ts server/src/database.ts
git commit -m "feat(server): add lastActivityAt column to shared_space table"
```

---

### Task 2: Update Test Factory — Add new fields

**Files:**

- Modify: `server/test/small.factory.ts:516-527`

**Step 1: Add `lastActivityAt` to sharedSpaceFactory**

In `server/test/small.factory.ts`, find the `sharedSpaceFactory` function (line 516) and add `lastActivityAt`:

```typescript
const sharedSpaceFactory = (data: Partial<SharedSpace> = {}): SharedSpace => ({
  id: newUuid(),
  name: 'Test Space',
  description: null,
  createdById: newUuid(),
  thumbnailAssetId: null,
  lastActivityAt: null,
  createdAt: newDate(),
  updatedAt: newDate(),
  createId: newUuid(),
  updateId: newUuid(),
  ...data,
});
```

**Step 2: Run existing tests to verify nothing breaks**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: ALL PASS (new field defaults to null, no behavior change)

**Step 3: Commit**

```bash
git add server/test/small.factory.ts
git commit -m "test(server): add lastActivityAt to shared space factory"
```

---

### Task 3: Repository — Add `getRecentAssets` method

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts:160-173`

**Step 1: Add the method**

Add after `getMostRecentAssetId` (line 173) in `server/src/repositories/shared-space.repository.ts`:

```typescript
@GenerateSql({ params: [DummyValue.UUID, 4] })
getRecentAssets(spaceId: string, limit: number = 4) {
  return this.db
    .selectFrom('shared_space_asset')
    .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
    .where('shared_space_asset.spaceId', '=', spaceId)
    .where('asset.deletedAt', 'is', null)
    .orderBy('shared_space_asset.addedAt', 'desc')
    .select(['asset.id', 'asset.thumbhash'])
    .limit(limit)
    .execute();
}
```

**Step 2: Add `getLastAssetAddedAt` method**

Add after `getRecentAssets`:

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
async getLastAssetAddedAt(spaceId: string): Promise<Date | undefined> {
  const result = await this.db
    .selectFrom('shared_space_asset')
    .where('spaceId', '=', spaceId)
    .select((eb) => eb.fn.max('addedAt').as('lastAddedAt'))
    .executeTakeFirst();
  return result?.lastAddedAt ?? undefined;
}
```

**Step 3: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "feat(server): add getRecentAssets and getLastAssetAddedAt repository methods"
```

---

### Task 4: DTOs — Add new fields to SharedSpaceResponseDto

**Files:**

- Modify: `server/src/dtos/shared-space.dto.ts:86-116`

**Step 1: Add new fields to SharedSpaceResponseDto**

In `server/src/dtos/shared-space.dto.ts`, add after `thumbnailAssetId` (line 112):

```typescript
@ApiPropertyOptional({ description: 'Last activity timestamp (most recent asset add)' })
lastActivityAt?: string | null;

@ApiPropertyOptional({ description: 'Recent asset IDs for collage display (up to 4)', type: [String] })
recentAssetIds?: string[];

@ApiPropertyOptional({ description: 'Thumbhashes for recent assets (parallel array)', type: [String] })
recentAssetThumbhashes?: (string | null)[];
```

**Step 2: Commit**

```bash
git add server/src/dtos/shared-space.dto.ts
git commit -m "feat(server): add lastActivityAt, recentAssetIds, recentAssetThumbhashes to DTOs"
```

---

### Task 5: Service Tests — Write failing tests for `lastActivityAt` tracking

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts:621-715`

**Step 1: Write failing test — addAssets updates lastActivityAt**

In the `addAssets` describe block (line 621), add after the existing tests:

```typescript
it('should update lastActivityAt when adding assets', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const assetId = newUuid();
  const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });
  const space = factory.sharedSpace({ id: spaceId, thumbnailAssetId: newUuid() });

  mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
  mocks.sharedSpace.addAssets.mockResolvedValue([]);
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.update.mockResolvedValue(space);

  await sut.addAssets(auth, spaceId, { assetIds: [assetId] });

  expect(mocks.sharedSpace.update).toHaveBeenCalledWith(
    spaceId,
    expect.objectContaining({ lastActivityAt: expect.any(Date) }),
  );
});
```

**Step 2: Write failing test — removeAssets recomputes lastActivityAt**

In the `removeAssets` describe block (line 687), add:

```typescript
it('should recompute lastActivityAt after removing assets', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const lastDate = new Date('2026-03-01T00:00:00.000Z');
  const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

  mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
  mocks.sharedSpace.removeAssets.mockResolvedValue(void 0);
  mocks.sharedSpace.getLastAssetAddedAt.mockResolvedValue(lastDate);
  mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: spaceId, lastActivityAt: lastDate }));

  await sut.removeAssets(auth, spaceId, { assetIds: [newUuid()] });

  expect(mocks.sharedSpace.getLastAssetAddedAt).toHaveBeenCalledWith(spaceId);
  expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, { lastActivityAt: lastDate });
});

it('should set lastActivityAt to null when removing last assets', async () => {
  const auth = factory.auth();
  const spaceId = newUuid();
  const editorMember = makeMemberResult({ spaceId, userId: auth.user.id, role: SharedSpaceRole.Editor });

  mocks.sharedSpace.getMember.mockResolvedValue(editorMember);
  mocks.sharedSpace.removeAssets.mockResolvedValue(void 0);
  mocks.sharedSpace.getLastAssetAddedAt.mockResolvedValue(void 0);
  mocks.sharedSpace.update.mockResolvedValue(factory.sharedSpace({ id: spaceId, lastActivityAt: null }));

  await sut.removeAssets(auth, spaceId, { assetIds: [newUuid()] });

  expect(mocks.sharedSpace.update).toHaveBeenCalledWith(spaceId, { lastActivityAt: null });
});
```

**Step 3: Run tests to verify they fail**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: 3 FAILs — `addAssets` doesn't call `update` with `lastActivityAt`, `removeAssets` doesn't call `getLastAssetAddedAt` or `update`.

**Step 4: Commit failing tests**

```bash
git add server/src/services/shared-space.service.spec.ts
git commit -m "test(server): add failing tests for lastActivityAt tracking"
```

---

### Task 6: Service Implementation — `lastActivityAt` tracking in addAssets/removeAssets

**Files:**

- Modify: `server/src/services/shared-space.service.ts:189-204`

**Step 1: Update addAssets to set lastActivityAt**

Replace `addAssets` method (lines 189-199):

```typescript
async addAssets(auth: AuthDto, spaceId: string, dto: SharedSpaceAssetAddDto): Promise<void> {
  await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);
  await this.sharedSpaceRepository.addAssets(
    dto.assetIds.map((assetId) => ({ spaceId, assetId, addedById: auth.user.id })),
  );

  const space = await this.sharedSpaceRepository.getById(spaceId);
  const updateFields: Record<string, unknown> = { lastActivityAt: new Date() };
  if (space && !space.thumbnailAssetId) {
    updateFields.thumbnailAssetId = dto.assetIds[0];
  }
  await this.sharedSpaceRepository.update(spaceId, updateFields);
}
```

**Step 2: Update removeAssets to recompute lastActivityAt**

Replace `removeAssets` method (lines 201-204):

```typescript
async removeAssets(auth: AuthDto, spaceId: string, dto: SharedSpaceAssetRemoveDto): Promise<void> {
  await this.requireRole(auth, spaceId, SharedSpaceRole.Editor);
  await this.sharedSpaceRepository.removeAssets(spaceId, dto.assetIds);

  const lastAddedAt = await this.sharedSpaceRepository.getLastAssetAddedAt(spaceId);
  await this.sharedSpaceRepository.update(spaceId, { lastActivityAt: lastAddedAt ?? null });
}
```

**Step 3: Run tests to verify they pass**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: ALL PASS

**Step 4: Commit**

```bash
git add server/src/services/shared-space.service.ts
git commit -m "feat(server): update lastActivityAt on asset add/remove"
```

---

### Task 7: Service Tests — Write failing tests for collage data in getAll/get

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts:89-237`

**Step 1: Write failing test — getAll includes collage data**

In the `getAll` describe block (line 89), add:

```typescript
it('should include recentAssetIds and thumbhashes', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace();
  const recentAssets = [
    { id: newUuid(), thumbhash: 'abc123' },
    { id: newUuid(), thumbhash: 'def456' },
  ];

  mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
  mocks.sharedSpace.getMembers.mockResolvedValue([]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(5);
  mocks.sharedSpace.getRecentAssets.mockResolvedValue(recentAssets);

  const result = await sut.getAll(auth);

  expect(result[0].recentAssetIds).toEqual([recentAssets[0].id, recentAssets[1].id]);
  expect(result[0].recentAssetThumbhashes).toEqual(['abc123', 'def456']);
});

it('should return empty arrays for spaces with no assets', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace();

  mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
  mocks.sharedSpace.getMembers.mockResolvedValue([]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
  mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

  const result = await sut.getAll(auth);

  expect(result[0].recentAssetIds).toEqual([]);
  expect(result[0].recentAssetThumbhashes).toEqual([]);
});

it('should include lastActivityAt in response', async () => {
  const auth = factory.auth();
  const lastActivity = new Date('2026-03-05T12:00:00.000Z');
  const space = factory.sharedSpace({ lastActivityAt: lastActivity });

  mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
  mocks.sharedSpace.getMembers.mockResolvedValue([]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
  mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

  const result = await sut.getAll(auth);

  expect(result[0].lastActivityAt).toBe(lastActivity.toISOString());
});
```

**Step 2: Write failing test — get includes collage data**

In the `get` describe block (line 143), add:

```typescript
it('should include recentAssetIds and thumbhashes', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace();
  const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });
  const recentAssets = [
    { id: newUuid(), thumbhash: 'thumb1' },
    { id: newUuid(), thumbhash: null },
    { id: newUuid(), thumbhash: 'thumb3' },
  ];

  mocks.sharedSpace.getMember.mockResolvedValue(member);
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.getMembers.mockResolvedValue([member]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(10);
  mocks.sharedSpace.getMostRecentAssetId.mockResolvedValue(void 0);
  mocks.sharedSpace.getRecentAssets.mockResolvedValue(recentAssets);

  const result = await sut.get(auth, space.id);

  expect(result.recentAssetIds).toEqual([recentAssets[0].id, recentAssets[1].id, recentAssets[2].id]);
  expect(result.recentAssetThumbhashes).toEqual(['thumb1', null, 'thumb3']);
});

it('should include lastActivityAt in response', async () => {
  const auth = factory.auth();
  const lastActivity = new Date('2026-03-01T00:00:00.000Z');
  const space = factory.sharedSpace({ lastActivityAt: lastActivity });
  const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });

  mocks.sharedSpace.getMember.mockResolvedValue(member);
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.getMembers.mockResolvedValue([member]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
  mocks.sharedSpace.getMostRecentAssetId.mockResolvedValue(void 0);
  mocks.sharedSpace.getRecentAssets.mockResolvedValue([]);

  const result = await sut.get(auth, space.id);

  expect(result.lastActivityAt).toBe(lastActivity.toISOString());
});
```

**Step 3: Run tests to verify they fail**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: 5 FAILs — `getRecentAssets` not called, `recentAssetIds` / `recentAssetThumbhashes` / `lastActivityAt` undefined in response.

**Step 4: Commit failing tests**

```bash
git add server/src/services/shared-space.service.spec.ts
git commit -m "test(server): add failing tests for collage data and lastActivityAt in getAll/get"
```

---

### Task 8: Service Implementation — Collage data and lastActivityAt in getAll/get/mapSpace

**Files:**

- Modify: `server/src/services/shared-space.service.ts:41-81,260-278`

**Step 1: Update getAll to fetch recent assets**

Replace `getAll` (lines 41-56):

```typescript
async getAll(auth: AuthDto): Promise<SharedSpaceResponseDto[]> {
  const spaces = await this.sharedSpaceRepository.getAllByUserId(auth.user.id);

  const results: SharedSpaceResponseDto[] = [];
  for (const space of spaces) {
    const members = await this.sharedSpaceRepository.getMembers(space.id);
    const assetCount = await this.sharedSpaceRepository.getAssetCount(space.id);
    const recentAssets = await this.sharedSpaceRepository.getRecentAssets(space.id);
    results.push({
      ...this.mapSpace(space),
      memberCount: members.length,
      assetCount,
      recentAssetIds: recentAssets.map((a) => a.id),
      recentAssetThumbhashes: recentAssets.map((a) => a.thumbhash),
      members: members.map((m) => this.mapMember(m)),
    });
  }
  return results;
}
```

**Step 2: Update get to fetch recent assets**

Replace `get` (lines 58-81):

```typescript
async get(auth: AuthDto, id: string): Promise<SharedSpaceResponseDto> {
  await this.requireMembership(auth, id);

  const space = await this.sharedSpaceRepository.getById(id);
  if (!space) {
    throw new BadRequestException('Shared space not found');
  }

  const members = await this.sharedSpaceRepository.getMembers(id);
  const assetCount = await this.sharedSpaceRepository.getAssetCount(id);
  const recentAssets = await this.sharedSpaceRepository.getRecentAssets(id);

  let thumbnailAssetId = space.thumbnailAssetId;
  if (!thumbnailAssetId) {
    thumbnailAssetId = (await this.sharedSpaceRepository.getMostRecentAssetId(id)) ?? null;
  }

  return {
    ...this.mapSpace(space),
    thumbnailAssetId,
    memberCount: members.length,
    assetCount,
    recentAssetIds: recentAssets.map((a) => a.id),
    recentAssetThumbhashes: recentAssets.map((a) => a.thumbhash),
    members: members.map((m) => this.mapMember(m)),
  };
}
```

**Step 3: Update mapSpace to include lastActivityAt**

Replace `mapSpace` (lines 260-278):

```typescript
private mapSpace(space: {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: unknown;
  updatedAt: unknown;
  thumbnailAssetId?: string | null;
  lastActivityAt?: Date | null;
}): SharedSpaceResponseDto {
  return {
    id: space.id,
    name: space.name,
    description: space.description,
    createdById: space.createdById,
    createdAt: space.createdAt as unknown as string,
    updatedAt: space.updatedAt as unknown as string,
    thumbnailAssetId: space.thumbnailAssetId ?? null,
    lastActivityAt: space.lastActivityAt ? space.lastActivityAt.toISOString() : null,
  };
}
```

**Step 4: Run tests to verify they pass**

```bash
cd server && pnpm test -- --run src/services/shared-space.service.spec.ts
```

Expected: ALL PASS

**Step 5: Fix any existing tests that broke**

Existing `getAll` and `get` tests may need `mocks.sharedSpace.getRecentAssets.mockResolvedValue([])` added. Check test output and add the mock to any failing tests.

**Step 6: Commit**

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat(server): thread collage data and lastActivityAt through getAll/get"
```

---

### Task 9: Run full server test suite

**Step 1: Run all server unit tests**

```bash
cd server && pnpm test -- --run
```

Expected: All 3100+ tests pass.

**Step 2: If any tests fail, fix them**

The most likely issue is other test files that mock `SharedSpaceRepository` may need `getRecentAssets` and `getLastAssetAddedAt` mocked. Check `newTestService` auto-mock behavior — if it auto-mocks all methods, no changes needed.

**Step 3: Commit any fixes**

```bash
git add -u
git commit -m "fix(server): update tests for new shared space repository methods"
```

---

### Task 10: Regenerate OpenAPI clients

**Step 1: Build server**

```bash
cd server && pnpm build
```

**Step 2: Sync OpenAPI spec**

```bash
cd server && pnpm sync:open-api
```

**Step 3: Regenerate clients**

```bash
make open-api
```

**Step 4: Verify TypeScript SDK has new fields**

```bash
grep -n "recentAssetIds\|recentAssetThumbhashes\|lastActivityAt" open-api/typescript-sdk/src/fetch-client.ts | head -20
```

Expected: `SharedSpaceResponseDto` includes all three new fields.

**Step 5: Commit**

```bash
git add open-api/ mobile/openapi/
git commit -m "chore: regenerate OpenAPI clients with collage and lastActivityAt fields"
```

---

### Task 11: Web — SpaceCollage component

**Files:**

- Create: `web/src/lib/components/spaces/space-collage.svelte`

**Step 1: Create the component**

```svelte
<script lang="ts">
  import { getAssetMediaUrl } from '$lib/utils';
  import { Icon } from '@immich/ui';
  import { mdiImageMultipleOutline } from '@mdi/js';

  interface AssetInfo {
    id: string;
    thumbhash: string | null;
  }

  interface Props {
    assets: AssetInfo[];
    gradientClass?: string;
    preload?: boolean;
  }

  let { assets, gradientClass = 'from-gray-400 to-gray-600', preload = false }: Props = $props();

  let layout = $derived(
    assets.length === 0 ? 'empty' : assets.length === 1 ? 'single' : assets.length <= 3 ? 'asymmetric' : 'grid',
  );
</script>

{#if layout === 'empty'}
  <div
    class="flex size-full items-center justify-center rounded-xl bg-gradient-to-br {gradientClass} aspect-square"
    data-testid="collage-empty"
  >
    <Icon icon={mdiImageMultipleOutline} size="4em" class="text-white/40" />
  </div>
{:else if layout === 'single'}
  <div class="aspect-square overflow-hidden rounded-xl" data-testid="collage-single">
    <img
      alt=""
      src={getAssetMediaUrl({ id: assets[0].id })}
      class="size-full object-cover"
      loading={preload ? 'eager' : 'lazy'}
      draggable="false"
    />
  </div>
{:else if layout === 'asymmetric'}
  <div class="grid aspect-square gap-0.5 rounded-xl overflow-hidden" style="grid-template-columns: 3fr 2fr;" data-testid="collage-asymmetric">
    <img
      alt=""
      src={getAssetMediaUrl({ id: assets[0].id })}
      class="size-full object-cover"
      style="grid-row: 1 / {assets.length === 2 ? 2 : 3};"
      loading={preload ? 'eager' : 'lazy'}
      draggable="false"
    />
    <img
      alt=""
      src={getAssetMediaUrl({ id: assets[1].id })}
      class="size-full object-cover"
      loading={preload ? 'eager' : 'lazy'}
      draggable="false"
    />
    {#if assets.length >= 3}
      <img
        alt=""
        src={getAssetMediaUrl({ id: assets[2].id })}
        class="size-full object-cover"
        loading={preload ? 'eager' : 'lazy'}
        draggable="false"
      />
    {/if}
  </div>
{:else}
  <div class="grid grid-cols-2 grid-rows-2 aspect-square gap-0.5 rounded-xl overflow-hidden" data-testid="collage-grid">
    {#each assets.slice(0, 4) as asset (asset.id)}
      <img
        alt=""
        src={getAssetMediaUrl({ id: asset.id })}
        class="size-full object-cover"
        loading={preload ? 'eager' : 'lazy'}
        draggable="false"
      />
    {/each}
  </div>
{/if}
```

**Step 2: Commit**

```bash
git add web/src/lib/components/spaces/space-collage.svelte
git commit -m "feat(web): add SpaceCollage component with 4 layout variants"
```

---

### Task 12: Web — SpaceCollage unit tests

**Files:**

- Create: `web/src/lib/components/spaces/space-collage.spec.ts`

**Step 1: Write tests**

```typescript
import SpaceCollage from '$lib/components/spaces/space-collage.svelte';
import { render, screen } from '@testing-library/svelte';

const makeAsset = (id: string, thumbhash: string | null = null) => ({ id, thumbhash });

describe('SpaceCollage component', () => {
  it('should render gradient placeholder for 0 assets', () => {
    render(SpaceCollage, { assets: [], gradientClass: 'from-blue-400 to-blue-600' });
    expect(screen.getByTestId('collage-empty')).toBeInTheDocument();
  });

  it('should render single image layout for 1 asset', () => {
    render(SpaceCollage, { assets: [makeAsset('a1')] });
    expect(screen.getByTestId('collage-single')).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toContain('a1');
  });

  it('should render asymmetric layout for 2 assets', () => {
    render(SpaceCollage, { assets: [makeAsset('a1'), makeAsset('a2')] });
    expect(screen.getByTestId('collage-asymmetric')).toBeInTheDocument();
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(2);
  });

  it('should render asymmetric layout for 3 assets', () => {
    render(SpaceCollage, { assets: [makeAsset('a1'), makeAsset('a2'), makeAsset('a3')] });
    expect(screen.getByTestId('collage-asymmetric')).toBeInTheDocument();
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(3);
  });

  it('should render 2x2 grid layout for 4 assets', () => {
    render(SpaceCollage, {
      assets: [makeAsset('a1'), makeAsset('a2'), makeAsset('a3'), makeAsset('a4')],
    });
    expect(screen.getByTestId('collage-grid')).toBeInTheDocument();
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(4);
  });

  it('should render 2x2 grid with only first 4 for 5+ assets', () => {
    render(SpaceCollage, {
      assets: [makeAsset('a1'), makeAsset('a2'), makeAsset('a3'), makeAsset('a4'), makeAsset('a5')],
    });
    expect(screen.getByTestId('collage-grid')).toBeInTheDocument();
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(4);
  });

  it('should use eager loading when preload is true', () => {
    render(SpaceCollage, { assets: [makeAsset('a1')], preload: true });
    const img = screen.getByRole('img');
    expect(img.getAttribute('loading')).toBe('eager');
  });

  it('should use lazy loading by default', () => {
    render(SpaceCollage, { assets: [makeAsset('a1')] });
    const img = screen.getByRole('img');
    expect(img.getAttribute('loading')).toBe('lazy');
  });
});
```

**Step 2: Run tests**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-collage.spec.ts
```

Expected: ALL PASS

**Step 3: Commit**

```bash
git add web/src/lib/components/spaces/space-collage.spec.ts
git commit -m "test(web): add SpaceCollage component tests"
```

---

### Task 13: Web — Update space-card to use SpaceCollage

**Files:**

- Modify: `web/src/lib/components/spaces/space-card.svelte`

**Step 1: Replace thumbnail section with SpaceCollage**

Replace the current imports and template. In the `<script>` section, replace:

```typescript
import AssetCover from '$lib/components/sharedlinks-page/covers/asset-cover.svelte';
```

with:

```typescript
import SpaceCollage from '$lib/components/spaces/space-collage.svelte';
```

Remove the `thumbnailUrl` derived (line 20). Add a new derived for collage assets:

```typescript
let collageAssets = $derived(
  (space.recentAssetIds ?? []).map((id, i) => ({
    id,
    thumbhash: space.recentAssetThumbhashes?.[i] ?? null,
  })),
);
```

Replace the thumbnail/empty state block (lines 31-40):

```svelte
<SpaceCollage assets={collageAssets} {preload} />
```

Remove the `getAssetMediaUrl` import if no longer used elsewhere in the file.

**Step 2: Run existing space-card tests**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-card.spec.ts
```

Some tests may need updating since the thumbnail rendering changed. Update the `makeSpace` helper to include `recentAssetIds` and `recentAssetThumbhashes`, and update assertions that checked for `album-image` testid.

**Step 3: Update space-card tests**

In `web/src/lib/components/spaces/space-card.spec.ts`, update `makeSpace`:

```typescript
const makeSpace = (overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto => ({
  id: 'space-1',
  name: 'Family Photos',
  description: 'Our family memories',
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  memberCount: 3,
  assetCount: 42,
  thumbnailAssetId: null,
  lastActivityAt: null,
  recentAssetIds: [],
  recentAssetThumbhashes: [],
  members: [],
  ...overrides,
});
```

Update the thumbnail test:

```typescript
it('should render collage when recentAssetIds are provided', () => {
  render(SpaceCard, {
    space: makeSpace({ recentAssetIds: ['asset-1', 'asset-2'], recentAssetThumbhashes: [null, null] }),
  });
  expect(screen.getByTestId('collage-asymmetric')).toBeInTheDocument();
});

it('should render gradient placeholder when no assets', () => {
  render(SpaceCard, { space: makeSpace({ recentAssetIds: [] }) });
  expect(screen.getByTestId('collage-empty')).toBeInTheDocument();
});
```

**Step 4: Run tests to verify all pass**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-card.spec.ts
```

Expected: ALL PASS

**Step 5: Commit**

```bash
git add web/src/lib/components/spaces/space-card.svelte web/src/lib/components/spaces/space-card.spec.ts
git commit -m "feat(web): replace single thumbnail with SpaceCollage in space card"
```

---

### Task 14: Web — SpaceHero component

**Files:**

- Create: `web/src/lib/components/spaces/space-hero.svelte`

**Step 1: Create the component**

```svelte
<script lang="ts">
  import { getAssetMediaUrl } from '$lib/utils';
  import type { SharedSpaceResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiCameraOutline, mdiAccountMultipleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    space: SharedSpaceResponseDto;
    memberCount: number;
    assetCount: number;
    currentRole?: string;
    gradientClass?: string;
  }

  let { space, memberCount, assetCount, currentRole, gradientClass = 'from-gray-400 to-gray-600' }: Props = $props();

  let coverUrl = $derived(space.thumbnailAssetId ? getAssetMediaUrl({ id: space.thumbnailAssetId }) : null);
  let showFullDescription = $state(false);
  let descriptionOverflows = $state(false);

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    editor: 'Editor',
    viewer: 'Viewer',
  };
</script>

<div class="relative w-full overflow-hidden rounded-xl" style="height: 250px;" data-testid="space-hero">
  {#if coverUrl}
    <img
      src={coverUrl}
      alt={space.name}
      class="absolute inset-0 size-full object-cover"
      data-testid="hero-cover-image"
    />
  {:else}
    <div class="absolute inset-0 bg-gradient-to-br {gradientClass}" data-testid="hero-gradient"></div>
  {/if}

  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

  <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
    <h1 class="text-2xl font-bold drop-shadow-md" data-testid="hero-title">{space.name}</h1>

    {#if space.description}
      <p
        class="mt-1 text-sm text-white/80 drop-shadow-sm"
        class:line-clamp-2={!showFullDescription}
        bind:clientHeight={descriptionOverflows}
        data-testid="hero-description"
      >
        {space.description}
      </p>
      {#if space.description.length > 120}
        <button
          class="text-xs text-white/60 hover:text-white/90 mt-0.5"
          onclick={() => (showFullDescription = !showFullDescription)}
          data-testid="hero-show-more"
        >
          {showFullDescription ? $t('show_less') : $t('show_more')}
        </button>
      {/if}
    {/if}

    <div class="flex flex-wrap items-center gap-2 mt-2">
      <span
        class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm"
        data-testid="hero-photo-count"
      >
        <Icon icon={mdiCameraOutline} size="16" />
        {assetCount} {$t('photos')}
      </span>
      <span
        class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm"
        data-testid="hero-member-count"
      >
        <Icon icon={mdiAccountMultipleOutline} size="16" />
        {memberCount} {$t('members')}
      </span>
      {#if currentRole}
        <span
          class="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm capitalize"
          data-testid="hero-role-badge"
        >
          {roleLabels[currentRole] ?? currentRole}
        </span>
      {/if}
    </div>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add web/src/lib/components/spaces/space-hero.svelte
git commit -m "feat(web): add SpaceHero component with cover photo and gradient fallback"
```

---

### Task 15: Web — SpaceHero unit tests

**Files:**

- Create: `web/src/lib/components/spaces/space-hero.spec.ts`

**Step 1: Write tests**

```typescript
import SpaceHero from '$lib/components/spaces/space-hero.svelte';
import type { SharedSpaceResponseDto } from '@immich/sdk';
import { render, screen } from '@testing-library/svelte';

const makeSpace = (overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto => ({
  id: 'space-1',
  name: 'Family Trip',
  description: null,
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  thumbnailAssetId: null,
  ...overrides,
});

describe('SpaceHero component', () => {
  it('should render the space name', () => {
    render(SpaceHero, { space: makeSpace({ name: 'Alps Hiking' }), memberCount: 3, assetCount: 42 });
    expect(screen.getByTestId('hero-title')).toHaveTextContent('Alps Hiking');
  });

  it('should render cover image when thumbnailAssetId is set', () => {
    render(SpaceHero, { space: makeSpace({ thumbnailAssetId: 'asset-1' }), memberCount: 3, assetCount: 42 });
    expect(screen.getByTestId('hero-cover-image')).toBeInTheDocument();
    expect(screen.queryByTestId('hero-gradient')).not.toBeInTheDocument();
  });

  it('should render gradient background when no cover photo', () => {
    render(SpaceHero, {
      space: makeSpace({ thumbnailAssetId: null }),
      memberCount: 3,
      assetCount: 42,
      gradientClass: 'from-blue-400 to-blue-600',
    });
    expect(screen.getByTestId('hero-gradient')).toBeInTheDocument();
    expect(screen.queryByTestId('hero-cover-image')).not.toBeInTheDocument();
  });

  it('should display asset count', () => {
    render(SpaceHero, { space: makeSpace(), memberCount: 3, assetCount: 99 });
    expect(screen.getByTestId('hero-photo-count')).toHaveTextContent('99');
  });

  it('should display member count', () => {
    render(SpaceHero, { space: makeSpace(), memberCount: 7, assetCount: 0 });
    expect(screen.getByTestId('hero-member-count')).toHaveTextContent('7');
  });

  it('should display role badge when currentRole is provided', () => {
    render(SpaceHero, { space: makeSpace(), memberCount: 1, assetCount: 0, currentRole: 'editor' });
    expect(screen.getByTestId('hero-role-badge')).toHaveTextContent('Editor');
  });

  it('should not display role badge when currentRole is not provided', () => {
    render(SpaceHero, { space: makeSpace(), memberCount: 1, assetCount: 0 });
    expect(screen.queryByTestId('hero-role-badge')).not.toBeInTheDocument();
  });

  it('should display description when present', () => {
    render(SpaceHero, { space: makeSpace({ description: 'A lovely trip' }), memberCount: 1, assetCount: 0 });
    expect(screen.getByTestId('hero-description')).toHaveTextContent('A lovely trip');
  });

  it('should show "Show more" for long descriptions', () => {
    const longDesc = 'A'.repeat(200);
    render(SpaceHero, { space: makeSpace({ description: longDesc }), memberCount: 1, assetCount: 0 });
    expect(screen.getByTestId('hero-show-more')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/space-hero.spec.ts
```

Expected: ALL PASS

**Step 3: Commit**

```bash
git add web/src/lib/components/spaces/space-hero.spec.ts
git commit -m "test(web): add SpaceHero component tests"
```

---

### Task 16: Web — Integrate SpaceHero into detail page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Import SpaceHero**

Add to the script imports:

```typescript
import SpaceHero from '$lib/components/spaces/space-hero.svelte';
```

**Step 2: Add hero section above the action buttons**

Find the section where the space title and stats are currently displayed. Replace the title heading and any inline stats with:

```svelte
<SpaceHero
  {space}
  memberCount={members.length}
  assetCount={space.assetCount ?? 0}
  currentRole={currentMember?.role}
  gradientClass={gradientClasses[space.color ?? 'primary'] ?? gradientClasses.primary}
/>
```

You'll need to add the `gradientClasses` map if P0 hasn't already added it. If P0 has added it to `space-card.svelte`, extract it to a shared utility or duplicate it locally.

The exact lines to modify depend on the current state after P0 changes — look for the space name heading and stats section and replace them with the `SpaceHero` component.

**Step 3: Run type check**

```bash
make check-web
```

Expected: PASS

**Step 4: Commit**

```bash
git add web/src/routes/\(user\)/spaces/\[spaceId\]/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte
git commit -m "feat(web): integrate SpaceHero into space detail page"
```

---

### Task 17: Web — SpacesControls component and sort store

**Files:**

- Create: `web/src/lib/stores/space-view.store.ts`
- Create: `web/src/lib/components/spaces/spaces-controls.svelte`

**Step 1: Create the sort store**

```typescript
// web/src/lib/stores/space-view.store.ts
import { SortOrder } from '$lib/stores/preferences.store';
import { persisted } from 'svelte-persisted-store';

export enum SpaceSortBy {
  Name = 'Name',
  LastActivity = 'LastActivity',
  DateCreated = 'DateCreated',
  AssetCount = 'AssetCount',
}

export interface SpaceViewSettings {
  sortBy: string;
  sortOrder: string;
}

export const spaceViewSettings = persisted<SpaceViewSettings>('space-view-settings', {
  sortBy: SpaceSortBy.LastActivity,
  sortOrder: SortOrder.Desc,
});

export interface SpaceSortOptionMetadata {
  id: SpaceSortBy;
  label: string;
  defaultOrder: SortOrder;
}

export const sortOptionsMetadata: SpaceSortOptionMetadata[] = [
  { id: SpaceSortBy.Name, label: 'name', defaultOrder: SortOrder.Asc },
  { id: SpaceSortBy.LastActivity, label: 'last_activity', defaultOrder: SortOrder.Desc },
  { id: SpaceSortBy.DateCreated, label: 'date_created', defaultOrder: SortOrder.Desc },
  { id: SpaceSortBy.AssetCount, label: 'asset_count', defaultOrder: SortOrder.Desc },
];
```

**Step 2: Create the controls component**

```svelte
<!-- web/src/lib/components/spaces/spaces-controls.svelte -->
<script lang="ts">
  import { SortOrder } from '$lib/stores/preferences.store';
  import { spaceViewSettings, sortOptionsMetadata, SpaceSortBy } from '$lib/stores/space-view.store';
  import type { SharedSpaceResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiArrowDownThin, mdiArrowUpThin, mdiSort } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    spaces: SharedSpaceResponseDto[];
    onSorted: (sorted: SharedSpaceResponseDto[]) => void;
  }

  let { spaces, onSorted }: Props = $props();

  let showDropdown = $state(false);

  const flipOrdering = (ordering: string) => {
    return ordering === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;
  };

  const handleSort = (option: (typeof sortOptionsMetadata)[0]) => {
    if ($spaceViewSettings.sortBy === option.id) {
      $spaceViewSettings.sortOrder = flipOrdering($spaceViewSettings.sortOrder);
    } else {
      $spaceViewSettings.sortBy = option.id;
      $spaceViewSettings.sortOrder = option.defaultOrder;
    }
    showDropdown = false;
  };

  const sortSpaces = (items: SharedSpaceResponseDto[], sortBy: string, sortOrder: string) => {
    const sorted = [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case SpaceSortBy.Name: {
          comparison = a.name.localeCompare(b.name);
          break;
        }
        case SpaceSortBy.LastActivity: {
          const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
          const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
          comparison = aTime - bTime;
          break;
        }
        case SpaceSortBy.DateCreated: {
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        }
        case SpaceSortBy.AssetCount: {
          comparison = (a.assetCount ?? 0) - (b.assetCount ?? 0);
          break;
        }
      }
      return sortOrder === SortOrder.Asc ? comparison : -comparison;
    });
    return sorted;
  };

  $effect(() => {
    const sorted = sortSpaces(spaces, $spaceViewSettings.sortBy, $spaceViewSettings.sortOrder);
    onSorted(sorted);
  });

  let sortIcon = $derived($spaceViewSettings.sortOrder === SortOrder.Desc ? mdiArrowDownThin : mdiArrowUpThin);
  let activeLabel = $derived(
    sortOptionsMetadata.find((o) => o.id === $spaceViewSettings.sortBy)?.label ?? 'last_activity',
  );
</script>

<div class="relative flex justify-end mb-4" data-testid="spaces-controls">
  <button
    class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
    onclick={() => (showDropdown = !showDropdown)}
    data-testid="sort-button"
  >
    <Icon icon={mdiSort} size="18" />
    <span>{$t(activeLabel)}</span>
    <Icon icon={sortIcon} size="18" />
  </button>

  {#if showDropdown}
    <div
      class="absolute top-full right-0 z-10 mt-1 min-w-[180px] rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
      data-testid="sort-dropdown"
    >
      {#each sortOptionsMetadata as option (option.id)}
        <button
          class="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          class:font-semibold={$spaceViewSettings.sortBy === option.id}
          onclick={() => handleSort(option)}
          data-testid="sort-option-{option.id}"
        >
          <span>{$t(option.label)}</span>
          {#if $spaceViewSettings.sortBy === option.id}
            <Icon icon={sortIcon} size="16" />
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
```

**Step 3: Commit**

```bash
git add web/src/lib/stores/space-view.store.ts web/src/lib/components/spaces/spaces-controls.svelte
git commit -m "feat(web): add SpacesControls component with sort dropdown and persisted store"
```

---

### Task 18: Web — SpacesControls unit tests

**Files:**

- Create: `web/src/lib/components/spaces/spaces-controls.spec.ts`

**Step 1: Write tests**

```typescript
import type { SharedSpaceResponseDto } from '@immich/sdk';
import { SpaceSortBy } from '$lib/stores/space-view.store';

const makeSpace = (overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto => ({
  id: 'space-1',
  name: 'Alpha',
  description: null,
  createdById: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  thumbnailAssetId: null,
  lastActivityAt: null,
  assetCount: 0,
  memberCount: 1,
  recentAssetIds: [],
  recentAssetThumbhashes: [],
  members: [],
  ...overrides,
});

describe('Space sorting logic', () => {
  const sortSpaces = (items: SharedSpaceResponseDto[], sortBy: string, sortOrder: string) => {
    const sorted = [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case SpaceSortBy.Name: {
          comparison = a.name.localeCompare(b.name);
          break;
        }
        case SpaceSortBy.LastActivity: {
          const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
          const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
          comparison = aTime - bTime;
          break;
        }
        case SpaceSortBy.DateCreated: {
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        }
        case SpaceSortBy.AssetCount: {
          comparison = (a.assetCount ?? 0) - (b.assetCount ?? 0);
          break;
        }
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  };

  const alpha = makeSpace({
    id: 's1',
    name: 'Alpha',
    createdAt: '2026-01-01T00:00:00.000Z',
    assetCount: 5,
    lastActivityAt: '2026-03-01T00:00:00.000Z',
  });
  const beta = makeSpace({
    id: 's2',
    name: 'Beta',
    createdAt: '2026-02-01T00:00:00.000Z',
    assetCount: 20,
    lastActivityAt: '2026-03-05T00:00:00.000Z',
  });
  const gamma = makeSpace({
    id: 's3',
    name: 'Gamma',
    createdAt: '2026-03-01T00:00:00.000Z',
    assetCount: 10,
    lastActivityAt: null,
  });

  it('should sort by name ascending', () => {
    const result = sortSpaces([gamma, alpha, beta], SpaceSortBy.Name, 'asc');
    expect(result.map((s) => s.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('should sort by name descending', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.Name, 'desc');
    expect(result.map((s) => s.name)).toEqual(['Gamma', 'Beta', 'Alpha']);
  });

  it('should sort by last activity newest first', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.LastActivity, 'desc');
    expect(result.map((s) => s.name)).toEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('should sort by last activity oldest first', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.LastActivity, 'asc');
    expect(result.map((s) => s.name)).toEqual(['Gamma', 'Alpha', 'Beta']);
  });

  it('should sort by date created newest first', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.DateCreated, 'desc');
    expect(result.map((s) => s.name)).toEqual(['Gamma', 'Beta', 'Alpha']);
  });

  it('should sort by date created oldest first', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.DateCreated, 'asc');
    expect(result.map((s) => s.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('should sort by asset count highest first', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.AssetCount, 'desc');
    expect(result.map((s) => s.name)).toEqual(['Beta', 'Gamma', 'Alpha']);
  });

  it('should sort by asset count lowest first', () => {
    const result = sortSpaces([alpha, beta, gamma], SpaceSortBy.AssetCount, 'asc');
    expect(result.map((s) => s.name)).toEqual(['Alpha', 'Gamma', 'Beta']);
  });

  it('should sort null lastActivityAt to end when sorting desc', () => {
    const result = sortSpaces([gamma, beta, alpha], SpaceSortBy.LastActivity, 'desc');
    expect(result[result.length - 1].name).toBe('Gamma');
  });

  it('should sort null lastActivityAt to start when sorting asc', () => {
    const result = sortSpaces([beta, alpha, gamma], SpaceSortBy.LastActivity, 'asc');
    expect(result[0].name).toBe('Gamma');
  });
});
```

**Step 2: Run tests**

```bash
cd web && pnpm test -- --run src/lib/components/spaces/spaces-controls.spec.ts
```

Expected: ALL PASS

**Step 3: Commit**

```bash
git add web/src/lib/components/spaces/spaces-controls.spec.ts
git commit -m "test(web): add SpacesControls sorting logic tests"
```

---

### Task 19: Web — Integrate SpacesControls into space list page

**Files:**

- Modify: `web/src/routes/(user)/spaces/+page.svelte`

**Step 1: Import and wire up SpacesControls**

Add to imports:

```typescript
import SpacesControls from '$lib/components/spaces/spaces-controls.svelte';
```

Add state for sorted spaces:

```typescript
let sortedSpaces = $state(data.spaces);
```

Add the controls component above the grid:

```svelte
{#if data.spaces.length > 0}
  <SpacesControls spaces={data.spaces} onSorted={(sorted) => (sortedSpaces = sorted)} />
{/if}
```

Replace `data.spaces` with `sortedSpaces` in the grid `{#each}` block.

**Step 2: Run type check**

```bash
make check-web
```

Expected: PASS

**Step 3: Commit**

```bash
git add web/src/routes/\(user\)/spaces/+page.svelte
git commit -m "feat(web): integrate SpacesControls sort dropdown into space list page"
```

---

### Task 20: Lint, Format, Type Check

**Step 1: Format and lint server**

```bash
make format-server && make lint-server && make check-server
```

**Step 2: Format and lint web**

```bash
make format-web && make lint-web && make check-web
```

**Step 3: Fix any issues and commit**

```bash
git add -u
git commit -m "chore: fix lint and formatting issues"
```

---

### Task 21: Run full test suites

**Step 1: Run all server tests**

```bash
cd server && pnpm test -- --run
```

Expected: All 3100+ tests pass.

**Step 2: Run all web tests**

```bash
cd web && pnpm test -- --run
```

Expected: All tests pass.

**Step 3: Fix any failures and commit**

```bash
git add -u
git commit -m "fix: resolve test failures from P1 integration"
```

---

### Task 22: E2E Tests — Playwright specs for collage, hero, and sort

**Files:**

- Create: `e2e/src/web/specs/spaces-p1.e2e-spec.ts`

> **Note:** E2E test file location and exact API helpers depend on the current E2E setup. Check `e2e/src/specs/web/` for existing test files and `e2e/src/utils.ts` for available helpers (`utils.createSpace`, `utils.addSpaceAssets`, `utils.createAsset`).

**Step 1: Create E2E test file**

```typescript
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';
import type { LoginResponseDto } from '@immich/sdk';

test.describe('Spaces P1 — Collage, Hero, Sort', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test.describe('Collage Cards', () => {
    test('should show gradient placeholder for empty space', async ({ context, page }) => {
      await utils.createSpace(admin.accessToken, { name: 'Empty Space' });
      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');
      await expect(page.locator('[data-testid="collage-empty"]')).toBeVisible();
    });

    test('should show single image for space with 1 asset', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Single Asset' });
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');
      await expect(page.locator('[data-testid="collage-single"]')).toBeVisible();
    });

    test('should show asymmetric layout for space with 2-3 assets', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Few Assets' });
      const asset1 = await utils.createAsset(admin.accessToken);
      const asset2 = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset1.id, asset2.id]);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');
      await expect(page.locator('[data-testid="collage-asymmetric"]')).toBeVisible();
    });

    test('should show 2x2 grid for space with 4+ assets', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Many Assets' });
      const assets = await Promise.all([
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
      ]);
      await utils.addSpaceAssets(
        admin.accessToken,
        space.id,
        assets.map((a) => a.id),
      );

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');
      await expect(page.locator('[data-testid="collage-grid"]')).toBeVisible();
    });
  });

  test.describe('Hero Section', () => {
    test('should show gradient hero when no cover photo', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'No Cover Space' });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);
      await expect(page.locator('[data-testid="hero-gradient"]')).toBeVisible();
      await expect(page.locator('[data-testid="hero-title"]')).toHaveText('No Cover Space');
    });

    test('should show cover image hero when cover is set', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Cover Space' });
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);
      // Space auto-sets thumbnailAssetId on first asset add
      await expect(page.locator('[data-testid="hero-cover-image"]')).toBeVisible();
    });

    test('should display stat chips', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Stats Space' });
      const asset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space.id, [asset.id]);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);
      await expect(page.locator('[data-testid="hero-photo-count"]')).toContainText('1');
      await expect(page.locator('[data-testid="hero-member-count"]')).toContainText('1');
    });

    test('should display role badge', async ({ context, page }) => {
      const space = await utils.createSpace(admin.accessToken, { name: 'Role Space' });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto(`/spaces/${space.id}`);
      await expect(page.locator('[data-testid="hero-role-badge"]')).toContainText('Owner');
    });
  });

  test.describe('Sort Controls', () => {
    test('should sort spaces by name', async ({ context, page }) => {
      await utils.createSpace(admin.accessToken, { name: 'Zulu Space' });
      await utils.createSpace(admin.accessToken, { name: 'Alpha Space' });
      await utils.createSpace(admin.accessToken, { name: 'Mike Space' });

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');

      // Click sort button and select Name
      await page.locator('[data-testid="sort-button"]').click();
      await page.locator('[data-testid="sort-option-Name"]').click();

      // Verify order
      const cards = page.locator('[data-testid="space-name"]');
      await expect(cards.first()).toHaveText('Alpha Space');
      await expect(cards.last()).toHaveText('Zulu Space');
    });

    test('should sort spaces by asset count', async ({ context, page }) => {
      const space1 = await utils.createSpace(admin.accessToken, { name: 'Few' });
      const space2 = await utils.createSpace(admin.accessToken, { name: 'Many' });
      const assets = await Promise.all([
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
        utils.createAsset(admin.accessToken),
      ]);
      await utils.addSpaceAssets(
        admin.accessToken,
        space2.id,
        assets.map((a) => a.id),
      );
      const singleAsset = await utils.createAsset(admin.accessToken);
      await utils.addSpaceAssets(admin.accessToken, space1.id, [singleAsset.id]);

      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');

      await page.locator('[data-testid="sort-button"]').click();
      await page.locator('[data-testid="sort-option-AssetCount"]').click();

      const cards = page.locator('[data-testid="space-name"]');
      await expect(cards.first()).toHaveText('Many');
    });

    test('should persist sort preference after reload', async ({ context, page }) => {
      await utils.setAuthCookies(context, admin.accessToken);
      await page.goto('/spaces');

      // Set sort to Name
      await page.locator('[data-testid="sort-button"]').click();
      await page.locator('[data-testid="sort-option-Name"]').click();

      // Reload
      await page.reload();

      // Verify button still shows Name
      await expect(page.locator('[data-testid="sort-button"]')).toContainText('name');
    });
  });
});
```

**Step 2: Run E2E tests (requires dev stack running)**

```bash
cd e2e && pnpm test:web -- --grep "Spaces P1"
```

Expected: ALL PASS (if dev stack is running)

**Step 3: Commit**

```bash
git add e2e/src/web/specs/spaces-p1.e2e-spec.ts
git commit -m "test(e2e): add Playwright tests for spaces P1 — collage, hero, sort"
```

---

### Task 23: Final verification

**Step 1: Run all server unit tests**

```bash
cd server && pnpm test -- --run
```

**Step 2: Run all web unit tests**

```bash
cd web && pnpm test -- --run
```

**Step 3: Run lint/format/check**

```bash
make lint-all && make format-all && make check-all
```

**Step 4: Verify E2E (if dev stack available)**

```bash
cd e2e && pnpm test:web -- --grep "Spaces P1"
```

**Step 5: Final commit if needed**

```bash
git add -u
git commit -m "chore: final cleanup for spaces P1"
```
