<script lang="ts">
  import { page } from '$app/state';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import type { AssetCursor } from '$lib/components/asset-viewer/asset-viewer.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { navigate } from '$lib/utils/navigation';
  import { type AssetResponseDto, getAssetInfo } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    results: AssetResponseDto[];
    isLoading: boolean;
    hasMore: boolean;
    totalLoaded: number;
    onLoadMore: () => void;
  }

  let { results, isLoading, hasMore, totalLoaded, onLoadMore }: Props = $props();

  let isViewerOpen = $state(false);

  const getFullAsset = async (id: string): Promise<AssetResponseDto> => {
    return getAssetInfo({ ...authManager.params, id });
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
</script>

<section class="px-4 py-4">
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
        {totalLoaded}{hasMore ? '+' : ''} result{totalLoaded === 1 && !hasMore ? '' : 's'}
      </span>
      {#if isLoading}
        <LoadingSpinner size="small" />
      {/if}
    </div>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-1">
      {#each results as asset (asset.id)}
        <button
          type="button"
          class="aspect-square cursor-pointer overflow-hidden rounded"
          onclick={() => openAsset(asset)}
        >
          <img src="/api/assets/{asset.id}/thumbnail" alt={asset.originalFileName} class="h-full w-full object-cover" />
        </button>
      {/each}
    </div>
    {#if hasMore}
      <div class="mt-4 flex justify-center">
        <button
          type="button"
          data-testid="load-more-btn"
          disabled={isLoading}
          onclick={onLoadMore}
          class="rounded-lg bg-immich-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-immich-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {$t('spaces_load_more')}
        </button>
      </div>
    {/if}
  {/if}
</section>

<Portal target="body">
  {#if isViewerOpen && cursor}
    {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
      <AssetViewer {cursor} isShared={true} onClose={() => handlePromiseError(handleClose())} />
    {/await}
  {/if}
</Portal>
