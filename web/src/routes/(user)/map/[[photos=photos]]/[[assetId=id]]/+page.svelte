<script lang="ts">
  import { run } from 'svelte/legacy';

  import { goto } from '$app/navigation';
  import AssetViewer from '$lib/components/asset-viewer/asset-viewer.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeDescription from '$lib/components/photos-page/actions/change-description-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import TagAction from '$lib/components/photos-page/actions/tag-action.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import Map from '$lib/components/shared-components/map/map.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { AppRoute } from '$lib/constants';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { preferences } from '$lib/stores/user.store';
  import { handlePromiseError } from '$lib/utils';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { getAssetInfo } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiClose, mdiDotsVertical, mdiPlus, mdiSelectAll, mdiSelectRemove } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
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

  // Asset interaction for multi-select in gallery
  let assetInteraction = new AssetInteraction();

  // Viewport tracking for square thumbnail grid
  let panelElement: HTMLElement | undefined = $state();
  let panelWidth = $state(0);
  let galleryViewport = $derived({ width: panelWidth - 32, height: 300 });

  // Reference to the scrollable container for GalleryViewer
  let scrollableContainer: HTMLElement | undefined = $state();

  // Connection management for asset loading.
  // Used to abort the loading of assets when the user navigates away from the map page.
  let loadingController: AbortController | null = null;
  let isLoading = $state(false);

  let fullscreenContainer: HTMLElement | undefined = $state();
  const fullscreenContainerSelector = '#map-page-fullscreen';

  // Viewport panel is not supported. Performance is not good.
  type PanelMode = 'viewport' | 'cluster' | null;
  let panelMode: PanelMode = $state(null);

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

    // Clear any existing selections
    assetInteraction.clearMultiselect();

    // Start batch asset loading
    await loadAssetsWithBatching(assetIds);
  }

  function onMapSelect(assetIds: string[]) {
    // Selection from map (cluster or single marker)
    panelMode = 'cluster';
    void onViewAssets(assetIds);
  }

  async function loadAssetsWithBatching(assetIds: string[]) {
    // Create new AbortController for this loading session
    loadingController = new AbortController();
    const signal = loadingController.signal;

    try {
      console.log(`Starting batch load of ${assetIds.length} assets`);

      // Use batch endpoint for much better performance
      // Process in smaller chunks to avoid overwhelming the server
      let BATCH_SIZE = 500; // Load 500 assets per batch request
      let loadedAssets: TimelineAsset[] = [];
      let useFallback = false;

      for (let i = 0; i < assetIds.length; i += BATCH_SIZE) {
        if (signal.aborted) {
          break;
        }

        let batchIds = assetIds.slice(i, i + BATCH_SIZE);
        console.log(`Loading batch ${i / BATCH_SIZE + 1}: ${batchIds.length} assets`);

        try {
          if (!useFallback) {
            // Try the bulk endpoint first
            const response = await fetch('/api/assets/bulk', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ ids: batchIds }),
              credentials: 'include', // This ensures cookies are included for auth
            });

            if (response.status === 404) {
              console.log('Bulk API not available, falling back to individual requests');
              useFallback = true;
              BATCH_SIZE = 20;
              batchIds = assetIds.slice(i, i + BATCH_SIZE);
              // Fall through to fallback logic below
            } else if (!response.ok) {
              throw new Error(`Failed to fetch assets: ${response.status}`);
            } else {
              const batchAssets = await response.json();
              const timelineAssets = batchAssets.map(toTimelineAsset);
              loadedAssets.push(...timelineAssets);
            }
          }
          // Fallback: use individual getAssetInfo calls
          if (useFallback) {
            console.log(`Using fallback method for batch ${i / BATCH_SIZE + 1}`);
            const batchAssets = await Promise.all(
              batchIds.map(async (id) => {
                try {
                  const asset = await getAssetInfo({ id });
                  return toTimelineAsset(asset);
                } catch (error) {
                  if (signal.aborted) {
                    return null;
                  }
                  console.error(`Failed to load individual asset ${id}:`, error);
                  return null;
                }
              }),
            );

            // Filter out failed assets
            const validAssets = batchAssets.filter((asset): asset is TimelineAsset => asset !== null);
            loadedAssets.push(...validAssets);
          }

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
      loadingController = null;
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

  function closeBottomPanel() {
    console.log('Closing bottom panel');

    // Cancel any ongoing loading
    cancelAssetLoading();

    // Clear selections
    assetInteraction.clearMultiselect();

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

  // Handle gallery navigation for selected assets
  async function handleGalleryNext() {
    const selectedAssets = assetInteraction.selectedAssets;
    if (selectedAssets.length > 0) {
      const currentAsset = selectedAssets[selectedAssets.length - 1];
      const currentIndex = panelAssets.findIndex((asset) => asset.id === currentAsset.id);
      if (currentIndex >= 0 && currentIndex < panelAssets.length - 1) {
        return panelAssets[currentIndex + 1];
      }
    }
    return undefined;
  }

  async function handleGalleryPrevious() {
    const selectedAssets = assetInteraction.selectedAssets;
    if (selectedAssets.length > 0) {
      const currentAsset = selectedAssets[0];
      const currentIndex = panelAssets.findIndex((asset) => asset.id === currentAsset.id);
      if (currentIndex > 0) {
        return panelAssets[currentIndex - 1];
      }
    }
    return undefined;
  }

  // Asset action handlers
  const handleSelectAll = () => {
    assetInteraction.selectAssets(panelAssets);
    isSelectingAllAssets.set(true);
  };

  const handleCancel = () => {
    cancelMultiselect(assetInteraction);
  };

  const handleDeleteOrArchiveAssets = (assetIds: string[]) => {
    panelAssets = panelAssets.filter((asset) => !assetIds.includes(asset.id));
    assetInteraction.clearMultiselect();
  };

  // Track panel width for responsive gallery
  $effect(() => {
    if (panelElement) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          panelWidth = entry.contentRect.width;
        }
      });
      observer.observe(panelElement);
      return () => observer.disconnect();
    }
  });
</script>

{#if $featureFlags.loaded && $featureFlags.map}
  <UserPageLayout title={data.meta.title}>
    <div id="map-page-fullscreen" class="isolate relative h-full w-full" bind:this={fullscreenContainer}>
      <Map hash onSelect={onMapSelect} fullscreenContainer={fullscreenContainerSelector} />

      {#if showBottomPanel}
        <div
          class="absolute inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
          bind:this={panelElement}
        >
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-4">
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
            </div>
            <div class="flex items-center gap-2">
              <button
                onclick={closeBottomPanel}
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close photo panel"
              >
                <IconButton shape="round" color="secondary" variant="ghost" aria-label={$t('close')} icon={mdiClose} />
              </button>
            </div>
          </div>

          <div class="p-2 max-h-80 overflow-y-auto" style="height: 245px;" bind:this={scrollableContainer}>
            {#if panelAssets.length === 0 && !isLoading}
              <div class="flex items-center justify-center h-32">
                <div class="text-gray-500 dark:text-gray-400">No photos found in this location</div>
              </div>
            {:else if panelAssets.length === 0 && isLoading}
              <div class="flex items-center justify-center h-32">
                <div class="text-gray-500 dark:text-gray-400">Loading photos...</div>
              </div>
            {:else}
              <GalleryViewer
                assets={panelAssets}
                viewport={galleryViewport}
                {assetInteraction}
                disableAssetSelect={false}
                showArchiveIcon={false}
                onNext={handleGalleryNext}
                onPrevious={handleGalleryPrevious}
                scrollContainer={scrollableContainer}
              />
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </UserPageLayout>

  <!-- Asset selection control bar at the top -->
  {#if assetInteraction.selectionActive}
    <div class="fixed top-0 left-0 right-0">
      <AssetSelectControlBar
        assets={assetInteraction.selectedAssets}
        clearSelect={() => cancelMultiselect(assetInteraction)}
      >
        <CreateSharedLink />
        <IconButton
          shape="round"
          color="secondary"
          variant="ghost"
          aria-label={$isSelectingAllAssets ? $t('unselect_all') : $t('select_all')}
          icon={$isSelectingAllAssets ? mdiSelectRemove : mdiSelectAll}
          onclick={$isSelectingAllAssets ? handleCancel : handleSelectAll}
        />

        <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
          <AddToAlbum />
          <AddToAlbum shared />
        </ButtonContextMenu>

        <FavoriteAction removeFavorite={assetInteraction.isAllFavorite} />

        <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
          <DownloadAction menuItem />
          <ChangeDate menuItem />
          <ChangeDescription menuItem />
          <ChangeLocation menuItem />
          <ArchiveAction menuItem unarchive={assetInteraction.isAllArchived} onArchive={handleDeleteOrArchiveAssets} />
          {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
            <TagAction menuItem />
          {/if}
          <DeleteAssets menuItem onAssetDelete={handleDeleteOrArchiveAssets} />
        </ButtonContextMenu>
      </AssetSelectControlBar>
    </div>
  {/if}

  <Portal target="body">
    {#if $showAssetViewer}
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
    {/if}
  </Portal>
{/if}
