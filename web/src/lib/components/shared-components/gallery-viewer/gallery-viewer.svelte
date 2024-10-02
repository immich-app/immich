<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import { AppRoute, AssetAction } from '$lib/constants';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import type { Viewport } from '$lib/stores/assets.store';
  import { getAssetRatio } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { navigate } from '$lib/utils/navigation';
  import { calculateWidth } from '$lib/utils/timeline-util';
  import { type AssetResponseDto } from '@immich/sdk';
  import justifiedLayout from 'justified-layout';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import AssetViewer from '../../asset-viewer/asset-viewer.svelte';
  import Portal from '../portal/portal.svelte';
  import { handlePromiseError } from '$lib/utils';

  export let assets: AssetResponseDto[];
  export let selectedAssets: Set<AssetResponseDto> = new Set();
  export let disableAssetSelect = false;
  export let showArchiveIcon = false;
  export let viewport: Viewport;
  export let onIntersected: (() => void) | undefined = undefined;
  export let showAssetName = false;
  export let onPrevious: (() => Promise<AssetResponseDto | undefined>) | undefined = undefined;
  export let onNext: (() => Promise<AssetResponseDto | undefined>) | undefined = undefined;

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
      const asset = onNext ? await onNext() : assets[++currentViewAssetIndex];
      if (asset) {
        setAsset(asset);
        await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
      }
    } catch (error) {
      handleError(error, $t('errors.cannot_navigate_next_asset'));
    }
  };

  const handlePrevious = async () => {
    try {
      const asset = onPrevious ? await onPrevious() : assets[--currentViewAssetIndex];
      if (asset) {
        setAsset(asset);
        await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
      }
    } catch (error) {
      handleError(error, $t('errors.cannot_navigate_previous_asset'));
    }
  };

  const handleAction = async (action: Action) => {
    switch (action.type) {
      case AssetAction.ARCHIVE:
      case AssetAction.DELETE:
      case AssetAction.TRASH: {
        assets.splice(
          assets.findIndex((a) => a.id === action.asset.id),
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
        title={showAssetName ? asset.originalFileName : ''}
      >
        <Thumbnail
          {asset}
          readonly={disableAssetSelect}
          onClick={(asset) => {
            if (isMultiSelectionMode) {
              selectAssetHandler(asset);
              return;
            }
            void viewAssetHandler(asset);
          }}
          onSelect={(asset) => selectAssetHandler(asset)}
          onIntersected={() => (i === Math.max(1, assets.length - 7) ? onIntersected?.() : void 0)}
          selected={selectedAssets.has(asset)}
          {showArchiveIcon}
          thumbnailWidth={geometry.boxes[i].width}
          thumbnailHeight={geometry.boxes[i].height}
        />
        {#if showAssetName}
          <div
            class="absolute text-center p-1 text-xs font-mono font-semibold w-full bottom-0 bg-gradient-to-t bg-slate-50/75 overflow-clip text-ellipsis"
          >
            {asset.originalFileName}
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<!-- Overlay Asset Viewer -->
{#if $isViewerOpen}
  <Portal target="body">
    <AssetViewer
      asset={$viewingAsset}
      onAction={handleAction}
      onPrevious={handlePrevious}
      onNext={handleNext}
      onClose={() => {
        assetViewingStore.showAssetViewer(false);
        handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
      }}
    />
  </Portal>
{/if}
