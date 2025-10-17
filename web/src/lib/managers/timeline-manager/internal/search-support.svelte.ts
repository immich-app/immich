import { TimelineManager } from '$lib/managers/timeline-manager/TimelineManager.svelte';
import { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';
import type { AssetDescriptor, Direction, TimelineAsset } from '$lib/managers/timeline-manager/types';
import { plainDateTimeCompare, type TimelineYearMonth } from '$lib/utils/timeline-util';
import { AssetOrder } from '@immich/sdk';
import { DateTime } from 'luxon';

export async function getAssetWithOffset(
  timelineManager: TimelineManager,
  assetDescriptor: AssetDescriptor,
  interval: 'asset' | 'day' | 'month' | 'year' = 'asset',
  direction: Direction,
): Promise<TimelineAsset | undefined> {
  const { asset, month } = findMonthForAsset(timelineManager, assetDescriptor.id) ?? {};
  if (!month || !asset) {
    return;
  }

  switch (interval) {
    case 'asset': {
      return getAssetByAssetOffset(timelineManager, asset, month, direction);
    }
    case 'day': {
      return getAssetByDayOffset(timelineManager, asset, month, direction);
    }
    case 'month': {
      return getAssetByMonthOffset(timelineManager, month, direction);
    }
    case 'year': {
      return getAssetByYearOffset(timelineManager, month, direction);
    }
  }
}

export function findMonthForAsset(timelineManager: TimelineManager, id: string) {
  for (const month of timelineManager.segments) {
    const asset = month.findAssetById({ id });
    if (asset) {
      return { month, asset };
    }
  }
}

export function getMonthByDate(
  timelineManager: TimelineManager,
  targetYearMonth: TimelineYearMonth,
): TimelineMonth | undefined {
  return timelineManager.segments.find(
    (month) => month.yearMonth.year === targetYearMonth.year && month.yearMonth.month === targetYearMonth.month,
  );
}

async function getAssetByAssetOffset(
  timelineManager: TimelineManager,
  asset: TimelineAsset,
  month: TimelineMonth,
  direction: Direction,
) {
  const day = month.findDayForAsset(asset);
  for await (const targetAsset of timelineManager.assetsIterator({
    startMonth: month,
    startDay: day,
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
  month: TimelineMonth,
  direction: Direction,
) {
  const day = month.findDayForAsset(asset);
  for await (const targetAsset of timelineManager.assetsIterator({
    startMonth: month,
    startDay: day,
    startAsset: asset,
    direction,
  })) {
    if (targetAsset.localDateTime.day !== asset.localDateTime.day) {
      return targetAsset;
    }
  }
}

async function getAssetByMonthOffset(timelineManager: TimelineManager, month: TimelineMonth, direction: Direction) {
  for (const targetMonth of timelineManager.monthIterator({ startMonth: month, direction })) {
    if (targetMonth.yearMonth.month !== month.yearMonth.month) {
      const { value, done } = await timelineManager.assetsIterator({ startMonth: targetMonth, direction }).next();
      return done ? undefined : value;
    }
  }
}

async function getAssetByYearOffset(timelineManager: TimelineManager, month: TimelineMonth, direction: Direction) {
  for (const targetMonth of timelineManager.monthIterator({ startMonth: month, direction })) {
    if (targetMonth.yearMonth.year !== month.yearMonth.year) {
      const { value, done } = await timelineManager.assetsIterator({ startMonth: targetMonth, direction }).next();
      return done ? undefined : value;
    }
  }
}

export async function retrieveRange(timelineManager: TimelineManager, start: AssetDescriptor, end: AssetDescriptor) {
  let { asset: startAsset, month: startMonth } = findMonthForAsset(timelineManager, start.id) ?? {};
  if (!startMonth || !startAsset) {
    return [];
  }
  let { asset: endAsset, month: endMonth } = findMonthForAsset(timelineManager, end.id) ?? {};
  if (!endMonth || !endAsset) {
    return [];
  }
  const assetOrder: AssetOrder = timelineManager.getAssetOrder();
  if (plainDateTimeCompare(assetOrder === AssetOrder.Desc, startAsset.localDateTime, endAsset.localDateTime) < 0) {
    [startAsset, endAsset] = [endAsset, startAsset];
    [startMonth, endMonth] = [endMonth, startMonth];
  }

  const range: TimelineAsset[] = [];
  const startDay = startMonth.findDayForAsset(startAsset);
  for await (const targetAsset of timelineManager.assetsIterator({
    startMonth,
    startDay,
    startAsset,
  })) {
    range.push(targetAsset);
    if (targetAsset.id === endAsset.id) {
      break;
    }
  }
  return range;
}

export function findMonthForDate(timelineManager: TimelineManager, targetYearMonth: TimelineYearMonth) {
  for (const month of timelineManager.segments) {
    const { year, month: monthNum } = month.yearMonth;
    if (monthNum === targetYearMonth.month && year === targetYearMonth.year) {
      return month;
    }
  }
}

export function findClosestGroupForDate(months: TimelineMonth[], targetYearMonth: TimelineYearMonth) {
  const targetDate = DateTime.fromObject({ year: targetYearMonth.year, month: targetYearMonth.month });

  let closestMonth: TimelineMonth | undefined;
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
