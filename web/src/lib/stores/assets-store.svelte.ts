import { locale } from '$lib/stores/preferences.store';
import { getKey } from '$lib/utils';
import { CancellableTask } from '$lib/utils/cancellable-task';
import { emptyGeometry, getJustifiedLayoutFromAssets, type CommonJustifiedLayout } from '$lib/utils/layout-utils';
import { formatDateGroupTitle, fromLocalDateTime, groupDateFormat } from '$lib/utils/timeline-util';
import { TUNABLES } from '$lib/utils/tunables';
import { getAssetInfo, getTimeBucket, getTimeBuckets, TimeBucketSize, type AssetResponseDto } from '@immich/sdk';
import { groupBy, isEqual, sortBy, throttle } from 'lodash-es';
import { DateTime } from 'luxon';
import { t } from 'svelte-i18n';
import { SvelteSet } from 'svelte/reactivity';
import { get, writable, type Unsubscriber } from 'svelte/store';
import { handleError } from '../utils/handle-error';
import { websocketEvents } from './websocket';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

const THUMBNAIL_HEIGHT = 235;
const GAP = 12;
const HEADER = 49; //(1.5rem)

type AssetApiGetTimeBucketsRequest = Parameters<typeof getTimeBuckets>[0];
export type AssetStoreOptions = Omit<AssetApiGetTimeBucketsRequest, 'size'> & {
  timelineAlbumId?: string;
  deferInit?: boolean;
};

class IntersectingCalc {
  // --- public ---
  readonly #group: AssetDateGroup;
  readonly #index: number;
  intersecting = $derived(this.#isIntersecting());
  position = $derived.by(() => {
    const geo = this.#group.geometry;
    const index = this.#index;
    return {
      top: geo.getTop(index),
      left: geo.getLeft(index),
      width: geo.getWidth(index),
      height: geo.getHeight(index),
    };
  });
  asset = $derived.by(() => this.#group.assets[this.#index]);
  id = $derived(this.asset.id);

  constructor(group: AssetDateGroup, index: number) {
    this.#group = group;
    this.#index = index;
  }

  #isIntersecting() {
    const store = this.#group.bucket.store;
    const topWindow = store.visibleWindow.top - HEADER - INTERSECTION_EXPAND_TOP;
    const bottomWindow = store.visibleWindow.bottom - HEADER + INTERSECTION_EXPAND_BOTTOM;
    const position = this.#group.getAssetPosition(this.#index);
    const intersecting = position.bottom > topWindow && position.top < bottomWindow;
    return intersecting;
  }
}
class AssetDateGroup {
  // --- public
  readonly bucket: AssetBucket;
  readonly index: number;
  readonly date: DateTime;
  readonly assets: AssetResponseDto[];

  geometry: CommonJustifiedLayout = $state(emptyGeometry());
  height = $state(0);
  intersecting = $derived.by(() => this.assetsIntersecting.some((asset) => asset.intersecting));

  // --- private
  top: number = $state(0);
  left: number = $state(0);
  row = $state(0);
  col = $state(0);
  assetsIntersecting: IntersectingCalc[];

  constructor(bucket: AssetBucket, index: number, date: DateTime, assets: AssetResponseDto[]) {
    this.index = index;
    this.bucket = bucket;
    this.date = date;

    this.assets = assets;
    this.assetsIntersecting = Array.from(this.assets, (_asset, index) => new IntersectingCalc(this, index));
  }

  getAssetPosition(index: number) {
    const absoluteDateGroupTop = this.bucket.top + this.top;
    const position = getPosition(this.geometry, index);
    const top = absoluteDateGroupTop + position.top;
    return {
      top,
      bottom: top + position.height,
    };
  }

  get groupTitle() {
    return formatDateGroupTitle(this.date);
  }
}

export function splitBucketIntoDateGroups(bucket: AssetBucket, locale: string | undefined): AssetDateGroup[] {
  const grouped = groupBy(bucket.assets, (asset) =>
    fromLocalDateTime(asset.localDateTime).toLocaleString(groupDateFormat, { locale }),
  );
  const sorted = sortBy(grouped, (group) => bucket.assets.indexOf(group[0]));

  return sorted.map((group, index) => {
    const date = fromLocalDateTime(group[0].localDateTime).startOf('day');
    return new AssetDateGroup(bucket, index, date, group);
  });
}

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

function getPosition(geometry: CommonJustifiedLayout, boxIdx: number) {
  const top = geometry.getTop(boxIdx);
  const left = geometry.getLeft(boxIdx);
  const width = geometry.getWidth(boxIdx);
  const height = geometry.getHeight(boxIdx);

  return { top, left, width, height };
}

export class AssetBucket {
  // --- public ---
  intersecting: boolean = $state(false);
  assets: AssetResponseDto[] = $state([]);
  isLoaded: boolean = $state(false);
  dateGroups: AssetDateGroup[] = $state([]);
  readonly store: AssetStore;

  // --- private ---
  /**
   * The DOM height of the bucket in pixel
   * This value is first estimated by the number of asset and later is corrected as the user scroll
   * Do not derive this height, it is important for it to be updated at specific times, so that
   * calculateing a delta between estimated and actual (when measured) is correct.
   */
  #bucketHeight: number = $state(0);
  #top: number = $state(0);
  #initialCount: number = 0;

  // --- should be private, but is used by AssetStore ---
  bucketCount: number = $derived(this.isLoaded ? this.assets?.length || 0 : this.#initialCount);
  loader: CancellableTask | undefined;
  isBucketHeightActual: boolean = $state(false);
  readonly bucketDateFormatted: string;
  readonly index: number;
  readonly bucketDate: string;

  constructor(index: number, store: AssetStore, bucketDate: string, initialCount: number) {
    this.index = index;
    this.store = store;
    this.#initialCount = initialCount;
    this.bucketDate = bucketDate;
    this.bucketDateFormatted = fromLocalDateTime(this.bucketDate)
      .startOf('month')
      .toJSDate()
      .toLocaleString(get(locale), {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });

    this.loader = new CancellableTask(
      () => (this.isLoaded = true),
      () => (this.isLoaded = false),
      this.handleLoadError,
    );
  }

  /** The svelte key for this view model object */
  get viewId() {
    return this.bucketDate;
  }

  set bucketHeight(height: number) {
    const { store } = this;
    const bucketHeightDelta = height - this.#bucketHeight;
    const prevBucket = store.buckets[this.index - 1];
    if (prevBucket) {
      this.#top = prevBucket.#top + prevBucket.#bucketHeight;
    }
    if (bucketHeightDelta) {
      let cursor = this.index + 1;
      while (cursor < store.buckets.length) {
        const nextBucket = this.store.buckets[cursor];
        nextBucket.#top += bucketHeightDelta;
        cursor++;
      }
    }
    this.#bucketHeight = height;
    if (this.index !== 0 && store.topIntersectingBucket) {
      const currentIndex = store.buckets.indexOf(store.topIntersectingBucket);
      // if the bucket is 'before' the last intersecting bucket in the sliding window
      // then adjust the scroll position by the delta, to compensate for the bucket
      // size adjustment
      if (INTERSECTION_EXPAND_TOP > 0) {
        // we use < or = because the topIntersectingBucket is actually slightly expanded
        // because of INTERSECTION_EXPAND_TOP
        if (this.index <= currentIndex) {
          store.compensateScrollCallback?.(bucketHeightDelta);
        }
      } else {
        if (this.index <= currentIndex) {
          store.compensateScrollCallback?.(bucketHeightDelta);
        }
      }
    }
  }
  get bucketHeight() {
    return this.#bucketHeight;
  }

  set top(top: number) {
    this.#top = top;
  }
  get top() {
    return this.#top + this.store.topSectionHeight;
  }

  handleLoadError(error: unknown) {
    const _$t = get(t);
    handleError(error, _$t('errors.failed_to_load_assets'));
  }

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
    return;
  }

  findAssetAbsolutePosition(assetId: string) {
    const searchResult = this.findDateGroupByAssetId(assetId);
    if (searchResult) {
      const dateGroup = searchResult.dateGroup;
      return dateGroup.getAssetPosition(searchResult.assetIndex).top + 49;
    }
    return;
  }

  cancel() {
    this.loader?.cancel();
  }
}

const isMismatched = (option: boolean | undefined, value: boolean): boolean =>
  option === undefined ? false : option !== value;

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

export type LiteBucket = {
  bucketHeight: number;
  assetCount: number;
  bucketDate: string;
  bucketDateFormattted: string;
};

export class AssetStore {
  // --- public ----
  isInitialized = $state(false);
  buckets: AssetBucket[] = $state([]);
  topSectionHeight = $state(0);
  timelineHeight = $derived(
    this.buckets.reduce((accumulator, b) => accumulator + b.bucketHeight, 0) + this.topSectionHeight,
  );
  assets: AssetResponseDto[] = $derived.by(() => this.buckets.flatMap(({ assets }) => assets));
  // todo - name this better
  albumAssets: Set<string> = new SvelteSet();

  // -- for scrubber only
  scrubberBuckets: LiteBucket[] = $state([]);
  scrubberTimelineHieght: number = $state(0);

  // -- should be private, but used by AssetBucket
  compensateScrollCallback: ((delta: number) => void) | undefined;
  topIntersectingBucket: AssetBucket | undefined = $state();
  visibleWindow = $derived.by(() => {
    return this.#scrollTop === 0
      ? {
          top: 0,
          bottom: this.viewportHeight,
        }
      : {
          top: this.#scrollTop,
          bottom: this.#scrollTop + this.viewportHeight,
        };
  });
  initTask = new CancellableTask(
    () => {
      this.isInitialized = true;
    },
    () => (this.isInitialized = false),
    () => void 0,
  );

  // --- private
  // todo: this should probably be a method isteat
  #assetToBucket: Record<string, AssetLookup> = $derived.by(() => {
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

  #viewportHeight = $state(0);
  #viewportWidth = $state(0);
  #scrollTop = $state(0);
  #pendingChanges: PendingChange[] = [];
  #unsubscribers: Unsubscriber[] = [];
  static #INIT_OPTIONS = {};
  #options: AssetStoreOptions = AssetStore.#INIT_OPTIONS;

  constructor() {}

  set viewportWidth(value: number) {
    const changed = value !== this.#viewportWidth;
    this.#viewportWidth = value;
    // side-effect - its ok!
    void this.#updateViewportGeometry(changed);
  }

  get viewportWidth() {
    return this.#viewportWidth;
  }

  set viewportHeight(value: number) {
    this.#viewportHeight = value;
    // side-effect - its ok!
    void this.#updateViewportGeometry(false);
  }

  get viewportHeight() {
    return this.#viewportHeight;
  }

  #addPendingChanges(...changes: PendingChange[]) {
    // prevent websocket events from happening before local client events
    setTimeout(() => {
      this.#pendingChanges.push(...changes);
      this.#processPendingChanges();
    }, 1000);
  }

  connect() {
    this.#unsubscribers.push(
      websocketEvents.on('on_upload_success', (_) => {
        // TODO!: Temporarily disable to avoid flashing effect of the timeline
        // this.addPendingChanges({ type: 'add', values: [asset] });
      }),
      websocketEvents.on('on_asset_trash', (ids) => {
        this.#addPendingChanges({ type: 'trash', values: ids });
      }),
      websocketEvents.on('on_asset_update', (asset) => {
        this.#addPendingChanges({ type: 'update', values: [asset] });
      }),
      websocketEvents.on('on_asset_delete', (id: string) => {
        this.#addPendingChanges({ type: 'delete', values: [id] });
      }),
    );
  }

  disconnect() {
    for (const unsubscribe of this.#unsubscribers) {
      unsubscribe();
    }
    this.#unsubscribers = [];
  }

  #getPendingChangeBatches() {
    const batches: PendingChange[] = [];
    let batch: PendingChange | undefined;

    for (const { type, values: _values } of this.#pendingChanges) {
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

  updateSlidingWindow(scrollTop: number) {
    this.#scrollTop = scrollTop;
    this.updateIntersections();
  }

  updateIntersections() {
    if (!this.isInitialized || this.visibleWindow.bottom === this.visibleWindow.top) {
      return;
    }
    let topIntersectingBucket = undefined;
    for (const bucket of this.buckets) {
      this.#updateIntersection(bucket);
      if (!topIntersectingBucket && bucket.intersecting) {
        topIntersectingBucket = bucket;
      }
    }
    this.topIntersectingBucket = topIntersectingBucket;
  }

  #updateIntersection(bucket: AssetBucket) {
    // note: maybe make bucket.intersection derived too? It would be a little
    // weird, since if its intersecting, there is a side-effect that it should
    // load the bucket if its not loaded.
    const bucketTop = bucket.top;
    const bucketBottom = bucketTop + bucket.bucketHeight;
    const topWindow = this.visibleWindow.top - HEADER - INTERSECTION_EXPAND_TOP;
    const bottomWindow = this.visibleWindow.bottom - HEADER + INTERSECTION_EXPAND_BOTTOM;
    if (bucketTop < bottomWindow && bucketBottom > topWindow) {
      bucket.intersecting = true;
      if (!bucket.isLoaded) {
        // no need to check for assets
        void this.loadBucket(bucket.bucketDate);
        return;
      }
    } else {
      bucket.intersecting = false;
      bucket.cancel();
      // note - not going to mark every asset as not intersecting. Asset-grid will not show
      // any buckets that are not intersecting, so its not necessary to mark every asset
      // as not intersecting.
    }
  }

  #processPendingChanges = throttle(() => {
    for (const { type, values } of this.#getPendingChangeBatches()) {
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
          if (!this.#options.isTrashed) {
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

    this.#pendingChanges = [];
  }, 2500);

  setCompensateScrollCallback(compensateScrollCallback: (delta: number) => void) {
    this.compensateScrollCallback = compensateScrollCallback;
  }

  async #initialiazeTimeBuckets() {
    const timebuckets = await getTimeBuckets({
      ...this.#options,
      size: TimeBucketSize.Month,
      key: getKey(),
    });
    this.buckets = timebuckets.map((bucket, index) => new AssetBucket(index, this, bucket.timeBucket, bucket.count));
    this.albumAssets.clear();
    await this.#updateViewportGeometry(false);
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
    await this.#updateViewportGeometry(false);
  }

  async #init(options: AssetStoreOptions) {
    // doing the following outside of the task reduces flickr
    this.isInitialized = false;
    this.buckets = [];
    this.albumAssets.clear();
    await this.initTask.execute(async () => {
      this.#options = options;
      await this.#initialiazeTimeBuckets();
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

    // special case updateViewport before or soon after call to updateOptions
    if (!this.initTask.executed) {
      // eslint-disable-next-line unicorn/prefer-ternary
      if (this.initTask.loading) {
        await this.initTask.waitUntilCompletion();
      } else {
        // not executed and not loaded means we should init now, and init will
        // also update geometry so just return after
        await this.#init(this.#options);
      }
    }

    // changing width affects the actual height, and needs to re-layout
    const changedWidth = viewport.width !== this.viewportWidth;
    this.viewportHeight = viewport.height;
    this.viewportWidth = viewport.width;
    await this.#updateViewportGeometry(changedWidth);
  }

  async #updateViewportGeometry(changedWidth: boolean) {
    if (!this.isInitialized) {
      return;
    }
    if (this.viewportWidth === 0 || this.viewportHeight === 0) {
      return;
    }
    for (const bucket of this.buckets) {
      this.#updateGeometry(bucket, changedWidth);
    }
    this.updateIntersections();

    const loaders = [];
    let height = 0;
    for (const bucket of this.buckets) {
      if (height >= this.viewportHeight) {
        break;
      }
      height += bucket.bucketHeight;
      loaders.push(this.loadBucket(bucket.bucketDate, { cancelable: false }));
    }
    await Promise.all(loaders);
    this.scrubberBuckets = this.buckets.map((bucket) => ({
      assetCount: bucket.bucketCount,
      bucketDate: bucket.bucketDate,
      bucketDateFormattted: bucket.bucketDateFormatted,
      bucketHeight: bucket.bucketHeight,
    }));
    this.scrubberTimelineHieght = this.timelineHeight;
  }

  #updateGeometry(bucket: AssetBucket, invalidateHeight: boolean) {
    if (invalidateHeight) {
      bucket.isBucketHeightActual = false;
    }
    if (!bucket.isLoaded) {
      // optimize - if bucket already has data, no need to create estimates
      const viewportWidth = this.viewportWidth;
      if (!bucket.isBucketHeightActual) {
        const unwrappedWidth = (3 / 2) * bucket.bucketCount * THUMBNAIL_HEIGHT * (7 / 10);
        const rows = Math.ceil(unwrappedWidth / viewportWidth);
        const height = 51 + Math.max(1, rows) * THUMBNAIL_HEIGHT;
        bucket.bucketHeight = height;
      }
      return;
    }
    this.#layoutBucket(bucket);
  }
  #layoutBucket(bucket: AssetBucket) {
    const viewportWidth = this.viewportWidth;
    const layoutOptions = {
      spacing: 2,
      heightTolerance: 0.15,
      rowHeight: 235,
      rowWidth: Math.floor(viewportWidth),
    };

    // these are top offsets, for each row
    let cummulativeHeight = 0;
    // these are left offsets of each group, for each row
    let cummulativeWidth = 0;
    let lastRowHeight = 0;
    let lastRow = 0;

    let dateGroupRow = 0;
    let dateGroupCol = 0;

    const rowSpaceRemaining: number[] = Array.from({ length: bucket.dateGroups.length });
    rowSpaceRemaining.fill(viewportWidth, 0, bucket.dateGroups.length);
    for (const assetGroup of bucket.dateGroups) {
      assetGroup.geometry = getJustifiedLayoutFromAssets(assetGroup.assets, layoutOptions);
      rowSpaceRemaining[dateGroupRow] -= assetGroup.geometry.containerWidth - 1;
      if (dateGroupCol > 0) {
        rowSpaceRemaining[dateGroupRow] -= GAP;
      }
      if (rowSpaceRemaining[dateGroupRow] >= 0) {
        assetGroup.row = dateGroupRow;
        assetGroup.col = dateGroupCol;
        assetGroup.left = cummulativeWidth;
        assetGroup.top = cummulativeHeight;

        dateGroupCol++;

        cummulativeWidth += assetGroup.geometry.containerWidth + GAP;
      } else {
        // starting a new row, we need to update the last col of the previous row
        cummulativeWidth = 0;
        dateGroupRow++;
        dateGroupCol = 0;
        assetGroup.row = dateGroupRow;
        assetGroup.col = dateGroupCol;
        assetGroup.left = cummulativeWidth;

        rowSpaceRemaining[dateGroupRow] -= assetGroup.geometry.containerWidth;
        dateGroupCol++;
        cummulativeHeight += lastRowHeight;
        assetGroup.top = cummulativeHeight;
        cummulativeWidth += assetGroup.geometry.containerWidth + GAP;
        lastRow = assetGroup.row - 1;
      }
      lastRowHeight = assetGroup.geometry.containerHeight + HEADER;
      assetGroup.height = assetGroup.geometry.containerHeight;
    }
    if (lastRow === 0 || lastRow !== bucket.dateGroups.at(-1)?.row) {
      cummulativeHeight += lastRowHeight;
    }

    bucket.bucketHeight = cummulativeHeight;
    bucket.isBucketHeightActual = true;
  }

  async loadBucket(bucketDate: string, options?: { cancelable: boolean }): Promise<void> {
    let cancelable = true;
    if (options) {
      cancelable = options.cancelable;
    }
    const bucket = this.getBucketByDate(bucketDate);
    if (!bucket) {
      return;
    }

    if (bucket.loader?.executed) {
      return;
    }

    const result = await bucket.loader?.execute(async (signal: AbortSignal) => {
      const assets = await getTimeBucket(
        {
          ...this.#options,
          timeBucket: bucketDate,
          size: TimeBucketSize.Month,
          key: getKey(),
        },
        { signal },
      );

      if (this.#options.timelineAlbumId) {
        const albumAssets = await getTimeBucket(
          {
            albumId: this.#options.timelineAlbumId,
            timeBucket: bucketDate,
            size: TimeBucketSize.Month,
            key: getKey(),
          },
          { signal },
        );
        for (const asset of albumAssets) {
          this.albumAssets.add(asset.id);
        }
      }

      bucket.assets = assets;
      bucket.dateGroups = splitBucketIntoDateGroups(bucket, get(locale));
      this.#layoutBucket(bucket);
    }, cancelable);
    if (result === 'LOADED') {
      this.#updateIntersection(bucket);
    }
  }

  addAssets(assets: AssetResponseDto[]) {
    const assetsToUpdate: AssetResponseDto[] = [];
    const assetsToAdd: AssetResponseDto[] = [];

    for (const asset of assets) {
      if (
        this.#assetToBucket[asset.id] ||
        this.#options.userId ||
        this.#options.personId ||
        this.#options.albumId ||
        this.#isExcluded(asset)
      ) {
        // If asset is already in the bucket we don't need to recalculate
        // asset store containers
        assetsToUpdate.push(asset);
      } else {
        assetsToAdd.push(asset);
      }
    }

    this.updateAssets(assetsToUpdate);
    this.#addAssetsToBuckets(assetsToAdd);
  }

  #addAssetsToBuckets(assets: AssetResponseDto[]) {
    if (assets.length === 0) {
      return;
    }
    const updatedBuckets = new Set<AssetBucket>();

    for (const asset of assets) {
      const timeBucket = DateTime.fromISO(asset.localDateTime).toUTC().startOf('month').toString();
      let bucket = this.getBucketByDate(timeBucket);

      if (!bucket) {
        const index = this.buckets.length;
        bucket = new AssetBucket(index, this, timeBucket, 1);
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
      this.#updateGeometry(bucket, true);
    }
    this.updateIntersections();
  }

  getBucketByDate(bucketDate: string): AssetBucket | undefined {
    return this.buckets.find((bucket) => bucket.bucketDate === bucketDate);
  }

  async findBucketForAsset(id: string) {
    await this.initTask.waitUntilCompletion();
    const bucketInfo = this.#assetToBucket[id];
    let bucket: AssetBucket | undefined = bucketInfo?.bucket;
    if (!bucket) {
      const asset = await getAssetInfo({ id });
      if (!asset || this.#isExcluded(asset)) {
        return;
      }
      bucket = await this.#loadBucketAtTime(asset.localDateTime, { cancelable: false });
    }

    if (bucket && bucket.assets.some((a) => a.id === id)) {
      return bucket;
    }
  }

  async #loadBucketAtTime(localDateTime: string, options?: { cancelable: boolean }) {
    let date = fromLocalDateTime(localDateTime);
    // Only support TimeBucketSize.Month
    date = date.set({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
    const iso = date.toISO()!;
    await this.loadBucket(iso, options);
    return this.getBucketByDate(iso);
  }

  async #getBucketInfoForAsset(asset: AssetResponseDto, options?: { cancelable: boolean }) {
    const bucketInfo = this.#assetToBucket[asset.id];
    if (bucketInfo) {
      return bucketInfo;
    }
    await this.#loadBucketAtTime(asset.localDateTime, options);
    return this.#assetToBucket[asset.id];
  }

  getBucketIndexByAssetId(assetId: string) {
    return this.#assetToBucket[assetId]?.bucketIndex;
  }

  async getRandomAsset(): Promise<AssetResponseDto | undefined> {
    let index = Math.floor(
      Math.random() * this.buckets.reduce((accumulator, bucket) => accumulator + bucket.bucketCount, 0),
    );
    for (const bucket of this.buckets) {
      if (index < bucket.bucketCount) {
        await this.loadBucket(bucket.bucketDate);
        return bucket.assets[index];
      }
      index -= bucket.bucketCount;
    }
    return;
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
    this.#addAssetsToBuckets(assetsToRecalculate);
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
        this.#updateGeometry(bucket, true);
        this.updateIntersections();
      }
    }
  }

  async getPreviousAsset(asset: AssetResponseDto): Promise<AssetResponseDto | undefined> {
    const info = await this.#getBucketInfoForAsset(asset);
    if (!info) {
      return;
    }

    const { bucket, assetIndex, bucketIndex } = info;

    if (assetIndex !== 0) {
      return bucket.assets[assetIndex - 1];
    }

    if (bucketIndex === 0) {
      return;
    }

    const previousBucket = this.buckets[bucketIndex - 1];
    await this.loadBucket(previousBucket.bucketDate);
    return previousBucket.assets.at(-1);
  }

  async getNextAsset(asset: AssetResponseDto): Promise<AssetResponseDto | undefined> {
    const info = await this.#getBucketInfoForAsset(asset);
    if (!info) {
      return;
    }

    const { bucket, assetIndex, bucketIndex } = info;

    if (assetIndex !== bucket.assets.length - 1) {
      return bucket.assets[assetIndex + 1];
    }

    if (bucketIndex === this.buckets.length - 1) {
      return;
    }

    const nextBucket = this.buckets[bucketIndex + 1];
    await this.loadBucket(nextBucket.bucketDate);
    return nextBucket.assets[0];
  }

  #isExcluded(asset: AssetResponseDto) {
    return (
      isMismatched(this.#options.isArchived ?? false, asset.isArchived) ||
      isMismatched(this.#options.isFavorite, asset.isFavorite) ||
      isMismatched(this.#options.isTrashed ?? false, asset.isTrashed)
    );
  }
}

export const isSelectingAllAssets = writable(false);
