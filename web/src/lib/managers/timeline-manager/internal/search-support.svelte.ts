import { plainDateTimeCompare, type TimelinePlainYearMonth } from '$lib/utils/timeline-util';
import type { MonthGroup } from '../month-group.svelte';
import type { TimelineManager } from '../timeline-manager.svelte';
import type { AssetDescriptor, Direction, TimelineAsset } from '../types';

export async function getAssetWithOffset(
  timelineManager: TimelineManager,
  assetDescriptor: AssetDescriptor,
  interval: 'asset' | 'day' | 'month' | 'year' = 'asset',
  direction: Direction,
): Promise<TimelineAsset | undefined> {
  const { asset, monthGroup } = findMonthGroupForAsset(timelineManager, assetDescriptor.id) ?? {};
  if (!monthGroup || !asset) {
    return;
  }

  switch (interval) {
    case 'asset': {
      return getAssetByAssetOffset(timelineManager, asset, monthGroup, direction);
    }
    case 'day': {
      return getAssetByDayOffset(timelineManager, asset, monthGroup, direction);
    }
    case 'month': {
      return getAssetByMonthOffset(timelineManager, monthGroup, direction);
    }
    case 'year': {
      return getAssetByYearOffset(timelineManager, monthGroup, direction);
    }
  }
}

function findMonthGroupForAsset(timelineManager: TimelineManager, id: string) {
  for (const month of timelineManager.months) {
    const asset = month.findAssetById({ id });
    if (asset) {
      return { monthGroup: month, asset };
    }
  }
}

export function getMonthGroupByDate(
  timelineManager: TimelineManager,
  targetYearMonth: TimelinePlainYearMonth,
): MonthGroup | undefined {
  return timelineManager.months.find(
    (month) => month.yearMonth.year === targetYearMonth.year && month.yearMonth.month === targetYearMonth.month,
  );
}

async function getAssetByAssetOffset(
  timelineManager: TimelineManager,
  asset: TimelineAsset,
  monthGroup: MonthGroup,
  direction: Direction,
) {
  const dayGroup = monthGroup.findDayGroupForAsset(asset);
  for await (const targetAsset of timelineManager.assetsIterator({
    startMonthGroup: monthGroup,
    startDayGroup: dayGroup,
    startAsset: asset,
    direction,
  })) {
    if (asset.id === targetAsset.id) {
      continue;
    }
    return targetAsset;
  }
}

async function getAssetByDayOffset(
  timelineManager: TimelineManager,
  asset: TimelineAsset,
  monthGroup: MonthGroup,
  direction: Direction,
) {
  const dayGroup = monthGroup.findDayGroupForAsset(asset);
  for await (const targetAsset of timelineManager.assetsIterator({
    startMonthGroup: monthGroup,
    startDayGroup: dayGroup,
    startAsset: asset,
    direction,
  })) {
    if (targetAsset.localDateTime.day !== asset.localDateTime.day) {
      return targetAsset;
    }
  }
}

async function getAssetByMonthOffset(timelineManager: TimelineManager, month: MonthGroup, direction: Direction) {
  for (const targetMonth of timelineManager.monthGroupIterator({ startMonthGroup: month, direction })) {
    if (targetMonth.yearMonth.month !== month.yearMonth.month) {
      for await (const targetAsset of timelineManager.assetsIterator({ startMonthGroup: targetMonth, direction })) {
        return targetAsset;
      }
    }
  }
}

async function getAssetByYearOffset(timelineManager: TimelineManager, month: MonthGroup, direction: Direction) {
  for (const targetMonth of timelineManager.monthGroupIterator({ startMonthGroup: month, direction })) {
    if (targetMonth.yearMonth.year !== month.yearMonth.year) {
      for await (const targetAsset of timelineManager.assetsIterator({ startMonthGroup: targetMonth, direction })) {
        return targetAsset;
      }
    }
  }
}

export async function retrieveRange(timelineManager: TimelineManager, start: AssetDescriptor, end: AssetDescriptor) {
  let { asset: startAsset, monthGroup: startMonthGroup } = findMonthGroupForAsset(timelineManager, start.id) ?? {};
  if (!startMonthGroup || !startAsset) {
    return [];
  }
  let { asset: endAsset, monthGroup: endMonthGroup } = findMonthGroupForAsset(timelineManager, end.id) ?? {};
  if (!endMonthGroup || !endAsset) {
    return [];
  }
  let direction: Direction = 'earlier';
  if (plainDateTimeCompare(true, startAsset.localDateTime, endAsset.localDateTime) < 0) {
    [startAsset, endAsset] = [endAsset, startAsset];
    [startMonthGroup, endMonthGroup] = [endMonthGroup, startMonthGroup];
    direction = 'earlier';
  }

  const range: TimelineAsset[] = [];
  const startDayGroup = startMonthGroup.findDayGroupForAsset(startAsset);
  for await (const targetAsset of timelineManager.assetsIterator({
    startMonthGroup,
    startDayGroup,
    startAsset,
    direction,
  })) {
    range.push(targetAsset);
    if (targetAsset.id === endAsset.id) {
      break;
    }
  }
  return range;
}

export function findMonthGroupForDate(timelineManager: TimelineManager, targetYearMonth: TimelinePlainYearMonth) {
  for (const month of timelineManager.months) {
    const { year, month: monthNum } = month.yearMonth;
    if (monthNum === targetYearMonth.month && year === targetYearMonth.year) {
      return month;
    }
  }
}
