<script lang="ts">
  import { page } from '$app/stores';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { type AssetResponseDto, ThumbnailFormat } from '@api';
  import AssetViewer from '../../asset-viewer/asset-viewer.svelte';
  import { flip } from 'svelte/animate';
  import { getThumbnailSize } from '$lib/utils/thumbnail-util';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { onDestroy } from 'svelte';

  export let assets: AssetResponseDto[];
  export let selectedAssets: Set<AssetResponseDto> = new Set();
  export let disableAssetSelect = false;
  export let showArchiveIcon = false;

  let { isViewing: showAssetViewer } = assetViewingStore;

  let selectedAsset: AssetResponseDto;
  let currentViewAssetIndex = 0;

  let viewWidth: number;
  $: thumbnailSize = getThumbnailSize(assets.length, viewWidth);

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
</script>

{#if assets.length > 0}
  <div class="flex w-full flex-wrap gap-1 pb-20" bind:clientWidth={viewWidth}>
    {#each assets as asset (asset.id)}
      <div animate:flip={{ duration: 500 }}>
        <Thumbnail
          {asset}
          {thumbnailSize}
          readonly={disableAssetSelect}
          format={assets.length < 7 ? ThumbnailFormat.Jpeg : ThumbnailFormat.Webp}
          on:click={(e) => (isMultiSelectionMode ? selectAssetHandler(e) : viewAssetHandler(e))}
          on:select={selectAssetHandler}
          selected={selectedAssets.has(asset)}
          {showArchiveIcon}
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
