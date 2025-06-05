import { authManager } from '$lib/managers/auth-manager.svelte';
import { websocketEvents } from '$lib/stores/websocket';
import { CancellableTask } from '$lib/utils/cancellable-task';
import {
  plainDateTimeCompare,
  toISOLocalDateTime,
  toTimelineAsset,
  type TimelinePlainDate,
  type TimelinePlainDateTime,
  type TimelinePlainYearMonth,
} from '$lib/utils/timeline-util';
import { TUNABLES } from '$lib/utils/tunables';
import { getAssetInfo, getTimeBucket, getTimeBuckets } from '@immich/sdk';
import { clamp, debounce, isEqual, throttle } from 'lodash-es';
import { SvelteSet } from 'svelte/reactivity';
import type { Unsubscriber } from 'svelte/store';
import { AddContext } from './add-context.svelte';
import { AssetBucket } from './asset-bucket.svelte';
import { AssetDateGroup } from './asset-date-group.svelte';
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

export class AssetStore {
  isInitialized = $state(false);
  buckets: AssetBucket[] = $state([]);
  topSectionHeight = $state(0);
  timelineHeight = $derived(
    this.buckets.reduce((accumulator, b) => accumulator + b.bucketHeight, 0) + this.topSectionHeight,
  );
  count = $derived(this.buckets.reduce((accumulator, b) => accumulator + b.bucketCount, 0));

  albumAssets: Set<string> = new SvelteSet();

  scrubberBuckets: LiteBucket[] = $state([]);
  scrubberTimelineHeight: number = $state(0);

  topIntersectingBucket: AssetBucket | undefined = $state();

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

  #options: AssetStoreOptions = AssetStore.#INIT_OPTIONS;

  #scrolling = $state(false);
  #suspendTransitions = $state(false);
  #resetScrolling = debounce(() => (this.#scrolling = false), 1000);
  #resetSuspendTransitions = debounce(() => (this.suspendTransitions = false), 1000);
  scrollCompensation: {
    heightDelta: number | undefined;
    scrollTop: number | undefined;
    bucket: AssetBucket | undefined;
  } = $state({
    heightDelta: 0,
    scrollTop: 0,
    bucket: undefined,
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
    startBucket?: AssetBucket;
    startDateGroup?: AssetDateGroup;
    startAsset?: TimelineAsset;
    direction?: Direction;
  }) {
    const direction = options?.direction ?? 'earlier';
    let { startDateGroup, startAsset } = options ?? {};
    for (const bucket of this.bucketsIterator({ direction, startBucket: options?.startBucket })) {
      await this.loadBucket(bucket.yearMonth, { cancelable: false });
      yield* bucket.assetsIterator({ startDateGroup, startAsset, direction });
      startDateGroup = startAsset = undefined;
    }
  }

  *bucketsIterator(options?: { direction?: Direction; startBucket?: AssetBucket }) {
    const isEarlier = options?.direction === 'earlier';
    let startIndex = options?.startBucket
      ? this.buckets.indexOf(options.startBucket)
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

  #findBucketForAsset(id: string) {
    for (const bucket of this.buckets) {
      const asset = bucket.findAssetById({ id });
      if (asset) {
        return { bucket, asset };
      }
    }
  }

  #findBucketForDate(targetYearMonth: TimelinePlainYearMonth) {
    for (const bucket of this.buckets) {
      const { year, month } = bucket.yearMonth;
      if (month === targetYearMonth.month && year === targetYearMonth.year) {
        return bucket;
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
      bucket: undefined,
    };
  }

  updateIntersections() {
    if (!this.isInitialized || this.visibleWindow.bottom === this.visibleWindow.top) {
      return;
    }
    let topIntersectingBucket = undefined;
    for (const bucket of this.buckets) {
      this.#updateIntersection(bucket);
      if (!topIntersectingBucket && bucket.actuallyIntersecting) {
        topIntersectingBucket = bucket;
      }
    }
    if (topIntersectingBucket !== undefined && this.topIntersectingBucket !== topIntersectingBucket) {
      this.topIntersectingBucket = topIntersectingBucket;
    }
    for (const bucket of this.buckets) {
      if (bucket === this.topIntersectingBucket) {
        this.topIntersectingBucket.percent = clamp(
          (this.visibleWindow.top - this.topIntersectingBucket.top) / this.topIntersectingBucket.bucketHeight,
          0,
          1,
        );
      } else {
        bucket.percent = 0;
      }
    }
  }

  #calculateIntersecting(bucket: AssetBucket, expandTop: number, expandBottom: number) {
    const bucketTop = bucket.top;
    const bucketBottom = bucketTop + bucket.bucketHeight;
    const topWindow = this.visibleWindow.top - expandTop;
    const bottomWindow = this.visibleWindow.bottom + expandBottom;

    return (
      (bucketTop >= topWindow && bucketTop < bottomWindow) ||
      (bucketBottom >= topWindow && bucketBottom < bottomWindow) ||
      (bucketTop < topWindow && bucketBottom >= bottomWindow)
    );
  }

  clearDeferredLayout(bucket: AssetBucket) {
    const hasDeferred = bucket.dateGroups.some((group) => group.deferredLayout);
    if (hasDeferred) {
      this.#updateGeometry(bucket, { invalidateHeight: true, noDefer: true });
      for (const group of bucket.dateGroups) {
        group.deferredLayout = false;
      }
    }
  }

  #updateIntersection(bucket: AssetBucket) {
    const actuallyIntersecting = this.#calculateIntersecting(bucket, 0, 0);
    let preIntersecting = false;
    if (!actuallyIntersecting) {
      preIntersecting = this.#calculateIntersecting(bucket, INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM);
    }
    bucket.intersecting = actuallyIntersecting || preIntersecting;
    bucket.actuallyIntersecting = actuallyIntersecting;
    if (preIntersecting || actuallyIntersecting) {
      this.clearDeferredLayout(bucket);
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

    this.buckets = timebuckets.map((bucket) => {
      const date = new Date(bucket.timeBucket);
      return new AssetBucket(
        this,
        { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 },
        bucket.count,
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
    if (this.#options !== AssetStore.#INIT_OPTIONS && isEqual(this.#options, options)) {
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
    for (const bucket of this.buckets) {
      this.#updateGeometry(bucket, { invalidateHeight: changedWidth });
    }
    this.updateIntersections();
    this.#createScrubBuckets();
  }

  #createScrubBuckets() {
    this.scrubberBuckets = this.buckets.map((bucket) => ({
      assetCount: bucket.bucketCount,
      year: bucket.yearMonth.year,
      month: bucket.yearMonth.month,
      bucketDateFormattted: bucket.bucketDateFormatted,
      bucketHeight: bucket.bucketHeight,
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

  #updateGeometry(bucket: AssetBucket, options: UpdateGeometryOptions) {
    const { invalidateHeight, noDefer = false } = options;
    if (invalidateHeight) {
      bucket.isBucketHeightActual = false;
    }
    if (!bucket.isLoaded) {
      const viewportWidth = this.viewportWidth;
      if (!bucket.isBucketHeightActual) {
        const unwrappedWidth = (3 / 2) * bucket.bucketCount * this.#rowHeight * (7 / 10);
        const rows = Math.ceil(unwrappedWidth / viewportWidth);
        const height = 51 + Math.max(1, rows) * this.#rowHeight;
        bucket.bucketHeight = height;
      }
      return;
    }
    this.#layoutBucket(bucket, noDefer);
  }

  #layoutBucket(bucket: AssetBucket, noDefer: boolean = false) {
    let cummulativeHeight = 0;
    let cummulativeWidth = 0;
    let lastRowHeight = 0;
    let lastRow = 0;

    let dateGroupRow = 0;
    let dateGroupCol = 0;

    const rowSpaceRemaining: number[] = Array.from({ length: bucket.dateGroups.length });
    rowSpaceRemaining.fill(this.viewportWidth, 0, bucket.dateGroups.length);
    const options = this.createLayoutOptions();
    for (const assetGroup of bucket.dateGroups) {
      assetGroup.layout(options, noDefer);
      rowSpaceRemaining[dateGroupRow] -= assetGroup.width - 1;
      if (dateGroupCol > 0) {
        rowSpaceRemaining[dateGroupRow] -= this.gap;
      }
      if (rowSpaceRemaining[dateGroupRow] >= 0) {
        assetGroup.row = dateGroupRow;
        assetGroup.col = dateGroupCol;
        assetGroup.left = cummulativeWidth;
        assetGroup.top = cummulativeHeight;

        dateGroupCol++;

        cummulativeWidth += assetGroup.width + this.gap;
      } else {
        cummulativeWidth = 0;
        dateGroupRow++;
        dateGroupCol = 0;
        assetGroup.row = dateGroupRow;
        assetGroup.col = dateGroupCol;
        assetGroup.left = cummulativeWidth;

        rowSpaceRemaining[dateGroupRow] -= assetGroup.width;
        dateGroupCol++;
        cummulativeHeight += lastRowHeight;
        assetGroup.top = cummulativeHeight;
        cummulativeWidth += assetGroup.width + this.gap;
        lastRow = assetGroup.row - 1;
      }
      lastRowHeight = assetGroup.height + this.headerHeight;
    }
    if (lastRow === 0 || lastRow !== bucket.lastDateGroup?.row) {
      cummulativeHeight += lastRowHeight;
    }

    bucket.bucketHeight = cummulativeHeight;
    bucket.isBucketHeightActual = true;
  }

  async loadBucket(yearMonth: TimelinePlainYearMonth, options?: { cancelable: boolean }): Promise<void> {
    let cancelable = true;
    if (options) {
      cancelable = options.cancelable;
    }
    const bucket = this.getBucketByDate(yearMonth);
    if (!bucket) {
      return;
    }

    if (bucket.loader?.executed) {
      return;
    }

    const result = await bucket.loader?.execute(async (signal: AbortSignal) => {
      if (bucket.getFirstAsset()) {
        return;
      }
      const timeBucket = toISOLocalDateTime(bucket.yearMonth);
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
        const unprocessedAssets = bucket.addAssets(bucketResponse);
        if (unprocessedAssets.length > 0) {
          console.error(
            `Warning: getTimeBucket API returning assets not in requested month: ${bucket.yearMonth.month}, ${JSON.stringify(
              unprocessedAssets.map((unprocessed) => ({
                id: unprocessed.id,
                localDateTime: unprocessed.localDateTime,
              })),
            )}`,
          );
        }
        this.#layoutBucket(bucket);
      }
    }, cancelable);
    if (result === 'LOADED') {
      this.#updateIntersection(bucket);
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
    this.#addAssetsToBuckets([...notUpdated]);
  }

  #addAssetsToBuckets(assets: TimelineAsset[]) {
    if (assets.length === 0) {
      return;
    }

    const addContext = new AddContext();
    const updatedBuckets = new Set<AssetBucket>();
    const bucketCount = this.buckets.length;
    for (const asset of assets) {
      let bucket = this.getBucketByDate(asset.localDateTime);

      if (!bucket) {
        bucket = new AssetBucket(this, asset.localDateTime, 1, this.#options.order);
        bucket.isLoaded = true;
        this.buckets.push(bucket);
      }

      bucket.addTimelineAsset(asset, addContext);
      updatedBuckets.add(bucket);
    }

    if (this.buckets.length !== bucketCount) {
      this.buckets.sort((a, b) => {
        return a.yearMonth.year === b.yearMonth.year
          ? b.yearMonth.month - a.yearMonth.month
          : b.yearMonth.year - a.yearMonth.year;
      });
    }

    for (const group of addContext.existingDateGroups) {
      group.sortAssets(this.#options.order);
    }

    for (const bucket of addContext.bucketsWithNewDateGroups) {
      bucket.sortDateGroups();
    }

    for (const bucket of addContext.updatedBuckets) {
      bucket.sortDateGroups();
      this.#updateGeometry(bucket, { invalidateHeight: true });
    }
    this.updateIntersections();
  }

  getBucketByDate(targetYearMonth: TimelinePlainYearMonth): AssetBucket | undefined {
    return this.buckets.find(
      (bucket) => bucket.yearMonth.year === targetYearMonth.year && bucket.yearMonth.month === targetYearMonth.month,
    );
  }

  async findBucketForAsset(id: string) {
    if (!this.isInitialized) {
      await this.initTask.waitUntilCompletion();
    }
    let { bucket } = this.#findBucketForAsset(id) ?? {};
    if (bucket) {
      return bucket;
    }
    const asset = toTimelineAsset(await getAssetInfo({ id, key: authManager.key }));
    if (!asset || this.isExcluded(asset)) {
      return;
    }
    bucket = await this.#loadBucketAtTime(asset.localDateTime, { cancelable: false });
    if (bucket?.findAssetById({ id })) {
      return bucket;
    }
  }

  async #loadBucketAtTime(yearMonth: TimelinePlainYearMonth, options?: { cancelable: boolean }) {
    await this.loadBucket(yearMonth, options);
    return this.getBucketByDate(yearMonth);
  }

  getBucketIndexByAssetId(assetId: string) {
    const bucketInfo = this.#findBucketForAsset(assetId);
    return bucketInfo?.bucket;
  }

  async getRandomBucket() {
    const random = Math.floor(Math.random() * this.buckets.length);
    const bucket = this.buckets[random];
    await this.loadBucket(bucket.yearMonth, { cancelable: false });
    return bucket;
  }

  async getRandomAsset() {
    const bucket = await this.getRandomBucket();
    return bucket?.getRandomAsset();
  }

  #runAssetOperation(ids: Set<string>, operation: AssetOperation) {
    if (ids.size === 0) {
      return { processedIds: new Set(), unprocessedIds: ids, changedGeometry: false };
    }

    const changedBuckets = new Set<AssetBucket>();
    let idsToProcess = new Set(ids);
    const idsProcessed = new Set<string>();
    const combinedMoveAssets: { asset: TimelineAsset; date: TimelinePlainDate }[][] = [];
    for (const bucket of this.buckets) {
      if (idsToProcess.size > 0) {
        const { moveAssets, processedIds, changedGeometry } = bucket.runAssetOperation(idsToProcess, operation);
        if (moveAssets.length > 0) {
          combinedMoveAssets.push(moveAssets);
        }
        idsToProcess = idsToProcess.difference(processedIds);
        for (const id of processedIds) {
          idsProcessed.add(id);
        }
        if (changedGeometry) {
          changedBuckets.add(bucket);
        }
      }
    }
    if (combinedMoveAssets.length > 0) {
      this.#addAssetsToBuckets(combinedMoveAssets.flat().map((a) => a.asset));
    }
    const changedGeometry = changedBuckets.size > 0;
    for (const bucket of changedBuckets) {
      this.#updateGeometry(bucket, { invalidateHeight: true });
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
    for (const bucket of this.buckets) {
      this.#updateGeometry(bucket, { invalidateHeight: true });
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
    const bucket = this.#findBucketForDate(dateTime);
    if (!bucket) {
      return;
    }
    await this.loadBucket(dateTime, { cancelable: false });
    const asset = bucket.findClosest(dateTime);
    if (asset) {
      return asset;
    }
    for await (const asset of this.assetsIterator({ startBucket: bucket })) {
      return asset;
    }
  }

  async retrieveRange(start: AssetDescriptor, end: AssetDescriptor) {
    let { asset: startAsset, bucket: startBucket } = this.#findBucketForAsset(start.id) ?? {};
    if (!startBucket || !startAsset) {
      return [];
    }
    let { asset: endAsset, bucket: endBucket } = this.#findBucketForAsset(end.id) ?? {};
    if (!endBucket || !endAsset) {
      return [];
    }
    let direction: Direction = 'earlier';
    if (plainDateTimeCompare(true, startAsset.localDateTime, endAsset.localDateTime) < 0) {
      [startAsset, endAsset] = [endAsset, startAsset];
      [startBucket, endBucket] = [endBucket, startBucket];
      direction = 'earlier';
    }

    const range: TimelineAsset[] = [];
    const startDateGroup = startBucket.findDateGroupForAsset(startAsset);
    for await (const targetAsset of this.assetsIterator({
      startBucket,
      startDateGroup,
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
    const { asset, bucket } = this.#findBucketForAsset(assetDescriptor.id) ?? {};
    if (!bucket || !asset) {
      return;
    }

    switch (interval) {
      case 'asset': {
        return this.#getAssetByAssetOffset(asset, bucket, direction);
      }
      case 'day': {
        return this.#getAssetByDayOffset(asset, bucket, direction);
      }
      case 'month': {
        return this.#getAssetByMonthOffset(bucket, direction);
      }
      case 'year': {
        return this.#getAssetByYearOffset(bucket, direction);
      }
    }
  }

  async #getAssetByAssetOffset(asset: TimelineAsset, bucket: AssetBucket, direction: Direction) {
    const dateGroup = bucket.findDateGroupForAsset(asset);
    for await (const targetAsset of this.assetsIterator({
      startBucket: bucket,
      startDateGroup: dateGroup,
      startAsset: asset,
      direction,
    })) {
      if (asset.id === targetAsset.id) {
        continue;
      }
      return targetAsset;
    }
  }

  async #getAssetByDayOffset(asset: TimelineAsset, bucket: AssetBucket, direction: Direction) {
    const dateGroup = bucket.findDateGroupForAsset(asset);
    for await (const targetAsset of this.assetsIterator({
      startBucket: bucket,
      startDateGroup: dateGroup,
      startAsset: asset,
      direction,
    })) {
      if (targetAsset.localDateTime.day !== asset.localDateTime.day) {
        return targetAsset;
      }
    }
  }

  async #getAssetByMonthOffset(bucket: AssetBucket, direction: Direction) {
    for (const targetBucket of this.bucketsIterator({ startBucket: bucket, direction })) {
      if (targetBucket.yearMonth.month !== bucket.yearMonth.month) {
        for await (const targetAsset of this.assetsIterator({ startBucket: targetBucket, direction })) {
          return targetAsset;
        }
      }
    }
  }

  async #getAssetByYearOffset(bucket: AssetBucket, direction: Direction) {
    for (const targetBucket of this.bucketsIterator({ startBucket: bucket, direction })) {
      if (targetBucket.yearMonth.year !== bucket.yearMonth.year) {
        for await (const targetAsset of this.assetsIterator({ startBucket: targetBucket, direction })) {
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
