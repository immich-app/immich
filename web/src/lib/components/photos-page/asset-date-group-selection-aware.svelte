<script lang="ts">
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import { navigate } from '$lib/utils/navigation';

  import AssetDateGroupComp from '$lib/components/photos-page/asset-date-group-comp.svelte';
  import { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import { onMount } from 'svelte';
  import { DateGroupActionLib } from './date-group-actions-lib.svelte';

  let { isUploading } = uploadAssetsStore;

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

  const actionLib = new DateGroupActionLib();

  onMount(() => {
    actionLib.assetInteraction = assetInteraction;
    actionLib.timelineManager = timelineManager;
    actionLib.singleSelect = singleSelect;
    actionLib.onSelect = onSelect;
    actionLib.onScrollToTop = onScrollToTop;
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
    void actionLib.onSelectAssets(asset);

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

  const handleOnHover = (dayGroup: DayGroup, asset: TimelineAsset) => {
    if (assetInteraction.selectionActive) {
      actionLib.onSelectAssetCandidates(asset);
    }
  };
</script>

<svelte:document onkeydown={actionLib.onKeyDown} onkeyup={actionLib.onKeyUp} />

<AssetDateGroupComp
  {isSelectionMode}
  {singleSelect}
  {withStacked}
  {showArchiveIcon}
  {monthGroup}
  {timelineManager}
  {onScrollCompensation}
  onHover={handleOnHover}
  onAssetOpen={handleOnAssetOpen}
  onAssetSelect={handleAssetSelect}
  onDayGroupSelect={actionLib.onDayGroupSelect}
  isDayGroupSelected={(dayGroup: DayGroup) => true}
  isAssetSelected={(asset) => true}
  isAssetSelectionCandidate={(asset) => true}
  isAssetDisabled={(asset) => true}
></AssetDateGroupComp>
