<script lang="ts">
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import { searchStore } from '$lib/stores/search.svelte';

  interface Props {
    timelineManager: TimelineManager;
    assetInteraction: AssetInteraction;
    singleSelect?: boolean;

    handleScrollTop: (scrollTop: number) => void;
    onSelect?: (asset: TimelineAsset) => void;

    onDateGroupSelect: ({ title, assets }: { title: string; assets: TimelineAsset[] }) => void;
    onSelectAssets: (asset: TimelineAsset) => Promise<void>;
    onSelectAssetCandidates: (asset: TimelineAsset | null) => void;
  }

  let {
    singleSelect = false,
    timelineManager,
    assetInteraction,
    handleScrollTop = () => {},
    onSelect = () => {},
    onDateGroupSelect = $bindable(),
    onSelectAssets = $bindable(),
    onSelectAssetCandidates = $bindable(),
  }: Props = $props();

  const handleSelectAsset = (asset: TimelineAsset) => {
    if (!timelineManager.albumAssets.has(asset.id)) {
      assetInteraction.selectAsset(asset);
    }
  };

  let lastAssetMouseEvent: TimelineAsset | null = $state(null);

  let shiftKeyIsDown = $state(false);

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

  onSelectAssetCandidates = (asset: TimelineAsset | null) => {
    if (asset) {
      void selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  onDateGroupSelect = ({ title: group, assets }: { title: string; assets: TimelineAsset[] }) => {
    if (assetInteraction.selectedGroup.has(group)) {
      assetInteraction.removeGroupFromMultiselectGroup(group);
      for (const asset of assets) {
        assetInteraction.removeAssetFromMultiselectGroup(asset.id);
      }
    } else {
      assetInteraction.addGroupToMultiselectGroup(group);
      for (const asset of assets) {
        handleSelectAsset(asset);
      }
    }

    if (timelineManager.assetCount == assetInteraction.selectedAssets.length) {
      isSelectingAllAssets.set(true);
    } else {
      isSelectingAllAssets.set(false);
    }
  };

  onSelectAssets = async (asset: TimelineAsset) => {
    if (!asset) {
      return;
    }
    onSelect(asset);

    if (singleSelect) {
      handleScrollTop(0);

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
      let startBucket = timelineManager.getMonthGroupByAssetId(assetInteraction.assetSelectionStart.id);
      let endBucket = timelineManager.getMonthGroupByAssetId(asset.id);

      if (startBucket === null || endBucket === null) {
        return;
      }

      // Select/deselect assets in range (start,end)
      let started = false;
      for (const monthGroup of timelineManager.months) {
        if (monthGroup === endBucket) {
          break;
        }
        if (started) {
          await timelineManager.loadMonthGroup(monthGroup.yearMonth);
          for (const asset of monthGroup.assetsIterator()) {
            if (deselect) {
              assetInteraction.removeAssetFromMultiselectGroup(asset.id);
            } else {
              handleSelectAsset(asset);
            }
          }
        }
        if (monthGroup === startBucket) {
          started = true;
        }
      }

      // Update date group selection in range [start,end]
      started = false;
      for (const monthGroup of timelineManager.months) {
        if (monthGroup === startBucket) {
          started = true;
        }
        if (started) {
          // Split month group into day groups and check each group
          for (const dayGroup of monthGroup.dayGroups) {
            const dayGroupTitle = dayGroup.groupTitle;
            if (dayGroup.getAssets().every((a) => assetInteraction.hasSelectedAsset(a.id))) {
              assetInteraction.addGroupToMultiselectGroup(dayGroupTitle);
            } else {
              assetInteraction.removeGroupFromMultiselectGroup(dayGroupTitle);
            }
          }
        }
        if (monthGroup === endBucket) {
          break;
        }
      }
    }

    assetInteraction.setAssetSelectionStart(deselect ? null : asset);
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

  let isEmpty = $derived(timelineManager.isInitialized && timelineManager.months.length === 0);

  $effect(() => {
    if (isEmpty) {
      assetInteraction.clearMultiselect();
    }
  });

  $effect(() => {
    if (!lastAssetMouseEvent) {
      assetInteraction.clearAssetSelectionCandidates();
    }
  });

  $effect(() => {
    if (!shiftKeyIsDown) {
      assetInteraction.clearAssetSelectionCandidates();
    }
  });

  $effect(() => {
    if (shiftKeyIsDown && lastAssetMouseEvent) {
      void selectAssetCandidates(lastAssetMouseEvent);
    }
  });
</script>

<svelte:document onkeydown={onKeyDown} onkeyup={onKeyUp} />
