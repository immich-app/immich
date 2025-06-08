import { getAssetInfo, getTimeBucket, getTimeBuckets } from '@immich/sdk';

import { authManager } from '$lib/managers/auth-manager.svelte';

import { CancellableTask } from '$lib/utils/cancellable-task';
import {
  toISOYearMonthUTC,
  toTimelineAsset,
  type TimelinePlainDate,
  type TimelinePlainDateTime,
  type TimelinePlainYearMonth,
} from '$lib/utils/timeline-util';
import { TUNABLES } from '$lib/utils/tunables';

import { clamp, debounce, isEqual } from 'lodash-es';
import { SvelteSet } from 'svelte/reactivity';

import {
  findMonthGroupForDate,
  getAssetWithOffset,
  getMonthGroupByDate,
  retrieveRange as retrieveRangeUtil,
} from '$lib/managers/timeline-manager/internal/search-support.svelte';
import { WebsocketSupport } from '$lib/managers/timeline-manager/internal/websocket-support.svelte';
import { DayGroup } from './day-group.svelte';
import { GroupInsertionCache } from './group-insertion-cache.svelte';
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
  UpdateGeometryOptions,
  Viewport,
} from './types';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

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

  #findMonthGroupForAsset(id: string) {
    for (const month of this.months) {
      const asset = month.findAssetById({ id });
      if (asset) {
        return { monthGroup: month, asset };
      }
    }
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
      this.#updateIntersection(month);
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

  #calculateIntersecting(monthGroup: MonthGroup, expandTop: number, expandBottom: number) {
    const monthGroupTop = monthGroup.top;
    const monthGroupBottom = monthGroupTop + monthGroup.height;
    const topWindow = this.visibleWindow.top - expandTop;
    const bottomWindow = this.visibleWindow.bottom + expandBottom;

    return (
      (monthGroupTop >= topWindow && monthGroupTop < bottomWindow) ||
      (monthGroupBottom >= topWindow && monthGroupBottom < bottomWindow) ||
      (monthGroupTop < topWindow && monthGroupBottom >= bottomWindow)
    );
  }

  clearDeferredLayout(month: MonthGroup) {
    const hasDeferred = month.dayGroups.some((group) => group.deferredLayout);
    if (hasDeferred) {
      this.#updateGeometry(month, { invalidateHeight: true, noDefer: true });
      for (const group of month.dayGroups) {
        group.deferredLayout = false;
      }
    }
  }

  #updateIntersection(month: MonthGroup) {
    const actuallyIntersecting = this.#calculateIntersecting(month, 0, 0);
    let preIntersecting = false;
    if (!actuallyIntersecting) {
      preIntersecting = this.#calculateIntersecting(month, INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM);
    }
    month.intersecting = actuallyIntersecting || preIntersecting;
    month.actuallyIntersecting = actuallyIntersecting;
    if (preIntersecting || actuallyIntersecting) {
      this.clearDeferredLayout(month);
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
      this.#updateGeometry(month, { invalidateHeight: changedWidth });
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
    const viewportWidth = this.viewportWidth;

    return {
      spacing: 2,
      heightTolerance: 0.15,
      rowHeight: this.#rowHeight,
      rowWidth: Math.floor(viewportWidth),
    };
  }

  #updateGeometry(month: MonthGroup, options: UpdateGeometryOptions) {
    const { invalidateHeight, noDefer = false } = options;
    if (invalidateHeight) {
      month.isHeightActual = false;
    }
    if (!month.isLoaded) {
      const viewportWidth = this.viewportWidth;
      if (!month.isHeightActual) {
        const unwrappedWidth = (3 / 2) * month.assetsCount * this.#rowHeight * (7 / 10);
        const rows = Math.ceil(unwrappedWidth / viewportWidth);
        const height = 51 + Math.max(1, rows) * this.#rowHeight;
        month.height = height;
      }
      return;
    }
    this.#layoutMonthGroup(month, noDefer);
  }

  #layoutMonthGroup(month: MonthGroup, noDefer: boolean = false) {
    let cummulativeHeight = 0;
    let cummulativeWidth = 0;
    let lastRowHeight = 0;
    let lastRow = 0;

    let dayGroupRow = 0;
    let dayGroupCol = 0;

    const rowSpaceRemaining: number[] = Array.from({ length: month.dayGroups.length });
    rowSpaceRemaining.fill(this.viewportWidth, 0, month.dayGroups.length);
    const options = this.createLayoutOptions();
    for (const assetGroup of month.dayGroups) {
      assetGroup.layout(options, noDefer);
      rowSpaceRemaining[dayGroupRow] -= assetGroup.width - 1;
      if (dayGroupCol > 0) {
        rowSpaceRemaining[dayGroupRow] -= this.gap;
      }
      if (rowSpaceRemaining[dayGroupRow] >= 0) {
        assetGroup.row = dayGroupRow;
        assetGroup.col = dayGroupCol;
        assetGroup.left = cummulativeWidth;
        assetGroup.top = cummulativeHeight;

        dayGroupCol++;

        cummulativeWidth += assetGroup.width + this.gap;
      } else {
        cummulativeWidth = 0;
        dayGroupRow++;
        dayGroupCol = 0;
        assetGroup.row = dayGroupRow;
        assetGroup.col = dayGroupCol;
        assetGroup.left = cummulativeWidth;

        rowSpaceRemaining[dayGroupRow] -= assetGroup.width;
        dayGroupCol++;
        cummulativeHeight += lastRowHeight;
        assetGroup.top = cummulativeHeight;
        cummulativeWidth += assetGroup.width + this.gap;
        lastRow = assetGroup.row - 1;
      }
      lastRowHeight = assetGroup.height + this.headerHeight;
    }
    if (lastRow === 0 || lastRow !== month.lastDayGroup?.row) {
      cummulativeHeight += lastRowHeight;
    }

    month.height = cummulativeHeight;
    month.isHeightActual = true;
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
      if (monthGroup.getFirstAsset()) {
        return;
      }
      const timeBucket = toISOYearMonthUTC(monthGroup.yearMonth);
      const key = authManager.key;
      const bucketResponse = await getTimeBucket(
        {
          ...this.#options,
          timeBucket,
          key,
        },
        { signal },
      );
      if (bucketResponse) {
        if (this.#options.timelineAlbumId) {
          const albumAssets = await getTimeBucket(
            {
              albumId: this.#options.timelineAlbumId,
              timeBucket,
              key,
            },
            { signal },
          );
          for (const id of albumAssets.id) {
            this.albumAssets.add(id);
          }
        }
        const unprocessedAssets = monthGroup.addAssets(bucketResponse);
        if (unprocessedAssets.length > 0) {
          console.error(
            `Warning: getTimeBucket API returning assets not in requested month: ${monthGroup.yearMonth.month}, ${JSON.stringify(
              unprocessedAssets.map((unprocessed) => ({
                id: unprocessed.id,
                localDateTime: unprocessed.localDateTime,
              })),
            )}`,
          );
        }
        this.#layoutMonthGroup(monthGroup);
      }
    }, cancelable);
    if (result === 'LOADED') {
      this.#updateIntersection(monthGroup);
    }
  }

  addAssets(assets: TimelineAsset[]) {
    const assetsToUpdate: TimelineAsset[] = [];

    for (const asset of assets) {
      if (this.isExcluded(asset)) {
        continue;
      }
      assetsToUpdate.push(asset);
    }

    const notUpdated = this.updateAssets(assetsToUpdate);
    this.#addAssetsToMonthGroups([...notUpdated]);
  }

  #addAssetsToMonthGroups(assets: TimelineAsset[]) {
    if (assets.length === 0) {
      return;
    }

    const addContext = new GroupInsertionCache();
    const updatedMonthGroups = new Set<MonthGroup>();
    const monthCount = this.months.length;
    for (const asset of assets) {
      let month = getMonthGroupByDate(this, asset.localDateTime);

      if (!month) {
        month = new MonthGroup(this, asset.localDateTime, 1, this.#options.order);
        month.isLoaded = true;
        this.months.push(month);
      }

      month.addTimelineAsset(asset, addContext);
      updatedMonthGroups.add(month);
    }

    if (this.months.length !== monthCount) {
      this.months.sort((a, b) => {
        return a.yearMonth.year === b.yearMonth.year
          ? b.yearMonth.month - a.yearMonth.month
          : b.yearMonth.year - a.yearMonth.year;
      });
    }

    for (const group of addContext.existingDayGroups) {
      group.sortAssets(this.#options.order);
    }

    for (const monthGroup of addContext.bucketsWithNewDayGroups) {
      monthGroup.sortDayGroups();
    }

    for (const month of addContext.updatedBuckets) {
      month.sortDayGroups();
      this.#updateGeometry(month, { invalidateHeight: true });
    }
    this.updateIntersections();
  }

  async findMonthGroupForAsset(id: string) {
    if (!this.isInitialized) {
      await this.initTask.waitUntilCompletion();
    }
    let { monthGroup } = this.#findMonthGroupForAsset(id) ?? {};
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

  getMonthGroupIndexByAssetId(assetId: string) {
    const monthGroupInfo = this.#findMonthGroupForAsset(assetId);
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

  #runAssetOperation(ids: Set<string>, operation: AssetOperation) {
    if (ids.size === 0) {
      return { processedIds: new Set(), unprocessedIds: ids, changedGeometry: false };
    }

    const changedMonthGroups = new Set<MonthGroup>();
    let idsToProcess = new Set(ids);
    const idsProcessed = new Set<string>();
    const combinedMoveAssets: { asset: TimelineAsset; date: TimelinePlainDate }[][] = [];
    for (const month of this.months) {
      if (idsToProcess.size > 0) {
        const { moveAssets, processedIds, changedGeometry } = month.runAssetOperation(idsToProcess, operation);
        if (moveAssets.length > 0) {
          combinedMoveAssets.push(moveAssets);
        }
        idsToProcess = idsToProcess.difference(processedIds);
        for (const id of processedIds) {
          idsProcessed.add(id);
        }
        if (changedGeometry) {
          changedMonthGroups.add(month);
        }
      }
    }
    if (combinedMoveAssets.length > 0) {
      this.#addAssetsToMonthGroups(combinedMoveAssets.flat().map((a) => a.asset));
    }
    const changedGeometry = changedMonthGroups.size > 0;
    for (const month of changedMonthGroups) {
      this.#updateGeometry(month, { invalidateHeight: true });
    }
    if (changedGeometry) {
      this.updateIntersections();
    }
    return { unprocessedIds: idsToProcess, processedIds: idsProcessed, changedGeometry };
  }

  updateAssetOperation(ids: string[], operation: AssetOperation) {
    this.#runAssetOperation(new Set(ids), operation);
  }

  updateAssets(assets: TimelineAsset[]) {
    const lookup = new Map<string, TimelineAsset>(assets.map((asset) => [asset.id, asset]));
    const { unprocessedIds } = this.#runAssetOperation(new Set(lookup.keys()), (asset) => {
      updateObject(asset, lookup.get(asset.id));
      return { remove: false };
    });
    return unprocessedIds.values().map((id) => lookup.get(id)!);
  }

  removeAssets(ids: string[]) {
    const { unprocessedIds } = this.#runAssetOperation(new Set(ids), () => {
      return { remove: true };
    });
    return [...unprocessedIds];
  }

  refreshLayout() {
    for (const month of this.months) {
      this.#updateGeometry(month, { invalidateHeight: true });
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
