<script lang="ts">
  import { page } from '$app/state';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import type { AssetCursor } from '$lib/components/asset-viewer/asset-viewer.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { navigate } from '$lib/utils/navigation';
  import { type AssetResponseDto, getAssetInfo } from '@immich/sdk';
  import { SvelteMap } from 'svelte/reactivity';
  import { t } from 'svelte-i18n';

  interface Props {
    results: AssetResponseDto[];
    isLoading: boolean;
    hasMore: boolean;
    totalLoaded: number;
    onLoadMore: () => void;
    spaceId?: string;
    isShared: boolean;
    sortMode: 'relevance' | 'asc' | 'desc';
    total?: number;
  }

  let { results, isLoading, hasMore, totalLoaded, onLoadMore, spaceId, isShared, sortMode, total }: Props = $props();

  let isViewerOpen = $state(false);
  let sentinelElement: HTMLElement | undefined = $state();
  let scrollContainer: HTMLElement | undefined = $state();
  let observer: IntersectionObserver | undefined;

  $effect(() => {
    if (sentinelElement && scrollContainer) {
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasMore && !isLoading) {
            onLoadMore();
          }
        },
        { root: scrollContainer },
      );
      observer.observe(sentinelElement);
      return () => observer?.disconnect();
    }
  });

  const getFullAsset = (id: string): Promise<AssetResponseDto> => {
    return getAssetInfo({ ...authManager.params, id, ...(spaceId ? { spaceId } : {}) });
  };

  let cursor = $state<AssetCursor | undefined>();

  const buildCursor = async (assetId: string) => {
    const idx = results.findIndex((a) => a.id === assetId);
    if (idx === -1) {
      return;
    }
    const [current, prev, next] = await Promise.all([
      getFullAsset(assetId),
      idx > 0 ? getFullAsset(results[idx - 1].id) : Promise.resolve(undefined),
      idx < results.length - 1 ? getFullAsset(results[idx + 1].id) : Promise.resolve(undefined),
    ]);
    cursor = { current, previousAsset: prev, nextAsset: next };
  };

  const openAsset = async (asset: AssetResponseDto) => {
    isViewerOpen = true;
    await buildCursor(asset.id);
  };

  // React to URL changes from AssetViewer's next/prev navigation
  $effect(() => {
    const assetId = page.params?.assetId;
    if (isViewerOpen && assetId) {
      handlePromiseError(buildCursor(assetId));
    }
  });

  const handleClose = async () => {
    isViewerOpen = false;
    cursor = undefined;
    await navigate({ targetRoute: 'current', assetId: null });
  };

  // Date grouping for date-sorted modes
  type DateGroup = { key: string; label: string; assets: AssetResponseDto[] };

  const groupByMonth = (assets: AssetResponseDto[]): DateGroup[] => {
    const map = new SvelteMap<string, DateGroup>();
    for (const asset of assets) {
      const date = asset.fileCreatedAt ? new Date(asset.fileCreatedAt) : undefined;
      const key = date ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}` : 'unknown';
      let group = map.get(key);
      if (!group) {
        const label = date
          ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' })
          : 'Unknown date';
        group = { key, label, assets: [] };
        map.set(key, group);
      }
      group.assets.push(asset);
    }
    return [...map.values()];
  };

  let dateGroups = $derived(sortMode === 'relevance' ? [] : groupByMonth(results));
  const resultCount = $derived(total ?? totalLoaded);
  const hasExactTotal = $derived(total !== undefined);
</script>

<section bind:this={scrollContainer} class="immich-scrollbar flex-1 overflow-y-auto px-4 py-4">
  {#if isLoading && results.length === 0}
    <div class="flex justify-center py-8" data-testid="search-loading">
      <LoadingSpinner />
    </div>
  {:else if results.length === 0}
    <p class="mt-8 text-center text-gray-500 dark:text-gray-400" data-testid="search-empty">
      {$t('search_no_result')}
    </p>
  {:else}
    <div class="mb-4 flex items-center gap-2">
      <span class="text-sm text-gray-500 dark:text-gray-400" data-testid="result-count">
        {#if hasExactTotal}
          {resultCount} result{resultCount === 1 ? '' : 's'}
        {:else if sortMode === 'relevance'}
          {totalLoaded}{hasMore ? '+' : ''} result{totalLoaded === 1 && !hasMore ? '' : 's'}
        {:else}
          {totalLoaded}{hasMore ? ' of up to 500' : ''} result{totalLoaded === 1 && !hasMore ? '' : 's'}
        {/if}
      </span>
      {#if isLoading}
        <LoadingSpinner size="small" />
      {/if}
    </div>

    {#if sortMode === 'relevance'}
      <div class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
        {#each results as asset (asset.id)}
          <button
            type="button"
            class="aspect-square cursor-pointer overflow-hidden rounded"
            onclick={() => openAsset(asset)}
          >
            <img
              src="/api/assets/{asset.id}/thumbnail"
              alt={asset.originalFileName}
              class="h-full w-full object-cover"
            />
          </button>
        {/each}
      </div>
    {:else}
      {#each dateGroups as group, i (group.key)}
        <h3
          class="mb-2 mt-4 text-sm font-medium text-gray-500 first:mt-0 dark:text-gray-400"
          data-testid="date-group-header-{i}"
        >
          {group.label}
        </h3>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
          {#each group.assets as asset (asset.id)}
            <button
              type="button"
              class="aspect-square cursor-pointer overflow-hidden rounded"
              onclick={() => openAsset(asset)}
            >
              <img
                src="/api/assets/{asset.id}/thumbnail"
                alt={asset.originalFileName}
                class="h-full w-full object-cover"
              />
            </button>
          {/each}
        </div>
      {/each}
    {/if}

    {#if hasMore}
      <div bind:this={sentinelElement} data-testid="scroll-sentinel" class="flex justify-center py-4">
        {#if isLoading}
          <LoadingSpinner size="small" />
        {/if}
      </div>
    {/if}
  {/if}
</section>

<Portal target="body">
  {#if isViewerOpen && cursor}
    {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
      <AssetViewer {cursor} {isShared} {spaceId} onClose={() => handlePromiseError(handleClose())} />
    {/await}
  {/if}
</Portal>
