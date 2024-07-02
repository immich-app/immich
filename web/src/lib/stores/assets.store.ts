import { getKey } from '$lib/utils';
import type { AssetGridRouteSearchParams } from '$lib/utils/navigation';
import { fromLocalDateTime } from '$lib/utils/timeline-util';
import { TimeBucketSize, getAssetInfo, getTimeBucket, getTimeBuckets, type AssetResponseDto } from '@immich/sdk';
import { throttle } from 'lodash-es';
import { DateTime } from 'luxon';
import { t } from 'svelte-i18n';
import { get, writable, type Unsubscriber } from 'svelte/store';
import { handleError } from '../utils/handle-error';
import { websocketEvents } from './websocket';

export enum BucketPosition {
  Above = 'above',
  Below = 'below',
  Visible = 'visible',
  Unknown = 'unknown',
}
type AssetApiGetTimeBucketsRequest = Parameters<typeof getTimeBuckets>[0];
export type AssetStoreOptions = Omit<AssetApiGetTimeBucketsRequest, 'size'>;

export interface Viewport {
  width: number;
  height: number;
}

interface AssetLookup {
  bucket: AssetBucket;
  bucketIndex: number;
  assetIndex: number;
}

export class AssetBucket {
  /**
   * The DOM height of the bucket in pixel
   * This value is first estimated by the number of asset and later is corrected as the user scroll
   */
  bucketHeight = 0;
  bucketHeightActual = false;
  bucketDate!: string;
  bucketCount = 0;
  assets: AssetResponseDto[] = [];
  cancelToken: AbortController | null = null;
  position: BucketPosition = BucketPosition.Unknown;
  /**
   * Prevent this asset's load from being canceled; i.e. to force load of offscreen asset.
   */
  preventCancel: boolean = false;
  /**
   * A promise that resolves once the bucket is loaded, and rejects if bucket is canceled.
   */
  complete!: Promise<void>;

  constructor(props: Partial<AssetBucket> & { bucketDate: string }) {
    Object.assign(this, props);
    this.init();
  }

  private init() {
    this.complete = new Promise((resolve, reject) => {
      this.$loadedSignal = resolve;
      this.$canceledSignal = reject;
    });
    // supress uncaught rejection
    this.complete.catch(() => void 0);
  }

  private $loadedSignal!: () => void;
  private $canceledSignal!: () => void;

  cancel() {
    if (this.preventCancel) {
      return;
    }
    this.position = BucketPosition.Unknown;
    this.cancelToken?.abort();
    this.$canceledSignal;
    this.init();
  }

  loaded() {
    this.$loadedSignal();
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

export const photoViewer = writable<HTMLImageElement | null>(null);

type PendingChange = AddAsset | UpdateAsset | DeleteAsset | TrashAssets;

export class AssetStore {
  private store$ = writable(this);
  private assetToBucket: Record<string, AssetLookup> = {};
  private pendingChanges: PendingChange[] = [];
  private unsubscribers: Unsubscriber[] = [];
  options: AssetApiGetTimeBucketsRequest;
  private viewport: Viewport = {
    height: 0,
    width: 0,
  };

  private $initializedSignal!: () => void;
  /**
   * A promise that resolves once the bucket is loaded, and rejects if bucket is canceled.
   */
  complete!: Promise<void>;
  initialized = false;
  timelineHeight = 0;
  buckets: AssetBucket[] = [];
  assets: AssetResponseDto[] = [];
  albumAssets: Set<string> = new Set();
  pendingScrollBucket: AssetBucket | undefined;
  pendingScrollAssetId: string | undefined;

  constructor(
    options: AssetStoreOptions,
    private albumId?: string,
  ) {
    this.options = { ...options, size: TimeBucketSize.Month };
    this.store$.set(this);
  }

  subscribe = this.store$.subscribe;

  private addPendingChanges(...changes: PendingChange[]) {
    // prevent websocket events from happening before local client events
    setTimeout(() => {
      this.pendingChanges.push(...changes);
      this.processPendingChanges();
    }, 1000);
  }

  connect() {
    this.unsubscribers.push(
      websocketEvents.on('on_upload_success', (asset) => {
        this.addPendingChanges({ type: 'add', values: [asset] });
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
    this.emit(true);
  }, 2500);

  async init() {
    if (this.initialized) {
      throw 'Can only init once';
    }

    this.complete = new Promise((resolve) => {
      this.$initializedSignal = resolve;
    });
    //  uncaught rejection go away
    this.complete.catch(() => void 0);
    this.timelineHeight = 0;
    this.buckets = [];
    this.assets = [];
    this.assetToBucket = {};
    this.albumAssets = new Set();

    const timebuckets = await getTimeBuckets({
      ...this.options,
      key: getKey(),
    });

    this.buckets = timebuckets.map(
      (bucket) => new AssetBucket({ bucketDate: bucket.timeBucket, bucketCount: bucket.count }),
    );
    this.$initializedSignal();
    this.initialized = true;
  }

  async updateViewport(viewport: Viewport) {
    if (!this.initialized && this.viewport.height === viewport.height && this.viewport.width === viewport.width) {
      return;
    }
    if (viewport.height === 0 && viewport.width === 0) {
      return;
    }
    this.viewport = { ...viewport };

    for (const bucket of this.buckets) {
      if (bucket.bucketHeightActual) {
        continue;
      }
      const unwrappedWidth = (3 / 2) * bucket.bucketCount * THUMBNAIL_HEIGHT * (7 / 10);
      const rows = Math.ceil(unwrappedWidth / viewport.width);
      const height = 51 + rows * THUMBNAIL_HEIGHT;
      bucket.bucketHeight = height;
    }
    this.timelineHeight = this.buckets.reduce((accumulator, b) => accumulator + b.bucketHeight, 0);

    const loaders = [];
    let height = 0;
    for (const bucket of this.buckets) {
      if (height >= viewport.height) {
        break;
      }
      height += bucket.bucketHeight;
      loaders.push(this.loadBucket(bucket.bucketDate, BucketPosition.Visible));
    }
    await Promise.all(loaders);
  }

  async loadBucket(bucketDate: string, position: BucketPosition, preventCancel?: boolean): Promise<void> {
    const bucket = this.getBucketByDate(bucketDate);
    if (!bucket) {
      return;
    }
    if (bucket.position === BucketPosition.Unknown) {
      // don't overwrite position if known
      bucket.position = position;
    }
    if (bucket.bucketCount === bucket.assets.length) {
      // already loaded
      return;
    }

    if (bucket.cancelToken != null && bucket.bucketCount !== bucket.assets.length) {
      // if promise is pending, and preventCancel is requested, then don't overwrite it
      if (!bucket.preventCancel) {
        bucket.preventCancel = !!preventCancel;
      }
      await bucket.complete;
      return;
    }
    bucket.preventCancel = !!preventCancel;

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

      if (cancelToken.signal.aborted) {
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
          return;
        }
        for (const asset of albumAssets) {
          this.albumAssets.add(asset.id);
        }
      }

      bucket.assets = assets;
      this.emit(true);
      bucket.loaded();
    } catch (error) {
      const $t = get(t);
      handleError(error, $t('errors.failed_to_load_assets'));
    } finally {
      bucket.cancelToken = null;
    }
  }

  updateBucket(bucketDate: string, height: number) {
    const bucket = this.getBucketByDate(bucketDate);
    if (!bucket) {
      return 0;
    }

    bucket.bucketHeightActual = true;
    const delta = height - bucket.bucketHeight;
    const scrollTimeline = bucket.position == BucketPosition.Above;

    bucket.bucketHeight = height;
    bucket.position = BucketPosition.Unknown;

    this.timelineHeight += delta;
    this.emit(false);
    return scrollTimeline ? delta : 0;
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
        isMismatched(this.options.isArchived, asset.isArchived) ||
        isMismatched(this.options.isFavorite, asset.isFavorite) ||
        isMismatched(this.options.isTrashed, asset.isTrashed)
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
      const timeBucket = DateTime.fromISO(asset.fileCreatedAt).toUTC().startOf('month').toString();
      let bucket = this.getBucketByDate(timeBucket);

      if (!bucket) {
        bucket = new AssetBucket({ bucketDate: timeBucket, bucketHeight: THUMBNAIL_HEIGHT });
        this.buckets.push(bucket);
      }

      bucket.assets.push(asset);
      this.assets.push(asset);
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
    }

    this.emit(true);
  }

  getBucketByDate(bucketDate: string): AssetBucket | null {
    return this.buckets.find((bucket) => bucket.bucketDate === bucketDate) || null;
  }

  private async findBucketForAssetId(id: string) {
    const bucketInfo = this.assetToBucket[id];
    if (bucketInfo) {
      return bucketInfo.bucket;
    }
    const asset = await getAssetInfo({ id });
    if (asset) {
      const bucket = await this.loadBucketAtTime(asset.localDateTime, true);
      return bucket;
    }
  }

  /* Must be paired with matching clearPendingScroll() call */
  async scheduleScrollToAssetId(scrollTarget?: AssetGridRouteSearchParams | null) {
    if (!scrollTarget) {
      return false;
    }
    await this.complete;

    try {
      const { at: assetId } = scrollTarget;
      if (assetId) {
        const bucket = await this.findBucketForAssetId(assetId);
        if (bucket) {
          this.pendingScrollBucket = bucket;
          this.pendingScrollAssetId = assetId;
          this.emit(false);
        }
      }
    } catch {
      return false;
    }
    return true;
  }

  clearPendingScroll() {
    this.pendingScrollBucket = undefined;
    this.pendingScrollAssetId = undefined;
  }

  private async loadBucketAtTime(localDateTime: string, preventCancel?: boolean) {
    let date = fromLocalDateTime(localDateTime);
    if (this.options.size == TimeBucketSize.Month) {
      date = date.set({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
    } else if (this.options.size == TimeBucketSize.Day) {
      date = date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    }
    const iso = date.toISO()!;
    await this.loadBucket(iso, BucketPosition.Unknown, preventCancel);
    return this.getBucketByDate(iso);
  }

  private async getBucketInfoForAsset(
    { id, localDateTime }: Pick<AssetResponseDto, 'id' | 'localDateTime'>,
    preventCancel?: boolean,
  ) {
    const bucketInfo = this.assetToBucket[id];
    if (bucketInfo) {
      return bucketInfo;
    }
    await this.loadBucketAtTime(localDateTime, preventCancel);
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
        await this.loadBucket(bucket.bucketDate, BucketPosition.Unknown);
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
    const assetsToReculculate: AssetResponseDto[] = [];

    for (const _asset of assets) {
      const asset = this.assets.find((asset) => asset.id === _asset.id);
      if (!asset) {
        continue;
      }

      const recalculate = asset.fileCreatedAt !== _asset.fileCreatedAt;
      Object.assign(asset, _asset);

      if (recalculate) {
        assetsToReculculate.push(asset);
      }
    }

    this.removeAssets(assetsToReculculate.map((asset) => asset.id));
    this.addAssetsToBuckets(assetsToReculculate);
    this.emit(assetsToReculculate.length > 0);
  }

  removeAssets(ids: string[]) {
    const idSet = new Set(ids);

    // Iterate in reverse to allow array splicing.
    for (let index = this.buckets.length - 1; index >= 0; index--) {
      const bucket = this.buckets[index];
      for (let index_ = bucket.assets.length - 1; index_ >= 0; index_--) {
        const asset = bucket.assets[index_];
        if (!idSet.has(asset.id)) {
          continue;
        }

        bucket.assets.splice(index_, 1);
        if (bucket.assets.length === 0) {
          this.buckets.splice(index, 1);
        }
      }
    }

    this.emit(true);
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
    await this.loadBucket(previousBucket.bucketDate, BucketPosition.Unknown);
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
    await this.loadBucket(nextBucket.bucketDate, BucketPosition.Unknown);
    return nextBucket.assets[0] || null;
  }

  triggerUpdate() {
    this.emit(false);
  }

  private emit(recalculate: boolean) {
    if (recalculate) {
      this.assets = this.buckets.flatMap(({ assets }) => assets);

      const assetToBucket: Record<string, AssetLookup> = {};
      for (let index = 0; index < this.buckets.length; index++) {
        const bucket = this.buckets[index];
        if (bucket.assets.length > 0) {
          bucket.bucketCount = bucket.assets.length;
        }
        for (let index_ = 0; index_ < bucket.assets.length; index_++) {
          const asset = bucket.assets[index_];
          assetToBucket[asset.id] = { bucket, bucketIndex: index, assetIndex: index_ };
        }
      }
      this.assetToBucket = assetToBucket;
    }

    this.store$.update(() => this);
  }
}

export const isSelectingAllAssets = writable(false);
