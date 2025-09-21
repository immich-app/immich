<script lang="ts">
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';

  import { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';

  import type { Snippet } from 'svelte';

  interface Props {
    content: Snippet<
      [
        {
          onDayGroupSelect: (dayGroup: DayGroup, asset: TimelineAsset[]) => void;
          onDayGroupAssetSelect: (dayGroup: DayGroup, asset: TimelineAsset) => void;
        },
      ]
    >;
    onAssetSelect: (asset: TimelineAsset) => void;
    assetInteraction: AssetInteraction;
  }

  let { content, assetInteraction, onAssetSelect }: Props = $props();

  // called when clicking asset with shift key pressed or with mouse
  const onDayGroupAssetSelect = (dayGroup: DayGroup, asset: TimelineAsset) => {
    onAssetSelect(asset);

    const assetsInDayGroup = dayGroup.getAssets();
    const groupTitle = dayGroup.groupTitle;

    // Check if all assets are selected in a group to toggle the group selection's icon
    const selectedAssetsInGroupCount = assetsInDayGroup.filter((asset) =>
      assetInteraction.hasSelectedAsset(asset.id),
    ).length;
    // if all assets are selected in a group, add the group to selected group
    if (selectedAssetsInGroupCount == assetsInDayGroup.length) {
      assetInteraction.addGroupToMultiselectGroup(groupTitle);
    } else {
      assetInteraction.removeGroupFromMultiselectGroup(groupTitle);
    }
  };

  const onDayGroupSelect = (dayGroup: DayGroup, assets: TimelineAsset[]) => {
    const group = dayGroup.groupTitle;
    if (assetInteraction.selectedGroup.has(group)) {
      assetInteraction.removeGroupFromMultiselectGroup(group);
      for (const asset of assets) {
        assetInteraction.removeAssetFromMultiselectGroup(asset.id);
      }
    } else {
      assetInteraction.addGroupToMultiselectGroup(group);
      for (const asset of assets) {
        onAssetSelect(asset);
      }
    }
  };
</script>

{@render content({
  onDayGroupSelect,
  onDayGroupAssetSelect,
})}
