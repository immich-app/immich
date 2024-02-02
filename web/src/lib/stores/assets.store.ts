import { api, type AssetApiGetTimeBucketsRequest, type AssetResponseDto, TimeBucketSize } from '@api';
import { throttle } from 'lodash-es';
import { DateTime } from 'luxon';
import { type Unsubscriber, writable } from 'svelte/store';
import { handleError } from '../utils/handle-error';
import { websocketStore } from './websocket';

export enum BucketPosition {
  Above = 'above',
  Below = 'below',
  Visible = 'visible',
  Unknown = 'unknown',
}

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
  value: AssetResponseDto;
}

interface DeleteAsset {
  type: 'delete';
  value: string;
}

interface TrashAsset {
  type: 'trash';
  value: string;
}

export const photoViewer = writable<HTMLImageElement | null>(null);

type PendingChange = AddAsset | DeleteAsset | TrashAsset;

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
      websocketStore.onUploadSuccess.subscribe((value) => {
        if (value) {
          this.addPendingChanges({ type: 'add', value });
        }
      }),

      websocketStore.onAssetTrash.subscribe((ids) => {
        if (ids) {
          this.addPendingChanges(...ids.map((id) => ({ type: 'trash', value: id }) as PendingChange));
        }
      }),

      websocketStore.onAssetDelete.subscribe((value) => {
        if (value) {
          this.addPendingChanges({ type: 'delete', value });
        }
      }),
    );
  }

  disconnect() {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
  }

  processPendingChanges = throttle(() => {
    for (const { type, value } of this.pendingChanges) {
      switch (type) {
        case 'add': {
          this.addAsset(value);
          break;
        }

        case 'trash': {
          if (!this.options.isTrashed) {
            this.removeAsset(value);
          }
          break;
        }

        case 'delete': {
          this.removeAsset(value);
          break;
        }
      }
    }

    this.pendingChanges = [];
    this.emit(true);
  }, 10_000);

  async init(viewport: Viewport) {
    this.initialized = false;
    this.timelineHeight = 0;
    this.buckets = [];
    this.assets = [];
    this.assetToBucket = {};
    this.albumAssets = new Set();

    const { data: buckets } = await api.assetApi.getTimeBuckets({
      ...this.options,
      key: api.getKey(),
    });

    this.initialized = true;

    this.buckets = buckets.map((bucket) => {
      const unwrappedWidth = (3 / 2) * bucket.count * THUMBNAIL_HEIGHT * (7 / 10);
      const rows = Math.ceil(unwrappedWidth / viewport.width);
      const height = rows * THUMBNAIL_HEIGHT;

      return {
        bucketDate: bucket.timeBucket,
        bucketHeight: height,
        bucketCount: bucket.count,
        assets: [],
        cancelToken: null,
        position: BucketPosition.Unknown,
      };
    });

    this.timelineHeight = this.buckets.reduce((accumulator, b) => accumulator + b.bucketHeight, 0);

    this.emit(false);

    let height = 0;
    for (const bucket of this.buckets) {
      if (height < viewport.height) {
        height += bucket.bucketHeight;
        this.loadBucket(bucket.bucketDate, BucketPosition.Visible);
        continue;
      }

      break;
    }
  }

  async loadBucket(bucketDate: string, position: BucketPosition): Promise<void> {
    try {
      const bucket = this.getBucketByDate(bucketDate);
      if (!bucket) {
        return;
      }

      bucket.position = position;

      if (bucket.assets.length > 0) {
        this.emit(false);
        return;
      }

      bucket.cancelToken = new AbortController();

      const { data: assets } = await api.assetApi.getTimeBucket(
        {
          ...this.options,
          timeBucket: bucketDate,
          key: api.getKey(),
        },
        { signal: bucket.cancelToken.signal },
      );

      if (this.albumId) {
        const { data: albumAssets } = await api.assetApi.getTimeBucket(
          {
            albumId: this.albumId,
            timeBucket: bucketDate,
            size: this.options.size,
            key: api.getKey(),
          },
          { signal: bucket.cancelToken.signal },
        );

        for (const asset of albumAssets) {
          this.albumAssets.add(asset.id);
        }
      }

      bucket.assets = assets;

      this.emit(true);
    } catch (error) {
      handleError(error, 'Failed to load assets');
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

  addAsset(asset: AssetResponseDto): void {
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
      this.updateAsset(asset);
      return;
    }

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
      this.buckets = this.buckets.sort((a, b) => {
        const aDate = DateTime.fromISO(a.bucketDate).toUTC();
        const bDate = DateTime.fromISO(b.bucketDate).toUTC();
        return bDate.diff(aDate).milliseconds;
      });
    }

    bucket.assets.push(asset);
    bucket.assets.sort((a, b) => {
      const aDate = DateTime.fromISO(a.fileCreatedAt).toUTC();
      const bDate = DateTime.fromISO(b.fileCreatedAt).toUTC();
      return bDate.diff(aDate).milliseconds;
    });

    // If we added an asset to the store, we need to recalculate
    // asset store containers
    this.assets.push(asset);
    this.updateAsset(asset, true);
  }

  getBucketByDate(bucketDate: string): AssetBucket | null {
    return this.buckets.find((bucket) => bucket.bucketDate === bucketDate) || null;
  }

  getBucketInfoForAssetId(assetId: string) {
    return this.assetToBucket[assetId] || null;
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

  updateAsset(_asset: AssetResponseDto, recalculate = false) {
    const asset = this.assets.find((asset) => asset.id === _asset.id);
    if (!asset) {
      return;
    }

    Object.assign(asset, _asset);

    this.emit(recalculate);
  }

  removeAssets(ids: string[]) {
    // TODO: this could probably be more efficient
    for (const id of ids) {
      this.removeAsset(id);
    }
  }

  removeAsset(id: string) {
    for (let index = 0; index < this.buckets.length; index++) {
      const bucket = this.buckets[index];
      for (let index_ = 0; index_ < bucket.assets.length; index_++) {
        const asset = bucket.assets[index_];
        if (asset.id !== id) {
          continue;
        }

        bucket.assets.splice(index_, 1);
        if (bucket.assets.length === 0) {
          this.buckets.splice(index, 1);
        }

        this.emit(true);
        return;
      }
    }
  }

  async getPreviousAssetId(assetId: string): Promise<string | null> {
    const info = this.getBucketInfoForAssetId(assetId);
    if (!info) {
      return null;
    }

    const { bucket, assetIndex, bucketIndex } = info;

    if (assetIndex !== 0) {
      return bucket.assets[assetIndex - 1].id;
    }

    if (bucketIndex === 0) {
      return null;
    }

    const previousBucket = this.buckets[bucketIndex - 1];
    await this.loadBucket(previousBucket.bucketDate, BucketPosition.Unknown);
    return previousBucket.assets.at(-1)?.id || null;
  }

  async getNextAssetId(assetId: string): Promise<string | null> {
    const info = this.getBucketInfoForAssetId(assetId);
    if (!info) {
      return null;
    }

    const { bucket, assetIndex, bucketIndex } = info;

    if (assetIndex !== bucket.assets.length - 1) {
      return bucket.assets[assetIndex + 1].id;
    }

    if (bucketIndex === this.buckets.length - 1) {
      return null;
    }

    const nextBucket = this.buckets[bucketIndex + 1];
    await this.loadBucket(nextBucket.bucketDate, BucketPosition.Unknown);
    return nextBucket.assets[0]?.id || null;
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

export const isSelectAllCancelled = writable(false);
