import { TUNABLES } from '$lib/utils/tunables';
import type { MonthGroup } from '../month-group.svelte';
import type { TimelineManager } from '../timeline-manager.svelte';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

export function updateIntersectionMonthGroup(timelineManager: TimelineManager, month: MonthGroup) {
  const actuallyIntersecting = calculateIntersecting(timelineManager, month, 0, 0);
  let preIntersecting = false;
  if (!actuallyIntersecting) {
    preIntersecting = calculateIntersecting(
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

export function calculateIntersecting(
  timelineManager: TimelineManager,
  monthGroup: MonthGroup,
  expandTop: number,
  expandBottom: number,
) {
  const monthGroupTop = monthGroup.top;
  const monthGroupBottom = monthGroupTop + monthGroup.height;
  const topWindow = timelineManager.visibleWindow.top - expandTop;
  const bottomWindow = timelineManager.visibleWindow.bottom + expandBottom;

  return isIntersecting(monthGroupTop, monthGroupBottom, topWindow, bottomWindow);
}

/**
 * Calculate intersection for viewer assets with additional parameters like header height and scroll compensation
 */
export function calculateViewerAssetIntersecting(
  timelineManager: TimelineManager,
  positionTop: number,
  positionHeight: number,
  expandTop: number = INTERSECTION_EXPAND_TOP,
  expandBottom: number = INTERSECTION_EXPAND_BOTTOM,
) {
  const scrollCompensationHeightDelta = timelineManager.scrollCompensation?.heightDelta ?? 0;

  const topWindow =
    timelineManager.visibleWindow.top - timelineManager.headerHeight - expandTop + scrollCompensationHeightDelta;
  const bottomWindow =
    timelineManager.visibleWindow.bottom + timelineManager.headerHeight + expandBottom + scrollCompensationHeightDelta;

  const positionBottom = positionTop + positionHeight;

  return isIntersecting(positionTop, positionBottom, topWindow, bottomWindow);
}
