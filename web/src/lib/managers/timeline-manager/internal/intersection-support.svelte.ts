import type { PhotostreamManager } from '$lib/managers/photostream-manager/PhotostreamManager.svelte';
import type { PhotostreamSegment } from '$lib/managers/photostream-manager/PhotostreamSegment.svelte';
import { TUNABLES } from '$lib/utils/tunables';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

export function updateIntersectionMonthGroup(timelineManager: PhotostreamManager, month: PhotostreamSegment) {
  const actuallyIntersecting = calculateSegmentIntersecting(timelineManager, month, 0, 0);
  let preIntersecting = false;
  if (!actuallyIntersecting) {
    preIntersecting = calculateSegmentIntersecting(
      timelineManager,
      month,
      INTERSECTION_EXPAND_TOP,
      INTERSECTION_EXPAND_BOTTOM,
    );
  }
  month.updateIntersection({ intersecting: actuallyIntersecting || preIntersecting, actuallyIntersecting });
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

export function calculateSegmentIntersecting(
  timelineManager: PhotostreamManager,
  monthGroup: PhotostreamSegment,
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
 * Calculate intersection for viewer assets with additional parameters like header height
 */
export function calculateViewerAssetIntersecting(
  timelineManager: PhotostreamManager,
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
