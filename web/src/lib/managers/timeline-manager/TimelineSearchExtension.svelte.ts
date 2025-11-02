import { authManager } from '$lib/managers/auth-manager.svelte';
import type { TimelineDay } from '$lib/managers/timeline-manager/TimelineDay.svelte';
import type { TimelineManager } from '$lib/managers/timeline-manager/TimelineManager.svelte';
import type { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';
import type { AssetDescriptor, Direction, TimelineAsset } from '$lib/managers/timeline-manager/types';
import {
  findClosestMonthToDate,
  getSegmentIdentifier,
  plainDateTimeCompare,
  toTimelineAsset,
  type TimelineDateTime,
  type TimelineYearMonth,
} from '$lib/utils/timeline-util';
import { AssetOrder, getAssetInfo } from '@immich/sdk';

export class TimelineSearchExtension {
  #timelineManager: TimelineManager;
  constructor(timelineManager: TimelineManager) {
    this.#timelineManager = timelineManager;
  }

  async getLaterAsset(
    assetDescriptor: AssetDescriptor,
    interval: 'asset' | 'day' | 'month' | 'year' = 'asset',
  ): Promise<TimelineAsset | undefined> {
    return await this.#getAssetWithOffset(assetDescriptor, interval, 'later');
  }

  async getEarlierAsset(
    assetDescriptor: AssetDescriptor,
    interval: 'asset' | 'day' | 'month' | 'year' = 'asset',
  ): Promise<TimelineAsset | undefined> {
    return await this.#getAssetWithOffset(assetDescriptor, interval, 'earlier');
  }

  async getMonthForAsset(id: string) {
    if (!this.#timelineManager.isInitialized) {
      await this.#timelineManager.initTask.waitUntilCompletion();
    }

    let { month } = this.findMonthForAsset(id) ?? {};
    if (month) {
      return month;
    }

    const response = await getAssetInfo({ ...authManager.params, id }).catch(() => null);
    if (!response) {
      return;
    }

    const asset = toTimelineAsset(response);
    if (!asset || this.#timelineManager.isExcluded(asset)) {
      return;
    }

    month = await this.#loadMonthAtTime(asset.localDateTime, { cancelable: false });
    if (month?.findAssetById({ id })) {
      return month;
    }
  }

  async #loadMonthAtTime(yearMonth: TimelineYearMonth, options?: { cancelable: boolean }) {
    await this.#timelineManager.loadSegment(getSegmentIdentifier(yearMonth), options);
    return this.findMonthByDate(yearMonth);
  }

  async #getAssetWithOffset(
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
        return this.#getAssetByAssetOffset(asset, month, direction);
      }
      case 'day': {
        return this.#getAssetByDayOffset(asset, month, direction);
      }
      case 'month': {
        return this.#getAssetByMonthOffset(month, direction);
      }
      case 'year': {
        return this.#getAssetByYearOffset(month, direction);
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

  // note: the `index` input is expected to be in the range [0, assetCount). This
  // value can be passed to make the method deterministic, which is mainly useful
  // for testing.
  async getRandomAsset(index?: number): Promise<TimelineAsset | undefined> {
    const randomAssetIndex = index ?? Math.floor(Math.random() * this.#timelineManager.assetCount);

    let accumulatedCount = 0;

    let randomMonth: TimelineMonth | undefined = undefined;
    for (const month of this.#timelineManager.segments) {
      if (randomAssetIndex < accumulatedCount + month.assetsCount) {
        randomMonth = month;
        break;
      }

      accumulatedCount += month.assetsCount;
    }
    if (!randomMonth) {
      return;
    }
    await this.#timelineManager.loadSegment(getSegmentIdentifier(randomMonth.yearMonth), { cancelable: false });

    let randomDay: TimelineDay | undefined = undefined;
    for (const day of randomMonth.days) {
      if (randomAssetIndex < accumulatedCount + day.viewerAssets.length) {
        randomDay = day;
        break;
      }

      accumulatedCount += day.viewerAssets.length;
    }
    if (!randomDay) {
      return;
    }

    return randomDay.viewerAssets[randomAssetIndex - accumulatedCount].asset;
  }

  async #getAssetByAssetOffset(asset: TimelineAsset, month: TimelineMonth, direction: Direction) {
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

  async #getAssetByDayOffset(asset: TimelineAsset, month: TimelineMonth, direction: Direction) {
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

  async #getAssetByMonthOffset(month: TimelineMonth, direction: Direction) {
    for (const targetMonth of this.#timelineManager.monthIterator({ startMonth: month, direction })) {
      if (targetMonth.yearMonth.month !== month.yearMonth.month) {
        const { value, done } = await this.#timelineManager
          .assetsIterator({ startMonth: targetMonth, direction })
          .next();
        return done ? undefined : value;
      }
    }
  }

  async #getAssetByYearOffset(month: TimelineMonth, direction: Direction) {
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

  async getClosestAssetToDate(dateTime: TimelineDateTime) {
    let month = this.findMonthForDate(dateTime);
    if (!month) {
      month = findClosestMonthToDate(this.#timelineManager.segments, dateTime);
      if (!month) {
        return;
      }
    }
    await this.#timelineManager.loadSegment(getSegmentIdentifier(dateTime), { cancelable: false });
    const asset = month.findClosest(dateTime);
    if (asset) {
      return asset;
    }
    for await (const asset of this.#timelineManager.assetsIterator({ startMonth: month })) {
      return asset;
    }
  }
}
