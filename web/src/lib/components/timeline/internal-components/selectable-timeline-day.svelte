<script lang="ts">
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import { navigate } from '$lib/utils/navigation';

  import TimelineDay from '$lib/components/timeline/base-components/timeline-day.svelte';
  import { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import { assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import { searchStore } from '$lib/stores/search.svelte';

  interface Props {
    isSelectionMode: boolean;
    singleSelect: boolean;
    withStacked: boolean;
    showArchiveIcon: boolean;
    monthGroup: MonthGroup;
    timelineManager: TimelineManager;
    assetInteraction: AssetInteraction;
    onSelect: (asset: TimelineAsset) => void;
    onScrollCompensation: (compensation: { heightDelta?: number; scrollTop?: number }) => void;
    onScrollToTop: () => void;
  }

  let {
    isSelectionMode,
    singleSelect,
    withStacked,
    showArchiveIcon,
    monthGroup = $bindable(),
    assetInteraction,
    timelineManager,
    onSelect,
    onScrollCompensation,
    onScrollToTop,
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

  const handleOnAssetOpen = (dayGroup: DayGroup, asset: TimelineAsset) => {
    if (isSelectionMode || assetInteraction.selectionActive) {
      handleAssetSelect(dayGroup, asset);
      return;
    }
    void navigate({ targetRoute: 'current', assetId: asset.id });
  };

  // called when clicking asset with shift key pressed or with mouse
  const handleAssetSelect = (dayGroup: DayGroup, asset: TimelineAsset) => {
    void onSelectAssets(asset);

    const assetsInDayGroup = dayGroup.getAssets();
    const groupTitle = dayGroup.groupTitle;
    // Check if all assets are selected in a group to toggle the group selection's icon
    let selectedAssetsInGroupCount = assetsInDayGroup.filter((asset) =>
      assetInteraction.hasSelectedAsset(asset.id),
    ).length;

    // if all assets are selected in a group, add the group to selected group
    if (selectedAssetsInGroupCount == assetsInDayGroup.length) {
      assetInteraction.addGroupToMultiselectGroup(groupTitle);
    } else {
      assetInteraction.removeGroupFromMultiselectGroup(groupTitle);
    }

    if (timelineManager.assetCount == assetInteraction.selectedAssets.length) {
      isSelectingAllAssets.set(true);
    } else {
      isSelectingAllAssets.set(false);
    }
  };

  const handleSelectAsset = (asset: TimelineAsset) => {
    if (!timelineManager.albumAssets.has(asset.id)) {
      assetInteraction.selectAsset(asset);
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

  const handleOnHover = (dayGroup: DayGroup, asset: TimelineAsset) => {
    if (assetInteraction.selectionActive) {
      void selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  const handleDayGroupSelect = (dayGroup: DayGroup, assets: TimelineAsset[]) => {
    const group = dayGroup.groupTitle;
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

  const onSelectAssets = async (asset: TimelineAsset) => {
    if (!asset) {
      return;
    }
    onSelect(asset);

    if (singleSelect) {
      onScrollToTop();

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
</script>

<svelte:document onkeydown={onKeyDown} onkeyup={onKeyUp} />

<TimelineDay
  {singleSelect}
  {withStacked}
  {showArchiveIcon}
  {monthGroup}
  {timelineManager}
  {onScrollCompensation}
  onHover={handleOnHover}
  onAssetOpen={handleOnAssetOpen}
  onAssetSelect={handleAssetSelect}
  onDayGroupSelect={handleDayGroupSelect}
  isDayGroupSelected={(dayGroup: DayGroup) => assetInteraction.selectedGroup.has(dayGroup.groupTitle)}
  isAssetSelected={(asset) => assetInteraction.hasSelectedAsset(asset.id) || timelineManager.albumAssets.has(asset.id)}
  isAssetSelectionCandidate={(asset) => assetInteraction.hasSelectionCandidate(asset.id)}
  isAssetDisabled={(asset) => timelineManager.albumAssets.has(asset.id)}
/>
