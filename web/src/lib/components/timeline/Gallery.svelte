<script lang="ts">
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import AssetLayout from '$lib/components/timeline/base-components/AssetLayout.svelte';
  import BaseTimelineViewer from '$lib/components/timeline/base-components/base-timeline-viewer.svelte';
  import SelectableTimelineMonth from '$lib/components/timeline/internal-components/selectable-timeline-month.svelte';
  import Skeleton from '$lib/elements/Skeleton.svelte';
  import { SearchStreamManager } from '$lib/managers/timeline-manager/SearchStreamManager.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';

  let { isViewing: showAssetViewer } = assetViewingStore;

  interface Props {
    searchTerms: any;
  }

  let { searchTerms }: Props = $props();

  let viewer: BaseTimelineViewer | undefined = $state();
  let showSkeleton: boolean = $state(true);

  const timelineManager = new SearchStreamManager(searchTerms, { isSmartSearchEnabled: true });
  timelineManager.init();
  const assetInteraction = new AssetInteraction();
</script>

<BaseTimelineViewer
  showScrollbar={true}
  enableRouting={false}
  {timelineManager}
  isShowDeleteConfirmation={true}
  {showSkeleton}
>
  {#snippet skeleton({ segment })}
    <Skeleton height={segment.height - segment.timelineManager.headerHeight} title={''} />
  {/snippet}
  {#snippet segment({ segment, onScrollCompensationMonthInDOM })}
    <SelectableTimelineMonth
      {segment}
      {onScrollCompensationMonthInDOM}
      {timelineManager}
      {assetInteraction}
      isSelectionMode={false}
      singleSelect={false}
    >
      {#snippet content({ onAssetOpen, onAssetSelect, onHover })}
        <AssetLayout
          photostreamManager={timelineManager}
          viewerAssets={segment.viewerAssets}
          height={segment.height}
          width={timelineManager.viewportWidth}
        >
          {#snippet thumbnail({ asset, position })}
            {@const isAssetSelectionCandidate = assetInteraction.hasSelectionCandidate(asset.id)}
            {@const isAssetSelected = assetInteraction.hasSelectedAsset(asset.id)}
            <Thumbnail
              showStackedIcon={true}
              showArchiveIcon={true}
              {asset}
              onClick={() => onAssetOpen(asset)}
              onSelect={() => onAssetSelect(asset)}
              onMouseEvent={() => onHover(asset)}
              selected={isAssetSelected}
              selectionCandidate={isAssetSelectionCandidate}
              thumbnailWidth={position.width}
              thumbnailHeight={position.height}
            />
          {/snippet}
        </AssetLayout>
      {/snippet}
    </SelectableTimelineMonth>
  {/snippet}
</BaseTimelineViewer>
