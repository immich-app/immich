import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
import type { MonthGroup } from '../month-group.svelte';

export function layoutMonthGroup(timelineManager: TimelineManager, month: MonthGroup, noDefer: boolean = false) {
  let cumulativeHeight = 0;
  let cumulativeWidth = 0;
  let currentRowHeight = 0;

  let dayGroupRow = 0;
  let dayGroupCol = 0;

  const options = timelineManager.createLayoutOptions();
  for (const dayGroup of month.dayGroups) {
    dayGroup.layout(options, noDefer);

    // Calculate space needed for this item (including gap if not first in row)
    const spaceNeeded = dayGroup.width + (dayGroupCol > 0 ? timelineManager.gap : 0);
    const fitsInCurrentRow = cumulativeWidth + spaceNeeded <= timelineManager.viewportWidth;

    if (fitsInCurrentRow) {
      dayGroup.row = dayGroupRow;
      dayGroup.col = dayGroupCol++;
      dayGroup.left = cumulativeWidth;
      dayGroup.top = cumulativeHeight;

      cumulativeWidth += dayGroup.width + timelineManager.gap;
    } else {
      // Move to next row
      cumulativeHeight += currentRowHeight;
      cumulativeWidth = 0;
      dayGroupRow++;
      dayGroupCol = 0;

      // Position at start of new row
      dayGroup.row = dayGroupRow;
      dayGroup.col = dayGroupCol;
      dayGroup.left = 0;
      dayGroup.top = cumulativeHeight;

      dayGroupCol++;
      cumulativeWidth += dayGroup.width + timelineManager.gap;
    }
    currentRowHeight = dayGroup.height + timelineManager.headerHeight;
  }

  // Add the height of the final row
  cumulativeHeight += currentRowHeight;

  month.height = cumulativeHeight;
  month.isHeightActual = true;
}
