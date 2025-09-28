<script lang="ts">
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import SearchKeyboardShortcuts from '$lib/components/search/SearchKeyboardShortcuts.svelte';
  import SearchResultsAssetViewer from '$lib/components/search/SearchResultsAssetViewer.svelte';

  import AssetLayout from '$lib/components/timeline/AssetLayout.svelte';
  import Photostream from '$lib/components/timeline/Photostream.svelte';
  import SelectableSegment from '$lib/components/timeline/SelectableSegment.svelte';
  import StreamWithViewer from '$lib/components/timeline/StreamWithViewer.svelte';
  import Skeleton from '$lib/elements/Skeleton.svelte';
  import { SearchResultsManager } from '$lib/managers/searchresults-manager/SearchResultsManager.svelte';

  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    assetInteraction: AssetInteraction;
    children?: Snippet<[]>;

    stylePaddingHorizontalPx?: number;
    styleMarginTopPx?: number;
    searchResultsManager: SearchResultsManager;
  }

  let {
    searchResultsManager,
    assetInteraction,
    children,
    stylePaddingHorizontalPx = 0,
    styleMarginTopPx,
  }: Props = $props();
  let viewer: Photostream | undefined = $state(undefined);

  const onAfterNavigateComplete = ({ scrollToAssetQueryParam }: { scrollToAssetQueryParam: boolean }) =>
    viewer?.completeAfterNavigate({ scrollToAssetQueryParam });
</script>

<StreamWithViewer timelineManager={searchResultsManager} {onAfterNavigateComplete}>
  {#snippet assetViewer({ onViewerClose })}
    <SearchResultsAssetViewer timelineManager={searchResultsManager} {onViewerClose} />
  {/snippet}
  <SearchKeyboardShortcuts {assetInteraction} timelineManager={searchResultsManager} />
  <Photostream
    bind:this={viewer}
    {stylePaddingHorizontalPx}
    {styleMarginTopPx}
    showScrollbar={true}
    alwaysShowScrollbar={true}
    enableRouting={true}
    timelineManager={searchResultsManager}
    isShowDeleteConfirmation={true}
    smallHeaderHeight={{ rowHeight: 100, headerHeight: 2 }}
    largeHeaderHeight={{ rowHeight: 235, headerHeight: 2 }}
  >
    {@render children?.()}

    {#snippet skeleton({ segment })}
      <Skeleton height={segment.height - segment.timelineManager.headerHeight} {stylePaddingHorizontalPx} />
    {/snippet}

    {#snippet segment({ segment })}
      <SelectableSegment
        timelineManager={searchResultsManager}
        {assetInteraction}
        isSelectionMode={false}
        singleSelect={false}
      >
        {#snippet content({ onAssetOpen, onAssetSelect, onAssetHover })}
          <AssetLayout
            photostreamManager={searchResultsManager}
            viewerAssets={segment.viewerAssets}
            height={segment.height}
            width={searchResultsManager.viewportWidth}
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
                onMouseEvent={() => onAssetHover(asset)}
                selected={isAssetSelected}
                selectionCandidate={isAssetSelectionCandidate}
                thumbnailWidth={position.width}
                thumbnailHeight={position.height}
              />
            {/snippet}
          </AssetLayout>
        {/snippet}
      </SelectableSegment>
    {/snippet}
  </Photostream>
</StreamWithViewer>
