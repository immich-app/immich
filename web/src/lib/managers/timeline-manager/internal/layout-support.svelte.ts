import type { MonthGroup } from '../month-group.svelte';
import type { TimelineManager } from '../timeline-manager.svelte';
import type { UpdateGeometryOptions } from '../types';

export function updateGeometry(
  timelineManager: TimelineManager,
  month: MonthGroup,
  options: UpdateGeometryOptions,
) {
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
  layoutMonthGroup(timelineManager, month, noDefer);
}

export function layoutMonthGroup(timelineManager: TimelineManager, month: MonthGroup, noDefer: boolean = false) {
  let cummulativeHeight = 0;
  let cummulativeWidth = 0;
  let lastRowHeight = 0;
  let lastRow = 0;

  let dayGroupRow = 0;
  let dayGroupCol = 0;

  const rowSpaceRemaining: number[] = Array.from({ length: month.dayGroups.length });
  rowSpaceRemaining.fill(timelineManager.viewportWidth, 0, month.dayGroups.length);
  const options = timelineManager.createLayoutOptions();
  for (const assetGroup of month.dayGroups) {
    assetGroup.layout(options, noDefer);
    rowSpaceRemaining[dayGroupRow] -= assetGroup.width - 1;
    if (dayGroupCol > 0) {
      rowSpaceRemaining[dayGroupRow] -= timelineManager.gap;
    }
    if (rowSpaceRemaining[dayGroupRow] >= 0) {
      assetGroup.row = dayGroupRow;
      assetGroup.col = dayGroupCol;
      assetGroup.left = cummulativeWidth;
      assetGroup.top = cummulativeHeight;

      dayGroupCol++;

      cummulativeWidth += assetGroup.width + timelineManager.gap;
    } else {
      cummulativeWidth = 0;
      dayGroupRow++;
      dayGroupCol = 0;
      assetGroup.row = dayGroupRow;
      assetGroup.col = dayGroupCol;
      assetGroup.left = cummulativeWidth;

      rowSpaceRemaining[dayGroupRow] -= assetGroup.width;
      dayGroupCol++;
      cummulativeHeight += lastRowHeight;
      assetGroup.top = cummulativeHeight;
      cummulativeWidth += assetGroup.width + timelineManager.gap;
      lastRow = assetGroup.row - 1;
    }
    lastRowHeight = assetGroup.height + timelineManager.headerHeight;
  }
  if (lastRow === 0 || lastRow !== month.lastDayGroup?.row) {
    cummulativeHeight += lastRowHeight;
  }

  month.height = cummulativeHeight;
  month.isHeightActual = true;
}