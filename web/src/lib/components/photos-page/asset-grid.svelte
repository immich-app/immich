<script lang="ts">
  import TimelineViewer from '$lib/components/timeline-viewer/timeline-viewer.svelte';
  import { AssetAction } from '$lib/constants';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import type { ScrubberListener, TimelineYearMonth } from '$lib/utils/timeline-util';
  import type { AlbumResponseDto, PersonResponseDto } from '@immich/sdk';
  import type { Snippet } from 'svelte';
  import Scrubber from '../shared-components/scrubber/scrubber.svelte';

  interface Props {
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
      | AssetAction.SET_VISIBILITY_TIMELINE;
    withStacked?: boolean;
    showArchiveIcon?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto | null;
    person?: PersonResponseDto | null;
    isShowDeleteConfirmation?: boolean;
    onSelect?: (asset: TimelineAsset) => void;
    onEscape?: () => void;
    children?: Snippet;
    empty?: Snippet;
  }

  let {
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
    onSelect = () => {},
    onEscape = () => {},
    children,
    empty,
  }: Props = $props();

  let leadout = $state(false);
  let scrubberMonthPercent = $state(0);
  let scrubberMonth: { year: number; month: number } | undefined = $state(undefined);
  let scrubOverallPercent: number = $state(0);
  let scrubberWidth: number = $state(0);

  // note: don't throttle, debounch, or otherwise make this function async - it causes flicker
  // this function updates the scrubber position based on the current scroll position in the timeline
  const handleTimelineScroll = () => {
    leadout = false;

    if (timelineManager.timelineHeight < timelineManager.viewportHeight * 2) {
      // edge case - scroll limited due to size of content, must adjust -  use the overall percent instead
      const maxScroll = timelineManager.getMaxScroll();
      scrubOverallPercent = Math.min(1, timelineManager.visibleWindow.top / maxScroll);

      scrubberMonth = undefined;
      scrubberMonthPercent = 0;
    } else {
      let top = timelineManager.visibleWindow.top;
      if (top < timelineManager.topSectionHeight) {
        // in the lead-in area
        scrubberMonth = undefined;
        scrubberMonthPercent = 0;
        const maxScroll = timelineManager.getMaxScroll();

        scrubOverallPercent = Math.min(1, top / maxScroll);
        return;
      }

      let maxScrollPercent = timelineManager.getMaxScrollPercent();
      let found = false;

      const monthsLength = timelineManager.months.length;
      for (let i = -1; i < monthsLength + 1; i++) {
        let monthGroup: TimelineYearMonth | undefined;
        let monthGroupHeight = 0;
        if (i === -1) {
          // lead-in
          monthGroupHeight = timelineManager.topSectionHeight;
        } else if (i === monthsLength) {
          // lead-out
          monthGroupHeight = timelineManager.bottomSectionHeight;
        } else {
          monthGroup = timelineManager.months[i].yearMonth;
          monthGroupHeight = timelineManager.months[i].height;
        }

        let next = top - monthGroupHeight * maxScrollPercent;
        // instead of checking for < 0, add a little wiggle room for subpixel resolution
        if (next < -1 && monthGroup) {
          scrubberMonth = monthGroup;

          // allowing next to be at least 1 may cause percent to go negative, so ensure positive percentage
          scrubberMonthPercent = Math.max(0, top / (monthGroupHeight * maxScrollPercent));

          // compensate for lost precision/rounding errors advance to the next bucket, if present
          if (scrubberMonthPercent > 0.9999 && i + 1 < monthsLength - 1) {
            scrubberMonth = timelineManager.months[i + 1].yearMonth;
            scrubberMonthPercent = 0;
          }

          found = true;
          break;
        }
        top = next;
      }
      if (!found) {
        leadout = true;
        scrubberMonth = undefined;
        scrubberMonthPercent = 0;
        scrubOverallPercent = 1;
      }
    }
  };

  // note: don't throttle, debounch, or otherwise make this function async - it causes flicker
  // this function scrolls the timeline to the specified month group and offset, based on scrubber interaction
  const onScrub: ScrubberListener = ({
    scrubberMonth,
    overallScrollPercent,
    scrubberMonthScrollPercent,
    handleScrollTop,
  }) => {
    if (!scrubberMonth || timelineManager.timelineHeight < timelineManager.viewportHeight * 2) {
      // edge case - scroll limited due to size of content, must adjust - use use the overall percent instead
      const maxScroll = timelineManager.getMaxScroll();
      const offset = maxScroll * overallScrollPercent;
      handleScrollTop?.(offset);
    } else {
      const monthGroup = timelineManager.months.find(
        ({ yearMonth: { year, month } }) => year === scrubberMonth.year && month === scrubberMonth.month,
      );
      if (!monthGroup) {
        return;
      }
      scrollToMonthGroupAndOffset(monthGroup, scrubberMonthScrollPercent, handleScrollTop);
    }
  };

  const scrollToMonthGroupAndOffset = (
    monthGroup: MonthGroup,
    monthGroupScrollPercent: number,
    handleScrollTop?: (top: number) => void,
  ) => {
    const topOffset = monthGroup.top;
    const maxScrollPercent = timelineManager.getMaxScrollPercent();
    const delta = monthGroup.height * monthGroupScrollPercent;
    const scrollToTop = (topOffset + delta) * maxScrollPercent;

    handleScrollTop?.(scrollToTop);
  };
</script>

<TimelineViewer
  {isSelectionMode}
  {singleSelect}
  {enableRouting}
  {timelineManager}
  {assetInteraction}
  {removeAction}
  {withStacked}
  {showArchiveIcon}
  {isShared}
  {album}
  {person}
  {isShowDeleteConfirmation}
  {onSelect}
  {onEscape}
  {children}
  {empty}
  {handleTimelineScroll}
>
  {#snippet header(handleScrollTop)}
    {#if timelineManager.months.length > 0}
      <Scrubber
        {timelineManager}
        height={timelineManager.viewportHeight}
        timelineTopOffset={timelineManager.topSectionHeight}
        timelineBottomOffset={timelineManager.bottomSectionHeight}
        {leadout}
        {scrubOverallPercent}
        {scrubberMonthPercent}
        {scrubberMonth}
        onScrub={(args) => onScrub({ ...args, handleScrollTop })}
        bind:scrubberWidth
      />
    {/if}
  {/snippet}
</TimelineViewer>
