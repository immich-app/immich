<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import SpaceCard from '$lib/components/spaces/space-card.svelte';
  import SpacesControls from '$lib/components/spaces/spaces-controls.svelte';
  import SpacesTable from '$lib/components/spaces/spaces-table.svelte';
  import SpaceCreateModal from '$lib/modals/SpaceCreateModal.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { Route } from '$lib/route';
  import { pinnedSpaceIds, spaceViewSettings } from '$lib/stores/space-view.store';
  import { user } from '$lib/stores/user.store';
  import { splitPinnedSpaces } from '$lib/utils/space-utils';
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
  let sortedSpaces: SharedSpaceResponseDto[] = $state(data.spaces);

  let split = $derived(splitPinnedSpaces(sortedSpaces, $pinnedSpaceIds));

  const handleCreate = async () => {
    const space = await modalManager.show(SpaceCreateModal, {});
    if (space) {
      await goto(Route.viewSpace({ id: space.id }));
    }
  };

  const handleTogglePin = (id: string) => {
    pinnedSpaceIds.update((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  };
</script>

<UserPageLayout title={data.meta.title}>
  {#snippet buttons()}
    {#if !authManager.isDemo}
      <Button shape="round" size="small" leadingIcon={mdiPlus} onclick={handleCreate}>
        {$t('spaces_create')}
      </Button>
    {/if}
  {/snippet}

  {#if spaces.length === 0}
    <EmptyPlaceholder
      text={$t('spaces_empty')}
      onClick={authManager.isDemo ? undefined : handleCreate}
      class="mt-10 mx-auto"
    />
  {:else}
    <SpacesControls {spaces} onSorted={(sorted) => (sortedSpaces = sorted)} />

    {#if $spaceViewSettings.viewMode === 'list'}
      <SpacesTable
        spaces={split.unpinned}
        pinnedSpaces={split.pinned}
        currentUserId={$user?.id ?? ''}
        pinnedIds={$pinnedSpaceIds}
        onTogglePin={handleTogglePin}
      />
    {:else}
      <div class="grid grid-auto-fill-72 gap-y-4">
        {#each split.pinned as space, index (space.id)}
          <SpaceCard {space} preload={index < 20} isPinned={true} onTogglePin={handleTogglePin} />
        {/each}
      </div>
      {#if split.showSection}
        <hr class="my-4 border-gray-200 dark:border-gray-700" />
      {/if}
      <div class="grid grid-auto-fill-72 gap-y-4">
        {#each split.unpinned as space, index (space.id)}
          <SpaceCard {space} preload={index < 20} isPinned={false} onTogglePin={handleTogglePin} />
        {/each}
      </div>
    {/if}
  {/if}
</UserPageLayout>
