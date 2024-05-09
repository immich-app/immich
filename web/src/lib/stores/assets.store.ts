import { getKey } from '$lib/utils';
import { fromLocalDateTime } from '$lib/utils/timeline-util';
import { TimeBucketSize, getTimeBucket, getTimeBuckets, type AssetResponseDto } from '@immich/sdk';
import { throttle } from 'lodash-es';
import { DateTime } from 'luxon';
import { writable, type Unsubscriber } from 'svelte/store';
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
  bucketHeight!: number;
  bucketDate!: string;
  bucketCount!: number;
  assets!: AssetResponseDto[];
  cancelToken!: AbortController | null;
  position!: BucketPosition;
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
  private options: AssetApiGetTimeBucketsRequest;

  initialized = false;
  timelineHeight = 0;
  buckets: AssetBucket[] = [];
  assets: AssetResponseDto[] = [];
  albumAssets: Set<string> = new Set();

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

  async init(viewport: Viewport) {
    this.initialized = false;
    this.timelineHeight = 0;
    this.buckets = [];
    this.assets = [];
    this.assetToBucket = {};
    this.albumAssets = new Set();

    const timebuckets = await getTimeBuckets({
      ...this.options,
      key: getKey(),
    });

    this.initialized = true;

    this.buckets = timebuckets.map((bucket) => ({
      bucketDate: bucket.timeBucket,
      bucketHeight: 0,
      bucketCount: bucket.count,
      assets: [],
      cancelToken: null,
      position: BucketPosition.Unknown,
    }));

    // if loading an asset, the grid-view may be hidden, which means
    // it has 0 width and height. No need to update bucket or timeline
    // heights in this case. Later, updateViewport will be called to
    // update the heights.
    if (viewport.height !== 0 && viewport.width !== 0) {
      await this.updateViewport(viewport);
    }
  }

  async updateViewport(viewport: Viewport) {
    for (const bucket of this.buckets) {
      const unwrappedWidth = (3 / 2) * bucket.bucketCount * THUMBNAIL_HEIGHT * (7 / 10);
      const rows = Math.ceil(unwrappedWidth / viewport.width);
      const height = rows * THUMBNAIL_HEIGHT;
      bucket.bucketHeight = height;
    }
    this.timelineHeight = this.buckets.reduce((accumulator, b) => accumulator + b.bucketHeight, 0);

    let height = 0;
    const loaders = [];
    for (const bucket of this.buckets) {
      if (height < viewport.height) {
        height += bucket.bucketHeight;
        loaders.push(this.loadBucket(bucket.bucketDate, BucketPosition.Visible));
        continue;
      }
      break;
    }
    await Promise.all(loaders);
    this.emit(false);
  }

  async loadBucket(bucketDate: string, position: BucketPosition): Promise<void> {
    const bucket = this.getBucketByDate(bucketDate);
    if (!bucket) {
      return;
    }

    bucket.position = position;

    if (bucket.cancelToken || bucket.assets.length > 0) {
      this.emit(false);
      return;
    }

    bucket.cancelToken = new AbortController();

    try {
      const assets = await getTimeBucket(
        {
          ...this.options,
          timeBucket: bucketDate,
          key: getKey(),
        },
        { signal: bucket.cancelToken.signal },
      );

      if (this.albumId) {
        const albumAssets = await getTimeBucket(
          {
            albumId: this.albumId,
            timeBucket: bucketDate,
            size: this.options.size,
            key: getKey(),
          },
          { signal: bucket.cancelToken.signal },
        );

        for (const asset of albumAssets) {
          this.albumAssets.add(asset.id);
        }
      }

      if (bucket.cancelToken.signal.aborted) {
        return;
      }

      bucket.assets = assets;

      this.emit(true);
    } catch (error) {
      handleError(error, 'Failed to load assets');
    } finally {
      bucket.cancelToken = null;
    }
  }

  cancelBucket(bucket: AssetBucket) {
    bucket.cancelToken?.abort();
  }

  updateBucket(bucketDate: string, height: number) {
    const bucket = this.getBucketByDate(bucketDate);
    if (!bucket) {
      return 0;
    }

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
        isMismatched(this.options.isFavorite, asset.isFavorite)
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
        bucket = {
          bucketDate: timeBucket,
          bucketHeight: THUMBNAIL_HEIGHT,
          bucketCount: 0,
          assets: [],
          cancelToken: null,
          position: BucketPosition.Unknown,
        };

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

  async getBucketInfoForAssetId({ id, localDateTime }: Pick<AssetResponseDto, 'id' | 'localDateTime'>) {
    const bucketInfo = this.assetToBucket[id];
    if (bucketInfo) {
      return bucketInfo;
    }
    let date = fromLocalDateTime(localDateTime);
    if (this.options.size == TimeBucketSize.Month) {
      date = date.set({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
    } else if (this.options.size == TimeBucketSize.Day) {
      date = date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    }
    await this.loadBucket(date.toISO()!, BucketPosition.Unknown);
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
    const info = await this.getBucketInfoForAssetId(asset);
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
    const info = await this.getBucketInfoForAssetId(asset);
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
