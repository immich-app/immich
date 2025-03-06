import { locale } from '$lib/stores/preferences.store';
import { getKey } from '$lib/utils';
import { CancellableTask } from '$lib/utils/cancellable-task';
import { generateId } from '$lib/utils/generate-id';
import { emptyGeometry, getJustifiedLayoutFromAssets, type CommonJustifiedLayout } from '$lib/utils/layout-utils';
import type { AssetGridRouteSearchParams } from '$lib/utils/navigation';
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

class AssetDateGroup {
  top: number = $state(0);
  left: number = $state(0);
  geometry: CommonJustifiedLayout = $state(emptyGeometry());
  row = $state(0);
  col = $state(0);
  assetsIntersecting: boolean[] = $state([]);
  height = $state(0);
  intersecting = $state(false);

  constructor(
    public bucket: AssetBucket,
    public index: number,
    public date: DateTime,
    public assets: AssetResponseDto[],
  ) {}

  getAssetPosition(index: number) {
    const absoluteDateGroupTop = this.bucket.top + this.top;
    const position = getPosition(this.geometry, index);
    return {
      top: absoluteDateGroupTop + position.top,
      bottom: absoluteDateGroupTop + position.top + position.height,
    };
  }

  get intersectingAssets() {
    const positions = [];
    for (let i = 0; i < this.assets.length; i++) {
      if (this.assetsIntersecting[i]) {
        positions.push({
          id: this.assets[i].id,
          asset: this.assets[i],
          top: this.geometry.getTop(i),
          left: this.geometry.getLeft(i),
          width: this.geometry.getWidth(i),
          height: this.geometry.getHeight(i),
        });
      } else {
        // optimization, stop iterating after we reach first non-intersecting asset
        if (positions.length > 0) {
          break;
        }
      }
    }
    return positions;
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
  /**
   * The DOM height of the bucket in pixel
   * This value is first estimated by the number of asset and later is corrected as the user scroll
   * Do not derive this height, it is important for it to be updated at specific times, so that
   * calculateing a delta between estimated and actual (when measured) is correct.
   */
  #bucketHeight: number = $state(0);
  #top: number = $state(0);
  isBucketHeightActual: boolean = $state(false);
  bucketDateFormattted!: string;
  bucketCount: number = $derived.by(() => (this.isLoaded ? this.assets.length : this.initialCount));
  assets: AssetResponseDto[] = $state([]);
  dateGroups: AssetDateGroup[] = $state([]);
  isLoaded: boolean = $state(false);
  intersecting: boolean = $state(false);
  loader: CancellableTask | undefined;

  constructor(
    private index: number,
    public store: AssetStore,
    public bucketDate: string,
    private initialCount: number,
  ) {
    this.loader = new CancellableTask(
      () => (this.isLoaded = true),
      () => (this.isLoaded = false),
      this.handleLoadError,
    );

    this.bucketDateFormattted = fromLocalDateTime(this.bucketDate)
      .startOf('month')
      .toJSDate()
      .toLocaleString(get(locale), {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
  }

  /** The svelte key for this view model object */
  get viewId() {
    return this.store.viewId + '-' + this.bucketDate;
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
    return null;
  }

  findAssetAbsolutePosition(assetId: string) {
    const searchResult = this.findDateGroupByAssetId(assetId);
    if (searchResult) {
      const dateGroup = searchResult.dateGroup;
      return dateGroup.getAssetPosition(searchResult.assetIndex).top + 49;
    }
    return null;
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
  #options!: AssetStoreOptions;
  _viewportHeight = $state(0);
  _viewportWidth = $state(0);

  set viewportHeight(a) {
    this._viewportHeight = a;
  }
  get viewportHeight() {
    return this._viewportHeight;
  }
  set viewportWidth(a) {
    const changed = a !== this._viewportWidth;

    this._viewportWidth = a;
    this.updateViewportGeometry(changed);
  }
  get viewportWidth() {
    return this._viewportWidth;
  }
  get viewport() {
    return {
      height: this.viewportHeight,
      width: this.viewportWidth,
    };
  }
  /** The svelte key for this view model object */
  viewId = generateId();

  isInitialized = $state(false);
  buckets: AssetBucket[] = $state([]);
  scrubberBuckets: LiteBucket[] = $state([]);
  scrubberTimelineHieght: number = $state(0);
  timelineHeight = $derived(this.buckets.reduce((accumulator, b) => accumulator + b.bucketHeight, 0));
  assets: AssetResponseDto[] = $derived.by(() => this.buckets.flatMap(({ assets }) => assets));
  albumAssets: Set<string> = new SvelteSet();
  // #visibleWindow = $state({  top: 0, bottom: 0 });
  scrollTop = $state(0);
  visibleWindow = $derived.by(() => {
    if (this.scrollTop === 0) {
      return {
        top: 0,
        bottom: this.viewportHeight,
      };
    } else {
      return {
        top: this.scrollTop,
        bottom: this.scrollTop + this.viewportHeight,
      };
    }
  });
  topSectionHeight = $state(0);
  topIntersectingBucket: AssetBucket | undefined = $state();
  compensateScrollCallback: ((delta: number) => void) | null = null;

  initTask = new CancellableTask(
    () => {
      this.isInitialized = true;
    },
    () => (this.isInitialized = false),
    () => void 0,
  );

  set options(options: AssetStoreOptions) {
    this.#options = { ...options };
  }

  get options(): AssetStoreOptions {
    return this.#options;
  }

  // topSectionHeight = $state(0);

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

  updateSlidingWindow(scrollTop: number) {
    this.scrollTop = scrollTop;
    // this.visibleWindow = {  top, bottom };

    this.updateIntersections();
  }

  updateIntersections() {
    if (!this.isInitialized || this.visibleWindow.bottom === this.visibleWindow.top) {
      return;
    }

    let topIntersectingBucket = undefined;
    for (const bucket of this.buckets) {
      this.updateIntersection(bucket);
      if (!topIntersectingBucket && bucket.intersecting) {
        topIntersectingBucket = bucket;
      }
    }
    this.topIntersectingBucket = topIntersectingBucket;
  }

  updateIntersection(bucket: AssetBucket) {
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
      const dateGroups = bucket.dateGroups;
      for (const group of dateGroups) {
        let anyIntersecting = false;
        for (let i = 0; i < group.assets.length; i++) {
          const position = group.getAssetPosition(i);
          const intersecting = position.bottom > topWindow && position.top < bottomWindow;
          group.assetsIntersecting[i] = intersecting;
          if (intersecting) {
            anyIntersecting = true;
          }
        }
        group.intersecting = anyIntersecting;
      }
    } else {
      bucket.intersecting = false;
      bucket.cancel();
      // note - not going to mark every asset as not intersecting. Asset-grid will not show
      // any buckets that are not intersecting, so its not necessary to mark every asset
      // as not intersecting.
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
  }, 2500);

  setCompensateScrollCallback(compensateScrollCallback: ((delta: number) => void) | null) {
    this.compensateScrollCallback = compensateScrollCallback;
  }

  async initialiazeTimeBuckets() {
    const timebuckets = await getTimeBuckets({
      ...this.options,
      size: TimeBucketSize.Month,
      key: getKey(),
    });
    this.buckets = timebuckets.map((bucket, index) => new AssetBucket(index, this, bucket.timeBucket, bucket.count));
    this.albumAssets.clear();
    await this.updateViewportGeometry(false);
  }

  async updateOptions(options: AssetStoreOptions) {
    if (options.deferInit) {
      return;
    }

    if (isEqual(this.options, options)) {
      return;
    }

    await this.initTask.reset();
    // doing the following outside of the task reduces flickr
    this.isInitialized = false;
    this.buckets = [];
    this.albumAssets.clear();

    await this.initTask.execute(async () => {
      this.options = options;
      await this.initialiazeTimeBuckets();
    }, false);

    await this.updateViewportGeometry(false);
  }

  public destroy() {
    this.disconnect();
    this.isInitialized = false;
  }

  async updateViewport(viewport: Viewport) {
    if (viewport.height === 0 && viewport.width === 0) {
      return;
    }

    if (this.viewport.height === viewport.height && this.viewport.width === viewport.width) {
      return;
    }

    await this.initTask.waitForCompletion();
    // changing width invalidates the actual height, and needs to be remeasured, since width changes causes
    // layout reflows.
    const changedWidth = viewport.width !== this.viewport.width;
    // this.viewport = { height: viewport.height, width: viewport.width}
    this.viewportHeight = viewport.height;
    this.viewportWidth = viewport.width;
    await this.updateViewportGeometry(changedWidth);
  }

  private async updateViewportGeometry(changedWidth: boolean) {
    if (!this.isInitialized) {
      return;
    }
    if (this.viewport.width === 0 || this.viewport.height === 0) {
      return;
    }
    for (const bucket of this.buckets) {
      this.updateGeometry(bucket, changedWidth);
    }
    this.updateIntersections();

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
    this.scrubberBuckets = this.buckets.map((bucket) => ({
      assetCount: bucket.bucketCount,
      bucketDate: bucket.bucketDate,
      bucketDateFormattted: bucket.bucketDateFormattted,
      bucketHeight: bucket.bucketHeight,
    }));
    this.scrubberTimelineHieght = this.timelineHeight;
  }

  private updateGeometry(bucket: AssetBucket, invalidateHeight: boolean) {
    if (invalidateHeight) {
      bucket.isBucketHeightActual = false;
    }
    const viewportWidth = this.viewport.width;

    if (!bucket.isBucketHeightActual) {
      const unwrappedWidth = (3 / 2) * bucket.bucketCount * THUMBNAIL_HEIGHT * (7 / 10);
      const rows = Math.ceil(unwrappedWidth / viewportWidth);
      const height = 51 + Math.max(1, rows) * THUMBNAIL_HEIGHT;
      if (height === 0) {
      }
      bucket.bucketHeight = height;
    }

    if (!bucket.isLoaded) {
      return;
    }
    this.layoutBucket(bucket);
  }
  private layoutBucket(bucket: AssetBucket) {
    const viewportWidth = this.viewport.width;
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

  async loadBucket(bucketDate: string, options: { preventCancel?: boolean; pending?: boolean } = {}): Promise<void> {
    const bucket = this.getBucketByDate(bucketDate);
    if (!bucket) {
      return;
    }

    if (bucket.loader?.isLoaded) {
      return;
    }

    const result = await bucket.loader?.execute(async (signal: AbortSignal) => {
      const assets = await getTimeBucket(
        {
          ...this.options,
          timeBucket: bucketDate,
          size: TimeBucketSize.Month,
          key: getKey(),
        },
        { signal },
      );

      if (this.options.timelineAlbumId) {
        const albumAssets = await getTimeBucket(
          {
            albumId: this.options.timelineAlbumId,
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
      this.layoutBucket(bucket);
    }, options.preventCancel || false);
    if (result === 'LOADED') {
      this.updateIntersection(bucket);
    }
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
      return bucket;
    }
  }

  async scheduleScrollToAssetId(scrollTarget: AssetGridRouteSearchParams, onFailure: () => void) {
    try {
      const { at: assetId } = scrollTarget;
      if (assetId) {
        await this.initTask.waitForCompletion();
        return await this.findAndLoadBucketAsPending(assetId);
      }
    } catch {
      // failure
    }
    onFailure();
  }

  private async loadBucketAtTime(localDateTime: string, options: { preventCancel?: boolean; pending?: boolean }) {
    let date = fromLocalDateTime(localDateTime);
    // Only support TimeBucketSize.Month
    date = date.set({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
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
