<script lang="ts">
  import { scrollMemory } from '#lib/actions/scroll-memory.svelte.ts';
  import UserPageLayout from '#lib/components/layouts/UserPageLayout.svelte';
  import MemoryCard from '#lib/components/memories/MemoryCard.svelte';
  import { memoryManager } from '#lib/managers/memory-manager.svelte.ts';
  import { userPreferencesManager } from '#lib/managers/user-preferences-manager.svelte.ts';
  import MemoriesSettingsModal from '#lib/modals/MemoriesSettingsModal.svelte';
  import { memoriesStatisticsQuery, searchMemoriesQuery } from '#lib/queries/memory.query.ts';
  import { Route } from '#lib/route.ts';
  import { locale } from '#lib/stores/preferences.store.ts';
  import { getAssetMediaUrl, memoryLaneTitle } from '#lib/utils.ts';
  import { getAltText } from '#lib/utils/thumbnail-util.ts';
  import { toTimelineAsset } from '#lib/utils/timeline-util.ts';
  import type { MemoryResponseDto } from '@immich/sdk';
  import { IconButton, LoadingSpinner, modalManager } from '@immich/ui';
  import { mdiTune } from '@mdi/js';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const queries = {
    memories: createQuery(() => searchMemoriesQuery(memoryManager.filters)),
    total: createQuery(() => memoriesStatisticsQuery(memoryManager.filters)),
  };
  const memories = $derived(queries.memories.data ?? []);

  // memories are generated a few days ahead of time, and sorted by `showAt`, so the ones that have
  // not been shown yet come first
  const isUpcoming = (memory: MemoryResponseDto) => !!memory.showAt && new Date(memory.showAt).getTime() > Date.now();
  const upcomingCount = $derived(memories.filter((memory) => isUpcoming(memory)).length);
  const hasUpcoming = $derived(upcomingCount > 0);

  const handleSettings = async () => {
    const settings = await modalManager.show(MemoriesSettingsModal);
    if (!settings) {
      return;
    }

    userPreferencesManager.memories = settings;
    memoryManager.applyPreferences();
  };
</script>

<UserPageLayout
  title={data.meta.title}
  description={queries.total.data === undefined ? undefined : `(${queries.total.data.toLocaleString($locale)})`}
  {@attach scrollMemory({ routeStartsWith: Route.memories() })}
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
  {#if memories.length > 0}
    <div class="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {#if hasUpcoming}
        <div class="col-span-full outline-none">{$t('memories_upcoming')}</div>
      {/if}
      {#each memories as memory, index (memory.id)}
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
            src: getAssetMediaUrl({ id: memory.assets[0].id, cacheKey: memory.assets[0].thumbhash }),
            alt: $getAltText(toTimelineAsset(memory.assets[0])),
            isSaved: memory.isSaved,
            type: memory.type,
          }}
        />
      {/each}
    </div>
  {:else if queries.memories.isFetching}
    <div class="flex items-center justify-center py-16">
      <LoadingSpinner size="giant" />
    </div>
  {/if}
</UserPageLayout>
