<script lang="ts">
  import { run } from 'svelte/legacy';

  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import Map from '$lib/components/shared-components/map/map.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { AppRoute } from '$lib/constants';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { getAssetThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { navigate } from '$lib/utils/navigation';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetMediaSize } from '@immich/sdk';
  import { onDestroy } from 'svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let {
    isViewing: showAssetViewer,
    asset: viewingAsset,
    setAssetId,
    showAssetViewer: showAssetViewerFn,
  } = assetViewingStore;

  let viewingAssets: string[] = $state([]);
  let viewingAssetCursor = 0;

  // New state for bottom panel
  let showBottomPanel = $state(false);
  let panelAssets: TimelineAsset[] = $state([]);
  let selectedAssetId: string | null = $state(null);

  // Connection management for asset loading.
  // Used to abort the loading of assets when the user navigates away from the map page.
  let loadingController: AbortController | null = null;
  let isLoading = $state(false);

  // Debug: Log component initialization
  console.log('Map page component initialized', { data, featureFlags: $featureFlags });
  console.log('🔥 Hot-reload test - this should update immediately!');

  onDestroy(() => {
    console.log('Map page component destroyed');
    // Cancel any ongoing loading
    cancelAssetLoading();
    assetViewingStore.showAssetViewer(false);
  });

  run(() => {
    console.log('Feature flags check:', { mapEnabled: $featureFlags.map, loaded: $featureFlags.loaded });
    if (!$featureFlags.map) {
      console.log('Map feature disabled, redirecting to photos');
      handlePromiseError(goto(AppRoute.PHOTOS));
    }
  });

  async function onViewAssets(assetIds: string[]) {
    console.log('onViewAssets called with asset IDs:', assetIds);

    // Cancel any previous loading
    cancelAssetLoading();

    // Show panel immediately with loading state
    showBottomPanel = true;
    panelAssets = [];
    viewingAssets = assetIds;
    viewingAssetCursor = 0;
    selectedAssetId = assetIds[0];
    isLoading = true;

    // Start batch asset loading
    await loadAssetsWithBatching(assetIds);
  }

  async function loadAssetsWithBatching(assetIds: string[]) {
    // Create new AbortController for this loading session
    loadingController = new AbortController();
    const signal = loadingController.signal;

    try {
      console.log(`Starting batch load of ${assetIds.length} assets`);

      // Use batch endpoint for much better performance
      // Process in smaller chunks to avoid overwhelming the server
      const BATCH_SIZE = 500; // Load 500 assets per batch request
      let loadedAssets: TimelineAsset[] = [];

      for (let i = 0; i < assetIds.length; i += BATCH_SIZE) {
        if (signal.aborted) {
          break;
        }

        const batchIds = assetIds.slice(i, i + BATCH_SIZE);
        console.log(`Loading batch ${i / BATCH_SIZE + 1}: ${batchIds.length} assets`);

        try {
          // Use the new bulk endpoint instead of individual requests
          const response = await fetch('/api/assets/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: batchIds }),
            credentials: 'include', // This ensures cookies are included for auth
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch assets: ${response.status}`);
          }

          const batchAssets = await response.json();

          const timelineAssets = batchAssets.map(toTimelineAsset);
          loadedAssets.push(...timelineAssets);

          // Update UI with current batch
          panelAssets = [...loadedAssets];
          console.log(`Loaded ${loadedAssets.length}/${assetIds.length} assets`);
        } catch (error) {
          if (!signal.aborted) {
            console.error(`Failed to load batch starting at index ${i}:`, error);
            // Continue with next batch instead of failing completely
          }
        }
      }

      console.log(`Batch load completed: ${loadedAssets.length}/${assetIds.length} assets loaded`);
    } catch (error) {
      if (!signal.aborted) {
        console.error('Failed to load assets:', error);
      }
    } finally {
      isLoading = false;
      if (loadingController === loadingController) {
        loadingController = null;
      }
    }
  }

  function cancelAssetLoading() {
    if (loadingController) {
      console.log('Cancelling asset loading');
      loadingController.abort();
      loadingController = null;
      isLoading = false;
    }
  }

  async function onPanelAssetClick(asset: TimelineAsset) {
    console.log('Panel asset clicked:', asset.id);
    selectedAssetId = asset.id;
    viewingAssetCursor = viewingAssets.indexOf(asset.id);
    await setAssetId(asset.id);
    showAssetViewerFn(true);
    console.log('Asset viewer should now be open');
  }

  function closeBottomPanel() {
    console.log('Closing bottom panel');

    // Cancel any ongoing loading
    cancelAssetLoading();

    showBottomPanel = false;
    panelAssets = [];
    selectedAssetId = null;
  }

  async function navigateNext() {
    console.log('navigateNext called, current cursor:', viewingAssetCursor, 'total assets:', viewingAssets.length);
    if (viewingAssetCursor < viewingAssets.length - 1) {
      await setAssetId(viewingAssets[++viewingAssetCursor]);
      console.log('Navigated to next asset, new cursor:', viewingAssetCursor);
      await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
      return true;
    }
    console.log('Already at last asset, cannot navigate next');
    return false;
  }

  async function navigatePrevious() {
    if (viewingAssetCursor > 0) {
      await setAssetId(viewingAssets[--viewingAssetCursor]);
      await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
      return true;
    }
    return false;
  }

  async function navigateRandom() {
    if (viewingAssets.length <= 0) {
      return undefined;
    }
    const index = Math.floor(Math.random() * viewingAssets.length);
    const asset = await setAssetId(viewingAssets[index]);
    await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
    return asset;
  }
</script>

{#if $featureFlags.loaded && $featureFlags.map}
  <UserPageLayout title={data.meta.title}>
    <div class="isolate h-full w-full">
      <Map hash onSelect={onViewAssets} />
    </div>
  </UserPageLayout>

  <!-- Bottom Panel -->
  {#if showBottomPanel}
    <div
      class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50"
    >
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Photos ({viewingAssets.length})
          {#if isLoading}
            <span class="text-sm text-gray-500">
              (Loading {panelAssets.length}/{viewingAssets.length}...)
              <span
                class="inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin ml-1"
              ></span>
            </span>
          {/if}
        </h3>
        <button
          onclick={closeBottomPanel}
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close photo panel"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="p-4 max-h-64 overflow-y-auto" id="asset-grid-container">
        {#if panelAssets.length === 0}
          <div class="flex items-center justify-center h-32">
            <div class="text-gray-500 dark:text-gray-400">Loading photos...</div>
          </div>
        {:else}
          <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-1">
            {#each panelAssets as asset (asset.id)}
              <div
                class="relative cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity aspect-square"
                class:ring-2={selectedAssetId === asset.id}
                class:ring-blue-500={selectedAssetId === asset.id}
              >
                <div
                  class="w-full h-full cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                  onclick={() => onPanelAssetClick(asset)}
                  onkeydown={(e) => e.key === 'Enter' && onPanelAssetClick(asset)}
                  role="button"
                  tabindex="0"
                  data-asset-id={asset.id}
                >
                  <img
                    src={getAssetThumbnailUrl({
                      id: asset.id,
                      size: AssetMediaSize.Thumbnail,
                      cacheKey: asset.thumbhash,
                    })}
                    alt={$getAltText(asset)}
                    class="w-full h-full object-cover"
                    draggable="false"
                    loading="lazy"
                  />
                </div>
              </div>
            {/each}

            {#if isLoading && panelAssets.length < viewingAssets.length}
              {#each Array.from({ length: Math.min(12, viewingAssets.length - panelAssets.length) }) as _, i}
                <div class="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse">
                  <div class="w-full h-full flex items-center justify-center">
                    <div class="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <Portal target="body">
    {#if $showAssetViewer}
      {#await import('../../../../../lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
        <AssetViewer
          asset={$viewingAsset}
          showNavigation={viewingAssets.length > 1}
          onNext={navigateNext}
          onPrevious={navigatePrevious}
          onRandom={navigateRandom}
          onClose={() => {
            console.log('Asset viewer closed');
            const currentAssetId = $viewingAsset?.id;
            assetViewingStore.showAssetViewer(false);
            handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));

            // Restore focus to the thumbnail that was viewing
            if (currentAssetId) {
              setTimeout(() => {
                const thumbnail = document.querySelector(`[data-asset-id="${currentAssetId}"]`) as HTMLElement;
                thumbnail?.focus();
              }, 0);
            }
          }}
          isShared={false}
        />
      {/await}
    {/if}
  </Portal>
{/if}
