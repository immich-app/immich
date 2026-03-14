/* eslint-disable unicorn/prefer-math-trunc */
import { TUNABLES } from '$lib/utils/tunables';
import type { MonthGroup } from '../month-group.svelte';
import { TimelineManager } from '../timeline-manager.svelte';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

/**
 * General function to check if a rectangular region intersects with another regtangular region.
 */
export function isIntersecting(regionTop: number, regionBottom: number, otherTop: number, otherBottom: number) {
  return (
    (regionTop >= otherTop && regionTop < otherBottom) ||
    (regionBottom >= otherTop && regionBottom < otherBottom) ||
    (regionTop < otherTop && regionBottom >= otherBottom)
  );
}

const NEARBY = 1 << 0;
const VISIBLE = 1 << 1;

export const IntersectionFlags = {
  NONE: 0,
  NEARBY,
  VISIBLE,
  RENDERABLE: NEARBY | VISIBLE,
} as const;

export type IntersectionFlag = (typeof IntersectionFlags)[keyof typeof IntersectionFlags];

export function isVisible(flag: number): boolean {
  return (flag & IntersectionFlags.VISIBLE) !== 0;
}

export function isRenderable(flag: number): boolean {
  return (flag & IntersectionFlags.RENDERABLE) !== 0;
}

function calculateIntersection(regionTop: number, regionBottom: number, windowTop: number, windowBottom: number) {
  if (regionBottom < windowTop - INTERSECTION_EXPAND_TOP || regionTop >= windowBottom + INTERSECTION_EXPAND_BOTTOM) {
    return IntersectionFlags.NONE;
  }

  if (regionBottom < windowTop || regionTop >= windowBottom) {
    return IntersectionFlags.NEARBY;
  }

  return IntersectionFlags.VISIBLE;
}

export function updateIntersectionMonthGroup(timelineManager: TimelineManager, month: MonthGroup) {
  const intersection = calculateIntersection(
    month.top,
    month.top + month.height,
    timelineManager.visibleWindow.top,
    timelineManager.visibleWindow.bottom,
  );

  month.intersection = intersection;
  if (isRenderable(intersection)) {
    timelineManager.clearDeferredLayout(month);
  }
}

export function calculateViewerAssetIntersecting(
  timelineManager: TimelineManager,
  positionTop: number,
  positionHeight: number,
) {
  const headerHeight = timelineManager.headerHeight;
  return calculateIntersection(
    positionTop,
    positionTop + positionHeight,
    timelineManager.visibleWindow.top - headerHeight,
    timelineManager.visibleWindow.bottom + headerHeight,
  );
}
