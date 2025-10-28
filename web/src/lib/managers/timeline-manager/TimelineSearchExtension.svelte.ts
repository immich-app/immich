import type { TimelineManager } from '$lib/managers/timeline-manager/TimelineManager.svelte';
import type { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';
import type { AssetDescriptor, Direction, TimelineAsset } from '$lib/managers/timeline-manager/types';
import { plainDateTimeCompare, type TimelineYearMonth } from '$lib/utils/timeline-util';
import { AssetOrder } from '@immich/sdk';
import { DateTime } from 'luxon';

export class TimelineSearchExtension {
  #timelineManager: TimelineManager;
  constructor(timelineManager: TimelineManager) {
    this.#timelineManager = timelineManager;
  }
  async getAssetWithOffset(
    assetDescriptor: AssetDescriptor,
    interval: 'asset' | 'day' | 'month' | 'year' = 'asset',
    direction: Direction,
  ): Promise<TimelineAsset | undefined> {
    const { asset, month } = this.findMonthForAsset(assetDescriptor.id) ?? {};
    if (!month || !asset) {
      return;
    }

    switch (interval) {
      case 'asset': {
        return this.getAssetByAssetOffset(asset, month, direction);
      }
      case 'day': {
        return this.getAssetByDayOffset(asset, month, direction);
      }
      case 'month': {
        return this.getAssetByMonthOffset(month, direction);
      }
      case 'year': {
        return this.getAssetByYearOffset(month, direction);
      }
    }
  }

  findMonthForAsset(id: string) {
    for (const month of this.#timelineManager.segments) {
      const asset = month.findAssetById({ id });
      if (asset) {
        return { month, asset };
      }
    }
  }

  findMonthByDate(targetYearMonth: TimelineYearMonth): TimelineMonth | undefined {
    return this.#timelineManager.segments.find(
      (month) => month.yearMonth.year === targetYearMonth.year && month.yearMonth.month === targetYearMonth.month,
    );
  }

  async getAssetByAssetOffset(asset: TimelineAsset, month: TimelineMonth, direction: Direction) {
    const day = month.findDayForAsset(asset);
    for await (const targetAsset of this.#timelineManager.assetsIterator({
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

  async getAssetByDayOffset(asset: TimelineAsset, month: TimelineMonth, direction: Direction) {
    const day = month.findDayForAsset(asset);
    for await (const targetAsset of this.#timelineManager.assetsIterator({
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

  async getAssetByMonthOffset(month: TimelineMonth, direction: Direction) {
    for (const targetMonth of this.#timelineManager.monthIterator({ startMonth: month, direction })) {
      if (targetMonth.yearMonth.month !== month.yearMonth.month) {
        const { value, done } = await this.#timelineManager
          .assetsIterator({ startMonth: targetMonth, direction })
          .next();
        return done ? undefined : value;
      }
    }
  }

  async getAssetByYearOffset(month: TimelineMonth, direction: Direction) {
    for (const targetMonth of this.#timelineManager.monthIterator({ startMonth: month, direction })) {
      if (targetMonth.yearMonth.year !== month.yearMonth.year) {
        const { value, done } = await this.#timelineManager
          .assetsIterator({ startMonth: targetMonth, direction })
          .next();
        return done ? undefined : value;
      }
    }
  }

  async retrieveRange(start: AssetDescriptor, end: AssetDescriptor) {
    let { asset: startAsset, month: startMonth } = this.findMonthForAsset(start.id) ?? {};
    if (!startMonth || !startAsset) {
      return [];
    }
    let { asset: endAsset, month: endMonth } = this.findMonthForAsset(end.id) ?? {};
    if (!endMonth || !endAsset) {
      return [];
    }
    const assetOrder: AssetOrder = this.#timelineManager.getAssetOrder();
    if (plainDateTimeCompare(assetOrder === AssetOrder.Desc, startAsset.localDateTime, endAsset.localDateTime) < 0) {
      [startAsset, endAsset] = [endAsset, startAsset];
      [startMonth, endMonth] = [endMonth, startMonth];
    }

    const range: TimelineAsset[] = [];
    const startDay = startMonth.findDayForAsset(startAsset);
    for await (const targetAsset of this.#timelineManager.assetsIterator({
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

  findMonthForDate(targetYearMonth: TimelineYearMonth) {
    for (const month of this.#timelineManager.segments) {
      const { year, month: monthNum } = month.yearMonth;
      if (monthNum === targetYearMonth.month && year === targetYearMonth.year) {
        return month;
      }
    }
  }

  findClosestGroupForDate(months: TimelineMonth[], targetYearMonth: TimelineYearMonth) {
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
}
