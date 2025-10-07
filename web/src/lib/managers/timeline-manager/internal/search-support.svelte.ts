import { plainDateTimeCompare, type TimelineYearMonth } from '$lib/utils/timeline-util';
import { AssetOrder } from '@immich/sdk';
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

export interface MonthGroupForSearch {
  yearMonth: TimelineYearMonth;
  top: number;
  height: number;
}

export interface BinarySearchResult {
  month: TimelineYearMonth;
  monthScrollPercent: number;
}

export function findMonthAtScrollPosition(
  months: MonthGroupForSearch[],
  scrollPosition: number,
  maxScrollPercent: number,
): BinarySearchResult | null {
  const SUBPIXEL_TOLERANCE = -1; // Tolerance for scroll position checks
  const NEAR_END_THRESHOLD = 0.9999; // Threshold for detecting near-end of month

  if (months.length === 0) {
    return null;
  }

  // Check if we're before the first month
  const firstMonthTop = months[0].top * maxScrollPercent;
  if (scrollPosition < firstMonthTop - SUBPIXEL_TOLERANCE) {
    return null;
  }

  // Check if we're after the last month
  const lastMonth = months.at(-1)!;
  const lastMonthBottom = (lastMonth.top + lastMonth.height) * maxScrollPercent;
  if (scrollPosition >= lastMonthBottom - SUBPIXEL_TOLERANCE) {
    return null;
  }

  // Binary search to find the month containing the scroll position
  let left = 0;
  let right = months.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const month = months[mid];
    const monthTop = month.top * maxScrollPercent;
    const monthBottom = monthTop + month.height * maxScrollPercent;

    if (scrollPosition >= monthTop - SUBPIXEL_TOLERANCE && scrollPosition < monthBottom - SUBPIXEL_TOLERANCE) {
      // Found the month containing the scroll position
      const distanceIntoMonth = scrollPosition - monthTop;
      const monthScrollPercent = Math.max(0, distanceIntoMonth / (month.height * maxScrollPercent));

      // Handle month boundary edge case
      if (monthScrollPercent > NEAR_END_THRESHOLD && mid < months.length - 1) {
        return {
          month: months[mid + 1].yearMonth,
          monthScrollPercent: 0,
        };
      }

      return {
        month: month.yearMonth,
        monthScrollPercent,
      };
    }

    if (scrollPosition < monthTop) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  // Shouldn't reach here, but return null if we do
  return null;
}
