<script lang="ts">
  import { run } from 'svelte/legacy';

  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import Map from '$lib/components/shared-components/map/map.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { AppRoute } from '$lib/constants';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { getAssetThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { navigate } from '$lib/utils/navigation';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetMediaSize, getAssetInfo } from '@immich/sdk';
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

  // Debug: Log component initialization
  console.log('Map page component initialized', { data, featureFlags: $featureFlags });
  console.log('🔥 Hot-reload test - this should update immediately!');

  onDestroy(() => {
    console.log('Map page component destroyed');
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

    // Load the assets for the bottom panel
    const assets = await Promise.all(
      assetIds.map(async (id) => {
        const asset = await getAssetInfo({ ...authManager.params, id });
        return toTimelineAsset(asset);
      }),
    );

    panelAssets = assets;
    viewingAssets = assetIds;
    viewingAssetCursor = 0;
    showBottomPanel = true;
    selectedAssetId = assetIds[0];

    console.log('Set panel assets:', panelAssets.length, 'selected:', selectedAssetId);
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
          Photos ({panelAssets.length})
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

      <div class="p-4 max-h-64 overflow-y-auto">
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
                />
              </div>
            </div>
          {/each}
        </div>
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
