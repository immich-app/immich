<script lang="ts">
  import BaseTimelineViewer from '$lib/components/timeline/base-components/base-timeline-viewer.svelte';
  import type { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import type { ScrubberListener, TimelineYearMonth } from '$lib/utils/timeline-util';
  import type { Snippet } from 'svelte';
  import Scrubber from './scrubber.svelte';

  interface Props {
    customThumbnailLayout?: Snippet<[TimelineAsset]>;

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
    onAssetOpen?: (dayGroup: DayGroup, asset: TimelineAsset, defaultAssetOpen: () => void) => void;
    onSelect?: (asset: TimelineAsset) => void;

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

    withStacked = false,
    showArchiveIcon = false,
    showSkeleton = $bindable(true),
    isShowDeleteConfirmation = $bindable(false),
    onAssetOpen,
    onSelect = () => {},
    children,
    empty,
  }: Props = $props();

  // Constants for timeline calculations
  const VIEWPORT_MULTIPLIER = 2; // Used to determine if timeline is "small"
  const SUBPIXEL_TOLERANCE = -1; // Tolerance for scroll position checks
  const NEAR_END_THRESHOLD = 0.9999; // Threshold for detecting near-end of month


  let isInLeadOutSection = $state(false);
  // The percentage of scroll through the month that is currently intersecting the top boundary of the viewport.
  // Note: There may be multiple months visible within the viewport at any given time.
  let viewportTopMonthScrollPercent = $state(0);
  let viewportTopMonth: TimelineYearMonth | undefined = $state(undefined);
  let timelineScrollPercent: number = $state(0);
  let scrubberWidth: number = $state(0);

  // note: don't throttle, debounce, or otherwise make this function async - it causes flicker
  // this function updates the scrubber position based on the current scroll position in the timeline
  const handleTimelineScroll = () => {
    isInLeadOutSection = false;

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
    return timelineManager.timelineHeight < timelineManager.viewportHeight * VIEWPORT_MULTIPLIER;
  };

  const isNearMonthBoundary = (progress: number) => {
    return progress > NEAR_END_THRESHOLD;
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

  const handleSmallTimelineScroll = () => {
    calculateTimelineScrollPercent();
  };

  const handleLeadInScroll = () => {
    calculateTimelineScrollPercent();
  };

  const handleMonthScroll = () => {
    const scrollTop = timelineManager.visibleWindow.top;
    const months = timelineManager.months;
    const maxScrollPercent = timelineManager.getMaxScrollPercent();
    
    // Early exit if no months
    if (months.length === 0) {
      isInLeadOutSection = true;
      timelineScrollPercent = 1;
      resetScrubberMonth();
      return;
    }
    
    // Check if we're before the first month (in lead-in)
    const firstMonthTop = months[0].top * maxScrollPercent;
    if (scrollTop < firstMonthTop - SUBPIXEL_TOLERANCE) {
      isInLeadOutSection = true;
      timelineScrollPercent = 1;
      resetScrubberMonth();
      return;
    }
    
    // Check if we're after the last month (in lead-out)
    const lastMonth = months[months.length - 1];
    const lastMonthBottom = (lastMonth.top + lastMonth.height) * maxScrollPercent;
    if (scrollTop >= lastMonthBottom - SUBPIXEL_TOLERANCE) {
      isInLeadOutSection = true;
      timelineScrollPercent = 1;
      resetScrubberMonth();
      return;
    }
    
    // Binary search to find the month containing the viewport top
    let left = 0;
    let right = months.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const month = months[mid];
      const monthTop = month.top * maxScrollPercent;
      const monthBottom = monthTop + month.height * maxScrollPercent;
      
      if (scrollTop >= monthTop - SUBPIXEL_TOLERANCE && scrollTop < monthBottom - SUBPIXEL_TOLERANCE) {
        // Found the month containing the viewport top
        viewportTopMonth = month.yearMonth;
        const distanceIntoMonth = scrollTop - monthTop;
        viewportTopMonthScrollPercent = Math.max(0, distanceIntoMonth / (month.height * maxScrollPercent));
        
        // Handle month boundary edge case
        if (isNearMonthBoundary(viewportTopMonthScrollPercent) && mid < months.length - 1) {
          viewportTopMonth = months[mid + 1].yearMonth;
          viewportTopMonthScrollPercent = 0;
        }
        
        isInLeadOutSection = false;
        return;
      }
      
      if (scrollTop < monthTop) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    
    // Shouldn't reach here, but if we do, we're in lead-out
    isInLeadOutSection = true;
    timelineScrollPercent = 1;
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
  {customThumbnailLayout}
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
  {onAssetOpen}
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
