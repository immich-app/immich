import { TUNABLES } from '$lib/utils/tunables';
import type { MonthGroup } from '../month-group.svelte';
import type { TimelineManager } from '../timeline-manager.svelte';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

export function updateIntersection(timelineManager: TimelineManager, month: MonthGroup) {
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

  return (
    (monthGroupTop >= topWindow && monthGroupTop < bottomWindow) ||
    (monthGroupBottom >= topWindow && monthGroupBottom < bottomWindow) ||
    (monthGroupTop < topWindow && monthGroupBottom >= bottomWindow)
  );
}
