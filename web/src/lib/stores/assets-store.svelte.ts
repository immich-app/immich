import { locale } from '$lib/stores/preferences.store';
import { getKey } from '$lib/utils';
import { generateId } from '$lib/utils/generate-id';
import { type getJustifiedLayoutFromAssetsFunction } from '$lib/utils/layout-utils';
import type { AssetGridRouteSearchParams } from '$lib/utils/navigation';
import { fromLocalDateTime, splitBucketIntoDateGroups, type DateGroup } from '$lib/utils/timeline-util';
import { TimeBucketSize, getAssetInfo, getTimeBucket, getTimeBuckets, type AssetResponseDto } from '@immich/sdk';
import { throttle } from 'lodash-es';
import { DateTime } from 'luxon';
import { t } from 'svelte-i18n';
import { SvelteSet } from 'svelte/reactivity';
import { get, writable, type Unsubscriber } from 'svelte/store';
import { handleError } from '../utils/handle-error';
import { websocketEvents } from './websocket';

let getJustifiedLayoutFromAssets: getJustifiedLayoutFromAssetsFunction;

type AssetApiGetTimeBucketsRequest = Parameters<typeof getTimeBuckets>[0];
export type AssetStoreOptions = Omit<AssetApiGetTimeBucketsRequest, 'size'>;

export interface Viewport {
  width: number;
  height: number;
}
export type ViewportXY = Viewport & {
  x: number;
  y: number;
};

interface AssetLookup {
  bucket: AssetBucket;
  bucketIndex: number;
  assetIndex: number;
}

const GAP = 12;
const HEADER = 49; //(1.5rem)

function getPosition(geometry: JustifiedLayout, boxIdx: number) {
  const top = geometry.getTop(boxIdx);
  const left = geometry.getLeft(boxIdx);
  const width = geometry.getWidth(boxIdx);
  const height = geometry.getHeight(boxIdx);

  return { top, left, width, height };
}

export class AssetBucket {
  store!: AssetStore;
  index!: number;
  bucketDate: string = $state('');
  /**
   * The DOM height of the bucket in pixel
   * This value is first estimated by the number of asset and later is corrected as the user scroll
   * Do not derive this height, it is important for it to be updated at specific times, so that
   * calculateing a delta between estimated and actual (when measured) is correct.
   */
  bucketHeight: number = $state(0);
  isBucketHeightActual: boolean = $state(false);
  bucketDateFormattted!: string;
  bucketCount: number = $derived.by(() => (this.isLoaded ? this.assets.length : this.initialCount));
  initialCount: number = 0;
  assets: AssetResponseDto[] = $state([]);

  dateGroups: DateGroup[] = $state([]);
  dateGroupsAssetsAbsolutePositions = $derived.by(() => {
    const positions = [];
    for (let i = 0; i < this.dateGroups.length; i++) {
      const group = this.dateGroups[i];
      const idx = this.store.buckets.indexOf(group.bucket);
      const buckheight = this.store.absoluteBucketHeights[idx];

      const height = buckheight + this.absoluteDateGroupHeights[i];
      const assets = [];
      for (let j = 0; j < group.assets.length; j++) {
        const position = getPosition(group.geometry, j);
        assets.push({
          top: height + position.top,
          bottom: height + position.top + position.height,
        });
      }
      positions.push(assets);
    }
    return positions;
  });
  absoluteDateGroupHeights = $derived.by(() => {
    const heights: number[] = [];
    let cummulativeHeight = 0;
    const rows = this.dateGroups.slice().pop()?.row || -1;
    for (let i = 0, j = 0; i <= rows; i++) {
      let group = this.dateGroups[j];
      const groupHeight = group.geometry.containerHeight;
      while (group && group.row === i) {
        j++;
        group = this.dateGroups[j];
        heights.push(cummulativeHeight);
      }
      cummulativeHeight += groupHeight + HEADER;
    }
    return heights;
  });
  absoluteDateGroupWidths = $derived.by(() => {
    const dateGroupWidths: number[][] = [];

    const rows = this.dateGroups.slice().pop()?.row || 0;
    for (let i = 0, j = 0; i <= rows; i++) {
      let cummulativeWidth = 0;
      const widths: number[] = [];
      let group = this.dateGroups[j];

      while (group && group.row === i) {
        const width = group.geometry.containerWidth;
        j++;
        group = this.dateGroups[j];
        widths.push(cummulativeWidth);
        cummulativeWidth += width + GAP;
      }
      dateGroupWidths.push(widths);
    }
    return dateGroupWidths;
  });

  cancelToken: AbortController | undefined = $state();
  /**
   * Prevent this asset's load from being canceled; i.e. to force load of offscreen asset.
   */
  isPreventCancel: boolean = $state(false);
  /**
   * A promise that resolves once the bucket is loaded, and rejects if bucket is canceled.
   */
  complete!: Promise<unknown>;
  loading: boolean = $state(false);
  isLoaded: boolean = $state(false);
  intersecting: boolean = $state(false);
  measured: boolean = $state(false);
  measuredPromise!: Promise<void>;

  constructor(props: Partial<AssetBucket> & { index: number; store: AssetStore; bucketDate: string }) {
    Object.assign(this, props);
    this.init();
  }
  /** The svelte key for this view model object */
  get viewId() {
    return this.store.viewId + '-' + this.bucketDate;
  }
  private init() {
    // create a promise, and store its resolve/reject callbacks. The loadedSignal callback
    // will be incoked when a bucket is loaded, fulfilling the promise. The canceledSignal
    // callback will be called if the bucket is canceled before it was loaded, rejecting the
    // promise.
    this.complete = new Promise<void>((resolve, reject) => {
      this.loadedSignal = resolve;
      this.canceledSignal = reject;
    }).catch(
      () =>
        // if no-one waits on complete, and its rejected a uncaught rejection message is logged.
        // We this message with an empty reject handler, since waiting on a bucket is optional.
        void 0,
    );
    this.measuredPromise = new Promise((resolve) => {
      this.measuredSignal = resolve;
    });

    this.bucketDateFormattted = fromLocalDateTime(this.bucketDate)
      .startOf('month')
      .toJSDate()
      .toLocaleString(get(locale), {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
  }

  private loadedSignal: (() => void) | undefined;
  private canceledSignal: (() => void) | undefined;
  measuredSignal: (() => void) | undefined;

  findDateGroupByAssetId(assetId: string) {
    for (let dateGroupIndex = 0; dateGroupIndex < this.dateGroups.length; dateGroupIndex++) {
      const dateGroup = this.dateGroups[dateGroupIndex];
      const assetIndex = dateGroup.assets.findIndex((asset) => asset.id === assetId);
      if (assetIndex !== -1) {
        const asset = dateGroup.assets[assetIndex];
        return {
          asset,
          dateGroup,
          assetIndex,
        };
      }
    }
    return null;
  }

  findAssetAbsolutePosition(assetId: string) {
    const searchResult = this.findDateGroupByAssetId(assetId);
    if (searchResult) {
      const dateGroup = searchResult.dateGroup;
      const bucket = dateGroup.bucket;
      const assetHeight = bucket.dateGroupsAssetsAbsolutePositions[dateGroup.index][searchResult.assetIndex];
      return assetHeight.top;
    }
    return null;
  }

  cancel() {
    if (this.isLoaded) {
      return;
    }
    if (this.isPreventCancel) {
      return;
    }
    this.cancelToken?.abort();

    this.canceledSignal?.();
    this.init();
  }

  loaded() {
    this.loadedSignal?.();
    this.isLoaded = true;
  }

  errored() {
    this.canceledSignal?.();
    this.init();
  }
}

const isMismatched = (option: boolean | undefined, value: boolean): boolean =>
  option === undefined ? false : option !== value;

const THUMBNAIL_HEIGHT = 235;

interface AddAsset {
  type: 'add';
  values: AssetResponseDto[];
}

interface UpdateAsset {
  type: 'update';
  values: AssetResponseDto[];
}

interface DeleteAsset {
  type: 'delete';
  values: string[];
}

interface TrashAssets {
  type: 'trash';
  values: string[];
}
interface UpdateStackAssets {
  type: 'update_stack_assets';
  values: string[];
}

export const photoViewerImgElement = writable<HTMLImageElement | null>(null);

type PendingChange = AddAsset | UpdateAsset | DeleteAsset | TrashAssets | UpdateStackAssets;

export type BucketListener = (
  event:
    | ViewPortEvent
    | BucketLoadEvent
    | BucketLoadedEvent
    | BucketCancelEvent
    | BucketHeightEvent
    | DateGroupIntersecting
    | DateGroupHeightEvent,
) => void;

type ViewPortEvent = {
  type: 'viewport';
};
type BucketLoadEvent = {
  type: 'load';
  bucket: AssetBucket;
};
type BucketLoadedEvent = {
  type: 'loaded';
  bucket: AssetBucket;
};
type BucketCancelEvent = {
  type: 'cancel';
  bucket: AssetBucket;
};
type BucketHeightEvent = {
  type: 'bucket-height';
  bucket: AssetBucket;
  delta: number;
};
type DateGroupIntersecting = {
  type: 'intersecting';
  bucket: AssetBucket;
  dateGroup: DateGroup;
};
type DateGroupHeightEvent = {
  type: 'height';
  bucket: AssetBucket;
  dateGroup: DateGroup;
  delta: number;
  height: number;
};

export class AssetStore {
  private assetToBucket: Record<string, AssetLookup> = $derived.by(() => {
    const result: Record<string, AssetLookup> = {};
    for (let index = 0; index < this.buckets.length; index++) {
      const bucket = this.buckets[index];
      for (let index_ = 0; index_ < bucket.assets.length; index_++) {
        const asset = bucket.assets[index_];
        result[asset.id] = { bucket, bucketIndex: index, assetIndex: index_ };
      }
    }
    return result;
  });
  private pendingChanges: PendingChange[] = [];
  private unsubscribers: Unsubscriber[] = [];
  private options!: AssetApiGetTimeBucketsRequest;
  viewport: Viewport = $state({
    height: 0,
    width: 0,
  });

  /** The svelte key for this view model object */
  viewId = generateId();

  lastScrollTime: number = $state(0);

  // subscribe = this.store$.subscribe;
  /**
   * A promise that resolves once the store is initialized.
   */
  initialized!: Promise<void>;
  initializedSignal: (() => void) | undefined;
  isInitialized = $state(false);
  timelineHeight = $state(0);
  buckets: AssetBucket[] = $state([]);
  absoluteBucketHeights = $derived.by(() => {
    const heights: number[] = [];
    let cummulativeHeight = this.visibleWindow.topSectionHeight;
    for (const bucket of this.buckets) {
      heights.push(cummulativeHeight);
      cummulativeHeight += bucket.bucketHeight;
    }
    return heights;
  });
  assets: AssetResponseDto[] = $derived.by(() => {
    return this.buckets.flatMap(({ assets }) => assets);
  });
  albumAssets: Set<string> = new SvelteSet();
  pendingScrollBucket: AssetBucket | undefined = $state();
  pendingScrollAssetId: string | undefined = $state();
  maxBucketAssets = $state(0);
  visibleWindow = $state({ topSectionHeight: 0, top: 0, bottom: 0 });
  firstIntersectingBucket = $state();

  private listeners: BucketListener[] = [];

  constructor(
    options: AssetStoreOptions,
    private albumId?: string,
  ) {
    this.setOptions();
    void this.updateOptions({ ...options });
  }

  private setOptions(options?: AssetStoreOptions) {
    this.options = { ...options, size: TimeBucketSize.Month };
  }

  private addPendingChanges(...changes: PendingChange[]) {
    // prevent websocket events from happening before local client events
    setTimeout(() => {
      this.pendingChanges.push(...changes);
      this.processPendingChanges();
    }, 1000);
  }

  connect() {
    this.unsubscribers.push(
      websocketEvents.on('on_upload_success', (_) => {
        // TODO!: Temporarily disable to avoid flashing effect of the timeline
        // this.addPendingChanges({ type: 'add', values: [asset] });
      }),
      websocketEvents.on('on_asset_trash', (ids) => {
        this.addPendingChanges({ type: 'trash', values: ids });
      }),
      websocketEvents.on('on_asset_update', (asset) => {
        this.addPendingChanges({ type: 'update', values: [asset] });
      }),
      websocketEvents.on('on_asset_delete', (id: string) => {
        this.addPendingChanges({ type: 'delete', values: [id] });
      }),
    );
  }

  disconnect() {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers = [];
  }

  private getPendingChangeBatches() {
    const batches: PendingChange[] = [];
    let batch: PendingChange | undefined;

    for (const { type, values: _values } of this.pendingChanges) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const values = _values as any[];

      if (batch && batch.type !== type) {
        batches.push(batch);
        batch = undefined;
      }

      if (batch) {
        batch.values.push(...values);
      } else {
        batch = { type, values };
      }
    }

    if (batch) {
      batches.push(batch);
    }

    return batches;
  }

  updateSlidingWindow({ topSectionHeight, top, bottom }: { topSectionHeight: number; top: number; bottom: number }) {
    this.visibleWindow = { topSectionHeight, top, bottom };
    this.updateIntersections();
  }

  updateIntersections() {
    if (!this.isInitialized) {
      return;
    }

    const heights = this.absoluteBucketHeights;

    let firstIntersected;

    for (const [i, bucketTop] of heights.entries()) {
      const bucket = this.buckets[i];
      const bucketBottom = bucketTop + bucket.bucketHeight;

      if (bucketTop < this.visibleWindow.bottom && bucketBottom > this.visibleWindow.top) {
        bucket.intersecting = true;
        if (!firstIntersected) {
          firstIntersected = bucket.bucketDate;
        }

        void this.loadBucket(bucket.bucketDate);
        const dateGroups = bucket.dateGroups;

        for (const [h, group] of dateGroups.entries()) {
          const positions = bucket.dateGroupsAssetsAbsolutePositions[h];
          for (let j = 0; j < group.assets.length; j++) {
            const assetTop = positions[j].top;
            const assetBottom = positions[j].bottom;
            group.assetsIntersecting[j] = assetBottom > this.visibleWindow.top && assetTop < this.visibleWindow.bottom ? true : false;
          }

          group.intersecting = group.assetsIntersecting.includes(true);

        }
      } else {
        bucket.intersecting = false;
        bucket.cancel();
        const dateGroups = bucket.dateGroups;
        for (const group of dateGroups) {
          for (let j = 0; j < group.assets.length; j++) {
            group.assetsIntersecting[j] = false;
          }
        }
      }
    }
    if (firstIntersected !== this.firstIntersectingBucket) {
      this.firstIntersectingBucket = firstIntersected;
    }
  }

  processPendingChanges = throttle(() => {
    for (const { type, values } of this.getPendingChangeBatches()) {
      switch (type) {
        case 'add': {
          this.addAssets(values);
          break;
        }

        case 'update': {
          this.updateAssets(values);
          break;
        }

        case 'trash': {
          if (!this.options.isTrashed) {
            this.removeAssets(values);
          }
          break;
        }

        case 'delete': {
          this.removeAssets(values);
          break;
        }
      }
    }

    this.pendingChanges = [];
    // this.emit(true);
  }, 2500);

  addListener(bucketListener: BucketListener) {
    this.listeners.push(bucketListener);
  }
  removeListener(bucketListener: BucketListener) {
    this.listeners = this.listeners.filter((l) => l != bucketListener);
  }
  private notifyListeners(
    event:
      | ViewPortEvent
      | BucketLoadEvent
      | BucketLoadedEvent
      | BucketCancelEvent
      | BucketHeightEvent
      | DateGroupIntersecting
      | DateGroupHeightEvent,
  ) {
    for (const fn of this.listeners) {
      fn(event);
    }
  }
  async init({ bucketListener }: { bucketListener?: BucketListener } = {}) {
    if (this.isInitialized) {
      throw 'Can only init once';
    }
    if (!getJustifiedLayoutFromAssets) {
      const module = await import('$lib/utils/layout-utils');
      getJustifiedLayoutFromAssets = module.getJustifiedLayoutFromAssets;
    }

    if (bucketListener) {
      this.addListener(bucketListener);
    }
    await this.initialiazeTimeBuckets();
  }

  async initialiazeTimeBuckets() {
    this.timelineHeight = 0;
    this.buckets = [];
    this.albumAssets.clear();

    const timebuckets = await getTimeBuckets({
      ...this.options,
      key: getKey(),
    });
    this.buckets = timebuckets.map(
      (bucket, index) =>
        new AssetBucket({ index, store: this, bucketDate: bucket.timeBucket, initialCount: bucket.count }),
    );

    this.isInitialized = true;
    // After initialization, we must layout at least the first bucket, or else it will be canceled
    // since the height of the first bucket is 0, which will not intersect with the sliding window
    const firstBucket = this.buckets[0];
    if (firstBucket) {
      await this.loadBucket(firstBucket.bucketDate, { preventCancel: true });
    }
    await this.updateViewportGeometry(false);
    this.initializedSignal?.();
  }

  async updateOptions(options: AssetStoreOptions) {
    // TODO: don't call updateObjects frequently after
    // init - cancelation of the initialize tasks isn't
    // performed right now, and will cause issues if
    // multiple updateOptions() calls are interleved.
    await this.initialized;
    this.isInitialized = false;
    this.initialized = new Promise<void>((resolve) => {
      this.initializedSignal = resolve;
    });
    this.viewId = generateId();
    this.setOptions(options);
    await this.initialiazeTimeBuckets();
  }

  public destroy() {
    this.listeners = [];
    this.isInitialized = false;
  }

  async updateViewport(viewport: Viewport, force?: boolean) {
    if (viewport.height === 0 && viewport.width === 0) {
      return;
    }
    if (!force && this.viewport.height === viewport.height && this.viewport.width === viewport.width) {
      return;
    }
    await this.initialized;
    // changing width invalidates the actual height, and needs to be remeasured, since width changes causes
    // layout reflows.
    const changedWidth = this.viewport.width != viewport.width;
    this.viewport = { ...viewport };
    await this.updateViewportGeometry(changedWidth);
  }

  private async updateViewportGeometry(changedWidth: boolean) {
    if (!this.isInitialized) {
      return;
    }
    for (const bucket of this.buckets) {
      this.updateGeometry(bucket, changedWidth);
    }
    this.updateIntersections();
    this.timelineHeight = this.buckets.reduce((accumulator, b) => accumulator + b.bucketHeight, 0);

    const loaders = [];
    let height = 0;
    for (const bucket of this.buckets) {
      if (height >= this.viewport.height) {
        break;
      }
      height += bucket.bucketHeight;
      loaders.push(this.loadBucket(bucket.bucketDate, { preventCancel: true }));
    }
    await Promise.all(loaders);
    this.notifyListeners({ type: 'viewport' });
  }

  private updateGeometry(bucket: AssetBucket, invalidateHeight: boolean) {
    if (invalidateHeight) {
      bucket.isBucketHeightActual = false;
      bucket.measured = false;
      for (const assetGroup of bucket.dateGroups) {
        assetGroup.heightActual = false;
      }
    }
    const viewportWidth = this.viewport.width;
    if (!bucket.isBucketHeightActual) {
      const unwrappedWidth = (3 / 2) * bucket.bucketCount * THUMBNAIL_HEIGHT * (7 / 10);
      const rows = Math.ceil(unwrappedWidth / viewportWidth);
      const height = 51 + Math.max(1, rows) * THUMBNAIL_HEIGHT;

      this.setBucketHeight(bucket, height, false);
    }

    if (bucket.isLoaded) {
      bucket.isBucketHeightActual = true;
    } else {
      return;
    }

    const layoutOptions = {
      spacing: 2,
      heightTolerance: 0.15,
      rowHeight: 235,
      rowWidth: Math.floor(viewportWidth),
    };

    let cummulativeHeight = 0;
    let lastRowHeight = 0;
    let lastRow = 0;

    let dateGroupRow = 0;
    let dateGroupCol = 0;

    const rowSpaceRemaining: number[] = Array.from({ length: bucket.dateGroups.length });
    rowSpaceRemaining.fill(viewportWidth, 0, bucket.dateGroups.length);
    for (const assetGroup of bucket.dateGroups) {
      if (!assetGroup.heightActual) {
        const unwrappedWidth = (3 / 2) * assetGroup.assets.length * THUMBNAIL_HEIGHT * (7 / 10);
        const rows = Math.ceil(unwrappedWidth / this.viewport.width);
        const height = rows * THUMBNAIL_HEIGHT;
        assetGroup.height = height;
      }
      assetGroup.geometry = getJustifiedLayoutFromAssets!(assetGroup.assets, layoutOptions);
      rowSpaceRemaining[dateGroupRow] -= assetGroup.geometry.containerWidth - 1;
      if (dateGroupCol > 0) {
        rowSpaceRemaining[dateGroupRow] -= GAP;
      }
      if (rowSpaceRemaining[dateGroupRow] >= 0) {
        assetGroup.row = dateGroupRow;
        assetGroup.col = dateGroupCol;
        dateGroupCol++;
      } else {
        dateGroupRow++;
        dateGroupCol = 0;
        assetGroup.row = dateGroupRow;
        assetGroup.col = dateGroupCol;
        rowSpaceRemaining[dateGroupRow] -= assetGroup.geometry.containerWidth;
        dateGroupCol++;
        cummulativeHeight += lastRowHeight;
        lastRow = assetGroup.row - 1;
      }
      lastRowHeight = assetGroup.geometry.containerHeight + HEADER;
      assetGroup.height = assetGroup.geometry.containerHeight;
    }
    if (lastRow !== bucket.dateGroups.at(-1).row) {
      cummulativeHeight += lastRowHeight;
    }
    bucket.bucketHeight = cummulativeHeight;
  }

  async loadBucket(bucketDate: string, options: { preventCancel?: boolean; pending?: boolean } = {}): Promise<void> {
    const bucket = this.getBucketByDate(bucketDate);
    if (!bucket) {
      return;
    }
    if (bucket.isLoaded) {
      // already loaded
      return;
    }

    if (bucket.cancelToken != null && bucket.bucketCount !== bucket.assets.length) {
      // if promise is pending, and preventCancel is requested, then don't overwrite it
      if (!bucket.isPreventCancel && options.preventCancel) {
        bucket.isPreventCancel = options.preventCancel;
      }
      await bucket.complete;
      return;
    }

    if (options.pending) {
      this.pendingScrollBucket = bucket;
    }
    this.notifyListeners({ type: 'load', bucket });
    bucket.isPreventCancel = !!options.preventCancel;
    const cancelToken = (bucket.cancelToken = new AbortController());
    try {
      const assets = await getTimeBucket(
        {
          ...this.options,
          timeBucket: bucketDate,
          key: getKey(),
        },
        { signal: cancelToken.signal },
      );
      // await this.sleep(5000);
      if (cancelToken.signal.aborted) {
        this.notifyListeners({ type: 'cancel', bucket });
        return;
      }

      if (this.albumId) {
        const albumAssets = await getTimeBucket(
          {
            albumId: this.albumId,
            timeBucket: bucketDate,
            size: this.options.size,
            key: getKey(),
          },
          { signal: cancelToken.signal },
        );
        if (cancelToken.signal.aborted) {
          this.notifyListeners({ type: 'cancel', bucket });
          return;
        }
        for (const asset of albumAssets) {
          this.albumAssets.add(asset.id);
        }
      }

      // Attention: setting loaded here, because updateGeometry will be a no-op if
      // the bucket isn't already loaded, Don't introduce any awaits between this call
      // and the end of this function
      bucket.loaded();
      bucket.assets = assets;
      bucket.dateGroups = splitBucketIntoDateGroups(bucket, get(locale));
      this.maxBucketAssets = Math.max(this.maxBucketAssets, assets.length);
      this.updateGeometry(bucket, true);
      this.updateIntersections();
      this.timelineHeight = this.buckets.reduce((accumulator, b) => accumulator + b.bucketHeight, 0);

      // this.notifyListeners({ type: 'loaded', bucket });
    } catch (error) {
      /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
      if ((error as any).name === 'AbortError') {
        return;
      }
      const _$t = get(t);
      handleError(error, _$t('errors.failed_to_load_assets'));
      bucket.errored();
    } finally {
      bucket.cancelToken = undefined;
    }
  }

  setBucketHeight(bucket: AssetBucket, newHeight: number, isActualHeight: boolean) {
    const delta = newHeight - bucket.bucketHeight;
    bucket.isBucketHeightActual = isActualHeight;
    bucket.bucketHeight = newHeight;
    this.timelineHeight += delta;
    this.notifyListeners({ type: 'bucket-height', bucket, delta });
  }

  updateBucket(bucketDate: string, properties: { height?: number; intersecting?: boolean; measured?: boolean }) {
    const bucket = this.getBucketByDate(bucketDate);
    if (!bucket) {
      return {};
    }
    const delta = 0;
    if ('height' in properties) {
      this.setBucketHeight(bucket, properties.height!, true);
    }
    if ('intersecting' in properties) {
      bucket.intersecting = properties.intersecting!;
    }
    if ('measured' in properties) {
      if (properties.measured) {
        bucket.measuredSignal?.();
      }
      bucket.measured = properties.measured!;
    }
    return { delta };
  }

  updateBucketDateGroup(
    bucket: AssetBucket,
    dateGroup: DateGroup,
    properties: { height?: number; intersecting?: boolean },
  ) {
    let delta = 0;
    if ('height' in properties) {
      const height = properties.height!;
      if (height > 0) {
        delta = height - dateGroup.height;
        dateGroup.heightActual = true;
        dateGroup.height = height;
        this.notifyListeners({ type: 'height', bucket, dateGroup, delta, height });
      }
    }
    if ('intersecting' in properties) {
      dateGroup.intersecting = properties.intersecting!;
      if (dateGroup.intersecting) {
        this.notifyListeners({ type: 'intersecting', bucket, dateGroup });
      }
    }
    return { delta };
  }

  addAssets(assets: AssetResponseDto[]) {
    const assetsToUpdate: AssetResponseDto[] = [];
    const assetsToAdd: AssetResponseDto[] = [];

    for (const asset of assets) {
      if (
        this.assetToBucket[asset.id] ||
        this.options.userId ||
        this.options.personId ||
        this.options.albumId ||
        this.isExcluded(asset)
      ) {
        // If asset is already in the bucket we don't need to recalculate
        // asset store containers
        assetsToUpdate.push(asset);
      } else {
        assetsToAdd.push(asset);
      }
    }

    this.updateAssets(assetsToUpdate);
    this.addAssetsToBuckets(assetsToAdd);
  }

  private addAssetsToBuckets(assets: AssetResponseDto[]) {
    if (assets.length === 0) {
      return;
    }
    const updatedBuckets = new Set<AssetBucket>();

    for (const asset of assets) {
      const timeBucket = DateTime.fromISO(asset.localDateTime).toUTC().startOf('month').toString();
      let bucket = this.getBucketByDate(timeBucket);

      if (!bucket) {
        const index = this.buckets.length;
        bucket = new AssetBucket({ index, store: this, bucketDate: timeBucket, bucketHeight: THUMBNAIL_HEIGHT });
        this.buckets.push(bucket);
      }

      bucket.assets.push(asset);
      updatedBuckets.add(bucket);
    }

    this.buckets = this.buckets.sort((a, b) => {
      const aDate = DateTime.fromISO(a.bucketDate).toUTC();
      const bDate = DateTime.fromISO(b.bucketDate).toUTC();
      return bDate.diff(aDate).milliseconds;
    });

    for (const bucket of updatedBuckets) {
      bucket.assets.sort((a, b) => {
        const aDate = DateTime.fromISO(a.fileCreatedAt).toUTC();
        const bDate = DateTime.fromISO(b.fileCreatedAt).toUTC();
        return bDate.diff(aDate).milliseconds;
      });
      bucket.dateGroups = splitBucketIntoDateGroups(bucket, get(locale));
      this.updateGeometry(bucket, true);
    }
    this.updateIntersections();
  }

  getBucketByDate(bucketDate: string): AssetBucket | null {
    return this.buckets.find((bucket) => bucket.bucketDate === bucketDate) || null;
  }

  async findAndLoadBucketAsPending(id: string) {
    const bucketInfo = this.assetToBucket[id];
    let bucket: AssetBucket | null = bucketInfo?.bucket ?? null;
    if (!bucket) {
      const asset = await getAssetInfo({ id });
      if (!asset || this.isExcluded(asset)) {
        return;
      }
      bucket = await this.loadBucketAtTime(asset.localDateTime, { preventCancel: true, pending: true });
    }

    if (bucket && bucket.assets.some((a) => a.id === id)) {
      this.pendingScrollBucket = bucket;
      this.pendingScrollAssetId = id;
      return bucket;
    }
  }

  /* Must be paired with matching clearPendingScroll() call */
  async scheduleScrollToAssetId(scrollTarget: AssetGridRouteSearchParams, onFailure: () => void) {
    try {
      const { at: assetId } = scrollTarget;
      if (assetId) {
        await this.initialized;
        return await this.findAndLoadBucketAsPending(assetId);
      }
    } catch {
      // failure
    }
    onFailure();
  }

  clearPendingScroll() {
    this.pendingScrollBucket = undefined;
    this.pendingScrollAssetId = undefined;
  }

  private async loadBucketAtTime(localDateTime: string, options: { preventCancel?: boolean; pending?: boolean }) {
    let date = fromLocalDateTime(localDateTime);
    if (this.options.size == TimeBucketSize.Month) {
      date = date.set({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
    } else if (this.options.size == TimeBucketSize.Day) {
      date = date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    }
    const iso = date.toISO()!;
    await this.loadBucket(iso, options);
    return this.getBucketByDate(iso);
  }

  private async getBucketInfoForAsset(
    { id, localDateTime }: Pick<AssetResponseDto, 'id' | 'localDateTime'>,
    options: { preventCancel?: boolean; pending?: boolean } = {},
  ) {
    const bucketInfo = this.assetToBucket[id];
    if (bucketInfo) {
      return bucketInfo;
    }
    await this.loadBucketAtTime(localDateTime, options);
    return this.assetToBucket[id] || null;
  }

  getBucketIndexByAssetId(assetId: string) {
    return this.assetToBucket[assetId]?.bucketIndex ?? null;
  }

  async getRandomAsset(): Promise<AssetResponseDto | null> {
    let index = Math.floor(
      Math.random() * this.buckets.reduce((accumulator, bucket) => accumulator + bucket.bucketCount, 0),
    );
    for (const bucket of this.buckets) {
      if (index < bucket.bucketCount) {
        await this.loadBucket(bucket.bucketDate);
        return bucket.assets[index] || null;
      }

      index -= bucket.bucketCount;
    }

    return null;
  }

  updateAssets(assets: AssetResponseDto[]) {
    if (assets.length === 0) {
      return;
    }
    const assetsToRecalculate: AssetResponseDto[] = [];

    for (const _asset of assets) {
      const asset = this.assets.find((asset) => asset.id === _asset.id);
      if (!asset) {
        continue;
      }

      const recalculate = asset.localDateTime !== _asset.localDateTime;
      Object.assign(asset, _asset);

      if (recalculate) {
        assetsToRecalculate.push(asset);
      }
    }

    this.removeAssets(assetsToRecalculate.map((asset) => asset.id));
    this.addAssetsToBuckets(assetsToRecalculate);
  }

  removeAssets(ids: string[]) {
    const idSet = new Set(ids);

    // Iterate in reverse to allow array splicing.
    for (let index = this.buckets.length - 1; index >= 0; index--) {
      const bucket = this.buckets[index];
      let changed = false;
      for (let index_ = bucket.assets.length - 1; index_ >= 0; index_--) {
        const asset = bucket.assets[index_];
        if (!idSet.has(asset.id)) {
          continue;
        }

        bucket.assets.splice(index_, 1);
        changed = true;
        if (bucket.assets.length === 0) {
          this.buckets.splice(index, 1);
        }
      }
      if (changed) {
        bucket.dateGroups = splitBucketIntoDateGroups(bucket, get(locale));
        this.updateGeometry(bucket, true);
        this.updateIntersections();
      }
    }
  }

  async getPreviousAsset(asset: AssetResponseDto): Promise<AssetResponseDto | null> {
    const info = await this.getBucketInfoForAsset(asset);
    if (!info) {
      return null;
    }

    const { bucket, assetIndex, bucketIndex } = info;

    if (assetIndex !== 0) {
      return bucket.assets[assetIndex - 1];
    }

    if (bucketIndex === 0) {
      return null;
    }

    const previousBucket = this.buckets[bucketIndex - 1];
    await this.loadBucket(previousBucket.bucketDate);
    return previousBucket.assets.at(-1) || null;
  }

  async getNextAsset(asset: AssetResponseDto): Promise<AssetResponseDto | null> {
    const info = await this.getBucketInfoForAsset(asset);
    if (!info) {
      return null;
    }

    const { bucket, assetIndex, bucketIndex } = info;

    if (assetIndex !== bucket.assets.length - 1) {
      return bucket.assets[assetIndex + 1];
    }

    if (bucketIndex === this.buckets.length - 1) {
      return null;
    }

    const nextBucket = this.buckets[bucketIndex + 1];
    await this.loadBucket(nextBucket.bucketDate);
    return nextBucket.assets[0] || null;
  }

  private isExcluded(asset: AssetResponseDto) {
    return (
      isMismatched(this.options.isArchived ?? false, asset.isArchived) ||
      isMismatched(this.options.isFavorite, asset.isFavorite) ||
      isMismatched(this.options.isTrashed ?? false, asset.isTrashed)
    );
  }
}

export const isSelectingAllAssets = writable(false);
