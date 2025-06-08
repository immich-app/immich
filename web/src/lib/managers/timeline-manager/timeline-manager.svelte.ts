import { getAssetInfo, getTimeBucket, getTimeBuckets } from '@immich/sdk';

import { authManager } from '$lib/managers/auth-manager.svelte';
import { websocketEvents } from '$lib/stores/websocket';
import { CancellableTask } from '$lib/utils/cancellable-task';
import {
  plainDateTimeCompare,
  toISOYearMonthUTC,
  toTimelineAsset,
  type TimelinePlainDate,
  type TimelinePlainDateTime,
  type TimelinePlainYearMonth,
} from '$lib/utils/timeline-util';
import { TUNABLES } from '$lib/utils/tunables';

import { clamp, debounce, isEqual, throttle } from 'lodash-es';
import { SvelteSet } from 'svelte/reactivity';
import type { Unsubscriber } from 'svelte/store';

import { DayGroup } from './day-group.svelte';
import { GroupInsertionCache } from './group-insertion-cache.svelte';
import { MonthGroup } from './month-group.svelte';
import type {
  AssetDescriptor,
  AssetOperation,
  AssetStoreLayoutOptions,
  AssetStoreOptions,
  Direction,
  LiteBucket,
  PendingChange,
  TimelineAsset,
  UpdateGeometryOptions,
  Viewport,
} from './types';
import { isMismatched, updateObject } from './utils.svelte';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

export class TimelineManager {
  isInitialized = $state(false);
  buckets: MonthGroup[] = $state([]);
  topSectionHeight = $state(0);
  timelineHeight = $derived(
    this.buckets.reduce((accumulator, b) => accumulator + b.bucketHeight, 0) + this.topSectionHeight,
  );
  count = $derived(this.buckets.reduce((accumulator, b) => accumulator + b.bucketCount, 0));

  albumAssets: Set<string> = new SvelteSet();

  scrubberBuckets: LiteBucket[] = $state([]);
  scrubberTimelineHeight: number = $state(0);

  topIntersectingBucket: MonthGroup | undefined = $state();

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
  #pendingChanges: PendingChange[] = [];
  #unsubscribers: Unsubscriber[] = [];

  #rowHeight = $state(235);
  #headerHeight = $state(48);
  #gap = $state(12);

  #options: AssetStoreOptions = TimelineManager.#INIT_OPTIONS;

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

  setLayoutOptions({ headerHeight = 48, rowHeight = 235, gap = 12 }: AssetStoreLayoutOptions) {
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
    for (const monthGroup of this.bucketsIterator({ direction, startMonthGroup: options?.startMonthGroup })) {
      await this.loadMonthGroup(monthGroup.yearMonth, { cancelable: false });
      yield* monthGroup.assetsIterator({ startDayGroup, startAsset, direction });
      startDayGroup = startAsset = undefined;
    }
  }

  *bucketsIterator(options?: { direction?: Direction; startMonthGroup?: MonthGroup }) {
    const isEarlier = options?.direction === 'earlier';
    let startIndex = options?.startMonthGroup
      ? this.buckets.indexOf(options.startMonthGroup)
      : isEarlier
        ? 0
        : this.buckets.length - 1;

    while (startIndex >= 0 && startIndex < this.buckets.length) {
      yield this.buckets[startIndex];
      startIndex += isEarlier ? 1 : -1;
    }
  }

  #addPendingChanges(...changes: PendingChange[]) {
    this.#pendingChanges.push(...changes);
    this.#processPendingChanges();
  }

  connect() {
    this.#unsubscribers.push(
      websocketEvents.on('on_upload_success', (asset) =>
        this.#addPendingChanges({ type: 'add', values: [toTimelineAsset(asset)] }),
      ),
      websocketEvents.on('on_asset_trash', (ids) => this.#addPendingChanges({ type: 'trash', values: ids })),
      websocketEvents.on('on_asset_update', (asset) =>
        this.#addPendingChanges({ type: 'update', values: [toTimelineAsset(asset)] }),
      ),
      websocketEvents.on('on_asset_delete', (id: string) => this.#addPendingChanges({ type: 'delete', values: [id] })),
    );
  }

  disconnect() {
    for (const unsubscribe of this.#unsubscribers) {
      unsubscribe();
    }
    this.#unsubscribers = [];
  }

  #getPendingChangeBatches() {
    const batch: {
      add: TimelineAsset[];
      update: TimelineAsset[];
      remove: string[];
    } = {
      add: [],
      update: [],
      remove: [],
    };
    for (const { type, values } of this.#pendingChanges) {
      switch (type) {
        case 'add': {
          batch.add.push(...values);
          break;
        }
        case 'update': {
          batch.update.push(...values);
          break;
        }
        case 'delete':
        case 'trash': {
          batch.remove.push(...values);
          break;
        }
      }
    }
    return batch;
  }

  #findMonthGroupForAsset(id: string) {
    for (const monthGroup of this.buckets) {
      const asset = monthGroup.findAssetById({ id });
      if (asset) {
        return { monthGroup, asset };
      }
    }
  }

  #findMonthGroupForDate(targetYearMonth: TimelinePlainYearMonth) {
    for (const monthGroup of this.buckets) {
      const { year, month } = monthGroup.yearMonth;
      if (month === targetYearMonth.month && year === targetYearMonth.year) {
        return monthGroup;
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
    for (const monthGroup of this.buckets) {
      this.#updateIntersection(monthGroup);
      if (!topIntersectingMonthGroup && monthGroup.actuallyIntersecting) {
        topIntersectingMonthGroup = monthGroup;
      }
    }
    if (topIntersectingMonthGroup !== undefined && this.topIntersectingBucket !== topIntersectingMonthGroup) {
      this.topIntersectingBucket = topIntersectingMonthGroup;
    }
    for (const monthGroup of this.buckets) {
      if (monthGroup === this.topIntersectingBucket) {
        this.topIntersectingBucket.percent = clamp(
          (this.visibleWindow.top - this.topIntersectingBucket.top) / this.topIntersectingBucket.bucketHeight,
          0,
          1,
        );
      } else {
        monthGroup.percent = 0;
      }
    }
  }

  #calculateIntersecting(monthGroup: MonthGroup, expandTop: number, expandBottom: number) {
    const monthGroupTop = monthGroup.top;
    const monthGroupBottom = monthGroupTop + monthGroup.bucketHeight;
    const topWindow = this.visibleWindow.top - expandTop;
    const bottomWindow = this.visibleWindow.bottom + expandBottom;

    return (
      (monthGroupTop >= topWindow && monthGroupTop < bottomWindow) ||
      (monthGroupBottom >= topWindow && monthGroupBottom < bottomWindow) ||
      (monthGroupTop < topWindow && monthGroupBottom >= bottomWindow)
    );
  }

  clearDeferredLayout(monthGroup: MonthGroup) {
    const hasDeferred = monthGroup.dayGroups.some((group) => group.deferredLayout);
    if (hasDeferred) {
      this.#updateGeometry(monthGroup, { invalidateHeight: true, noDefer: true });
      for (const group of monthGroup.dayGroups) {
        group.deferredLayout = false;
      }
    }
  }

  #updateIntersection(monthGroup: MonthGroup) {
    const actuallyIntersecting = this.#calculateIntersecting(monthGroup, 0, 0);
    let preIntersecting = false;
    if (!actuallyIntersecting) {
      preIntersecting = this.#calculateIntersecting(monthGroup, INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM);
    }
    monthGroup.intersecting = actuallyIntersecting || preIntersecting;
    monthGroup.actuallyIntersecting = actuallyIntersecting;
    if (preIntersecting || actuallyIntersecting) {
      this.clearDeferredLayout(monthGroup);
    }
  }

  #processPendingChanges = throttle(() => {
    const { add, update, remove } = this.#getPendingChangeBatches();
    if (add.length > 0) {
      this.addAssets(add);
    }
    if (update.length > 0) {
      this.updateAssets(update);
    }
    if (remove.length > 0) {
      this.removeAssets(remove);
    }
    this.#pendingChanges = [];
  }, 2500);

  async #initializeTimeBuckets() {
    const timebuckets = await getTimeBuckets({
      ...this.#options,
      key: authManager.key,
    });

    this.buckets = timebuckets.map((timeBucket) => {
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

  async updateOptions(options: AssetStoreOptions) {
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

  async #init(options: AssetStoreOptions) {
    this.isInitialized = false;
    this.buckets = [];
    this.albumAssets.clear();
    await this.initTask.execute(async () => {
      this.#options = options;
      await this.#initializeTimeBuckets();
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
    for (const monthGroup of this.buckets) {
      this.#updateGeometry(monthGroup, { invalidateHeight: changedWidth });
    }
    this.updateIntersections();
    this.#createScrubBuckets();
  }

  #createScrubBuckets() {
    this.scrubberBuckets = this.buckets.map((monthGroup) => ({
      assetCount: monthGroup.bucketCount,
      year: monthGroup.yearMonth.year,
      month: monthGroup.yearMonth.month,
      bucketDateFormattted: monthGroup.bucketDateFormatted,
      bucketHeight: monthGroup.bucketHeight,
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

  #updateGeometry(monthGroup: MonthGroup, options: UpdateGeometryOptions) {
    const { invalidateHeight, noDefer = false } = options;
    if (invalidateHeight) {
      monthGroup.isBucketHeightActual = false;
    }
    if (!monthGroup.isLoaded) {
      const viewportWidth = this.viewportWidth;
      if (!monthGroup.isBucketHeightActual) {
        const unwrappedWidth = (3 / 2) * monthGroup.bucketCount * this.#rowHeight * (7 / 10);
        const rows = Math.ceil(unwrappedWidth / viewportWidth);
        const height = 51 + Math.max(1, rows) * this.#rowHeight;
        monthGroup.bucketHeight = height;
      }
      return;
    }
    this.#layoutMonthGroup(monthGroup, noDefer);
  }

  #layoutMonthGroup(monthGroup: MonthGroup, noDefer: boolean = false) {
    let cummulativeHeight = 0;
    let cummulativeWidth = 0;
    let lastRowHeight = 0;
    let lastRow = 0;

    let dayGroupRow = 0;
    let dayGroupCol = 0;

    const rowSpaceRemaining: number[] = Array.from({ length: monthGroup.dayGroups.length });
    rowSpaceRemaining.fill(this.viewportWidth, 0, monthGroup.dayGroups.length);
    const options = this.createLayoutOptions();
    for (const assetGroup of monthGroup.dayGroups) {
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
    if (lastRow === 0 || lastRow !== monthGroup.lastDayGroup?.row) {
      cummulativeHeight += lastRowHeight;
    }

    monthGroup.bucketHeight = cummulativeHeight;
    monthGroup.isBucketHeightActual = true;
  }

  async loadMonthGroup(yearMonth: TimelinePlainYearMonth, options?: { cancelable: boolean }): Promise<void> {
    let cancelable = true;
    if (options) {
      cancelable = options.cancelable;
    }
    const monthGroup = this.getMonthGroupByDate(yearMonth);
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
    const bucketCount = this.buckets.length;
    for (const asset of assets) {
      let monthGroup = this.getMonthGroupByDate(asset.localDateTime);

      if (!monthGroup) {
        monthGroup = new MonthGroup(this, asset.localDateTime, 1, this.#options.order);
        monthGroup.isLoaded = true;
        this.buckets.push(monthGroup);
      }

      monthGroup.addTimelineAsset(asset, addContext);
      updatedMonthGroups.add(monthGroup);
    }

    if (this.buckets.length !== bucketCount) {
      this.buckets.sort((a, b) => {
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

    for (const monthGroup of addContext.updatedBuckets) {
      monthGroup.sortDayGroups();
      this.#updateGeometry(monthGroup, { invalidateHeight: true });
    }
    this.updateIntersections();
  }

  getMonthGroupByDate(targetYearMonth: TimelinePlainYearMonth): MonthGroup | undefined {
    return this.buckets.find(
      (monthGroup) =>
        monthGroup.yearMonth.year === targetYearMonth.year && monthGroup.yearMonth.month === targetYearMonth.month,
    );
  }

  async findBucketForAsset(id: string) {
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
    return this.getMonthGroupByDate(yearMonth);
  }

  getMonthGroupIndexByAssetId(assetId: string) {
    const monthGroupInfo = this.#findMonthGroupForAsset(assetId);
    return monthGroupInfo?.monthGroup;
  }

  async getRandomMonthGroup() {
    const random = Math.floor(Math.random() * this.buckets.length);
    const monthGroup = this.buckets[random];
    await this.loadMonthGroup(monthGroup.yearMonth, { cancelable: false });
    return monthGroup;
  }

  async getRandomAsset() {
    const monthGroup = await this.getRandomMonthGroup();
    return monthGroup?.getRandomAsset();
  }

  #runAssetOperation(ids: Set<string>, operation: AssetOperation) {
    if (ids.size === 0) {
      return { processedIds: new Set(), unprocessedIds: ids, changedGeometry: false };
    }

    const changedMonthGroups = new Set<MonthGroup>();
    let idsToProcess = new Set(ids);
    const idsProcessed = new Set<string>();
    const combinedMoveAssets: { asset: TimelineAsset; date: TimelinePlainDate }[][] = [];
    for (const monthGroup of this.buckets) {
      if (idsToProcess.size > 0) {
        const { moveAssets, processedIds, changedGeometry } = monthGroup.runAssetOperation(idsToProcess, operation);
        if (moveAssets.length > 0) {
          combinedMoveAssets.push(moveAssets);
        }
        idsToProcess = idsToProcess.difference(processedIds);
        for (const id of processedIds) {
          idsProcessed.add(id);
        }
        if (changedGeometry) {
          changedMonthGroups.add(monthGroup);
        }
      }
    }
    if (combinedMoveAssets.length > 0) {
      this.#addAssetsToMonthGroups(combinedMoveAssets.flat().map((a) => a.asset));
    }
    const changedGeometry = changedMonthGroups.size > 0;
    for (const monthGroup of changedMonthGroups) {
      this.#updateGeometry(monthGroup, { invalidateHeight: true });
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
    for (const monthGroup of this.buckets) {
      this.#updateGeometry(monthGroup, { invalidateHeight: true });
    }
    this.updateIntersections();
  }

  getFirstAsset(): TimelineAsset | undefined {
    return this.buckets[0]?.getFirstAsset();
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

  async getClosestAssetToDate(dateTime: TimelinePlainDateTime) {
    const monthGroup = this.#findMonthGroupForDate(dateTime);
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
    let { asset: startAsset, monthGroup: startMonthGroup } = this.#findMonthGroupForAsset(start.id) ?? {};
    if (!startMonthGroup || !startAsset) {
      return [];
    }
    let { asset: endAsset, monthGroup: endMonthGroup } = this.#findMonthGroupForAsset(end.id) ?? {};
    if (!endMonthGroup || !endAsset) {
      return [];
    }
    let direction: Direction = 'earlier';
    if (plainDateTimeCompare(true, startAsset.localDateTime, endAsset.localDateTime) < 0) {
      [startAsset, endAsset] = [endAsset, startAsset];
      [startMonthGroup, endMonthGroup] = [endMonthGroup, startMonthGroup];
      direction = 'earlier';
    }

    const range: TimelineAsset[] = [];
    const startDayGroup = startMonthGroup.findDayGroupForAsset(startAsset);
    for await (const targetAsset of this.assetsIterator({
      startMonthGroup,
      startDayGroup,
      startAsset,
      direction,
    })) {
      range.push(targetAsset);
      if (targetAsset.id === endAsset.id) {
        break;
      }
    }
    return range;
  }

  async #getAssetWithOffset(
    assetDescriptor: AssetDescriptor,
    interval: 'asset' | 'day' | 'month' | 'year' = 'asset',
    direction: Direction,
  ): Promise<TimelineAsset | undefined> {
    const { asset, monthGroup } = this.#findMonthGroupForAsset(assetDescriptor.id) ?? {};
    if (!monthGroup || !asset) {
      return;
    }

    switch (interval) {
      case 'asset': {
        return this.#getAssetByAssetOffset(asset, monthGroup, direction);
      }
      case 'day': {
        return this.#getAssetByDayOffset(asset, monthGroup, direction);
      }
      case 'month': {
        return this.#getAssetByMonthOffset(monthGroup, direction);
      }
      case 'year': {
        return this.#getAssetByYearOffset(monthGroup, direction);
      }
    }
  }

  async #getAssetByAssetOffset(asset: TimelineAsset, monthGroup: MonthGroup, direction: Direction) {
    const dayGroup = monthGroup.findDayGroupForAsset(asset);
    for await (const targetAsset of this.assetsIterator({
      startMonthGroup: monthGroup,
      startDayGroup: dayGroup,
      startAsset: asset,
      direction,
    })) {
      if (asset.id === targetAsset.id) {
        continue;
      }
      return targetAsset;
    }
  }

  async #getAssetByDayOffset(asset: TimelineAsset, monthGroup: MonthGroup, direction: Direction) {
    const dayGroup = monthGroup.findDayGroupForAsset(asset);
    for await (const targetAsset of this.assetsIterator({
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

  async #getAssetByMonthOffset(monthGroup: MonthGroup, direction: Direction) {
    for (const targetMonthGroup of this.bucketsIterator({ startMonthGroup: monthGroup, direction })) {
      if (targetMonthGroup.yearMonth.month !== monthGroup.yearMonth.month) {
        for await (const targetAsset of this.assetsIterator({ startMonthGroup: targetMonthGroup, direction })) {
          return targetAsset;
        }
      }
    }
  }

  async #getAssetByYearOffset(monthGroup: MonthGroup, direction: Direction) {
    for (const targetMonthGroup of this.bucketsIterator({ startMonthGroup: monthGroup, direction })) {
      if (targetMonthGroup.yearMonth.year !== monthGroup.yearMonth.year) {
        for await (const targetAsset of this.assetsIterator({ startMonthGroup: targetMonthGroup, direction })) {
          return targetAsset;
        }
      }
    }
  }

  isExcluded(asset: TimelineAsset) {
    return (
      isMismatched(this.#options.visibility, asset.visibility) ||
      isMismatched(this.#options.isFavorite, asset.isFavorite) ||
      isMismatched(this.#options.isTrashed, asset.isTrashed)
    );
  }
}
