<script lang="ts">
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import { navigate } from '$lib/utils/navigation';

  import type { PhotostreamManager } from '$lib/managers/timeline-manager/PhotostreamManager.svelte';
  import type { PhotostreamSegment } from '$lib/managers/timeline-manager/PhotostreamSegment.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import { searchStore } from '$lib/stores/search.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    content: Snippet<
      [
        {
          onAssetOpen: (asset: TimelineAsset) => void;
          onAssetSelect: (asset: TimelineAsset) => void;
          onHover: (asset: TimelineAsset) => void;
        },
      ]
    >;
    segment: PhotostreamSegment;
    isSelectionMode: boolean;
    singleSelect: boolean;
    timelineManager: PhotostreamManager;
    assetInteraction: AssetInteraction;
    onAssetOpen?: (asset: TimelineAsset, defaultAssetOpen: () => void) => void;
    onSelect?: (isSingleSelect: boolean, asset: TimelineAsset) => void;
    onScrollCompensationMonthInDOM: (compensation: { heightDelta?: number; scrollTop?: number }) => void;
  }

  let {
    segment,
    content,
    isSelectionMode,
    singleSelect,
    assetInteraction,
    timelineManager,
    onAssetOpen,
    onSelect,
    onScrollCompensationMonthInDOM,
  }: Props = $props();

  let lastAssetMouseEvent: TimelineAsset | null = $state(null);
  let shiftKeyIsDown = $state(false);
  let isEmpty = $derived(timelineManager.isInitialized && timelineManager.months.length === 0);

  $effect(() => {
    if (!lastAssetMouseEvent || !lastAssetMouseEvent) {
      assetInteraction.clearAssetSelectionCandidates();
    }
    if (shiftKeyIsDown && lastAssetMouseEvent) {
      void selectAssetCandidates(lastAssetMouseEvent);
    }
    if (isEmpty) {
      assetInteraction.clearMultiselect();
    }
  });

  const defaultAssetOpen = (asset: TimelineAsset) => {
    if (isSelectionMode || assetInteraction.selectionActive) {
      handleAssetSelect(asset);
      return;
    }
    void navigate({ targetRoute: 'current', assetId: asset.id });
  };

  const handleOnAssetOpen = (asset: TimelineAsset) => {
    if (onAssetOpen) {
      onAssetOpen(asset, () => defaultAssetOpen(asset));
      return;
    }
    defaultAssetOpen(asset);
  };

  // called when clicking asset with shift key pressed or with mouse
  const handleAssetSelect = (asset: TimelineAsset) => {
    void onSelectAssets(asset);

    if (timelineManager.assetCount == assetInteraction.selectedAssets.length) {
      isSelectingAllAssets.set(true);
    } else {
      isSelectingAllAssets.set(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (searchStore.isSearchEnabled) {
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = true;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (searchStore.isSearchEnabled) {
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = false;
    }
  };

  const handleOnHover = (asset: TimelineAsset) => {
    if (assetInteraction.selectionActive) {
      void selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  const onSelectAssets = async (asset: TimelineAsset) => {
    if (!asset) {
      return;
    }
    onSelect?.(singleSelect, asset);

    if (singleSelect) {
      return;
    }

    const rangeSelection = assetInteraction.assetSelectionCandidates.length > 0;
    const deselect = assetInteraction.hasSelectedAsset(asset.id);

    // Select/deselect already loaded assets
    if (deselect) {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        assetInteraction.removeAssetFromMultiselectGroup(candidate.id);
      }
      assetInteraction.removeAssetFromMultiselectGroup(asset.id);
    } else {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        handleSelectAsset(candidate);
      }
      handleSelectAsset(asset);
    }

    assetInteraction.clearAssetSelectionCandidates();

    if (assetInteraction.assetSelectionStart && rangeSelection) {
      const assets = await timelineManager.retrieveRange(assetInteraction.assetSelectionStart, asset);
      for (const asset of assets) {
        if (deselect) {
          assetInteraction.removeAssetFromMultiselectGroup(asset.id);
        } else {
          handleSelectAsset(asset);
        }
      }
    }
    assetInteraction.setAssetSelectionStart(deselect ? null : asset);
  };

  const handleSelectAsset = (asset: TimelineAsset) => {
    if ('albumAssets' in timelineManager) {
      const tm = timelineManager as TimelineManager;
      if (tm.albumAssets.has(asset.id)) {
        return;
      }
    }
    assetInteraction.selectAsset(asset);
  };

  const selectAssetCandidates = async (endAsset: TimelineAsset) => {
    if (!shiftKeyIsDown) {
      return;
    }

    const startAsset = assetInteraction.assetSelectionStart;
    if (!startAsset) {
      return;
    }

    const assets = assetsSnapshot(await timelineManager.retrieveRange(startAsset, endAsset));
    assetInteraction.setAssetSelectionCandidates(assets);
  };

  $effect.root(() => {
    if (timelineManager.scrollCompensation.monthGroup === segment) {
      onScrollCompensationMonthInDOM(timelineManager.scrollCompensation);
    }
  });
</script>

<svelte:document onkeydown={onKeyDown} onkeyup={onKeyUp} />

{@render content({
  onAssetOpen: handleOnAssetOpen,
  onAssetSelect: handleSelectAsset,
  onHover: handleOnHover,
})}
