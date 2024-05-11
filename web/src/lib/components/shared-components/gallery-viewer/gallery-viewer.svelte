<script lang="ts">
  import Portal from '../portal/portal.svelte';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import type { BucketPosition, Viewport } from '$lib/stores/assets.store';
  import { handleError } from '$lib/utils/handle-error';
  import { type AssetResponseDto } from '@immich/sdk';
  import { createEventDispatcher, onDestroy } from 'svelte';
  import AssetViewer from '../../asset-viewer/asset-viewer.svelte';
  import justifiedLayout from 'justified-layout';
  import { getAssetRatio } from '$lib/utils/asset-utils';
  import { calculateWidth } from '$lib/utils/timeline-util';
  import { navigate } from '$lib/utils/navigation';
  import { AppRoute, AssetAction } from '$lib/constants';
  import { goto } from '$app/navigation';

  const dispatch = createEventDispatcher<{ intersected: { container: HTMLDivElement; position: BucketPosition } }>();

  export let assets: AssetResponseDto[];
  export let selectedAssets: Set<AssetResponseDto> = new Set();
  export let disableAssetSelect = false;
  export let showArchiveIcon = false;
  export let viewport: Viewport;

  let { isViewing: isViewerOpen, asset: viewingAsset, setAsset } = assetViewingStore;

  let currentViewAssetIndex = 0;
  $: isMultiSelectionMode = selectedAssets.size > 0;

  const viewAssetHandler = async (asset: AssetResponseDto) => {
    currentViewAssetIndex = assets.findIndex((a) => a.id == asset.id);
    setAsset(assets[currentViewAssetIndex]);
    await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
  };

  const selectAssetHandler = (asset: AssetResponseDto) => {
    let temporary = new Set(selectedAssets);

    if (selectedAssets.has(asset)) {
      temporary.delete(asset);
    } else {
      temporary.add(asset);
    }

    selectedAssets = temporary;
  };

  const handleNext = async () => {
    try {
      if (currentViewAssetIndex < assets.length - 1) {
        setAsset(assets[++currentViewAssetIndex]);
        await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
      }
    } catch (error) {
      handleError(error, 'Cannot navigate to the next asset');
    }
  };

  const handlePrevious = async () => {
    try {
      if (currentViewAssetIndex > 0) {
        setAsset(assets[--currentViewAssetIndex]);
        await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
      }
    } catch (error) {
      handleError(error, 'Cannot navigate to previous asset');
    }
  };

  const handleAction = async (action: AssetAction, asset: AssetResponseDto) => {
    switch (action) {
      case AssetAction.ARCHIVE:
      case AssetAction.DELETE:
      case AssetAction.TRASH: {
        assets.splice(
          assets.findIndex((a) => a.id === asset.id),
          1,
        );
        assets = assets;
        if (assets.length === 0) {
          await goto(AppRoute.PHOTOS);
        } else if (currentViewAssetIndex === assets.length) {
          await handlePrevious();
        } else {
          setAsset(assets[currentViewAssetIndex]);
        }
        break;
      }
    }
  };

  onDestroy(() => {
    $isViewerOpen = false;
  });

  $: geometry = (() => {
    const justifiedLayoutResult = justifiedLayout(
      assets.map((asset) => getAssetRatio(asset)),
      {
        boxSpacing: 2,
        containerWidth: Math.floor(viewport.width),
        containerPadding: 0,
        targetRowHeightTolerance: 0.15,
        targetRowHeight: 235,
      },
    );

    return {
      ...justifiedLayoutResult,
      containerWidth: calculateWidth(justifiedLayoutResult.boxes),
    };
  })();
</script>

{#if assets.length > 0}
  <div class="relative" style="height: {geometry.containerHeight}px;width: {geometry.containerWidth}px ">
    {#each assets as asset, i (i)}
      <div
        class="absolute"
        style="width: {geometry.boxes[i].width}px; height: {geometry.boxes[i].height}px; top: {geometry.boxes[i]
          .top}px; left: {geometry.boxes[i].left}px"
      >
        <Thumbnail
          {asset}
          readonly={disableAssetSelect}
          onClick={(e) => (isMultiSelectionMode ? selectAssetHandler(e) : viewAssetHandler(e))}
          on:select={(e) => selectAssetHandler(e.detail.asset)}
          on:intersected={(event) =>
            i === Math.max(1, assets.length - 7) ? dispatch('intersected', event.detail) : undefined}
          selected={selectedAssets.has(asset)}
          {showArchiveIcon}
          thumbnailWidth={geometry.boxes[i].width}
          thumbnailHeight={geometry.boxes[i].height}
        />
      </div>
    {/each}
  </div>
{/if}

<!-- Overlay Asset Viewer -->
{#if $isViewerOpen}
  <Portal target="body">
    <AssetViewer
      asset={$viewingAsset}
      on:action={({ detail: action }) => handleAction(action.type, action.asset)}
      on:previous={handlePrevious}
      on:next={handleNext}
    />
  </Portal>
{/if}
