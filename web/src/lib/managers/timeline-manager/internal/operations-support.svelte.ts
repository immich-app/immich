import { setDifference, type TimelinePlainDate } from '$lib/utils/timeline-util';
import { AssetOrder } from '@immich/sdk';

import { GroupInsertionCache } from '../group-insertion-cache.svelte';
import { MonthGroup } from '../month-group.svelte';
import type { TimelineManager } from '../timeline-manager.svelte';
import type { AssetOperation, TimelineAsset } from '../types';
import { updateGeometry } from './layout-support.svelte';
import { getMonthGroupByDate } from './search-support.svelte';

export function addAssetsToMonthGroups(
  timelineManager: TimelineManager,
  assets: TimelineAsset[],
  options: { order: AssetOrder },
) {
  if (assets.length === 0) {
    return;
  }

  const addContext = new GroupInsertionCache();
  const updatedMonthGroups = new Set<MonthGroup>();
  const monthCount = timelineManager.months.length;
  for (const asset of assets) {
    let month = getMonthGroupByDate(timelineManager, asset.localDateTime);

    if (!month) {
      month = new MonthGroup(timelineManager, asset.localDateTime, 1, options.order);
      month.isLoaded = true;
      timelineManager.months.push(month);
    }

    month.addTimelineAsset(asset, addContext);
    updatedMonthGroups.add(month);
  }

  if (timelineManager.months.length !== monthCount) {
    timelineManager.months.sort((a, b) => {
      return a.yearMonth.year === b.yearMonth.year
        ? b.yearMonth.month - a.yearMonth.month
        : b.yearMonth.year - a.yearMonth.year;
    });
  }

  for (const group of addContext.existingDayGroups) {
    group.sortAssets(options.order);
  }

  for (const monthGroup of addContext.bucketsWithNewDayGroups) {
    monthGroup.sortDayGroups();
  }

  for (const month of addContext.updatedBuckets) {
    month.sortDayGroups();
    updateGeometry(timelineManager, month, { invalidateHeight: true });
  }
  timelineManager.updateIntersections();
}

export function runAssetOperation(
  timelineManager: TimelineManager,
  ids: Set<string>,
  operation: AssetOperation,
  options: { order: AssetOrder },
) {
  if (ids.size === 0) {
    return { processedIds: new Set(), unprocessedIds: ids, changedGeometry: false };
  }

  const changedMonthGroups = new Set<MonthGroup>();
  let idsToProcess = new Set(ids);
  const idsProcessed = new Set<string>();
  const combinedMoveAssets: { asset: TimelineAsset; date: TimelinePlainDate }[][] = [];
  for (const month of timelineManager.months) {
    if (idsToProcess.size > 0) {
      const { moveAssets, processedIds, changedGeometry } = month.runAssetOperation(idsToProcess, operation);
      if (moveAssets.length > 0) {
        combinedMoveAssets.push(moveAssets);
      }
      idsToProcess = setDifference(idsToProcess, processedIds);
      for (const id of processedIds) {
        idsProcessed.add(id);
      }
      if (changedGeometry) {
        changedMonthGroups.add(month);
      }
    }
  }
  if (combinedMoveAssets.length > 0) {
    addAssetsToMonthGroups(
      timelineManager,
      combinedMoveAssets.flat().map((a) => a.asset),
      options,
    );
  }
  const changedGeometry = changedMonthGroups.size > 0;
  for (const month of changedMonthGroups) {
    updateGeometry(timelineManager, month, { invalidateHeight: true });
  }
  if (changedGeometry) {
    timelineManager.updateIntersections();
  }
  return { unprocessedIds: idsToProcess, processedIds: idsProcessed, changedGeometry };
}
