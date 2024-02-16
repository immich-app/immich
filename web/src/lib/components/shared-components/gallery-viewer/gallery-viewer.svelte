<script lang="ts">
  import { page } from '$app/stores';
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

  const dispatch = createEventDispatcher<{ intersected: { container: HTMLDivElement; position: BucketPosition } }>();

  export let assets: AssetResponseDto[];
  export let selectedAssets: Set<AssetResponseDto> = new Set();
  export let disableAssetSelect = false;
  export let showArchiveIcon = false;
  export let viewport: Viewport;

  let { isViewing: showAssetViewer } = assetViewingStore;

  let selectedAsset: AssetResponseDto;
  let currentViewAssetIndex = 0;
  $: isMultiSelectionMode = selectedAssets.size > 0;

  const viewAssetHandler = (event: CustomEvent) => {
    const { asset }: { asset: AssetResponseDto } = event.detail;

    currentViewAssetIndex = assets.findIndex((a) => a.id == asset.id);
    selectedAsset = assets[currentViewAssetIndex];
    $showAssetViewer = true;
    pushState(selectedAsset.id);
  };

  const selectAssetHandler = (event: CustomEvent) => {
    const { asset }: { asset: AssetResponseDto } = event.detail;
    let temporary = new Set(selectedAssets);

    if (selectedAssets.has(asset)) {
      temporary.delete(asset);
    } else {
      temporary.add(asset);
    }

    selectedAssets = temporary;
  };

  const navigateAssetForward = () => {
    try {
      if (currentViewAssetIndex < assets.length - 1) {
        currentViewAssetIndex++;
        selectedAsset = assets[currentViewAssetIndex];
        pushState(selectedAsset.id);
      }
    } catch (error) {
      handleError(error, 'Cannot navigate to the next asset');
    }
  };

  const navigateAssetBackward = () => {
    try {
      if (currentViewAssetIndex > 0) {
        currentViewAssetIndex--;
        selectedAsset = assets[currentViewAssetIndex];
        pushState(selectedAsset.id);
      }
    } catch (error) {
      handleError(error, 'Cannot navigate to previous asset');
    }
  };

  const pushState = (assetId: string) => {
    // add a URL to the browser's history
    // changes the current URL in the address bar but doesn't perform any SvelteKit navigation
    history.pushState(null, '', `${$page.url.pathname}/photos/${assetId}`);
  };

  const closeViewer = () => {
    $showAssetViewer = false;
    history.pushState(null, '', `${$page.url.pathname}`);
  };

  onDestroy(() => {
    $showAssetViewer = false;
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
          on:click={(e) => (isMultiSelectionMode ? selectAssetHandler(e) : viewAssetHandler(e))}
          on:select={selectAssetHandler}
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
{#if $showAssetViewer}
  <AssetViewer
    asset={selectedAsset}
    on:previous={navigateAssetBackward}
    on:next={navigateAssetForward}
    on:close={closeViewer}
  />
{/if}
