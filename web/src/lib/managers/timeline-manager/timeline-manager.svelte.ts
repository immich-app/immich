import { AssetOrder, getAssetInfo, getTimeBuckets } from '@immich/sdk';

import { authManager } from '$lib/managers/auth-manager.svelte';

import { CancellableTask } from '$lib/utils/cancellable-task';
import { toTimelineAsset, type TimelinePlainDateTime, type TimelinePlainYearMonth } from '$lib/utils/timeline-util';

import { clamp, debounce, isEqual } from 'lodash-es';
import { SvelteSet } from 'svelte/reactivity';

import { updateIntersectionMonthGroup } from '$lib/managers/timeline-manager/internal/intersection-support.svelte';
import { updateGeometry } from '$lib/managers/timeline-manager/internal/layout-support.svelte';
import { loadFromTimeBuckets } from '$lib/managers/timeline-manager/internal/load-support.svelte';
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
  TimelineManagerLayoutOptions,
  TimelineManagerOptions,
  Viewport,
} from './types';

export class TimelineManager {
  isInitialized = $state(false);
  months: MonthGroup[] = $state([]);
  topSectionHeight = $state(0);
  timelineHeight = $derived(this.months.reduce((accumulator, b) => accumulator + b.height, 0) + this.topSectionHeight);
  assetCount = $derived(this.months.reduce((accumulator, b) => accumulator + b.assetsCount, 0));

  albumAssets: Set<string> = new SvelteSet();

  scrubberMonths: ScrubberMonth[] = $state([]);
  scrubberTimelineHeight: number = $state(0);

  topIntersectingMonthGroup: MonthGroup | undefined = $state();

  visibleWindow = $derived.by(() => ({
    top: this.#scrollTop,
    bottom: this.#scrollTop + this.viewportHeight,
  }));

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
  #viewportHeight = $state(0);
  #viewportWidth = $state(0);
  #scrollTop = $state(0);
  #websocketSupport: WebsocketSupport | undefined;

  #rowHeight = $state(235);
  #headerHeight = $state(48);
  #gap = $state(12);

  #options: TimelineManagerOptions = TimelineManager.#INIT_OPTIONS;

  #scrolling = $state(false);
  #suspendTransitions = $state(false);
  #resetScrolling = debounce(() => (this.#scrolling = false), 1000);
  #resetSuspendTransitions = debounce(() => (this.suspendTransitions = false), 1000);
  scrollCompensation: {
    heightDelta: number | undefined;
    scrollTop: number | undefined;
    monthGroup: MonthGroup | undefined;
  } = $state({
    heightDelta: 0,
    scrollTop: 0,
    monthGroup: undefined,
  });

  constructor() {}

  setLayoutOptions({ headerHeight = 48, rowHeight = 235, gap = 12 }: TimelineManagerLayoutOptions) {
    let changed = false;
    changed ||= this.#setHeaderHeight(headerHeight);
    changed ||= this.#setGap(gap);
    changed ||= this.#setRowHeight(rowHeight);
    if (changed) {
      this.refreshLayout();
    }
  }

  #setHeaderHeight(value: number) {
    if (this.#headerHeight == value) {
      return false;
    }
    this.#headerHeight = value;
    return true;
  }

  get headerHeight() {
    return this.#headerHeight;
  }

  #setGap(value: number) {
    if (this.#gap == value) {
      return false;
    }
    this.#gap = value;
    return true;
  }

  get gap() {
    return this.#gap;
  }

  #setRowHeight(value: number) {
    if (this.#rowHeight == value) {
      return false;
    }
    this.#rowHeight = value;
    return true;
  }

  get rowHeight() {
    return this.#rowHeight;
  }

  set scrolling(value: boolean) {
    this.#scrolling = value;
    if (value) {
      this.suspendTransitions = true;
      this.#resetScrolling();
    }
  }

  get scrolling() {
    return this.#scrolling;
  }

  set suspendTransitions(value: boolean) {
    this.#suspendTransitions = value;
    if (value) {
      this.#resetSuspendTransitions();
    }
  }

  get suspendTransitions() {
    return this.#suspendTransitions;
  }

  set viewportWidth(value: number) {
    const changed = value !== this.#viewportWidth;
    this.#viewportWidth = value;
    this.suspendTransitions = true;
    void this.#updateViewportGeometry(changed);
  }

  get viewportWidth() {
    return this.#viewportWidth;
  }

  set viewportHeight(value: number) {
    this.#viewportHeight = value;
    this.#suspendTransitions = true;
    void this.#updateViewportGeometry(false);
  }

  get viewportHeight() {
    return this.#viewportHeight;
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
      await this.loadMonthGroup(monthGroup.yearMonth, { cancelable: false });
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

  updateSlidingWindow(scrollTop: number) {
    if (this.#scrollTop !== scrollTop) {
      this.#scrollTop = scrollTop;
      this.updateIntersections();
    }
  }

  clearScrollCompensation() {
    this.scrollCompensation = {
      heightDelta: undefined,
      scrollTop: undefined,
      monthGroup: undefined,
    };
  }

  updateIntersections() {
    if (!this.isInitialized || this.visibleWindow.bottom === this.visibleWindow.top) {
      return;
    }
    let topIntersectingMonthGroup = undefined;
    for (const month of this.months) {
      updateIntersectionMonthGroup(this, month);
      if (!topIntersectingMonthGroup && month.actuallyIntersecting) {
        topIntersectingMonthGroup = month;
      }
    }
    if (topIntersectingMonthGroup !== undefined && this.topIntersectingMonthGroup !== topIntersectingMonthGroup) {
      this.topIntersectingMonthGroup = topIntersectingMonthGroup;
    }
    for (const month of this.months) {
      if (month === this.topIntersectingMonthGroup) {
        this.topIntersectingMonthGroup.percent = clamp(
          (this.visibleWindow.top - this.topIntersectingMonthGroup.top) / this.topIntersectingMonthGroup.height,
          0,
          1,
        );
      } else {
        month.percent = 0;
      }
    }
  }

  clearDeferredLayout(month: MonthGroup) {
    const hasDeferred = month.dayGroups.some((group) => group.deferredLayout);
    if (hasDeferred) {
      updateGeometry(this, month, { invalidateHeight: true, noDefer: true });
      for (const group of month.dayGroups) {
        group.deferredLayout = false;
      }
    }
  }

  async #initializeMonthGroups() {
    const timebuckets = await getTimeBuckets({
      ...this.#options,
      key: authManager.key,
    });

    this.months = timebuckets.map((timeBucket) => {
      const date = new Date(timeBucket.timeBucket);
      return new MonthGroup(
        this,
        { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 },
        timeBucket.count,
        this.#options.order,
      );
    });
    this.albumAssets.clear();
    this.#updateViewportGeometry(false);
  }

  async updateOptions(options: TimelineManagerOptions) {
    if (options.deferInit) {
      return;
    }
    if (this.#options !== TimelineManager.#INIT_OPTIONS && isEqual(this.#options, options)) {
      return;
    }
    await this.initTask.reset();
    await this.#init(options);
    this.#updateViewportGeometry(false);
  }

  async #init(options: TimelineManagerOptions) {
    this.isInitialized = false;
    this.months = [];
    this.albumAssets.clear();
    await this.initTask.execute(async () => {
      this.#options = options;
      await this.#initializeMonthGroups();
    }, true);
  }

  public destroy() {
    this.disconnect();
    this.isInitialized = false;
  }

  async updateViewport(viewport: Viewport) {
    if (viewport.height === 0 && viewport.width === 0) {
      return;
    }

    if (this.viewportHeight === viewport.height && this.viewportWidth === viewport.width) {
      return;
    }

    if (!this.initTask.executed) {
      await (this.initTask.loading ? this.initTask.waitUntilCompletion() : this.#init(this.#options));
    }

    const changedWidth = viewport.width !== this.viewportWidth;
    this.viewportHeight = viewport.height;
    this.viewportWidth = viewport.width;
    this.#updateViewportGeometry(changedWidth);
  }

  #updateViewportGeometry(changedWidth: boolean) {
    if (!this.isInitialized) {
      return;
    }
    if (this.viewportWidth === 0 || this.viewportHeight === 0) {
      return;
    }
    for (const month of this.months) {
      updateGeometry(this, month, { invalidateHeight: changedWidth });
    }
    this.updateIntersections();
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

  createLayoutOptions() {
    return {
      spacing: 2,
      heightTolerance: 0.3,
      rowHeight: this.#rowHeight,
      rowWidth: Math.floor(this.viewportWidth),
    };
  }

  async loadMonthGroup(yearMonth: TimelinePlainYearMonth, options?: { cancelable: boolean }): Promise<void> {
    let cancelable = true;
    if (options) {
      cancelable = options.cancelable;
    }
    const monthGroup = getMonthGroupByDate(this, yearMonth);
    if (!monthGroup) {
      return;
    }

    if (monthGroup.loader?.executed) {
      return;
    }

    const result = await monthGroup.loader?.execute(async (signal: AbortSignal) => {
      await loadFromTimeBuckets(this, monthGroup, this.#options, signal);
    }, cancelable);
    if (result === 'LOADED') {
      updateIntersectionMonthGroup(this, monthGroup);
    }
  }

  addAssets(assets: TimelineAsset[]) {
    const assetsToUpdate = assets.filter((asset) => !this.isExcluded(asset));
    const notUpdated = this.updateAssets(assetsToUpdate);
    addAssetsToMonthGroups(this, [...notUpdated], { order: this.#options.order ?? AssetOrder.Desc });
  }

  async findMonthGroupForAsset(id: string) {
    if (!this.isInitialized) {
      await this.initTask.waitUntilCompletion();
    }
    let { monthGroup } = findMonthGroupForAssetUtil(this, id) ?? {};
    if (monthGroup) {
      return monthGroup;
    }
    const asset = toTimelineAsset(await getAssetInfo({ id, key: authManager.key }));
    if (!asset || this.isExcluded(asset)) {
      return;
    }
    monthGroup = await this.#loadMonthGroupAtTime(asset.localDateTime, { cancelable: false });
    if (monthGroup?.findAssetById({ id })) {
      return monthGroup;
    }
  }

  async #loadMonthGroupAtTime(yearMonth: TimelinePlainYearMonth, options?: { cancelable: boolean }) {
    await this.loadMonthGroup(yearMonth, options);
    return getMonthGroupByDate(this, yearMonth);
  }

  getMonthGroupByAssetId(assetId: string) {
    const monthGroupInfo = findMonthGroupForAssetUtil(this, assetId);
    return monthGroupInfo?.monthGroup;
  }

  async getRandomMonthGroup() {
    const random = Math.floor(Math.random() * this.months.length);
    const month = this.months[random];
    await this.loadMonthGroup(month.yearMonth, { cancelable: false });
    return month;
  }

  async getRandomAsset() {
    const month = await this.getRandomMonthGroup();
    return month?.getRandomAsset();
  }

  updateAssetOperation(ids: string[], operation: AssetOperation) {
    runAssetOperation(this, new Set(ids), operation, { order: this.#options.order ?? AssetOrder.Desc });
  }

  updateAssets(assets: TimelineAsset[]) {
    const lookup = new Map<string, TimelineAsset>(assets.map((asset) => [asset.id, asset]));
    const { unprocessedIds } = runAssetOperation(
      this,
      new Set(lookup.keys()),
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
      new Set(ids),
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

  async getClosestAssetToDate(dateTime: TimelinePlainDateTime) {
    const monthGroup = findMonthGroupForDate(this, dateTime);
    if (!monthGroup) {
      return;
    }
    await this.loadMonthGroup(dateTime, { cancelable: false });
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
}
