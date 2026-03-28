import { TUNABLES } from '$lib/utils/tunables';
import type { MonthGroup } from '../month-group.svelte';
import { TimelineManager } from '../timeline-manager.svelte';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

export function isIntersecting(regionTop: number, regionBottom: number, otherTop: number, otherBottom: number) {
  return (
    (regionTop >= otherTop && regionTop < otherBottom) ||
    (regionBottom >= otherTop && regionBottom < otherBottom) ||
    (regionTop < otherTop && regionBottom >= otherBottom)
  );
}

export enum ViewportProximity {
  FarFromViewport,
  NearViewport,
  InViewport,
}

export function isInViewport(state: ViewportProximity): boolean {
  return state === ViewportProximity.InViewport;
}

export function isInOrNearViewport(state: ViewportProximity): boolean {
  return state !== ViewportProximity.FarFromViewport;
}

function calculateViewportProximity(regionTop: number, regionBottom: number, windowTop: number, windowBottom: number) {
  if (regionBottom < windowTop - INTERSECTION_EXPAND_TOP || regionTop >= windowBottom + INTERSECTION_EXPAND_BOTTOM) {
    return ViewportProximity.FarFromViewport;
  }

  if (regionBottom < windowTop || regionTop >= windowBottom) {
    return ViewportProximity.NearViewport;
  }

  return ViewportProximity.InViewport;
}

export function updateMonthGroupViewportProximity(timelineManager: TimelineManager, month: MonthGroup) {
  const proximity = calculateViewportProximity(
    month.top,
    month.top + month.height,
    timelineManager.visibleWindow.top,
    timelineManager.visibleWindow.bottom,
  );

  month.viewportProximity = proximity;
  if (isInOrNearViewport(proximity)) {
    timelineManager.clearDeferredLayout(month);
  }
}

export function calculateViewerAssetViewportProximity(
  timelineManager: TimelineManager,
  positionTop: number,
  positionHeight: number,
) {
  const headerHeight = timelineManager.headerHeight;
  return calculateViewportProximity(
    positionTop,
    positionTop + positionHeight,
    timelineManager.visibleWindow.top - headerHeight,
    timelineManager.visibleWindow.bottom + headerHeight,
  );
}
