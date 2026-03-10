import { TUNABLES } from '$lib/utils/tunables';
import type { MonthGroup } from '../month-group.svelte';
import { TimelineManager } from '../timeline-manager.svelte';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

/**
 * General function to check if a rectangular region intersects with a window.
 */
export function isIntersecting(regionTop: number, regionBottom: number, windowTop: number, windowBottom: number) {
  return (
    (regionTop >= windowTop && regionTop < windowBottom) ||
    (regionBottom >= windowTop && regionBottom < windowBottom) ||
    (regionTop < windowTop && regionBottom >= windowBottom)
  );
}

export function updateIntersectionMonthGroup(timelineManager: TimelineManager, month: MonthGroup) {
  const monthGroupTop = month.top;
  const monthGroupBottom = monthGroupTop + month.height;
  const windowTop = timelineManager.visibleWindow.top;
  const windowBottom = timelineManager.visibleWindow.bottom;

  const actuallyIntersecting = isIntersecting(monthGroupTop, monthGroupBottom, windowTop, windowBottom);

  let intersecting = actuallyIntersecting;
  if (!actuallyIntersecting) {
    intersecting = isIntersecting(
      monthGroupTop,
      monthGroupBottom,
      windowTop - INTERSECTION_EXPAND_TOP,
      windowBottom + INTERSECTION_EXPAND_BOTTOM,
    );
  }

  month.intersecting = intersecting;
  month.actuallyIntersecting = actuallyIntersecting;
  if (intersecting) {
    timelineManager.clearDeferredLayout(month);
  }
}

// Bit flags for intersection state
export const Intersection = {
  NONE: 0,
  PRE: 1,
  ACTUAL: 3, // includes PRE (both bits set)
} as const;

/**
 * Returns a numeric flag: NONE (0), PRE (1, within expanded margin only), or ACTUAL (3, truly visible).
 */
export function calculateViewerAssetIntersecting(
  timelineManager: TimelineManager,
  positionTop: number,
  positionHeight: number,
) {
  const positionBottom = positionTop + positionHeight;
  const headerHeight = timelineManager.headerHeight;
  const windowTop = timelineManager.visibleWindow.top - headerHeight;
  const windowBottom = timelineManager.visibleWindow.bottom + headerHeight;

  if (isIntersecting(positionTop, positionBottom, windowTop, windowBottom)) {
    return Intersection.ACTUAL;
  }

  if (
    isIntersecting(
      positionTop,
      positionBottom,
      windowTop - INTERSECTION_EXPAND_TOP,
      windowBottom + INTERSECTION_EXPAND_BOTTOM,
    )
  ) {
    return Intersection.PRE;
  }

  return Intersection.NONE;
}
