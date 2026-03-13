# Shared Spaces Phase 2: Adding Photos to a Space — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the web UI for viewing, adding, and removing assets in shared spaces, plus the backend timeline integration needed to list space assets.

**Architecture:** Extend the existing timeline infrastructure with a `spaceId` filter (mirroring `albumId`), then redesign the space detail page as a full asset grid with album-style view modes for adding assets.

**Tech Stack:** NestJS (Kysely), SvelteKit (Svelte 5 runes), Timeline/AssetInteraction components, `@immich/sdk`

---

## Context

- **Phase 1 is complete.** The backend has full CRUD for spaces, members, and assets (add/remove endpoints). The web UI has space list/detail pages with member management. The `shared_space_asset` DB table exists.
- **What's missing:** No API endpoint to LIST assets in a space (only add/remove exist). No web UI to view or select assets.
- **Approach:** Add `spaceId` filtering to the existing timeline endpoints (`/timeline/buckets` and `/timeline/bucket`), then rewrite the space detail page to use the `Timeline` component (same as album detail page).

## Reference Files

These files contain patterns you'll replicate. Read them before starting each task:

- **Album detail page:** `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte` — VIEW/SELECT_ASSETS modes, ControlAppBar, AssetSelectControlBar
- **Album viewer:** `web/src/lib/components/album-page/album-viewer.svelte` — Timeline options with `albumId`
- **Timeline service:** `server/src/services/timeline.service.ts` — `timeBucketChecks`, `buildTimeBucketOptions`
- **Asset repository:** `server/src/repositories/asset.repository.ts` — `getTimeBuckets` (line ~690), `getTimeBucket` (line ~746), `AssetBuilderOptions` (line ~70)
- **Access utils:** `server/src/utils/access.ts` — `Permission.AlbumRead` case (line ~172)
- **Access repository:** `server/src/repositories/access.repository.ts` — `AlbumAccess` class (line ~66)
- **RemoveFromAlbumAction:** `web/src/lib/components/timeline/actions/RemoveFromAlbumAction.svelte`
- **Event manager:** `web/src/lib/managers/event-manager.svelte.ts`

---

## Task 1: Add shared space access checks to the access infrastructure

The timeline service uses `requireAccess()` to verify a user can view a resource. This dispatches to `access.repository.ts` based on permission type. Shared spaces have no access checks registered yet — we need to add them.

**Files:**

- Modify: `server/src/repositories/access.repository.ts`
- Modify: `server/src/utils/access.ts`

**Step 1: Add `SharedSpaceAccess` class to access repository**

In `server/src/repositories/access.repository.ts`, add a new class before the `@Injectable() export class AccessRepository` line. Follow the `AlbumAccess` pattern:

```typescript
class SharedSpaceAccess {
  constructor(private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async checkMemberAccess(userId: string, spaceIds: Set<string>) {
    if (spaceIds.size === 0) {
      return new Set<string>();
    }

    return this.db
      .selectFrom('shared_space_member')
      .select('shared_space_member.spaceId')
      .where('shared_space_member.spaceId', 'in', [...spaceIds])
      .where('shared_space_member.userId', '=', userId)
      .execute()
      .then((rows) => new Set(rows.map((row) => row.spaceId)));
  }
}
```

Then in the `AccessRepository` class:

1. Add property: `sharedSpace: SharedSpaceAccess;`
2. In constructor: `this.sharedSpace = new SharedSpaceAccess(db);`

**Step 2: Add `Permission.SharedSpaceRead` case to access utils**

In `server/src/utils/access.ts`, in the `checkAccess` function's switch statement for non-shared-link auth (around line 172 where `Permission.AlbumRead` is), add:

```typescript
case Permission.SharedSpaceRead: {
  return await access.sharedSpace.checkMemberAccess(auth.user.id, ids);
}
```

**Step 3: Verify it compiles**

```bash
cd server && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add server/src/repositories/access.repository.ts server/src/utils/access.ts
git commit -m "feat: add shared space access checks to access infrastructure"
```

---

## Task 2: Add `spaceId` filtering to timeline infrastructure

Add `spaceId` as a query parameter to the timeline endpoints, threading it through the DTO → service → repository layers. Follows the exact `albumId` pattern.

**Files:**

- Modify: `server/src/dtos/time-bucket.dto.ts`
- Modify: `server/src/repositories/asset.repository.ts`
- Modify: `server/src/services/timeline.service.ts`

**Step 1: Add `spaceId` to `TimeBucketDto`**

In `server/src/dtos/time-bucket.dto.ts`, add after the `albumId` field:

```typescript
@ValidateUUID({ optional: true, description: 'Filter assets belonging to a specific shared space' })
spaceId?: string;
```

**Step 2: Add `spaceId` to `AssetBuilderOptions`**

In `server/src/repositories/asset.repository.ts`, add to the `AssetBuilderOptions` interface (around line 70):

```typescript
spaceId?: string;
```

**Step 3: Add `shared_space_asset` join to `getTimeBuckets`**

In `server/src/repositories/asset.repository.ts`, in the `getTimeBuckets` method, add after the `.$if(!!options.albumId, ...)` block (around line 718):

```typescript
.$if(!!options.spaceId, (qb) =>
  qb
    .innerJoin('shared_space_asset', 'asset.id', 'shared_space_asset.assetId')
    .where('shared_space_asset.spaceId', '=', asUuid(options.spaceId!)),
)
```

**Step 4: Add `shared_space_asset` filter to `getTimeBucket`**

In the `getTimeBucket` method, add after the `.$if(!!options.albumId, ...)` block (around line 808). This method uses an `EXISTS` subquery pattern instead of a join:

```typescript
.$if(!!options.spaceId, (qb) =>
  qb.where((eb) =>
    eb.exists(
      eb
        .selectFrom('shared_space_asset')
        .whereRef('shared_space_asset.assetId', '=', 'asset.id')
        .where('shared_space_asset.spaceId', '=', asUuid(options.spaceId!)),
    ),
  ),
)
```

**Step 5: Add `spaceId` permission check in timeline service**

In `server/src/services/timeline.service.ts`, modify `timeBucketChecks`. Currently:

```typescript
if (dto.albumId) {
  await this.requireAccess({ auth, permission: Permission.AlbumRead, ids: [dto.albumId] });
} else {
  dto.userId = dto.userId || auth.user.id;
}
```

Change to:

```typescript
if (dto.albumId) {
  await this.requireAccess({ auth, permission: Permission.AlbumRead, ids: [dto.albumId] });
} else if (dto.spaceId) {
  await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
} else {
  dto.userId = dto.userId || auth.user.id;
}
```

This ensures that when `spaceId` is provided, no `userId` filter is applied (space assets can belong to any member). The `buildTimeBucketOptions` method already spreads all DTO fields into the options, so `spaceId` flows through automatically.

**Step 6: Verify it compiles**

```bash
cd server && npx tsc --noEmit
```

**Step 7: Commit**

```bash
git add server/src/dtos/time-bucket.dto.ts server/src/repositories/asset.repository.ts server/src/services/timeline.service.ts
git commit -m "feat: add spaceId filtering to timeline infrastructure"
```

---

## Task 3: Add timeline service tests for `spaceId`

**Files:**

- Modify: `server/src/services/timeline.service.spec.ts`

**Step 1: Read existing tests**

```bash
# Read the file to understand existing test patterns
```

Read `server/src/services/timeline.service.spec.ts` to understand how `albumId` tests are structured. Follow the same patterns.

**Step 2: Add tests**

Add these test cases in the appropriate describe blocks:

```typescript
it('should check shared space access when spaceId is provided', async () => {
  mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
  mocks.asset.getTimeBuckets.mockResolvedValue([]);

  await sut.getTimeBuckets(authStub.user1, { spaceId: 'space-id' });

  expect(mocks.access.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(authStub.user1.user.id, expect.any(Set));
});

it('should not set userId when spaceId is provided', async () => {
  mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
  mocks.asset.getTimeBuckets.mockResolvedValue([]);

  await sut.getTimeBuckets(authStub.user1, { spaceId: 'space-id' });

  expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ spaceId: 'space-id' }));
  expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.not.objectContaining({ userIds: expect.anything() }));
});

it('should throw when user is not a space member', async () => {
  mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set());

  await expect(sut.getTimeBuckets(authStub.user1, { spaceId: 'space-id' })).rejects.toThrow();
});
```

Adapt variable names and stubs to match the existing test conventions in the file. The mock for `sharedSpace` access may need to be added to the test setup if not already present.

**Step 3: Run tests**

```bash
cd server && pnpm test -- --run src/services/timeline.service.spec.ts
```

**Step 4: Commit**

```bash
git add server/src/services/timeline.service.spec.ts
git commit -m "test: add timeline service tests for spaceId filtering"
```

---

## Task 4: Regenerate OpenAPI spec and TypeScript SDK

The `spaceId` parameter was added to `TimeBucketDto`, which changes the OpenAPI spec. Regenerate so the frontend SDK picks it up.

**Step 1: Build server**

```bash
cd server && pnpm build
```

**Step 2: Sync OpenAPI spec**

```bash
cd server && pnpm sync:open-api
```

**Step 3: Regenerate TypeScript SDK**

```bash
make open-api-typescript
```

**Step 4: Verify `spaceId` appears in the SDK**

```bash
grep -n 'spaceId' open-api/typescript-sdk/src/fetch-client.ts
```

Expected: `spaceId` should appear as an optional parameter in `getTimeBuckets` and `getTimeBucket` functions.

**Step 5: Commit**

```bash
git add open-api/ server/immich-openapi-specs.json
git commit -m "chore: regenerate OpenAPI spec and SDK with spaceId parameter"
```

---

## Task 5: Add space events to event manager

The space detail page needs events for asset add/remove operations, similar to `AlbumAddAssets`.

**Files:**

- Modify: `web/src/lib/managers/event-manager.svelte.ts`

**Step 1: Add events**

In `web/src/lib/managers/event-manager.svelte.ts`, add after the `AlbumUserDelete` event (around line 46):

```typescript
SpaceAddAssets: [{ assetIds: string[]; spaceId: string }];
SpaceRemoveAssets: [{ assetIds: string[]; spaceId: string }];
```

**Step 2: Commit**

```bash
git add web/src/lib/managers/event-manager.svelte.ts
git commit -m "feat: add SpaceAddAssets and SpaceRemoveAssets events"
```

---

## Task 6: Create `RemoveFromSpaceAction` component

Create a bulk action component for removing selected assets from a space, following the `RemoveFromAlbumAction.svelte` pattern exactly.

**Files:**

- Create: `web/src/lib/components/timeline/actions/RemoveFromSpaceAction.svelte`

**Step 1: Create the component**

Read `web/src/lib/components/timeline/actions/RemoveFromAlbumAction.svelte` first, then create `RemoveFromSpaceAction.svelte`:

```svelte
<script lang="ts">
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { getAssetControlContext } from '$lib/utils/context';
  import { handleError } from '$lib/utils/handle-error';
  import { removeAssets } from '@immich/sdk';
  import { IconButton, modalManager, toastManager } from '@immich/ui';
  import { mdiImageRemoveOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    spaceId: string;
    onRemove?: (assetIds: string[]) => void;
  }

  let { spaceId, onRemove }: Props = $props();

  const { getAssets, clearSelect } = getAssetControlContext();

  const removeFromSpace = async () => {
    const assets = [...getAssets()];
    const isConfirmed = await modalManager.showDialog({
      prompt: $t('remove_assets_shared_space_confirmation', { values: { count: assets.length } }),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      const assetIds = assets.map((a) => a.id);
      await removeAssets({
        id: spaceId,
        sharedSpaceAssetRemoveDto: { assetIds },
      });

      eventManager.emit('SpaceRemoveAssets', { assetIds, spaceId });
      onRemove?.(assetIds);

      toastManager.success($t('assets_removed_count', { values: { count: assetIds.length } }));
      clearSelect();
    } catch (error) {
      handleError(error, $t('errors.error_removing_assets_from_space'));
    }
  };
</script>

<IconButton
  shape="round"
  color="secondary"
  variant="ghost"
  aria-label={$t('remove_from_space')}
  icon={mdiImageRemoveOutline}
  onclick={removeFromSpace}
/>
```

**Note:** The i18n keys (`remove_assets_shared_space_confirmation`, `errors.error_removing_assets_from_space`, `remove_from_space`) need to be added. Check `web/src/lib/i18n/en.json` for the pattern and add them. If adding i18n keys is complex (upstream may manage translations), use existing fallback keys like `$t('confirm')` and `$t('error')` as placeholders. The exact approach depends on the project's i18n workflow — check how `RemoveFromAlbumAction` does it.

**Step 2: Commit**

```bash
git add web/src/lib/components/timeline/actions/RemoveFromSpaceAction.svelte
git commit -m "feat: add RemoveFromSpaceAction component"
```

---

## Task 7: Redesign space detail page as asset grid

This is the main task. Rewrite the space detail page to use the `Timeline` component with `spaceId` filtering, add VIEW/SELECT_ASSETS modes, and move member management to a modal.

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/+page.svelte` (major rewrite)
- Modify: `web/src/routes/(user)/spaces/[spaceId]/+page.ts` (add member role info)

**Step 1: Read reference files**

Read these files to understand the patterns:

1. Album detail page: `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
2. Current space detail page: `web/src/routes/(user)/spaces/[spaceId]/+page.svelte`
3. `AssetSelectControlBar`: `web/src/lib/components/timeline/AssetSelectControlBar.svelte`
4. `ControlAppBar`: `web/src/lib/components/shared-components/control-app-bar.svelte`

**Step 2: Update the page load function**

In `web/src/routes/(user)/spaces/[spaceId]/+page.ts`, keep as-is. The current load function already fetches space + members.

**Step 3: Rewrite the space detail page**

Replace the contents of `web/src/routes/(user)/spaces/[spaceId]/+page.svelte` with a new implementation following the album detail page pattern. Key structure:

```svelte
<script lang="ts">
  // Imports: Timeline, AssetSelectControlBar, ControlAppBar, OnEvents,
  // RemoveFromSpaceAction, DownloadAction, FavoriteAction, SelectAllAssets,
  // HeaderActionButton, SpaceAddMemberModal, AssetInteraction,
  // SDK methods (addAssets, getSpace, getMembers), event manager, icons, route, etc.

  // State
  let viewMode: 'view' | 'select-assets' = $state('view');
  let timelineManager = $state<TimelineManager>() as TimelineManager;
  const assetInteraction = new AssetInteraction();
  const timelineInteraction = new AssetInteraction();
  const currentInteraction = $derived(
    viewMode === 'select-assets' ? timelineInteraction : assetInteraction,
  );

  // Space data from page load
  let space = $state(data.space);
  let members = $state(data.members);
  const currentUserMember = $derived(members.find(m => m.userId === $user?.id));
  const isEditor = $derived(
    currentUserMember?.role === 'editor' || currentUserMember?.role === 'owner',
  );
  const isOwner = $derived(currentUserMember?.role === 'owner');

  // Timeline options (switch based on view mode)
  const options = $derived.by(() => {
    if (viewMode === 'select-assets') {
      // Show user's personal timeline for picking assets
      return { visibility: AssetVisibility.Timeline, withPartners: false };
    }
    // Show space assets
    return { spaceId: space.id };
  });

  // Add assets action (used in SELECT_ASSETS mode toolbar)
  const handleAddAssets = async () => {
    const assetIds = timelineInteraction.selectedAssets.map(a => a.id);
    if (assetIds.length === 0) return;
    await addAssets({ id: space.id, sharedSpaceAssetAddDto: { assetIds } });
    eventManager.emit('SpaceAddAssets', { assetIds, spaceId: space.id });
    toastManager.success($t('added_to_space_count', { values: { count: assetIds.length } }));
  };

  // Event handlers
  const onSpaceAddAssets = async () => {
    space = await getSpace({ id: space.id });
    timelineInteraction.clearMultiselect();
    setModeToView();
  };

  const onSpaceRemoveAssets = async ({ assetIds }) => {
    timelineManager.removeAssets(assetIds);
    space = await getSpace({ id: space.id });
  };

  // View mode switching
  const setModeToView = () => {
    timelineManager.suspendTransitions = true;
    viewMode = 'view';
  };

  const handleCloseSelectAssets = () => {
    timelineInteraction.clearMultiselect();
    setModeToView();
  };

  // Members modal
  const handleShowMembers = async () => {
    // Open SpaceAddMemberModal or a members list modal
  };

  // Delete space (owner only)
  const handleDelete = async () => { /* same as current */ };
</script>

<OnEvents
  onSpaceAddAssets={onSpaceAddAssets}
  onSpaceRemoveAssets={onSpaceRemoveAssets}
/>

<!-- ASSET SELECTION BAR (shown when assets selected in VIEW mode) -->
{#if assetInteraction.selectionActive}
  <AssetSelectControlBar
    assets={assetInteraction.selectedAssets}
    clearSelect={() => assetInteraction.clearMultiselect()}
  >
    <SelectAllAssets {timelineManager} {assetInteraction} />
    {#if isEditor}
      <RemoveFromSpaceAction spaceId={space.id} onRemove={(ids) => timelineManager.removeAssets(ids)} />
    {/if}
    <DownloadAction />
    <FavoriteAction
      removeFavorite={assetInteraction.isAllFavorite}
      onFavorite={(ids, isFavorite) => timelineManager.update(ids, (a) => (a.isFavorite = isFavorite))}
    />
  </AssetSelectControlBar>
{:else}

  <!-- VIEW MODE TOOLBAR -->
  {#if viewMode === 'view'}
    <ControlAppBar showBackButton backIcon={mdiArrowLeft} onClose={() => goto(Route.spaces())}>
      {#snippet trailing()}
        {#if isEditor}
          <IconButton
            variant="ghost" shape="round" color="secondary"
            aria-label={$t('add_photos')}
            icon={mdiImagePlusOutline}
            onclick={() => {
              timelineManager.suspendTransitions = true;
              viewMode = 'select-assets';
            }}
          />
        {/if}
        <IconButton
          variant="ghost" shape="round" color="secondary"
          aria-label={$t('members')}
          icon={mdiAccountGroupOutline}
          onclick={handleShowMembers}
        />
        {#if isOwner}
          <IconButton
            variant="ghost" shape="round" color="secondary"
            aria-label={$t('spaces_delete')}
            icon={mdiDelete}
            onclick={handleDelete}
          />
        {/if}
      {/snippet}
    </ControlAppBar>
  {/if}

  <!-- SELECT_ASSETS MODE TOOLBAR -->
  {#if viewMode === 'select-assets'}
    <ControlAppBar onClose={handleCloseSelectAssets}>
      {#snippet leading()}
        <p class="text-lg dark:text-immich-dark-fg">
          {#if !timelineInteraction.selectionActive}
            {$t('add_to_space')}
          {:else}
            {$t('selected_count', { values: { count: timelineInteraction.selectedAssets.length } })}
          {/if}
        </p>
      {/snippet}
      {#snippet trailing()}
        <Button
          size="small"
          disabled={!timelineInteraction.selectionActive}
          onclick={handleAddAssets}
        >
          {$t('add')}
        </Button>
      {/snippet}
    </ControlAppBar>
  {/if}
{/if}

<!-- TIMELINE / ASSET GRID -->
<main class="relative">
  <Timeline
    enableRouting={false}
    bind:timelineManager
    {options}
    assetInteraction={currentInteraction}
    isSelectionMode={viewMode === 'select-assets'}
  >
    {#snippet empty()}
      {#if viewMode === 'view'}
        <section class="flex flex-col items-center justify-center mt-20">
          <p class="text-lg text-immich-fg/60 dark:text-immich-dark-fg/60">
            {$t('spaces_no_assets')}
          </p>
          {#if isEditor}
            <Button class="mt-4" onclick={() => (viewMode = 'select-assets')}>
              {$t('add_photos')}
            </Button>
          {/if}
        </section>
      {/if}
    {/snippet}

    <!-- Space header (shown above asset grid in VIEW mode) -->
    {#if viewMode === 'view'}
      <section class="pt-8 md:pt-24 px-2 md:px-6">
        <h1 class="text-2xl md:text-4xl text-primary">{space.name}</h1>
        {#if space.description}
          <p class="text-sm text-immich-fg/75 dark:text-immich-dark-fg/75 mt-2">{space.description}</p>
        {/if}
        <div class="flex gap-4 mt-2 text-sm text-immich-fg/60 dark:text-immich-dark-fg/60">
          <span>{space.assetCount ?? 0} {$t('photos')}</span>
          <span>{members.length} {$t('members')}</span>
        </div>
      </section>
    {/if}
  </Timeline>
</main>
```

**Important implementation notes:**

1. **Imports:** Use existing components — `Timeline`, `AssetSelectControlBar`, `ControlAppBar`, `SelectAllAssets`, `DownloadAction`, `FavoriteAction`, `RemoveFromSpaceAction`, `OnEvents`, `HeaderActionButton`. Import `AssetInteraction` from `$lib/stores/asset-interaction.svelte`. Import `TimelineManager` from `$lib/managers/timeline-manager/timeline-manager.svelte`.

2. **i18n keys:** Check `web/src/lib/i18n/en.json` for existing keys. You'll need: `add_to_space`, `spaces_no_assets`, `added_to_space_count`, and the keys from Task 6. If the project uses a flat JSON file, add them. If translations are managed externally, use existing close matches.

3. **Members modal:** Reuse `SpaceAddMemberModal` for adding members. For viewing/removing members, you can either:
   - Create a simple `SpaceMembersModal.svelte` (showing member list with remove buttons + "Add member" button)
   - Or navigate to a sub-route

   The simpler approach is a modal. Create `web/src/lib/modals/SpaceMembersModal.svelte` that shows the current member list with remove functionality, and an "Add member" button that chains to `SpaceAddMemberModal`.

4. **No `UserPageLayout`:** The album detail page doesn't use `UserPageLayout` — it uses `ControlAppBar` directly. Do the same for the space detail page.

**Step 4: Run type check**

```bash
cd web && npx svelte-check --tsconfig ./tsconfig.json
```

**Step 5: Commit**

```bash
git add web/src/routes/(user)/spaces/[spaceId]/
git commit -m "feat: redesign space detail page with asset grid and add-photos mode"
```

---

## Task 8: Create `SpaceMembersModal`

Extract member management into a modal component, since the detail page is now an asset grid.

**Files:**

- Create: `web/src/lib/modals/SpaceMembersModal.svelte`

**Step 1: Read reference files**

Read `web/src/lib/modals/SpaceAddMemberModal.svelte` for the modal pattern. Read the member list section from the OLD space detail page (now in git history, or from the research in this plan — it shows UserAvatar + name + email + role + remove button).

**Step 2: Create the modal**

```svelte
<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import SpaceAddMemberModal from '$lib/modals/SpaceAddMemberModal.svelte';
  import {
    removeMember,
    UserAvatarColor,
    type SharedSpaceMemberResponseDto,
  } from '@immich/sdk';
  import { Button, FormModal, IconButton, modalManager, Text } from '@immich/ui';
  import { mdiAccountPlus, mdiClose } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    spaceId: string;
    members: SharedSpaceMemberResponseDto[];
    isOwner: boolean;
    onClose: (updatedMembers?: SharedSpaceMemberResponseDto[]) => void;
  }

  let { spaceId, members: initialMembers, isOwner, onClose }: Props = $props();
  let members = $state([...initialMembers]);

  const toAvatarUser = (member: SharedSpaceMemberResponseDto) => ({
    id: member.userId,
    name: member.name,
    email: member.email,
    profileImagePath: member.profileImagePath ?? '',
    avatarColor: (member.avatarColor as UserAvatarColor) ?? UserAvatarColor.Primary,
    profileChangedAt: member.profileChangedAt ?? '',
  });

  const handleRemoveMember = async (member: SharedSpaceMemberResponseDto) => {
    const confirmed = await modalManager.showDialog({
      prompt: $t('spaces_remove_member_confirmation', { values: { name: member.name } }),
      title: $t('spaces_remove_member'),
    });

    if (!confirmed) return;

    await removeMember({ id: spaceId, userId: member.userId });
    members = members.filter((m) => m.userId !== member.userId);
  };

  const handleAddMember = async () => {
    const added = await modalManager.show(SpaceAddMemberModal, {
      spaceId,
      existingMemberIds: members.map((m) => m.userId),
    });

    if (added && added.length > 0) {
      members = [...members, ...added];
    }
  };

  const handleClose = () => {
    onClose(members);
  };
</script>

<FormModal
  title={$t('members')}
  size="small"
  onClose={handleClose}
  hidePrimaryAction
>
  <div class="flex flex-col gap-2 m-4">
    {#if isOwner}
      <Button size="small" leadingIcon={mdiAccountPlus} onclick={handleAddMember}>
        {$t('spaces_add_member')}
      </Button>
    {/if}

    {#each members as member (member.userId)}
      <div class="flex items-center gap-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <UserAvatar user={toAvatarUser(member)} size="md" />
        <div class="flex-1">
          <Text fontWeight="medium">{member.name}</Text>
          <Text size="tiny" color="muted">{member.email}</Text>
        </div>
        <span class="text-sm text-immich-fg/60 dark:text-immich-dark-fg/60 capitalize">{member.role}</span>
        {#if isOwner && member.role !== 'owner'}
          <IconButton
            shape="round"
            size="small"
            icon={mdiClose}
            aria-label={$t('spaces_remove_member')}
            onclick={() => handleRemoveMember(member)}
          />
        {/if}
      </div>
    {/each}
  </div>
</FormModal>
```

**Step 3: Wire it into the space detail page**

In the space detail page's `handleShowMembers` function:

```typescript
const handleShowMembers = async () => {
  const updatedMembers = await modalManager.show(SpaceMembersModal, {
    spaceId: space.id,
    members,
    isOwner,
  });
  if (updatedMembers) {
    members = updatedMembers;
  }
};
```

**Step 4: Run type check**

```bash
cd web && npx svelte-check --tsconfig ./tsconfig.json
```

**Step 5: Commit**

```bash
git add web/src/lib/modals/SpaceMembersModal.svelte web/src/routes/(user)/spaces/[spaceId]/+page.svelte
git commit -m "feat: add SpaceMembersModal for member management"
```

---

## Task 9: Add i18n keys

Add the translation keys needed by the new components.

**Files:**

- Modify: `web/src/lib/i18n/en.json`

**Step 1: Read the i18n file**

Search for existing shared-space-related keys:

```bash
grep -n "space" web/src/lib/i18n/en.json
```

**Step 2: Add missing keys**

Add these keys (in alphabetical order, following the file's convention):

- `add_to_space`: `"Add to space"`
- `added_to_space_count`: `"Added {count, plural, one {# asset} other {# assets}} to space"`
- `errors.error_removing_assets_from_space`: `"Error removing assets from space"`
- `remove_assets_shared_space_confirmation`: `"Remove {count, plural, one {# asset} other {# assets}} from this space?"`
- `remove_from_space`: `"Remove from space"`
- `spaces_no_assets`: `"No photos in this space yet"`

**Step 3: Commit**

```bash
git add web/src/lib/i18n/en.json
git commit -m "feat: add i18n keys for shared space asset management"
```

---

## Task 10: Update documentation

Update the shared spaces docs to reflect the Phase 2 implementation.

**Files:**

- Modify: `docs/docs/features/shared-spaces.md`

**Step 1: Update the "Adding Photos" section**

Replace the Phase 2 placeholder section (lines 49-51) with:

```markdown
## Adding Photos to a Space

Editors and Owners can add photos from their personal library into a shared space:

1. Open the space.
2. Click the **Add photos** button in the toolbar.
3. Your personal timeline appears — select the photos you want to add.
4. Click **Add** to link them into the space.

Photos are linked by reference — they remain in your personal library and appear in the space for all members. Removing a photo from a space does not delete it from your library.

## Removing Photos from a Space

1. Open the space.
2. Select the photos you want to remove (click to select, shift-click for range).
3. Click the **Remove from space** button in the action bar.
4. Confirm the removal.
```

**Step 2: Format docs**

```bash
cd docs && pnpm format
```

**Step 3: Commit**

```bash
git add docs/docs/features/shared-spaces.md
git commit -m "docs: update shared spaces docs for Phase 2 asset management"
```

---

## Task 11: Run full checks

Verify everything compiles and passes.

**Step 1: Server type check + lint**

```bash
cd server && npx tsc --noEmit && pnpm lint
```

**Step 2: Web type check + lint**

```bash
cd web && npx svelte-check --tsconfig ./tsconfig.json && pnpm lint
```

**Step 3: Server unit tests**

```bash
cd server && pnpm test -- --run
```

**Step 4: Web unit tests**

```bash
cd web && pnpm test -- --run
```

**Step 5: Fix any issues and commit**

```bash
git add -A
git commit -m "fix: address lint and type check issues"
```
