import { VirtualScrollManager } from '$lib/managers/VirtualScrollManager/VirtualScrollManager.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { updateIntersectionMonthGroup } from '$lib/managers/timeline-manager/internal/intersection-support.svelte';
import { updateGeometry } from '$lib/managers/timeline-manager/internal/layout-support.svelte';
import { loadFromTimeBuckets } from '$lib/managers/timeline-manager/internal/load-support.svelte';
import {
  addAssetsToMonthGroups,
  runAssetOperation,
} from '$lib/managers/timeline-manager/internal/operations-support.svelte';
import {
  findClosestGroupForDate,
  findMonthGroupForAsset as findMonthGroupForAssetUtil,
  findMonthGroupForDate,
  getAssetWithOffset,
  getMonthGroupByDate,
  retrieveRange as retrieveRangeUtil,
} from '$lib/managers/timeline-manager/internal/search-support.svelte';
import { WebsocketSupport } from '$lib/managers/timeline-manager/internal/websocket-support.svelte';
import { CancellableTask } from '$lib/utils/cancellable-task';
import { toTimelineAsset, type TimelineDateTime, type TimelineYearMonth } from '$lib/utils/timeline-util';
import { AssetOrder, getAssetInfo, getTimeBuckets } from '@immich/sdk';
import { clamp, isEqual } from 'lodash-es';
import { SvelteDate, SvelteMap, SvelteSet } from 'svelte/reactivity';
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
  Viewport,
} from './types';

type ViewportTopMonthIntersection = {
  month: MonthGroup | undefined;
  // Where viewport top intersects month (0 = month top, 1 = month bottom)
  viewportTopRatioInMonth: number;
  // Where month bottom is in viewport (0 = viewport top, 1 = viewport bottom)
  monthBottomViewportRatio: number;
};
export class TimelineManager extends VirtualScrollManager {
  override bottomSectionHeight = $state(60);

  override bodySectionHeight = $derived.by(() => {
    let height = 0;
    for (const month of this.months) {
      height += month.height;
    }
    return height;
  });

  assetCount = $derived.by(() => {
    let count = 0;
    for (const month of this.months) {
      count += month.assetsCount;
    }
    return count;
  });

  isInitialized = $state(false);
  isScrollingOnLoad = false;
  months: MonthGroup[] = $state([]);
  albumAssets: Set<string> = new SvelteSet();
  scrubberMonths: ScrubberMonth[] = $state([]);
  scrubberTimelineHeight: number = $state(0);
  viewportTopMonthIntersection: ViewportTopMonthIntersection | undefined;
  limitedScroll = $derived(this.maxScrollPercent < 0.5);
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
  #updatingIntersections = false;
  #scrollableElement: HTMLElement | undefined = $state();

  constructor() {
    super();
  }

  override get scrollTop(): number {
    return this.#scrollableElement?.scrollTop ?? 0;
  }

  set scrollableElement(element: HTMLElement | undefined) {
    this.#scrollableElement = element;
  }

  scrollTo(top: number) {
    this.#scrollableElement?.scrollTo({ top });
    this.updateSlidingWindow();
  }

  scrollBy(y: number) {
    this.#scrollableElement?.scrollBy(0, y);
    this.updateSlidingWindow();
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

  #calculateMonthBottomViewportRatio(month: MonthGroup | undefined) {
    if (!month) {
      return 0;
    }
    const windowHeight = this.visibleWindow.bottom - this.visibleWindow.top;
    const bottomOfMonth = month.top + month.height;
    const bottomOfMonthInViewport = bottomOfMonth - this.visibleWindow.top;
    return clamp(bottomOfMonthInViewport / windowHeight, 0, 1);
  }

  #calculateVewportTopRatioInMonth(month: MonthGroup | undefined) {
    if (!month) {
      return 0;
    }
    return clamp((this.visibleWindow.top - month.top) / month.height, 0, 1);
  }

  override updateIntersections() {
    if (this.#updatingIntersections || !this.isInitialized || this.visibleWindow.bottom === this.visibleWindow.top) {
      return;
    }
    this.#updatingIntersections = true;

    for (const month of this.months) {
      updateIntersectionMonthGroup(this, month);
    }

    const month = this.months.find((month) => month.actuallyIntersecting);
    const viewportTopRatioInMonth = this.#calculateVewportTopRatioInMonth(month);
    const monthBottomViewportRatio = this.#calculateMonthBottomViewportRatio(month);

    this.viewportTopMonthIntersection = {
      month,
      monthBottomViewportRatio,
      viewportTopRatioInMonth,
    };

    this.#updatingIntersections = false;
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
      ...authManager.params,
      ...this.#options,
    });

    this.months = timebuckets.map((timeBucket) => {
      const date = new SvelteDate(timeBucket.timeBucket);
      return new MonthGroup(
        this,
        { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 },
        timeBucket.count,
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
    await this.#init(options);
    this.updateViewportGeometry(false);
    this.#createScrubberMonths();
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

  public override destroy() {
    this.disconnect();
    this.isInitialized = false;
    super.destroy();
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
    this.updateViewportGeometry(changedWidth);
  }

  protected override updateViewportGeometry(changedWidth: boolean) {
    if (!this.isInitialized || this.hasEmptyViewport) {
      return;
    }
    for (const month of this.months) {
      updateGeometry(this, month, { invalidateHeight: changedWidth });
    }
    this.updateIntersections();
    if (changedWidth) {
      this.#createScrubberMonths();
    }
  }

  #createScrubberMonths() {
    this.scrubberMonths = this.months.map((month) => ({
      assetCount: month.assetsCount,
      year: month.yearMonth.year,
      month: month.yearMonth.month,
      title: month.monthGroupTitle,
      height: month.height,
    }));
    this.scrubberTimelineHeight = this.totalViewerHeight;
  }

  async loadMonthGroup(yearMonth: TimelineYearMonth, options?: { cancelable: boolean }): Promise<void> {
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

    const executionStatus = await monthGroup.loader?.execute(async (signal: AbortSignal) => {
      await loadFromTimeBuckets(this, monthGroup, this.#options, signal);
    }, cancelable);
    if (executionStatus === 'LOADED') {
      updateGeometry(this, monthGroup, { invalidateHeight: false });
      this.updateIntersections();
    }
  }

  upsertAssets(assets: TimelineAsset[]) {
    const notUpdated = this.#updateAssets(assets);
    const notExcluded = notUpdated.filter((asset) => !this.isExcluded(asset));
    addAssetsToMonthGroups(this, [...notExcluded], { order: this.#options.order ?? AssetOrder.Desc });
  }

  async findMonthGroupForAsset(id: string) {
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
    await this.loadMonthGroup(yearMonth, options);
    return getMonthGroupByDate(this, yearMonth);
  }

  getMonthGroupByAssetId(assetId: string) {
    const monthGroupInfo = findMonthGroupForAssetUtil(this, assetId);
    return monthGroupInfo?.monthGroup;
  }

  // note: the `index` input is expected to be in the range [0, assetCount). This
  // value can be passed to make the method deterministic, which is mainly useful
  // for testing.
  async getRandomAsset(index?: number): Promise<TimelineAsset | undefined> {
    const randomAssetIndex = index ?? Math.floor(Math.random() * this.assetCount);

    let accumulatedCount = 0;

    let randomMonth: MonthGroup | undefined = undefined;
    for (const month of this.months) {
      if (randomAssetIndex < accumulatedCount + month.assetsCount) {
        randomMonth = month;
        break;
      }

      accumulatedCount += month.assetsCount;
    }
    if (!randomMonth) {
      return;
    }
    await this.loadMonthGroup(randomMonth.yearMonth, { cancelable: false });

    let randomDay: DayGroup | undefined = undefined;
    for (const day of randomMonth.dayGroups) {
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

  updateAssetOperation(ids: string[], operation: AssetOperation) {
    runAssetOperation(this, new SvelteSet(ids), operation, { order: this.#options.order ?? AssetOrder.Desc });
  }

  #updateAssets(assets: TimelineAsset[]) {
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

  override refreshLayout() {
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
    let monthGroup = findMonthGroupForDate(this, dateTime);
    if (!monthGroup) {
      // if exact match not found, find closest
      monthGroup = findClosestGroupForDate(this.months, dateTime);
      if (!monthGroup) {
        return;
      }
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

  getAssetOrder() {
    return this.#options.order ?? AssetOrder.Desc;
  }
}
