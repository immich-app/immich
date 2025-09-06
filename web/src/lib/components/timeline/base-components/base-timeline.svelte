<script lang="ts">
  import BaseTimelineViewer from '$lib/components/timeline/base-components/base-timeline-viewer.svelte';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { findMonthAtScrollPosition, type ScrubberListener, type TimelineYearMonth } from '$lib/utils/timeline-util';
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

  const VIEWPORT_MULTIPLIER = 2; // Used to determine if timeline is "small"

  // The percentage of scroll through the month that is currently intersecting the top boundary of the viewport.
  // Note: There may be multiple months visible within the viewport at any given time.
  let viewportTopMonthScrollPercent = $state(0);
  // The timeline month intersecting the top position of the viewport
  let viewportTopMonth: TimelineYearMonth | undefined = $state(undefined);
  // Overall scroll percentage through the entire timeline (0-1)
  let timelineScrollPercent: number = $state(0);
  // Indicates whether the viewport is currently in the lead-out section (after all months)
  let isInLeadOutSection = $state(false);
  // Width of the scrubber component in pixels, used to adjust timeline margins
  let scrubberWidth: number = $state(0);

  // note: don't throttle, debounce, or otherwise make this function async - it causes flicker
  // this function updates the scrubber position based on the current scroll position in the timeline
  const handleTimelineScroll = () => {
    isInLeadOutSection = false;

    // Handle edge cases: small timeline (limited scroll) or lead-in area scrolling
    const top = timelineManager.visibleWindow.top;
    if (isSmallTimeline() || top < timelineManager.topSectionHeight) {
      calculateTimelineScrollPercent();
      return;
    }

    // Handle normal month scrolling
    handleMonthScroll();
  };

  const handleMonthScroll = () => {
    const scrollPosition = timelineManager.visibleWindow.top;
    const months = timelineManager.months;
    const maxScrollPercent = timelineManager.getMaxScrollPercent();

    // Find the month at the current scroll position
    const searchResult = findMonthAtScrollPosition(months, scrollPosition, maxScrollPercent);

    if (searchResult) {
      viewportTopMonth = searchResult.month;
      viewportTopMonthScrollPercent = searchResult.monthScrollPercent;
      isInLeadOutSection = false;
      return;
    }

    // We're in lead-out section
    isInLeadOutSection = true;
    timelineScrollPercent = 1;
    resetScrubberMonth();
  };

  const resetScrubberMonth = () => {
    viewportTopMonth = undefined;
    viewportTopMonthScrollPercent = 0;
  };

  const calculateTimelineScrollPercent = () => {
    const maxScroll = timelineManager.getMaxScroll();
    timelineScrollPercent = Math.min(1, timelineManager.visibleWindow.top / maxScroll);
    resetScrubberMonth();
  };

  const handleOverallPercentScroll = (percent: number, scrollTo?: (offset: number) => void) => {
    const maxScroll = timelineManager.getMaxScroll();
    const offset = maxScroll * percent;
    scrollTo?.(offset);
  };

  const findMonthGroup = (target: TimelineYearMonth) => {
    return timelineManager.months.find(
      ({ yearMonth }) => yearMonth.year === target.year && yearMonth.month === target.month,
    );
  };

  const isSmallTimeline = () => {
    return timelineManager.timelineHeight < timelineManager.viewportHeight * VIEWPORT_MULTIPLIER;
  };

  // note: don't throttle, debounce, or otherwise make this function async - it causes flicker
  // this function scrolls the timeline to the specified month group and offset, based on scrubber interaction
  const onScrub: ScrubberListener = (scrubberData) => {
    const { scrubberMonth, overallScrollPercent, scrubberMonthScrollPercent, scrollToFunction } = scrubberData;

    // Handle edge case or no month selected
    if (!scrubberMonth || isSmallTimeline()) {
      handleOverallPercentScroll(overallScrollPercent, scrollToFunction);
      return;
    }

    // Find and scroll to the selected month
    const monthGroup = findMonthGroup(scrubberMonth);
    if (monthGroup) {
      scrollToPositionWithinMonth(monthGroup, scrubberMonthScrollPercent, scrollToFunction);
    }
  };

  const scrollToPositionWithinMonth = (
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
  {#snippet header(scrollToFunction)}
    {#if timelineManager.months.length > 0}
      <Scrubber
        {timelineManager}
        height={timelineManager.viewportHeight}
        timelineTopOffset={timelineManager.topSectionHeight}
        timelineBottomOffset={timelineManager.bottomSectionHeight}
        {isInLeadOutSection}
        {timelineScrollPercent}
        {viewportTopMonthScrollPercent}
        {viewportTopMonth}
        onScrub={(scrubberData) => onScrub({ ...scrubberData, scrollToFunction })}
        bind:scrubberWidth
      />
    {/if}
  {/snippet}
</BaseTimelineViewer>
