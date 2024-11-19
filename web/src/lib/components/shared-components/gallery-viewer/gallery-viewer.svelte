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

  interface Props {
    assets: AssetResponseDto[];
    selectedAssets?: Set<AssetResponseDto>;
    disableAssetSelect?: boolean;
    showArchiveIcon?: boolean;
    viewport: Viewport;
    onIntersected?: (() => void) | undefined;
    showAssetName?: boolean;
    onPrevious?: (() => Promise<AssetResponseDto | undefined>) | undefined;
    onNext?: (() => Promise<AssetResponseDto | undefined>) | undefined;
  }

  let {
    assets = $bindable(),
    selectedAssets = $bindable(new Set()),
    disableAssetSelect = false,
    showArchiveIcon = false,
    viewport,
    onIntersected = undefined,
    showAssetName = false,
    onPrevious = undefined,
    onNext = undefined,
  }: Props = $props();

  let { isViewing: isViewerOpen, asset: viewingAsset, setAsset } = assetViewingStore;

  let currentViewAssetIndex = 0;
  let isMultiSelectionMode = $derived(selectedAssets.size > 0);

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
      let asset: AssetResponseDto | undefined;
      if (onNext) {
        asset = await onNext();
      } else {
        currentViewAssetIndex = Math.min(currentViewAssetIndex + 1, assets.length - 1);
        asset = assets[currentViewAssetIndex];
      }

      await navigateToAsset(asset);
    } catch (error) {
      handleError(error, $t('errors.cannot_navigate_next_asset'));
    }
  };

  const handlePrevious = async () => {
    try {
      let asset: AssetResponseDto | undefined;
      if (onPrevious) {
        asset = await onPrevious();
      } else {
        currentViewAssetIndex = Math.max(currentViewAssetIndex - 1, 0);
        asset = assets[currentViewAssetIndex];
      }

      await navigateToAsset(asset);
    } catch (error) {
      handleError(error, $t('errors.cannot_navigate_previous_asset'));
    }
  };

  const navigateToAsset = async (asset?: AssetResponseDto) => {
    if (asset && asset.id !== $viewingAsset.id) {
      setAsset(asset);
      await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
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

  let geometry = $derived(
    (() => {
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
    })(),
  );
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
