<script lang="ts">
  import { Route } from '$lib/route';
  import { getAssetMediaUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiHeart } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { MemoryIndexItem } from './memory-index-utils';

  interface Props {
    item: MemoryIndexItem;
    preload?: boolean;
  }

  let { item, preload = false }: Props = $props();

  let firstAsset = $derived(item.memory.assets[0]);
  let collageAssets = $derived(item.memory.assets.slice(0, 4));
  let collageLayout = $derived(
    collageAssets.length === 1 ? 'single' : collageAssets.length <= 3 ? 'asymmetric' : 'grid',
  );
  let loading: 'eager' | 'lazy' = $derived(preload ? 'eager' : 'lazy');
</script>

{#if firstAsset}
  <a
    href={Route.memoryViewer({ id: firstAsset.id, source: 'history' })}
    aria-label={item.title}
    data-testid="memory-card"
    class="group relative block rounded-2xl border border-transparent p-5 hover:border-gray-200 hover:bg-gray-100 dark:hover:border-gray-800 dark:hover:bg-gray-900"
  >
    <div class="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-900">
      {#if collageLayout === 'single'}
        <div class="aspect-square overflow-hidden rounded-xl">
          <img
            src={getAssetMediaUrl({ id: firstAsset.id, size: AssetMediaSize.Thumbnail })}
            alt=""
            {loading}
            draggable="false"
            class="size-full object-cover transition duration-200 group-hover:scale-[1.02]"
          />
        </div>
      {:else if collageLayout === 'asymmetric'}
        <div
          class="grid aspect-square gap-0.5 overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800"
          style="grid-template-columns: 3fr 2fr;"
        >
          <img
            src={getAssetMediaUrl({ id: collageAssets[0].id, size: AssetMediaSize.Thumbnail })}
            alt=""
            {loading}
            draggable="false"
            class="size-full object-cover transition duration-200 group-hover:scale-[1.02]"
            style="grid-row: 1 / {collageAssets.length === 2 ? 2 : 3};"
          />
          <img
            src={getAssetMediaUrl({ id: collageAssets[1].id, size: AssetMediaSize.Thumbnail })}
            alt=""
            {loading}
            draggable="false"
            class="size-full object-cover transition duration-200 group-hover:scale-[1.02]"
          />
          {#if collageAssets.length >= 3}
            <img
              src={getAssetMediaUrl({ id: collageAssets[2].id, size: AssetMediaSize.Thumbnail })}
              alt=""
              {loading}
              draggable="false"
              class="size-full object-cover transition duration-200 group-hover:scale-[1.02]"
            />
          {/if}
        </div>
      {:else}
        <div
          class="grid aspect-square grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800"
        >
          {#each collageAssets as asset (asset.id)}
            <img
              src={getAssetMediaUrl({ id: asset.id, size: AssetMediaSize.Thumbnail })}
              alt=""
              {loading}
              draggable="false"
              class="size-full object-cover transition duration-200 group-hover:scale-[1.02]"
            />
          {/each}
        </div>
      {/if}

      {#if item.memory.isSaved}
        <div
          class="absolute start-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-white/70 text-immich-primary shadow-sm backdrop-blur-sm dark:bg-gray-800/70"
          data-testid="memory-saved-indicator"
        >
          <Icon icon={mdiHeart} size="15" />
        </div>
      {/if}
    </div>

    <div class="mt-4">
      <div class="space-y-0.5">
        <p
          class="line-clamp-2 w-full text-lg font-semibold leading-6 text-black group-hover:text-primary dark:text-white"
          title={item.title}
        >
          {item.title}
        </p>
        {#if item.subtitle}
          <p class="truncate text-xs font-medium text-gray-500 dark:text-gray-400" title={item.subtitle}>
            {item.subtitle}
          </p>
        {/if}
      </div>

      <div class="mt-1 flex gap-2 text-sm text-gray-600 dark:text-immich-dark-fg">
        <p>{item.dateLabel}</p>
        <p aria-hidden="true">&middot;</p>
        <p>{$t('memory_assets_count', { values: { count: item.memory.assets.length } })}</p>
      </div>
    </div>
  </a>
{/if}
