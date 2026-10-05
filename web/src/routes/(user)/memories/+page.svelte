<script lang="ts">
  import { scrollMemory } from '$lib/actions/scroll-memory';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import { memoryManager } from '$lib/managers/memory-manager.svelte';
  import { userPreferencesManager } from '$lib/managers/user-preferences-manager.svelte';
  import MemoryCard from '$lib/components/memories/MemoryCard.svelte';
  import MemoriesSettingsModal from '$lib/modals/MemoriesSettingsModal.svelte';
  import { Route } from '$lib/route';
  import { locale } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl, memoryLaneTitle } from '$lib/utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import type { MemoryResponseDto } from '@immich/sdk';
  import { IconButton, LoadingSpinner, modalManager } from '@immich/ui';
  import { mdiTune } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  // memories are generated a few days ahead of time, and sorted by `showAt`, so the ones that have
  // not been shown yet come first
  const isUpcoming = (memory: MemoryResponseDto) => !!memory.showAt && new Date(memory.showAt).getTime() > Date.now();
  const upcomingCount = $derived(memoryManager.memories.filter((memory) => isUpcoming(memory)).length);
  const hasUpcoming = $derived(upcomingCount > 0);

  const handleSettings = async () => {
    const settings = await modalManager.show(MemoriesSettingsModal);
    if (!settings) {
      return;
    }

    userPreferencesManager.memories = settings;
    await memoryManager.applyPreferences();
  };
</script>

<UserPageLayout
  title={data.meta.title}
  description={memoryManager.total === undefined ? undefined : `(${memoryManager.total.toLocaleString($locale)})`}
  use={[[scrollMemory, { routeStartsWith: Route.memories() }]]}
>
  {#snippet buttons()}
    <div class="flex place-items-center gap-2">
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        indicator={userPreferencesManager.hasMemoryPreferences() ? 'primary' : undefined}
        icon={mdiTune}
        aria-label={$t('filters')}
        onclick={handleSettings}
      />
    </div>
  {/snippet}
  {#if memoryManager.memories.length > 0}
    <div class="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {#if hasUpcoming}
        <div class="col-span-full outline-none">{$t('memories_upcoming')}</div>
      {/if}
      {#each memoryManager.memories as memory, index (memory.id)}
        {#if hasUpcoming && index === upcomingCount}
          <div class="col-span-full outline-none">{$t('memories_current')}</div>
        {/if}
        <MemoryCard
          class="size-full"
          item={{
            id: memory.id,
            title: $memoryLaneTitle(memory),
            href: Route.viewMemory({
              id: memory.id,
              assetId: memory.assets[0].id,
              isSaved: userPreferencesManager.memories.onlyFavorites || undefined,
            }),
            src: getAssetMediaUrl({ id: memory.assets[0].id }),
            alt: $getAltText(toTimelineAsset(memory.assets[0])),
            isSaved: memory.isSaved,
            type: memory.type,
          }}
        />
      {/each}
    </div>
  {:else if memoryManager.loading}
    <div class="flex items-center justify-center py-16">
      <LoadingSpinner size="giant" />
    </div>
  {/if}
</UserPageLayout>
