import { TimelineManager } from '$lib/managers/timeline-manager/TimelineManager.svelte';
import { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';
import type { UpdateGeometryOptions } from '$lib/managers/timeline-manager/types';

export function updateGeometry(timelineManager: TimelineManager, month: TimelineMonth, options: UpdateGeometryOptions) {
  const { invalidateHeight, noDefer = false } = options;
  if (invalidateHeight) {
    month.isHeightActual = false;
  }
  if (!month.isLoaded) {
    const viewportWidth = timelineManager.viewportWidth;
    if (!month.isHeightActual) {
      const unwrappedWidth = (3 / 2) * month.assetsCount * timelineManager.rowHeight * (7 / 10);
      const rows = Math.ceil(unwrappedWidth / viewportWidth);
      const height = 51 + Math.max(1, rows) * timelineManager.rowHeight;
      month.height = height;
    }
    return;
  }
  layoutMonth(timelineManager, month, noDefer);
}

export function layoutMonth(timelineManager: TimelineManager, month: TimelineMonth, noDefer: boolean = false) {
  let cumulativeHeight = 0;
  let cumulativeWidth = 0;
  let currentRowHeight = 0;

  let dayRow = 0;
  let dayCol = 0;

  const options = timelineManager.justifiedLayoutOptions;
  for (const day of month.days) {
    day.layout(options, noDefer);

    // Calculate space needed for this item (including gap if not first in row)
    const spaceNeeded = day.width + (dayCol > 0 ? timelineManager.gap : 0);
    const fitsInCurrentRow = cumulativeWidth + spaceNeeded <= timelineManager.viewportWidth;

    if (fitsInCurrentRow) {
      day.row = dayRow;
      day.col = dayCol++;
      day.left = cumulativeWidth;
      day.top = cumulativeHeight;

      cumulativeWidth += day.width + timelineManager.gap;
    } else {
      // Move to next row
      cumulativeHeight += currentRowHeight;
      cumulativeWidth = 0;
      dayRow++;
      dayCol = 0;

      // Position at start of new row
      day.row = dayRow;
      day.col = dayCol;
      day.left = 0;
      day.top = cumulativeHeight;

      dayCol++;
      cumulativeWidth += day.width + timelineManager.gap;
    }
    currentRowHeight = day.height + timelineManager.headerHeight;
  }

  // Add the height of the final row
  cumulativeHeight += currentRowHeight;

  month.height = cumulativeHeight;
  month.isHeightActual = true;
}
