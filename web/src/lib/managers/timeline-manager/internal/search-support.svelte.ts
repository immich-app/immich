import type { TimelineYearMonth } from '#lib/utils/timeline-util.ts';
import type { AssetResponseDto } from '@immich/sdk';
import { DateTime } from 'luxon';
import { SvelteSet } from 'svelte/reactivity';
import { TimelineManager } from '../timeline-manager.svelte';
import type { TimelineMonth } from '../timeline-month.svelte';
import type { AssetDescriptor, AssetRangeEndpoint, Direction, TimelineAsset } from '../types';

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

export async function retrieveRange(
  timelineManager: TimelineManager,
  start: AssetRangeEndpoint,
  end: AssetRangeEndpoint,
) {
  const positions = [];
  for (const id of new SvelteSet([start.id, start.lastId ?? start.id, end.id, end.lastId ?? end.id])) {
    const match = findTimelineMonthForAsset(timelineManager, id);
    const timelineDay = match?.timelineMonth.findTimelineDayForAsset(match.asset);
    if (!match || !timelineDay) {
      return [];
    }

    const { asset, timelineMonth } = match;
    positions.push({
      asset,
      timelineMonth,
      timelineDay,
      monthIndex: timelineManager.months.indexOf(timelineMonth),
      dayIndex: timelineMonth.timelineDays.indexOf(timelineDay),
      assetIndex: timelineDay.viewerAssets.findIndex((viewerAsset) => viewerAsset.id === id),
    });
  }
  positions.sort((a, b) => a.monthIndex - b.monthIndex || a.dayIndex - b.dayIndex || a.assetIndex - b.assetIndex);
  const first = positions[0];
  const last = positions.at(-1);
  if (!last) {
    return [];
  }

  const range: TimelineAsset[] = [];
  for await (const targetAsset of timelineManager.assetsIterator({
    startTimelineMonth: first.timelineMonth,
    startTimelineDay: first.timelineDay,
    startAsset: first.asset,
  })) {
    range.push(targetAsset);
    if (targetAsset.id === last.asset.id) {
      return range;
    }
  }
  return [];
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

    if (totalDiff >= minDifference) {
      continue;
    }

    minDifference = totalDiff;
    closestMonth = month;
  }

  return closestMonth;
}
