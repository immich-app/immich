<script lang="ts">
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import MonthSegment from '$lib/components/timeline/MonthSegment.svelte';
  import PhotostreamWithScrubber from '$lib/components/timeline/PhotostreamWithScrubber.svelte';
  import SelectableDay from '$lib/components/timeline/SelectableDay.svelte';
  import SelectableSegment from '$lib/components/timeline/SelectableSegment.svelte';
  import StreamWithViewer from '$lib/components/timeline/StreamWithViewer.svelte';
  import TimelineAssetViewer from '$lib/components/timeline/TimelineAssetViewer.svelte';
  import TimelineKeyboardActions from '$lib/components/timeline/actions/TimelineKeyboardActions.svelte';
  import { AssetAction } from '$lib/constants';
  import Skeleton from '$lib/elements/Skeleton.svelte';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { type AlbumResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { type Snippet } from 'svelte';

  interface Props {
    isSelectionMode?: boolean;
    singleSelect?: boolean;
    /** `true` if this asset grid is responds to navigation events; if `true`, then look at the
     `AssetViewingStore.gridScrollTarget` and load and scroll to the asset specified, and
     additionally, update the page location/url with the asset as the timeline is scrolled */
    enableRouting: boolean;
    timelineManager: TimelineManager;
    assetInteraction: AssetInteraction;
    removeAction?:
      | AssetAction.UNARCHIVE
      | AssetAction.ARCHIVE
      | AssetAction.FAVORITE
      | AssetAction.UNFAVORITE
      | AssetAction.SET_VISIBILITY_TIMELINE
      | null;
    withStacked?: boolean;
    showArchiveIcon?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto | null;
    person?: PersonResponseDto | null;
    isShowDeleteConfirmation?: boolean;
    onAssetOpen?: (asset: TimelineAsset, defaultAssetOpen: () => void) => void;
    onAssetSelect?: (asset: TimelineAsset) => void;
    onEscape?: () => void;
    children?: Snippet;
    empty?: Snippet;
    customThumbnailLayout?: Snippet<[TimelineAsset]>;
  }

  let {
    isSelectionMode = false,
    singleSelect = false,
    enableRouting,
    timelineManager = $bindable(),
    assetInteraction,
    removeAction = null,
    withStacked = false,
    showArchiveIcon = false,
    isShared = false,
    album = null,
    person = null,
    isShowDeleteConfirmation = $bindable(false),

    onAssetSelect,
    onAssetOpen,
    onEscape = () => {},
    children,
    empty,
    customThumbnailLayout,
  }: Props = $props();

  let viewer: PhotostreamWithScrubber | undefined = $state(undefined);

  const onAfterNavigateComplete = ({ scrollToAssetQueryParam }: { scrollToAssetQueryParam: boolean }) =>
    viewer?.completeAfterNavigate({ scrollToAssetQueryParam });
</script>

<StreamWithViewer {timelineManager} {onAfterNavigateComplete}>
  {#snippet assetViewer({ onViewerClose })}
    <TimelineAssetViewer {timelineManager} {removeAction} {withStacked} {isShared} {album} {person} {onViewerClose} />
  {/snippet}
  <TimelineKeyboardActions
    scrollToAsset={async (asset) => (await viewer?.scrollToAsset(asset)) ?? Promise.resolve(false)}
    {timelineManager}
    {assetInteraction}
    bind:isShowDeleteConfirmation
    {onEscape}
  />
  <PhotostreamWithScrubber
    bind:this={viewer}
    {enableRouting}
    {timelineManager}
    {isShowDeleteConfirmation}
    {children}
    {empty}
  >
    {#snippet skeleton({ segment })}
      <Skeleton
        height={segment.height - segment.timelineManager.headerHeight}
        title={(segment as MonthGroup).monthGroupTitle}
      />
    {/snippet}
    {#snippet segment({ segment, onScrollCompensationMonthInDOM })}
      <SelectableSegment
        {segment}
        {onScrollCompensationMonthInDOM}
        {timelineManager}
        {assetInteraction}
        {isSelectionMode}
        {singleSelect}
        {onAssetOpen}
        {onAssetSelect}
      >
        {#snippet content({ onAssetOpen, onAssetSelect, onAssetHover })}
          <SelectableDay {assetInteraction} {onAssetSelect}>
            {#snippet content({ onDayGroupSelect, onDayGroupAssetSelect })}
              <MonthSegment
                {assetInteraction}
                {customThumbnailLayout}
                {singleSelect}
                monthGroup={segment as MonthGroup}
                {timelineManager}
                {onDayGroupSelect}
              >
                {#snippet thumbnail({ asset, position, dayGroup, groupIndex })}
                  {@const isAssetSelectionCandidate = assetInteraction.hasSelectionCandidate(asset.id)}
                  {@const isAssetSelected =
                    assetInteraction.hasSelectedAsset(asset.id) || timelineManager.albumAssets.has(asset.id)}
                  {@const isAssetDisabled = timelineManager.albumAssets.has(asset.id)}
                  <Thumbnail
                    showStackedIcon={withStacked}
                    {showArchiveIcon}
                    {asset}
                    {groupIndex}
                    onClick={() => onAssetOpen(asset)}
                    onSelect={() => onDayGroupAssetSelect(dayGroup, asset)}
                    onMouseEvent={(isMouseOver) => {
                      if (isMouseOver) {
                        onAssetHover(asset);
                      } else {
                        onAssetHover(null);
                      }
                    }}
                    selected={isAssetSelected}
                    selectionCandidate={isAssetSelectionCandidate}
                    disabled={isAssetDisabled}
                    thumbnailWidth={position.width}
                    thumbnailHeight={position.height}
                  />
                {/snippet}
              </MonthSegment>
            {/snippet}
          </SelectableDay>
        {/snippet}
      </SelectableSegment>
    {/snippet}
  </PhotostreamWithScrubber>
</StreamWithViewer>
