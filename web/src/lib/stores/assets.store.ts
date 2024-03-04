import { getKey } from '$lib/utils';
import { fromLocalDateTime, groupDateFormat } from '$lib/utils/timeline-util';
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

type BucketConstructor = {
  height: number;
  date: string;
  count: number;
  assets?: AssetResponseDto[];
  position?: BucketPosition;
};

export class AssetBucket {
  /**
   * The DOM height of the bucket in pixel
   * This value is first estimated by the number of asset and later is corrected as the user scroll
   */
  height!: number;
  date!: string;
  count!: number;
  assets!: AssetResponseDto[];
  cancelToken!: AbortController | null;
  position!: BucketPosition;
  dateGroups!: Map<string, AssetResponseDto[]>;

  constructor({ height, date, count, assets = [], position = BucketPosition.Unknown }: BucketConstructor) {
    this.height = height;
    this.date = date;
    this.count = count;
    this.assets = assets;
    this.position = position;
    this.cancelToken = null;
    this.dateGroups = new Map();
  }

  public addAssets(assets: AssetResponseDto[]) {
    if (this.assets.length === 0) {
      this.assets = assets;
    } else {
      this.assets.push(...assets);
    }
    this.updateDateGroups();
  }

  public updateDateGroups() {
    if (this.assets.length === 0) {
      return;
    }

    for (const asset of this.assets) {
      const curLocale = fromLocalDateTime(asset.localDateTime).toLocaleString(groupDateFormat);
      if (this.dateGroups.has(curLocale)) {
        this.dateGroups.get(curLocale)?.push(asset);
      } else {
        this.dateGroups.set(curLocale, [asset]);
      }
    }
  }
}

const isMismatched = (option: boolean | undefined, value: boolean): boolean =>
  option === undefined ? false : option !== value;

const THUMBNAIL_HEIGHT = 235;

interface AddAsset {
  type: 'add';
  value: AssetResponseDto;
}

interface UpdateAsset {
  type: 'update';
  value: AssetResponseDto;
}

interface DeleteAsset {
  type: 'delete';
  value: string;
}

interface TrashAssets {
  type: 'trash';
  value: string[];
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
        this.addPendingChanges({ type: 'add', value: asset });
      }),
      websocketEvents.on('on_asset_trash', (ids) => {
        this.addPendingChanges({ type: 'trash', value: ids });
      }),
      websocketEvents.on('on_asset_update', (asset) => {
        this.addPendingChanges({ type: 'update', value: asset });
      }),
      websocketEvents.on('on_asset_delete', (id: string) => {
        this.addPendingChanges({ type: 'delete', value: id });
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

        case 'update': {
          this.updateAsset(value);
          break;
        }

        case 'trash': {
          if (!this.options.isTrashed) {
            this.removeAssets(value);
          }
          break;
        }

        case 'delete': {
          this.removeAssets([value]);
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

    const buckets = await getTimeBuckets({ ...this.options, key: getKey() });

    this.initialized = true;

    let viewHeight = 0;
    const loaders = [];
    for (const { timeBucket, count } of buckets) {
      const unwrappedWidth = (3 / 2) * count * THUMBNAIL_HEIGHT * (7 / 10);
      const rows = Math.ceil(unwrappedWidth / viewport.width);
      const bucketHeight = rows * THUMBNAIL_HEIGHT;

      const bucket = new AssetBucket({ height: bucketHeight, date: timeBucket, count });
      this.buckets.push(bucket);
      if (viewHeight < viewport.height) {
        viewHeight += bucket.height;
        loaders.push(this.loadBucket(bucket.date, BucketPosition.Visible));
      }
    }

    this.timelineHeight = this.buckets.reduce((accumulator, b) => accumulator + b.height, 0);

    await Promise.all(loaders);
    this.emit(false);
  }

  async loadBucket(bucketDate: string, position: BucketPosition): Promise<void> {
    try {
      const bucket = this.getBucketByDate(bucketDate);
      if (!bucket) {
        return;
      }

      bucket.position = position;

      if (bucket.assets.length > 0 || bucket.cancelToken) {
        this.emit(false);
        return;
      }

      bucket.cancelToken = new AbortController();

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

      bucket.addAssets(assets);
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

    const delta = height - bucket.height;
    const scrollTimeline = bucket.position == BucketPosition.Above;

    bucket.height = height;
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

    this.addAssetToBucket(asset);
  }

  private addAssetToBucket(asset: AssetResponseDto) {
    const timeBucket = DateTime.fromISO(asset.fileCreatedAt).toUTC().startOf('month').toString();
    let bucket = this.getBucketByDate(timeBucket);

    if (!bucket) {
      bucket = new AssetBucket({ height: 0, date: timeBucket, count: 0 });

      this.buckets.push(bucket);
      this.buckets = this.buckets.sort((a, b) => {
        const aDate = DateTime.fromISO(a.date).toUTC();
        const bDate = DateTime.fromISO(b.date).toUTC();
        return bDate.diff(aDate).milliseconds;
      });
    }

    bucket.addAssets([asset]);

    // If we added an asset to the store, we need to recalculate
    // asset store containers
    this.assets.push(asset);
    this.emit(true);
  }

  getBucketByDate(bucketDate: string): AssetBucket | null {
    return this.buckets.find((bucket) => bucket.date === bucketDate) || null;
  }

  getBucketInfoForAssetId(assetId: string) {
    return this.assetToBucket[assetId] || null;
  }

  getBucketIndexByAssetId(assetId: string) {
    return this.assetToBucket[assetId]?.bucketIndex ?? null;
  }

  async getRandomAsset(): Promise<AssetResponseDto | null> {
    let index = Math.floor(Math.random() * this.buckets.reduce((accumulator, bucket) => accumulator + bucket.count, 0));
    for (const bucket of this.buckets) {
      if (index < bucket.count) {
        await this.loadBucket(bucket.date, BucketPosition.Unknown);
        return bucket.assets[index] || null;
      }

      index -= bucket.count;
    }

    return null;
  }

  updateAsset(_asset: AssetResponseDto) {
    const asset = this.assets.find((asset) => asset.id === _asset.id);
    if (!asset) {
      return;
    }

    const recalculate = asset.fileCreatedAt !== _asset.fileCreatedAt;
    if (recalculate) {
      this.removeAssets([asset.id]);
      this.addAssetToBucket(_asset);
      return;
    }

    Object.assign(asset, _asset);
    this.emit(recalculate);
  }

  removeAssets(ids: string[]) {
    const idSet = new Set(ids);
    this.assets = this.assets.filter((asset) => !idSet.has(asset.id));

    // Iterate in reverse to allow array splicing.
    for (let index = this.buckets.length - 1; index >= 0; index--) {
      const bucket = this.buckets[index];
      for (let index_ = bucket.assets.length - 1; index_ >= 0; index_--) {
        const asset = bucket.assets[index_];
        if (!idSet.has(asset.id)) {
          continue;
        }

        bucket.assets.splice(index_, 1);
        bucket.count = bucket.assets.length;
        if (bucket.count === 0) {
          this.buckets.splice(index, 1);
        }

        delete this.assetToBucket[asset.id];
      }
    }

    this.emit(false);
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
    await this.loadBucket(previousBucket.date, BucketPosition.Unknown);
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
    await this.loadBucket(nextBucket.date, BucketPosition.Unknown);
    return nextBucket.assets[0]?.id || null;
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
          bucket.count = bucket.assets.length;
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
