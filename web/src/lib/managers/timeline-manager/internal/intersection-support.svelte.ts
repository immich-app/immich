import { TimelineManager } from '$lib/managers/timeline-manager/TimelineManager.svelte';
import { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';
import { TUNABLES } from '$lib/utils/tunables';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

export function updateIntersectionMonth(timelineManager: TimelineManager, month: TimelineMonth) {
  const actuallyIntersecting = calculateMonthIntersecting(timelineManager, month, 0, 0);
  let preIntersecting = false;
  if (!actuallyIntersecting) {
    preIntersecting = calculateMonthIntersecting(
      timelineManager,
      month,
      INTERSECTION_EXPAND_TOP,
      INTERSECTION_EXPAND_BOTTOM,
    );
  }
  month.intersecting = actuallyIntersecting || preIntersecting;
  month.actuallyIntersecting = actuallyIntersecting;
  if (preIntersecting || actuallyIntersecting) {
    timelineManager.clearDeferredLayout(month);
  }
}

/**
 * General function to check if a rectangular region intersects with a window.
 * @param regionTop - Top position of the region to check
 * @param regionBottom - Bottom position of the region to check
 * @param windowTop - Top position of the window
 * @param windowBottom - Bottom position of the window
 * @returns true if the region intersects with the window
 */
export function isIntersecting(regionTop: number, regionBottom: number, windowTop: number, windowBottom: number) {
  return (
    (regionTop >= windowTop && regionTop < windowBottom) ||
    (regionBottom >= windowTop && regionBottom < windowBottom) ||
    (regionTop < windowTop && regionBottom >= windowBottom)
  );
}

export function calculateMonthIntersecting(
  timelineManager: TimelineManager,
  month: TimelineMonth,
  expandTop: number,
  expandBottom: number,
) {
  const monthTop = month.top;
  const monthBottom = monthTop + month.height;
  const topWindow = timelineManager.visibleWindow.top - expandTop;
  const bottomWindow = timelineManager.visibleWindow.bottom + expandBottom;

  return isIntersecting(monthTop, monthBottom, topWindow, bottomWindow);
}

/**
 * Calculate intersection for viewer assets with additional parameters like header height
 */
export function calculateViewerAssetIntersecting(
  timelineManager: TimelineManager,
  positionTop: number,
  positionHeight: number,
  expandTop: number = INTERSECTION_EXPAND_TOP,
  expandBottom: number = INTERSECTION_EXPAND_BOTTOM,
) {
  const topWindow = timelineManager.visibleWindow.top - timelineManager.headerHeight - expandTop;
  const bottomWindow = timelineManager.visibleWindow.bottom + timelineManager.headerHeight + expandBottom;

  const positionBottom = positionTop + positionHeight;

  return isIntersecting(positionTop, positionBottom, topWindow, bottomWindow);
}
