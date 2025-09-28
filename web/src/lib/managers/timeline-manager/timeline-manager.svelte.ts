import { AssetOrder, getAssetInfo, getTimeBuckets } from '@immich/sdk';

import { authManager } from '$lib/managers/auth-manager.svelte';

import { CancellableTask } from '$lib/utils/cancellable-task';
import {
  getSegmentIdentifier,
  toTimelineAsset,
  type TimelineDateTime,
  type TimelineYearMonth,
} from '$lib/utils/timeline-util';

import { isEqual } from 'lodash-es';
import { SvelteDate, SvelteMap, SvelteSet } from 'svelte/reactivity';

import { PhotostreamManager } from '$lib/managers/photostream-manager/PhotostreamManager.svelte';
import { updateGeometry } from '$lib/managers/timeline-manager/internal/layout-support.svelte';
import {
  addAssetsToMonthGroups,
  runAssetOperation,
} from '$lib/managers/timeline-manager/internal/operations-support.svelte';
import {
  findMonthGroupForAsset as findMonthGroupForAssetUtil,
  findMonthGroupForDate,
  getAssetWithOffset,
  getMonthGroupByDate,
  retrieveRange as retrieveRangeUtil,
} from '$lib/managers/timeline-manager/internal/search-support.svelte';
import { WebsocketSupport } from '$lib/managers/timeline-manager/internal/websocket-support.svelte';
import { DayGroup } from './day-group.svelte';
import { isMismatched, updateObject } from './internal/utils.svelte';
import { MonthGroup } from './month-group.svelte';
import type {
  AssetDescriptor,
  AssetOperation,
  Direction,
  ScrubberMonth,
  TimelineAsset,
  TimelineManagerOptions,
} from './types';

export class TimelineManager extends PhotostreamManager {
  albumAssets: Set<string> = new SvelteSet();
  scrubberMonths: ScrubberMonth[] = $state([]);
  scrubberTimelineHeight: number = $state(0);
  #months: MonthGroup[] = $state([]);

  initTask = new CancellableTask(
    () => {
      this.isInitialized = true;
      if (this.#options.albumId || this.#options.personId) {
        return;
      }
      this.connect();
    },
    () => {
      this.disconnect();
      this.isInitialized = false;
    },
    () => void 0,
  );

  static #INIT_OPTIONS = {};

  #websocketSupport: WebsocketSupport | undefined;
  #options: TimelineManagerOptions = TimelineManager.#INIT_OPTIONS;

  get months() {
    return this.#months;
  }

  get options() {
    return this.#options;
  }

  async *assetsIterator(options?: {
    startMonthGroup?: MonthGroup;
    startDayGroup?: DayGroup;
    startAsset?: TimelineAsset;
    direction?: Direction;
  }) {
    const direction = options?.direction ?? 'earlier';
    let { startDayGroup, startAsset } = options ?? {};
    for (const monthGroup of this.monthGroupIterator({ direction, startMonthGroup: options?.startMonthGroup })) {
      await this.loadSegment(monthGroup.identifier, { cancelable: false });
      yield* monthGroup.assetsIterator({ startDayGroup, startAsset, direction });
      startDayGroup = startAsset = undefined;
    }
  }

  *monthGroupIterator(options?: { direction?: Direction; startMonthGroup?: MonthGroup }) {
    const isEarlier = options?.direction === 'earlier';
    let startIndex = options?.startMonthGroup
      ? this.months.indexOf(options.startMonthGroup)
      : isEarlier
        ? 0
        : this.months.length - 1;

    while (startIndex >= 0 && startIndex < this.months.length) {
      yield this.months[startIndex];
      startIndex += isEarlier ? 1 : -1;
    }
  }

  connect() {
    if (this.#websocketSupport) {
      throw new Error('TimelineManager already connected');
    }
    this.#websocketSupport = new WebsocketSupport(this);
    this.#websocketSupport.connectWebsocketEvents();
  }

  disconnect() {
    if (!this.#websocketSupport) {
      return;
    }
    this.#websocketSupport.disconnectWebsocketEvents();
    this.#websocketSupport = undefined;
  }

  async #initializeMonthGroups() {
    const timebuckets = await getTimeBuckets({
      ...authManager.params,
      ...this.#options,
    });

    this.#months = timebuckets.map((timeBucket) => {
      const date = new SvelteDate(timeBucket.timeBucket);
      return new MonthGroup(
        this,
        { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 },
        timeBucket.count,
        false,
        this.#options.order,
      );
    });
    this.albumAssets.clear();
    this.updateViewportGeometry(false);
  }

  async updateOptions(options: TimelineManagerOptions) {
    if (options.deferInit) {
      return;
    }
    if (this.#options !== TimelineManager.#INIT_OPTIONS && isEqual(this.#options, options)) {
      return;
    }
    await this.initTask.reset();
    this.#options = options;
    await this.init();
    this.updateViewportGeometry(false);
  }

  async init() {
    this.isInitialized = false;
    this.#months = [];
    this.albumAssets.clear();
    await this.initTask.execute(async () => {
      await this.#initializeMonthGroups();
    }, true);
  }

  public destroy() {
    this.disconnect();
    this.isInitialized = false;
  }

  updateViewportGeometry(changedWidth: boolean) {
    super.updateViewportGeometry(changedWidth);
    this.#createScrubberMonths();
  }

  #createScrubberMonths() {
    this.scrubberMonths = this.months.map((month) => ({
      assetCount: month.assetsCount,
      year: month.yearMonth.year,
      month: month.yearMonth.month,
      title: month.monthGroupTitle,
      height: month.height,
    }));
    this.scrubberTimelineHeight = this.timelineHeight;
  }

  addAssets(assets: TimelineAsset[]) {
    const assetsToUpdate = assets.filter((asset) => !this.isExcluded(asset));
    const notUpdated = this.updateAssets(assetsToUpdate);
    addAssetsToMonthGroups(this, [...notUpdated], { order: this.#options.order ?? AssetOrder.Desc });
  }

  async findSegmentForAssetId(id: string) {
    if (!this.isInitialized) {
      await this.initTask.waitUntilCompletion();
    }

    let { monthGroup } = findMonthGroupForAssetUtil(this, id) ?? {};
    if (monthGroup) {
      return monthGroup;
    }

    const response = await getAssetInfo({ ...authManager.params, id }).catch(() => null);
    if (!response) {
      return;
    }

    const asset = toTimelineAsset(response);
    if (!asset || this.isExcluded(asset)) {
      return;
    }

    monthGroup = await this.#loadMonthGroupAtTime(asset.localDateTime, { cancelable: false });
    if (monthGroup?.findAssetById({ id })) {
      return monthGroup;
    }
  }

  async #loadMonthGroupAtTime(yearMonth: TimelineYearMonth, options?: { cancelable: boolean }) {
    await this.loadSegment(getSegmentIdentifier(yearMonth), options);
    return getMonthGroupByDate(this, yearMonth);
  }

  async getRandomMonthGroup() {
    const random = Math.floor(Math.random() * this.months.length);
    const month = this.months[random];
    await this.loadSegment(getSegmentIdentifier(month.yearMonth), { cancelable: false });
    return month;
  }

  async getRandomAsset() {
    const month = await this.getRandomMonthGroup();
    return month?.getRandomAsset();
  }

  updateAssetOperation(ids: string[], operation: AssetOperation) {
    runAssetOperation(this, new SvelteSet(ids), operation, { order: this.#options.order ?? AssetOrder.Desc });
  }

  updateAssets(assets: TimelineAsset[]) {
    const lookup = new SvelteMap<string, TimelineAsset>(assets.map((asset) => [asset.id, asset]));
    const { unprocessedIds } = runAssetOperation(
      this,
      new SvelteSet(lookup.keys()),
      (asset) => {
        updateObject(asset, lookup.get(asset.id));
        return { remove: false };
      },
      { order: this.#options.order ?? AssetOrder.Desc },
    );
    const result: TimelineAsset[] = [];
    for (const id of unprocessedIds.values()) {
      result.push(lookup.get(id)!);
    }
    return result;
  }

  removeAssets(ids: string[]) {
    const { unprocessedIds } = runAssetOperation(
      this,
      new SvelteSet(ids),
      () => {
        return { remove: true };
      },
      { order: this.#options.order ?? AssetOrder.Desc },
    );
    return [...unprocessedIds];
  }

  refreshLayout() {
    for (const month of this.months) {
      updateGeometry(this, month, { invalidateHeight: true });
    }
    this.updateIntersections();
  }

  getFirstAsset(): TimelineAsset | undefined {
    return this.months[0]?.getFirstAsset();
  }

  async getLaterAsset(
    assetDescriptor: AssetDescriptor,
    interval: 'asset' | 'day' | 'month' | 'year' = 'asset',
  ): Promise<TimelineAsset | undefined> {
    return await getAssetWithOffset(this, assetDescriptor, interval, 'later');
  }

  async getEarlierAsset(
    assetDescriptor: AssetDescriptor,
    interval: 'asset' | 'day' | 'month' | 'year' = 'asset',
  ): Promise<TimelineAsset | undefined> {
    return await getAssetWithOffset(this, assetDescriptor, interval, 'earlier');
  }

  async getClosestAssetToDate(dateTime: TimelineDateTime) {
    const monthGroup = findMonthGroupForDate(this, dateTime);
    if (!monthGroup) {
      return;
    }
    await this.loadSegment(getSegmentIdentifier(dateTime), { cancelable: false });
    const asset = monthGroup.findClosest(dateTime);
    if (asset) {
      return asset;
    }
    for await (const asset of this.assetsIterator({ startMonthGroup: monthGroup })) {
      return asset;
    }
  }

  async retrieveRange(start: AssetDescriptor, end: AssetDescriptor) {
    return retrieveRangeUtil(this, start, end);
  }

  isExcluded(asset: TimelineAsset) {
    return (
      isMismatched(this.#options.visibility, asset.visibility) ||
      isMismatched(this.#options.isFavorite, asset.isFavorite) ||
      isMismatched(this.#options.isTrashed, asset.isTrashed)
    );
  }

  getAssetOrder() {
    return this.#options.order ?? AssetOrder.Desc;
  }
}
