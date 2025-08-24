<script lang="ts">
  import BaseTimelineViewer from '$lib/components/timeline/base-components/base-timeline-viewer.svelte';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import type { ScrubberListener } from '$lib/utils/timeline-util';
  import type { Snippet } from 'svelte';
  import Scrubber from './scrubber.svelte';

  interface Props {
    isSelectionMode?: boolean;
    singleSelect?: boolean;
    /** `true` if this timeline responds to navigation events; if `true`, then look at the
     `AssetViewingStore.gridScrollTarget` and load and scroll to the asset specified, and
     additionally, update the page location/url with the asset as the asset-grid is scrolled */
    enableRouting: boolean;
    timelineManager: TimelineManager;
    assetInteraction: AssetInteraction;

    withStacked?: boolean;
    showArchiveIcon?: boolean;
    showSkeleton?: boolean;

    isShowDeleteConfirmation?: boolean;

    onSelect?: (asset: TimelineAsset) => void;
    children?: Snippet;
    empty?: Snippet;
  }

  let {
    isSelectionMode = false,
    singleSelect = false,
    enableRouting,
    timelineManager = $bindable(),
    assetInteraction,

    withStacked = false,
    showArchiveIcon = false,
    showSkeleton = $bindable(true),
    isShowDeleteConfirmation = $bindable(false),
    onSelect = () => {},
    children,
    empty,
  }: Props = $props();

  let leadOut = $state(false);
  let scrubberMonthPercent = $state(0);
  let scrubberMonth: { year: number; month: number } | undefined = $state(undefined);
  let scrubOverallPercent: number = $state(0);
  let scrubberWidth: number = $state(0);

  // note: don't throttle, debounce, or otherwise make this function async - it causes flicker
  // this function updates the scrubber position based on the current scroll position in the timeline
  const handleTimelineScroll = () => {
    leadOut = false;

    // Handle small timeline edge case: scroll limited due to size of content
    if (isSmallTimeline()) {
      handleSmallTimelineScroll();
      return;
    }

    // Handle scrolling of the lead-in area
    const top = timelineManager.visibleWindow.top;
    if (top < timelineManager.topSectionHeight) {
      handleLeadInScroll();
      return;
    }

    // Handle normal month scrolling
    handleMonthScroll();
  };

  const isSmallTimeline = () => {
    return timelineManager.timelineHeight < timelineManager.viewportHeight * 2;
  };

  const resetScrubberMonth = () => {
    scrubberMonth = undefined;
    scrubberMonthPercent = 0;
  };

  const handleSmallTimelineScroll = () => {
    const maxScroll = timelineManager.getMaxScroll();
    scrubOverallPercent = Math.min(1, timelineManager.visibleWindow.top / maxScroll);
    resetScrubberMonth();
  };

  const handleLeadInScroll = () => {
    const maxScroll = timelineManager.getMaxScroll();
    scrubOverallPercent = Math.min(1, timelineManager.visibleWindow.top / maxScroll);
    resetScrubberMonth();
  };

  const handleMonthScroll = () => {
    const monthsLength = timelineManager.months.length;
    const maxScrollPercent = timelineManager.getMaxScrollPercent();
    let top = timelineManager.visibleWindow.top;
    let found = false;

    for (let i = -1; i < monthsLength + 1; i++) {
      const monthData = getMonthData(i);
      const next = top - monthData.height * maxScrollPercent;

      // Check if we're in this month (with subpixel tolerance)
      if (next < -1 && monthData.monthGroup) {
        scrubberMonth = monthData.monthGroup;

        // Calculate month percentage
        scrubberMonthPercent = Math.max(0, top / (monthData.height * maxScrollPercent));

        // Handle rounding errors (and/or subpixel tolerance) -
        // advance to next month if almost at end
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
      leadOut = true;
      scrubOverallPercent = 1;
      resetScrubberMonth();
    }
  };

  const getMonthData = (index: number) => {
    const monthsLength = timelineManager.months.length;

    if (index === -1) {
      // lead-in
      return {
        height: timelineManager.topSectionHeight,
        monthGroup: undefined,
      };
    }

    if (index === monthsLength) {
      // lead-out
      return {
        height: timelineManager.bottomSectionHeight,
        monthGroup: undefined,
      };
    }

    // normal month
    return {
      height: timelineManager.months[index].height,
      monthGroup: timelineManager.months[index].yearMonth,
    };
  };

  // note: don't throttle, debounce, or otherwise make this function async - it causes flicker
  // this function scrolls the timeline to the specified month group and offset, based on scrubber interaction
  const onScrub: ScrubberListener = ({
    scrubberMonth,
    overallScrollPercent,
    scrubberMonthScrollPercent,
    scrollToFunction,
  }) => {
    if (!scrubberMonth || timelineManager.timelineHeight < timelineManager.viewportHeight * 2) {
      // edge case - scroll limited due to size of content, must adjust - use use the overall percent instead
      const maxScroll = timelineManager.getMaxScroll();
      const offset = maxScroll * overallScrollPercent;
      scrollToFunction?.(offset);
    } else {
      const monthGroup = timelineManager.months.find(
        ({ yearMonth: { year, month } }) => year === scrubberMonth.year && month === scrubberMonth.month,
      );
      if (!monthGroup) {
        return;
      }
      scrollToMonthGroupAndOffset(monthGroup, scrubberMonthScrollPercent, scrollToFunction);
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
  let baseTimelineViewer: BaseTimelineViewer | undefined = $state();
  export const scrollToAsset = (asset: TimelineAsset) => baseTimelineViewer?.scrollToAsset(asset) ?? false;
</script>

<BaseTimelineViewer
  bind:this={baseTimelineViewer}
  {isSelectionMode}
  {singleSelect}
  {enableRouting}
  {timelineManager}
  {assetInteraction}
  {withStacked}
  {showArchiveIcon}
  {showSkeleton}
  {isShowDeleteConfirmation}
  styleMarginRightOverride={scrubberWidth + 'px'}
  {onSelect}
  {children}
  {empty}
  {handleTimelineScroll}
>
  {#snippet header(scrollTo)}
    {#if timelineManager.months.length > 0}
      <Scrubber
        {timelineManager}
        height={timelineManager.viewportHeight}
        timelineTopOffset={timelineManager.topSectionHeight}
        timelineBottomOffset={timelineManager.bottomSectionHeight}
        {leadOut}
        {scrubOverallPercent}
        {scrubberMonthPercent}
        {scrubberMonth}
        onScrub={(args) => onScrub({ ...args, scrollToFunction: scrollTo })}
        bind:scrubberWidth
      />
    {/if}
  {/snippet}
</BaseTimelineViewer>
