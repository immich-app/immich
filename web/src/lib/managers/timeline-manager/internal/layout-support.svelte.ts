import { TimelineManager } from '../timeline-manager.svelte';
import type { TimelineMonth } from '../timeline-month.svelte';
import type { UpdateGeometryOptions } from '../types';

export function updateGeometry(timelineManager: TimelineManager, month: TimelineMonth, options: UpdateGeometryOptions) {
  const { invalidateHeight, noDefer = false } = options;
  if (invalidateHeight) {
    month.isHeightActual = false;
  }
  if (!month.isLoaded) {
    const viewportWidth = timelineManager.viewportWidth;
    // A hidden timeline has no width, and dividing by it would make the height
    // infinite. The height setter would then propagate that as an infinite top
    // to every following month, leaving the whole timeline unpositioned.
    // updateViewportGeometry recomputes the heights once the viewport is back.
    if (!month.isHeightActual && viewportWidth > 0) {
      const unwrappedWidth = (3 / 2) * month.assetsCount * timelineManager.rowHeight * (7 / 10);
      const rows = Math.ceil(unwrappedWidth / viewportWidth);
      const height = timelineManager.headerHeight + Math.max(1, rows) * timelineManager.rowHeight;
      month.height = height;
    }
    return;
  }
  layoutTimelineMonth(timelineManager, month, noDefer);
}

export function layoutTimelineMonth(timelineManager: TimelineManager, month: TimelineMonth, noDefer: boolean = false) {
  let cumulativeHeight = 0;
  let cumulativeWidth = 0;
  let currentRowHeight = 0;

  let timelineDayRow = 0;
  let timelineDayCol = 0;

  const options = timelineManager.justifiedLayoutOptions;
  for (const timelineDay of month.timelineDays) {
    timelineDay.layout(options, noDefer);

    // Calculate space needed for this item (including gap if not first in row)
    const spaceNeeded = timelineDay.width + (timelineDayCol > 0 ? timelineManager.gap : 0);
    const fitsInCurrentRow = cumulativeWidth + spaceNeeded <= timelineManager.viewportWidth;

    if (fitsInCurrentRow) {
      timelineDay.row = timelineDayRow;
      timelineDay.col = timelineDayCol++;
      timelineDay.start = cumulativeWidth;
      timelineDay.top = cumulativeHeight;
    } else {
      // Move to next row
      cumulativeHeight += currentRowHeight;
      cumulativeWidth = 0;
      timelineDayRow++;
      timelineDayCol = 0;

      // Position at start of new row
      timelineDay.row = timelineDayRow;
      timelineDay.col = timelineDayCol;
      timelineDay.start = 0;
      timelineDay.top = cumulativeHeight;

      timelineDayCol++;
    }
    cumulativeWidth += timelineDay.width + timelineManager.gap;
    currentRowHeight = timelineDay.height + timelineManager.headerHeight;
  }

  // Add the height of the final row
  cumulativeHeight += currentRowHeight;

  month.height = cumulativeHeight;
  month.isHeightActual = true;
}
