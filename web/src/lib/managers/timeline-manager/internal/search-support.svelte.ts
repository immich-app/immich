import { plainDateTimeCompare, type TimelineYearMonth } from '$lib/utils/timeline-util';
import { AssetOrder, type AssetResponseDto } from '@immich/sdk';
import { DateTime } from 'luxon';
import { TimelineManager } from '../timeline-manager.svelte';
import type { TimelineMonth } from '../timeline-month.svelte';
import type { AssetDescriptor, Direction, TimelineAsset } from '../types';

export async function getAssetWithOffset(
  timelineManager: TimelineManager,
  assetDescriptor: AssetDescriptor | AssetResponseDto,
  interval: 'asset' | 'day' | 'month' | 'year' = 'asset',
  direction: Direction,
): Promise<TimelineAsset | undefined> {
  const timelineMonth = await timelineManager.findTimelineMonthForAsset(assetDescriptor);
  if (!timelineMonth) {
    return;
  }
  const asset = timelineMonth.findAssetById(assetDescriptor);
  if (!asset) {
    return;
  }

  switch (interval) {
    case 'asset': {
      return getAssetByAssetOffset(timelineManager, asset, timelineMonth, direction);
    }
    case 'day': {
      return getAssetByDayOffset(timelineManager, asset, timelineMonth, direction);
    }
    case 'month': {
      return getAssetByMonthOffset(timelineManager, timelineMonth, direction);
    }
    case 'year': {
      return getAssetByYearOffset(timelineManager, timelineMonth, direction);
    }
  }
}

export function findTimelineMonthForAsset(timelineManager: TimelineManager, id: string) {
  for (const month of timelineManager.months) {
    const asset = month.findAssetById({ id });
    if (asset) {
      return { timelineMonth: month, asset };
    }
  }
}

export function getTimelineMonthByDate(
  timelineManager: TimelineManager,
  targetYearMonth: TimelineYearMonth,
): TimelineMonth | undefined {
  return timelineManager.months.find(
    (month) => month.yearMonth.year === targetYearMonth.year && month.yearMonth.month === targetYearMonth.month,
  );
}

async function getAssetByAssetOffset(
  timelineManager: TimelineManager,
  asset: TimelineAsset,
  timelineMonth: TimelineMonth,
  direction: Direction,
) {
  const timelineDay = timelineMonth.findTimelineDayForAsset(asset);
  for await (const targetAsset of timelineManager.assetsIterator({
    startTimelineMonth: timelineMonth,
    startTimelineDay: timelineDay,
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
  timelineMonth: TimelineMonth,
  direction: Direction,
) {
  const timelineDay = timelineMonth.findTimelineDayForAsset(asset);
  for await (const targetAsset of timelineManager.assetsIterator({
    startTimelineMonth: timelineMonth,
    startTimelineDay: timelineDay,
    startAsset: asset,
    direction,
  })) {
    if (targetAsset.localDateTime.day !== asset.localDateTime.day) {
      return targetAsset;
    }
  }
}

async function getAssetByMonthOffset(timelineManager: TimelineManager, month: TimelineMonth, direction: Direction) {
  for (const targetMonth of timelineManager.timelineMonthIterator({ startTimelineMonth: month, direction })) {
    if (targetMonth.yearMonth.month !== month.yearMonth.month) {
      const { value, done } = await timelineManager
        .assetsIterator({ startTimelineMonth: targetMonth, direction })
        .next();
      return done ? undefined : value;
    }
  }
}

async function getAssetByYearOffset(timelineManager: TimelineManager, month: TimelineMonth, direction: Direction) {
  for (const targetMonth of timelineManager.timelineMonthIterator({ startTimelineMonth: month, direction })) {
    if (targetMonth.yearMonth.year !== month.yearMonth.year) {
      const { value, done } = await timelineManager
        .assetsIterator({ startTimelineMonth: targetMonth, direction })
        .next();
      return done ? undefined : value;
    }
  }
}

export async function retrieveRange(timelineManager: TimelineManager, start: AssetDescriptor, end: AssetDescriptor) {
  let { asset: startAsset, timelineMonth: startTimelineMonth } =
    findTimelineMonthForAsset(timelineManager, start.id) ?? {};
  if (!startTimelineMonth || !startAsset) {
    return [];
  }
  let { asset: endAsset, timelineMonth: endTimelineMonth } = findTimelineMonthForAsset(timelineManager, end.id) ?? {};
  if (!endTimelineMonth || !endAsset) {
    return [];
  }
  const assetOrder: AssetOrder = timelineManager.getAssetOrder();
  if (plainDateTimeCompare(assetOrder === AssetOrder.Desc, startAsset.localDateTime, endAsset.localDateTime) < 0) {
    [startAsset, endAsset] = [endAsset, startAsset];
    // eslint-disable-next-line no-useless-assignment
    [startTimelineMonth, endTimelineMonth] = [endTimelineMonth, startTimelineMonth];
  }

  const range: TimelineAsset[] = [];
  const startTimelineDay = startTimelineMonth.findTimelineDayForAsset(startAsset);
  for await (const targetAsset of timelineManager.assetsIterator({
    startTimelineMonth,
    startTimelineDay,
    startAsset,
  })) {
    range.push(targetAsset);
    if (targetAsset.id === endAsset.id) {
      break;
    }
  }
  return range;
}

export function findTimelineMonthForDate(timelineManager: TimelineManager, targetYearMonth: TimelineYearMonth) {
  for (const month of timelineManager.months) {
    const { year, month: monthNum } = month.yearMonth;
    if (monthNum === targetYearMonth.month && year === targetYearMonth.year) {
      return month;
    }
  }
}

export function findClosestTimelineMonthForDate(months: TimelineMonth[], targetYearMonth: TimelineYearMonth) {
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
