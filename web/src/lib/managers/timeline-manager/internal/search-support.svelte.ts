import { plainDateTimeCompare, type TimelineYearMonth } from '$lib/utils/timeline-util';
import { AssetOrder, type AssetResponseDto } from '@immich/sdk';
import { DateTime } from 'luxon';
import type { MonthGroup } from '../month-group.svelte';
import { TimelineManager } from '../timeline-manager.svelte';
import type { AssetDescriptor, Direction, TimelineAsset } from '../types';

export async function getAssetWithOffset(
  timelineManager: TimelineManager,
  assetDescriptor: AssetDescriptor | AssetResponseDto,
  interval: 'asset' | 'day' | 'month' | 'year' = 'asset',
  direction: Direction,
): Promise<TimelineAsset | undefined> {
  const monthGroup = await timelineManager.findMonthGroupForAsset(assetDescriptor);
  if (!monthGroup) {
    return;
  }
  const asset = monthGroup.findAssetById(assetDescriptor);
  if (!asset) {
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

export function findMonthGroupForAsset(timelineManager: TimelineManager, id: string) {
  for (const month of timelineManager.months) {
    const asset = month.findAssetById({ id });
    if (asset) {
      return { monthGroup: month, asset };
    }
  }
}

export function getMonthGroupByDate(
  timelineManager: TimelineManager,
  targetYearMonth: TimelineYearMonth,
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
    if (asset.id !== targetAsset.id) {
      return targetAsset;
    }
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
      const { value, done } = await timelineManager.assetsIterator({ startMonthGroup: targetMonth, direction }).next();
      return done ? undefined : value;
    }
  }
}

async function getAssetByYearOffset(timelineManager: TimelineManager, month: MonthGroup, direction: Direction) {
  for (const targetMonth of timelineManager.monthGroupIterator({ startMonthGroup: month, direction })) {
    if (targetMonth.yearMonth.year !== month.yearMonth.year) {
      const { value, done } = await timelineManager.assetsIterator({ startMonthGroup: targetMonth, direction }).next();
      return done ? undefined : value;
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
  const assetOrder: AssetOrder = timelineManager.getAssetOrder();
  if (plainDateTimeCompare(assetOrder === AssetOrder.Desc, startAsset.localDateTime, endAsset.localDateTime) < 0) {
    [startAsset, endAsset] = [endAsset, startAsset];
    [startMonthGroup, endMonthGroup] = [endMonthGroup, startMonthGroup];
  }

  const range: TimelineAsset[] = [];
  const startDayGroup = startMonthGroup.findDayGroupForAsset(startAsset);
  for await (const targetAsset of timelineManager.assetsIterator({
    startMonthGroup,
    startDayGroup,
    startAsset,
  })) {
    range.push(targetAsset);
    if (targetAsset.id === endAsset.id) {
      break;
    }
  }
  return range;
}

export function findMonthGroupForDate(timelineManager: TimelineManager, targetYearMonth: TimelineYearMonth) {
  for (const month of timelineManager.months) {
    const { year, month: monthNum } = month.yearMonth;
    if (monthNum === targetYearMonth.month && year === targetYearMonth.year) {
      return month;
    }
  }
}

export function findClosestGroupForDate(months: MonthGroup[], targetYearMonth: TimelineYearMonth) {
  const targetDate = DateTime.fromObject({ year: targetYearMonth.year, month: targetYearMonth.month });

  let closestMonth: MonthGroup | undefined;
  let minDifference = Number.MAX_SAFE_INTEGER;

  for (const month of months) {
    const monthDate = DateTime.fromObject({ year: month.yearMonth.year, month: month.yearMonth.month });
    const totalDiff = Math.abs(monthDate.diff(targetDate, 'months').months);

    if (totalDiff < minDifference) {
      minDifference = totalDiff;
      closestMonth = month;
    }
  }

  return closestMonth;
}
