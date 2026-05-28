<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import type { PageData } from './$types';
  import { Route } from '$lib/route';
  import { getAssetMediaUrl, memoryLaneTitle } from '$lib/utils';
  import { t } from 'svelte-i18n';
  import { mdiHeartOutline, mdiHeart } from '@mdi/js';
  import { Button, Icon } from '@immich/ui';
  import { locale } from '$lib/stores/preferences.store';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { page } from '$app/state';
  import MemoryViewer from './MemoryViewer.svelte';
  import { QueryParameter } from '$lib/constants';
  import { memoryManager } from '$lib/managers/memory-manager.svelte';
  import { clearQueryParam, setQueryValue } from '$lib/utils/navigation';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let memories = $derived(data.memories);
  let onlyFavorites = $state(page.url.searchParams.get('favorites') === 'true');

  const toggleFavorites = async () => {
    onlyFavorites = !onlyFavorites;
    memoryManager.filters = onlyFavorites ? { isSaved: true } : {};
    await memoryManager.ready();
    memories = memoryManager.memories;

    if (onlyFavorites) {
      void setQueryValue('favorites', 'true');
    } else {
      void clearQueryParam('favorites', page.url);
    }
  };
</script>

{#if page.url.searchParams.has(QueryParameter.ID)}
  <MemoryViewer />
{:else}
  <UserPageLayout title={data.meta.title} description={`(${memories.length.toLocaleString($locale)})`}>
    {#snippet buttons()}
      <div class="flex place-items-center gap-2">
        <Button
          leadingIcon={mdiHeartOutline}
          size="small"
          variant={onlyFavorites ? 'filled' : 'ghost'}
          color="secondary"
          onclick={() => toggleFavorites()}>{$t('only_favorites')}</Button
        >
      </div>
    {/snippet}
    {#if memories.length > 0}
      <div class="grid w-full grid-cols-2 gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-7">
        {#each memories as memory (memory.id)}
          <a href={Route.memories({ id: memory.assets[0].id })} class="item-card relative inline-block aspect-video">
            {#if memory.isSaved}
              <div class="absolute inset-s-2 top-2 z-2">
                <Icon data-icon-favorite icon={mdiHeart} size="24" class="text-white" />
              </div>
            {/if}
            <img
              src={getAssetMediaUrl({ id: memory.assets[0].id })}
              alt={$getAltText(toTimelineAsset(memory.assets[0]))}
              class="size-full object-cover brightness-75"
              loading="lazy"
            />
            <span
              class="absolute bottom-2 w-full px-1 text-center text-sm font-medium text-ellipsis text-white capitalize backdrop-blur-[1px] hover:cursor-pointer"
            >
              {$memoryLaneTitle(memory)}
            </span>
          </a>
        {/each}
      </div>
    {:else}{/if}
  </UserPageLayout>
{/if}
