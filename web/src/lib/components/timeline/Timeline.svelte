<script lang="ts">
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import TimelineKeyboardActions from '$lib/components/timeline/actions/timeline-keyboard-actions.svelte';
  import BaseTimeline from '$lib/components/timeline/base-components/base-timeline.svelte';
  import TimelineMonth from '$lib/components/timeline/base-components/timeline-month.svelte';
  import SelectableTimelineDaygroup from '$lib/components/timeline/internal-components/selectable-timeline-daygroup.svelte';
  import SelectableTimelineMonth from '$lib/components/timeline/internal-components/selectable-timeline-month.svelte';
  import TimelineAssetViewer from '$lib/components/timeline/internal-components/timeline-asset-viewer.svelte';
  import type { AssetAction } from '$lib/constants';
  import Portal from '$lib/elements/Portal.svelte';
  import Skeleton from '$lib/elements/Skeleton.svelte';
  import { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import type { AlbumResponseDto, PersonResponseDto } from '@immich/sdk';
  import type { Snippet } from 'svelte';

  let { isViewing: showAssetViewer } = assetViewingStore;

  interface Props {
    customThumbnailLayout?: Snippet<[TimelineAsset]>;
    isSelectionMode?: boolean;
    singleSelect?: boolean;
    /** `true` if this asset grid is responds to navigation events; if `true`, then look at the
     `AssetViewingStore.gridScrollTarget` and load and scroll to the asset specified, and
     additionally, update the page location/url with the asset as the asset-grid is scrolled */
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
    onAssetOpen?: (dayGroup: DayGroup, asset: TimelineAsset, defaultAssetOpen: () => void) => void;
    onSelect?: (asset: TimelineAsset) => void;
    onEscape?: () => void;
    children?: Snippet;
    empty?: Snippet;
  }

  let {
    customThumbnailLayout,
    isSelectionMode = false,
    singleSelect = false,
    enableRouting,
    timelineManager = $bindable(),
    assetInteraction,
    removeAction,
    withStacked = false,
    showArchiveIcon = false,
    isShared = false,
    album = null,
    person = null,
    isShowDeleteConfirmation = $bindable(false),
    onAssetOpen,
    onSelect = () => {},
    onEscape = () => {},
    children,
    empty,
  }: Props = $props();

  let viewer: BaseTimeline | undefined = $state();
  let showSkeleton: boolean = $state(true);
</script>

<BaseTimeline
  bind:this={viewer}
  {enableRouting}
  {timelineManager}
  {isShowDeleteConfirmation}
  {showSkeleton}
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
    <SelectableTimelineMonth
      {segment}
      {onScrollCompensationMonthInDOM}
      {timelineManager}
      {assetInteraction}
      {isSelectionMode}
      {singleSelect}
    >
      {#snippet content({ onAssetOpen, onAssetSelect, onHover })}
        <SelectableTimelineDaygroup {timelineManager} {assetInteraction} {onAssetSelect}>
          {#snippet content({ onDayGroupSelect, onDayGroupAssetSelect })}
            <TimelineMonth
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
                  onMouseEvent={() => onHover(asset)}
                  selected={isAssetSelected}
                  selectionCandidate={isAssetSelectionCandidate}
                  disabled={isAssetDisabled}
                  thumbnailWidth={position.width}
                  thumbnailHeight={position.height}
                />
              {/snippet}
            </TimelineMonth>
          {/snippet}
        </SelectableTimelineDaygroup>
      {/snippet}
    </SelectableTimelineMonth>
  {/snippet}
</BaseTimeline>

<TimelineKeyboardActions
  scrollToAsset={(asset) => viewer?.scrollToAsset(asset) ?? false}
  {timelineManager}
  {assetInteraction}
  bind:isShowDeleteConfirmation
  {onEscape}
/>

<Portal target="body">
  {#if $showAssetViewer}
    <TimelineAssetViewer bind:showSkeleton {timelineManager} {removeAction} {withStacked} {isShared} {album} {person} />
  {/if}
</Portal>
