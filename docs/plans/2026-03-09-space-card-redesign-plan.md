# Space Card Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace plain text space labels with album-style cards featuring photo thumbnails, member avatar overlays, and user-settable cover photos.

**Architecture:** Add `thumbnailAssetId` column to `shared_space` table. The API resolves thumbnails (user-set or auto-fallback to most recent asset). The web renders `SpaceCard` components styled like album cards, with `AssetCover` for thumbnails and `UserAvatar` stacks for members. A "Set as Space Cover" context menu action allows owners/editors to pick a cover photo.

**Tech Stack:** NestJS (Kysely ORM), SvelteKit (Svelte 5 runes), Vitest, @testing-library/svelte, @immich/sdk (OpenAPI-generated)

---

## Task 1: Add `thumbnailAssetId` Column — Schema & Migration

**Files:**

- Modify: `server/src/schema/tables/shared-space.table.ts`
- Create: `server/src/schema/migrations/1772260000000-AddThumbnailAssetIdToSharedSpace.ts`
- Modify: `server/src/database.ts` (lines 320-329, SharedSpace type)

**Step 1: Add column to schema table**

In `server/src/schema/tables/shared-space.table.ts`, add a nullable FK column pointing to the `AssetTable`:

```typescript
import { AssetTable } from 'src/schema/tables/asset.table';
// ... existing imports

// Inside SharedSpaceTable class, after updatedAt:
@ForeignKeyColumn(() => AssetTable, { onDelete: 'SET NULL', nullable: true })
thumbnailAssetId!: string | null;
```

**Step 2: Update manually-maintained type in database.ts**

In `server/src/database.ts`, add `thumbnailAssetId` to the `SharedSpace` type (around line 320):

```typescript
export type SharedSpace = {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createId: string;
  updateId: string;
  thumbnailAssetId: string | null; // ADD THIS
};
```

**Step 3: Create migration**

Create `server/src/schema/migrations/1772260000000-AddThumbnailAssetIdToSharedSpace.ts`:

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('shared_space')
    .addColumn('thumbnailAssetId', 'uuid', (col) => col.references('assets.id').onDelete('set null'))
    .execute();

  await db.schema
    .createIndex('shared_space_thumbnailAssetId_idx')
    .on('shared_space')
    .column('thumbnailAssetId')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('shared_space').dropColumn('thumbnailAssetId').execute();
}
```

**Step 4: Update factory**

In `server/test/small.factory.ts`, update the `sharedSpaceFactory`:

```typescript
const sharedSpaceFactory = (data: Partial<SharedSpace> = {}): SharedSpace => ({
  id: newUuid(),
  name: 'Test Space',
  description: null,
  createdById: newUuid(),
  createdAt: newDate(),
  updatedAt: newDate(),
  createId: newUuid(),
  updateId: newUuid(),
  thumbnailAssetId: null, // ADD THIS
  ...data,
});
```

**Step 5: Register migration**

Check `server/src/schema/index.ts` (or wherever migrations are imported) and add the new migration to the list.

**Step 6: Verify**

Run: `cd server && npx tsc --noEmit`
Expected: No type errors

**Step 7: Commit**

```bash
git add server/src/schema/tables/shared-space.table.ts server/src/schema/migrations/1772260000000-AddThumbnailAssetIdToSharedSpace.ts server/src/database.ts server/test/small.factory.ts
git commit -m "feat(server): add thumbnailAssetId column to shared_space table"
```

---

## Task 2: Server — Update DTOs and Service for Thumbnail

**Files:**

- Modify: `server/src/dtos/shared-space.dto.ts`
- Modify: `server/src/services/shared-space.service.ts`
- Modify: `server/src/repositories/shared-space.repository.ts`
- Test: `server/src/services/shared-space.service.spec.ts`

### Step 1: Write failing tests for thumbnail in update

In `server/src/services/shared-space.service.spec.ts`, add tests to the `update` describe block:

```typescript
it('should update thumbnailAssetId when owner', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace();
  const thumbnailAssetId = newUuid();
  const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner });
  const updatedSpace = { ...space, thumbnailAssetId };

  mocks.sharedSpace.getMember.mockResolvedValue(member);
  mocks.sharedSpace.update.mockResolvedValue(updatedSpace);

  const result = await sut.update(auth, space.id, { thumbnailAssetId });

  expect(result.thumbnailAssetId).toBe(thumbnailAssetId);
  expect(mocks.sharedSpace.update).toHaveBeenCalledWith(space.id, {
    name: undefined,
    description: undefined,
    thumbnailAssetId,
  });
});

it('should clear thumbnailAssetId when set to null', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace({ thumbnailAssetId: newUuid() });
  const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Owner });
  const updatedSpace = { ...space, thumbnailAssetId: null };

  mocks.sharedSpace.getMember.mockResolvedValue(member);
  mocks.sharedSpace.update.mockResolvedValue(updatedSpace);

  const result = await sut.update(auth, space.id, { thumbnailAssetId: null });

  expect(result.thumbnailAssetId).toBeNull();
});
```

### Step 2: Write failing tests for thumbnail auto-fallback in getAll

Add a new test in the `getAll` describe block:

```typescript
it('should include thumbnailAssetId in response', async () => {
  const auth = factory.auth();
  const thumbnailId = newUuid();
  const space = factory.sharedSpace({ name: 'With Thumb', thumbnailAssetId: thumbnailId });

  mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);

  const result = await sut.getAll(auth);

  expect(result[0].thumbnailAssetId).toBe(thumbnailId);
});
```

### Step 3: Write failing tests for thumbnail auto-fallback in get

Add tests in the `get` describe block:

```typescript
it('should return thumbnailAssetId when set', async () => {
  const auth = factory.auth();
  const thumbnailId = newUuid();
  const space = factory.sharedSpace({ thumbnailAssetId: thumbnailId });
  const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });

  mocks.sharedSpace.getMember.mockResolvedValue(member);
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.getMembers.mockResolvedValue([member]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(5);

  const result = await sut.get(auth, space.id);

  expect(result.thumbnailAssetId).toBe(thumbnailId);
});

it('should auto-fallback to most recent asset when thumbnailAssetId is null', async () => {
  const auth = factory.auth();
  const fallbackAssetId = newUuid();
  const space = factory.sharedSpace({ thumbnailAssetId: null });
  const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });

  mocks.sharedSpace.getMember.mockResolvedValue(member);
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.getMembers.mockResolvedValue([member]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(3);
  mocks.sharedSpace.getMostRecentAssetId.mockResolvedValue(fallbackAssetId);

  const result = await sut.get(auth, space.id);

  expect(result.thumbnailAssetId).toBe(fallbackAssetId);
});

it('should return null thumbnailAssetId when no assets and no thumbnail set', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace({ thumbnailAssetId: null });
  const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Viewer });

  mocks.sharedSpace.getMember.mockResolvedValue(member);
  mocks.sharedSpace.getById.mockResolvedValue(space);
  mocks.sharedSpace.getMembers.mockResolvedValue([member]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(0);
  mocks.sharedSpace.getMostRecentAssetId.mockResolvedValue(void 0);

  const result = await sut.get(auth, space.id);

  expect(result.thumbnailAssetId).toBeNull();
});
```

### Step 4: Write failing tests for member info in getAll

Add test to `getAll` block:

```typescript
it('should include member info for each space', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace({ name: 'Space 1' });
  const member1 = makeMemberResult({
    spaceId: space.id,
    userId: auth.user.id,
    role: SharedSpaceRole.Owner,
    name: 'Alice',
  });
  const member2 = makeMemberResult({ spaceId: space.id, role: SharedSpaceRole.Viewer, name: 'Bob' });

  mocks.sharedSpace.getAllByUserId.mockResolvedValue([space]);
  mocks.sharedSpace.getMembers.mockResolvedValue([member1, member2]);
  mocks.sharedSpace.getAssetCount.mockResolvedValue(10);

  const result = await sut.getAll(auth);

  expect(result[0].memberCount).toBe(2);
  expect(result[0].assetCount).toBe(10);
  expect(result[0].members).toHaveLength(2);
  expect(result[0].members![0].name).toBe('Alice');
  expect(result[0].members![1].name).toBe('Bob');
});
```

### Step 5: Run tests to verify they fail

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: FAIL — `thumbnailAssetId` not in response, `getMostRecentAssetId` not defined, `members` not in response

### Step 6: Update DTOs

In `server/src/dtos/shared-space.dto.ts`:

**Add `thumbnailAssetId` to `SharedSpaceUpdateDto`:**

```typescript
export class SharedSpaceUpdateDto {
  // ... existing fields ...

  @ValidateUUID({ optional: true, nullable: true, description: 'Thumbnail asset ID' })
  thumbnailAssetId?: string | null;
}
```

**Add `thumbnailAssetId` and `members` to `SharedSpaceResponseDto`:**

```typescript
export class SharedSpaceResponseDto {
  // ... existing fields ...

  @ApiPropertyOptional({ description: 'Thumbnail asset ID' })
  thumbnailAssetId?: string | null;

  @ApiPropertyOptional({ description: 'Space members (summary)', type: [SharedSpaceMemberResponseDto] })
  members?: SharedSpaceMemberResponseDto[];
}
```

**Note:** You'll need to import `ValidateUUID` if not already imported.

### Step 7: Add `getMostRecentAssetId` to repository

In `server/src/repositories/shared-space.repository.ts`, add:

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
async getMostRecentAssetId(spaceId: string): Promise<string | undefined> {
  const result = await this.db
    .selectFrom('shared_space_asset')
    .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
    .where('shared_space_asset.spaceId', '=', spaceId)
    .where('asset.deletedAt', 'is', null)
    .orderBy('shared_space_asset.addedAt', 'desc')
    .select('asset.id')
    .limit(1)
    .executeTakeFirst();
  return result?.id;
}
```

### Step 8: Update service — mapSpace to include thumbnailAssetId

In `server/src/services/shared-space.service.ts`, update `mapSpace`:

```typescript
private mapSpace(space: {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: unknown;
  updatedAt: unknown;
  thumbnailAssetId?: string | null;
}): SharedSpaceResponseDto {
  return {
    id: space.id,
    name: space.name,
    description: space.description,
    createdById: space.createdById,
    createdAt: space.createdAt as unknown as string,
    updatedAt: space.updatedAt as unknown as string,
    thumbnailAssetId: space.thumbnailAssetId ?? null,
  };
}
```

### Step 9: Update service — update() to pass thumbnailAssetId

In `update()` method, add `thumbnailAssetId` to the update call:

```typescript
async update(auth: AuthDto, id: string, dto: SharedSpaceUpdateDto): Promise<SharedSpaceResponseDto> {
  await this.requireRole(auth, id, SharedSpaceRole.Owner);

  const space = await this.sharedSpaceRepository.update(id, {
    name: dto.name,
    description: dto.description,
    thumbnailAssetId: dto.thumbnailAssetId,
  });

  return this.mapSpace(space);
}
```

### Step 10: Update service — get() to resolve thumbnail with auto-fallback

```typescript
async get(auth: AuthDto, id: string): Promise<SharedSpaceResponseDto> {
  await this.requireMembership(auth, id);

  const space = await this.sharedSpaceRepository.getById(id);
  if (!space) {
    throw new BadRequestException('Shared space not found');
  }

  const members = await this.sharedSpaceRepository.getMembers(id);
  const assetCount = await this.sharedSpaceRepository.getAssetCount(id);

  let thumbnailAssetId = space.thumbnailAssetId;
  if (!thumbnailAssetId) {
    thumbnailAssetId = (await this.sharedSpaceRepository.getMostRecentAssetId(id)) ?? null;
  }

  return {
    ...this.mapSpace(space),
    thumbnailAssetId,
    memberCount: members.length,
    assetCount,
  };
}
```

### Step 11: Update service — getAll() to include counts and members

```typescript
async getAll(auth: AuthDto): Promise<SharedSpaceResponseDto[]> {
  const spaces = await this.sharedSpaceRepository.getAllByUserId(auth.user.id);
  const results: SharedSpaceResponseDto[] = [];

  for (const space of spaces) {
    const members = await this.sharedSpaceRepository.getMembers(space.id);
    const assetCount = await this.sharedSpaceRepository.getAssetCount(space.id);

    results.push({
      ...this.mapSpace(space),
      memberCount: members.length,
      assetCount,
      members: members.map((m) => this.mapMember(m)),
    });
  }

  return results;
}
```

### Step 12: Run tests

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: ALL PASS

### Step 13: Run type check

Run: `cd server && npx tsc --noEmit`
Expected: No errors

### Step 14: Commit

```bash
git add server/src/dtos/shared-space.dto.ts server/src/services/shared-space.service.ts server/src/repositories/shared-space.repository.ts server/src/services/shared-space.service.spec.ts
git commit -m "feat(server): add thumbnail support and member info to shared spaces API"
```

---

## Task 3: Regenerate OpenAPI Clients

**Files:**

- Modified (auto-generated): `open-api/typescript-sdk/src/fetch-client.ts`
- Modified (auto-generated): `mobile/openapi/`

**Step 1: Build server and regenerate**

```bash
cd server && pnpm build
pnpm sync:open-api
cd .. && make open-api
```

**Step 2: Verify SDK types include new fields**

Check that `SharedSpaceResponseDto` in `open-api/typescript-sdk/src/fetch-client.ts` includes `thumbnailAssetId` and `members`.

**Step 3: Commit**

```bash
git add open-api/ mobile/openapi/
git commit -m "chore: regenerate OpenAPI clients for space thumbnail support"
```

---

## Task 4: Web — SpaceCard Component (TDD)

**Files:**

- Create: `web/src/lib/components/spaces/space-card.svelte`
- Create: `web/src/lib/components/spaces/space-card.spec.ts`

### Step 1: Write failing tests

Create `web/src/lib/components/spaces/space-card.spec.ts`:

```typescript
import SpaceCard from '$lib/components/spaces/space-card.svelte';
import type { SharedSpaceResponseDto } from '@immich/sdk';
import { render, screen } from '@testing-library/svelte';

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
  members: [],
  ...overrides,
});

describe('SpaceCard component', () => {
  it('should render space name', () => {
    render(SpaceCard, { space: makeSpace() });
    expect(screen.getByText('Family Photos')).toBeInTheDocument();
  });

  it('should render asset and member counts', () => {
    render(SpaceCard, { space: makeSpace() });
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render thumbnail image when thumbnailAssetId is set', () => {
    render(SpaceCard, { space: makeSpace({ thumbnailAssetId: 'asset-thumb-1' }) });
    const img = screen.getByTestId('album-image');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('asset-thumb-1');
  });

  it('should render empty state when no thumbnailAssetId', () => {
    render(SpaceCard, { space: makeSpace({ thumbnailAssetId: null }) });
    expect(screen.queryByTestId('album-image')).not.toBeInTheDocument();
  });

  it('should render member avatars when members are provided', () => {
    const members = [
      {
        userId: 'u1',
        name: 'Alice',
        email: 'a@b.com',
        role: 'owner',
        joinedAt: '',
        profileImagePath: '',
        avatarColor: 'primary',
        showInTimeline: true,
      },
      {
        userId: 'u2',
        name: 'Bob',
        email: 'b@b.com',
        role: 'viewer',
        joinedAt: '',
        profileImagePath: '',
        avatarColor: 'blue',
        showInTimeline: true,
      },
    ];
    render(SpaceCard, { space: makeSpace({ members }) });
    // Each avatar shows the first letter of the user's name as fallback
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('should show overflow badge when more than 4 members', () => {
    const members = Array.from({ length: 6 }, (_, i) => ({
      userId: `u${i}`,
      name: `User ${i}`,
      email: `u${i}@b.com`,
      role: 'viewer',
      joinedAt: '',
      profileImagePath: '',
      avatarColor: 'primary',
      showInTimeline: true,
    }));
    render(SpaceCard, { space: makeSpace({ members }) });
    // Should show 4 avatars + "+2" badge
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('should have link to space detail page', () => {
    render(SpaceCard, { space: makeSpace() });
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toContain('space-1');
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-card.spec.ts`
Expected: FAIL — SpaceCard component does not exist

### Step 3: Create SpaceCard component

Create `web/src/lib/components/spaces/space-card.svelte`:

```svelte
<script lang="ts">
  import AssetCover from '$lib/components/sharedlinks-page/covers/asset-cover.svelte';
  import NoCover from '$lib/components/sharedlinks-page/covers/no-cover.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { Route } from '$lib/route';
  import { getAssetMediaUrl } from '$lib/utils';
  import type { SharedSpaceMemberResponseDto, SharedSpaceResponseDto, UserAvatarColor } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    space: SharedSpaceResponseDto;
    preload?: boolean;
  }

  let { space, preload = false }: Props = $props();

  const MAX_AVATARS = 4;

  let thumbnailUrl = $derived(
    space.thumbnailAssetId ? getAssetMediaUrl({ id: space.thumbnailAssetId }) : null,
  );
  let visibleMembers = $derived((space.members ?? []).slice(0, MAX_AVATARS));
  let overflowCount = $derived(Math.max(0, (space.members ?? []).length - MAX_AVATARS));
</script>

<a
  href={Route.viewSpace({ id: space.id })}
  class="group relative rounded-2xl border border-transparent p-5 hover:bg-gray-100 hover:border-gray-200 dark:hover:border-gray-800 dark:hover:bg-gray-900"
  data-testid="space-card"
>
  <div class="relative">
    {#if thumbnailUrl}
      <AssetCover alt={space.name} class="transition-all duration-300 hover:shadow-lg" src={thumbnailUrl} {preload} />
    {:else}
      <NoCover alt={space.name} class="transition-all duration-300" {preload} />
    {/if}

    {#if visibleMembers.length > 0}
      <div class="absolute bottom-2 end-2 flex items-center">
        {#each visibleMembers as member (member.userId)}
          <div class="-ms-1.5 first:ms-0">
            <UserAvatar
              user={{
                id: member.userId,
                name: member.name,
                email: member.email,
                profileImagePath: member.profileImagePath ?? '',
                avatarColor: (member.avatarColor ?? 'primary') as UserAvatarColor,
                profileChangedAt: member.profileChangedAt ?? '',
              }}
              size="sm"
              noTitle
            />
          </div>
        {/each}
        {#if overflowCount > 0}
          <div class="-ms-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-500 text-xs font-medium text-white shadow-md">
            +{overflowCount}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="mt-4">
    <p
      class="w-full leading-6 text-lg line-clamp-2 font-semibold text-black dark:text-white group-hover:text-primary"
      data-testid="space-name"
      title={space.name}
    >
      {space.name}
    </p>

    <span class="flex gap-2 text-sm dark:text-immich-dark-fg" data-testid="space-details">
      {#if space.assetCount != null}
        <p>{space.assetCount} {$t('photos')}</p>
      {/if}
      {#if space.assetCount != null && space.memberCount != null}
        <p>·</p>
      {/if}
      {#if space.memberCount != null}
        <p>{space.memberCount} {$t('members')}</p>
      {/if}
    </span>
  </div>
</a>
```

### Step 4: Run tests

Run: `cd web && pnpm test -- --run src/lib/components/spaces/space-card.spec.ts`
Expected: ALL PASS

### Step 5: Commit

```bash
git add web/src/lib/components/spaces/space-card.svelte web/src/lib/components/spaces/space-card.spec.ts
git commit -m "feat(web): add SpaceCard component with thumbnail and avatar support"
```

---

## Task 5: Web — Update Spaces List Page

**Files:**

- Modify: `web/src/routes/(user)/spaces/+page.svelte`

### Step 1: Update the spaces list page to use SpaceCard

Replace the current grid with `SpaceCard` components:

```svelte
<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import SpaceCard from '$lib/components/spaces/space-card.svelte';
  import SpaceCreateModal from '$lib/modals/SpaceCreateModal.svelte';
  import { Route } from '$lib/route';
  import { type SharedSpaceResponseDto } from '@immich/sdk';
  import { Button, modalManager } from '@immich/ui';
  import { mdiPlus } from '@mdi/js';
  import { goto } from '$app/navigation';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let spaces: SharedSpaceResponseDto[] = $state(data.spaces);

  const handleCreate = async () => {
    const space = await modalManager.show(SpaceCreateModal, {});
    if (space) {
      await goto(Route.viewSpace({ id: space.id }));
    }
  };
</script>

<UserPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <Button shape="round" size="small" leadingIcon={mdiPlus} onclick={handleCreate}>
      {$t('spaces_create')}
    </Button>
  {/snippet}

  {#if spaces.length === 0}
    <EmptyPlaceholder text={$t('spaces_empty')} onClick={handleCreate} class="mt-10 mx-auto" />
  {:else}
    <div class="grid grid-auto-fill-56 gap-y-4">
      {#each spaces as space (space.id)}
        <SpaceCard {space} preload={spaces.indexOf(space) < 20} />
      {/each}
    </div>
  {/if}
</UserPageLayout>
```

### Step 2: Verify lint & type check

Run: `cd web && npx svelte-check --tsconfig ./tsconfig.json`
Expected: No errors

### Step 3: Commit

```bash
git add web/src/routes/(user)/spaces/+page.svelte
git commit -m "feat(web): use SpaceCard grid layout on spaces list page"
```

---

## Task 6: Web — "Set as Space Cover" Action (TDD)

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Test: Add tests for the action behavior (server-side tests already cover the API)

### Step 1: Write failing server tests for editor permission on thumbnail update

In `server/src/services/shared-space.service.spec.ts`, add to the `update` describe block:

```typescript
it('should allow editor to update thumbnailAssetId', async () => {
  const auth = factory.auth();
  const space = factory.sharedSpace();
  const thumbnailAssetId = newUuid();
  const member = makeMemberResult({ spaceId: space.id, userId: auth.user.id, role: SharedSpaceRole.Editor });

  mocks.sharedSpace.getMember.mockResolvedValue(member);
  mocks.sharedSpace.update.mockResolvedValue({ ...space, thumbnailAssetId });

  const result = await sut.update(auth, space.id, { thumbnailAssetId });

  expect(result.thumbnailAssetId).toBe(thumbnailAssetId);
});
```

### Step 2: Run test to verify it fails

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: FAIL — `update()` requires Owner role, Editor is rejected

### Step 3: Update service to allow Editor for thumbnail-only updates

In `server/src/services/shared-space.service.ts`, modify `update()`:

```typescript
async update(auth: AuthDto, id: string, dto: SharedSpaceUpdateDto): Promise<SharedSpaceResponseDto> {
  // Thumbnail-only updates require Editor; name/description changes require Owner
  const isMetadataUpdate = dto.name !== undefined || dto.description !== undefined;
  const minimumRole = isMetadataUpdate ? SharedSpaceRole.Owner : SharedSpaceRole.Editor;
  await this.requireRole(auth, id, minimumRole);

  const space = await this.sharedSpaceRepository.update(id, {
    name: dto.name,
    description: dto.description,
    thumbnailAssetId: dto.thumbnailAssetId,
  });

  return this.mapSpace(space);
}
```

### Step 4: Run tests

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: ALL PASS

### Step 5: Add "Set as Space Cover" to space detail page

In the space detail page (`web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`), add a function and context menu option for setting the cover photo. The exact implementation depends on the existing asset context menu pattern — look for how albums implement "Set as Album Cover" and follow the same pattern. The function should call:

```typescript
import { updateSharedSpace } from '@immich/sdk';

const handleSetAsCover = async (assetId: string) => {
  await updateSharedSpace({ id: space.id, sharedSpaceUpdateDto: { thumbnailAssetId: assetId } });
  space.thumbnailAssetId = assetId;
};
```

### Step 6: Commit

```bash
git add server/src/services/shared-space.service.ts server/src/services/shared-space.service.spec.ts web/src/routes/
git commit -m "feat: allow editors to set space cover photo"
```

---

## Task 7: Generate SQL Documentation & Final Checks

**Files:**

- Modified (auto-generated): `server/src/queries/shared.space.repository.sql`

### Step 1: Generate SQL docs

```bash
cd server && make sql
```

### Step 2: Run full server test suite

```bash
cd server && pnpm test -- --run
```

Expected: ALL PASS

### Step 3: Run web test suite

```bash
cd web && pnpm test -- --run
```

Expected: ALL PASS

### Step 4: Lint and format

```bash
make lint-server && make lint-web && make format-server && make format-web
```

### Step 5: Type check

```bash
make check-server && make check-web
```

### Step 6: Commit any remaining changes

```bash
git add -A
git commit -m "chore: regenerate SQL docs, format, and lint"
```

---

## Task 8: Push & Create PR

### Step 1: Push branch

```bash
git push origin feat/shared-spaces-phase1-completion
```

### Step 2: Wait for CI

Use `/babysit` to monitor CI and fix any failures.

---

## Summary of Test Coverage

| Area                                     | Tests                                                             |
| ---------------------------------------- | ----------------------------------------------------------------- |
| Server: update with thumbnailAssetId     | 2 tests (set + clear)                                             |
| Server: getAll with thumbnailAssetId     | 1 test                                                            |
| Server: get with thumbnail auto-fallback | 3 tests (set, fallback, no assets)                                |
| Server: getAll with member info          | 1 test                                                            |
| Server: editor thumbnail permission      | 1 test                                                            |
| Web: SpaceCard rendering                 | 7 tests (name, counts, thumbnail, empty, avatars, overflow, link) |
| **Total new tests**                      | **15 tests**                                                      |
