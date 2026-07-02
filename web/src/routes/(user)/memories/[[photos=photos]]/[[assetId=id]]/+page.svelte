<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import type { PageData } from './$types';
  import { Route } from '$lib/route';
  import { getAssetMediaUrl, memoryLaneTitle } from '$lib/utils';
  import { t } from 'svelte-i18n';
  import { mdiHeartOutline, mdiHeart } from '@mdi/js';
  import { Button, Icon, LoadingSpinner } from '@immich/ui';
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
  let onlyFavorites = $state(page.url.searchParams.get('favorites') === 'true');
  let lastElement: HTMLElement | undefined = $state();

  const toggleFavorites = async () => {
    onlyFavorites = !onlyFavorites;
    memoryManager.filters = onlyFavorites ? { isSaved: true } : {};
    await memoryManager.ready();

    if (onlyFavorites) {
      void setQueryValue('favorites', 'true');
    } else {
      void clearQueryParam('favorites', page.url);
    }
  };

  const intersectionObserver = new IntersectionObserver((entries) => {
    const entry = entries.find((entry) => entry.target === lastElement);
    if (entry?.isIntersecting && memoryManager.hasNextPage) {
      void memoryManager.loadNextPage();
    }
  });

  $effect(() => {
    if (lastElement) {
      intersectionObserver.disconnect();
      intersectionObserver.observe(lastElement);
    }
  });

  const rotation = () => {
    const classes = [
      'rotate-[-2.5deg]',
      '-rotate-2',
      'rotate-[-1.5deg]',
      '-rotate-1',
      'rotate-[-0.5deg]',
      'rotate-0',
      'rotate-[0.5deg]',
      'rotate-1',
      'rotate-[1.5deg]',
      'rotate-2',
      'rotate-[2.5deg]',
    ];

    return classes[Math.round(Math.random() * classes.length)];
  };
</script>

{#if page.url.searchParams.has(QueryParameter.ID)}
  <MemoryViewer />
{:else}
  <UserPageLayout
    title={data.meta.title}
    description={memoryManager.total === undefined ? undefined : `(${memoryManager.total.toLocaleString($locale)})`}
  >
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
    {#if memoryManager.memories.length > 0}
      <div class="grid w-full grid-cols-3 gap-7 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
        {#each memoryManager.memories as memory, index (memory.id)}
          <a
            href={Route.memories({ id: memory.assets[0].id })}
            class={`relative rounded-md bg-gray-50 p-2 pb-0 shadow-md transition-all hover:scale-102 hover:rotate-0 hover:shadow-lg sm:p-5 sm:pb-0 dark:bg-gray-800 ${rotation()}`}
            bind:this={
              () => (index === memoryManager.memories.length - 1 ? lastElement : null),
              (e) => {
                if (index === memoryManager.memories.length - 1) {
                  lastElement = e;
                }
              }
            }
          >
            {#if memory.isSaved}
              <div class="absolute inset-s-2 top-2 z-2">
                <Icon data-icon-favorite icon={mdiHeart} size="32" class="text-red-400" />
              </div>
            {/if}
            <img
              src={getAssetMediaUrl({ id: memory.assets[0].id })}
              alt={$getAltText(toTimelineAsset(memory.assets[0]))}
              class="aspect-square object-cover brightness-75"
              loading="lazy"
            />
            <p class="my-2 text-center text-sm font-medium text-ellipsis capitalize hover:cursor-pointer sm:my-5">
              {$memoryLaneTitle(memory)}
            </p>
          </a>
        {/each}
      </div>
    {:else if memoryManager.total === undefined}
      <div class="flex items-center justify-center py-16">
        <LoadingSpinner size="giant" />
      </div>
    {/if}
  </UserPageLayout>
{/if}
