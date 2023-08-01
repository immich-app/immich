import { AssetGridState, BucketPosition } from '$lib/models/asset-grid-state';
import { api, AssetCountByTimeBucketResponseDto, AssetResponseDto } from '@api';
import { writable } from 'svelte/store';

export interface AssetStore {
  setInitialState: (
    viewportHeight: number,
    viewportWidth: number,
    data: AssetCountByTimeBucketResponseDto,
    userId: string | undefined,
  ) => void;
  getAssetsByBucket: (bucket: string, position: BucketPosition) => Promise<void>;
  updateBucketHeight: (bucket: string, actualBucketHeight: number) => number;
  cancelBucketRequest: (token: AbortController, bucketDate: string) => Promise<void>;
  getAdjacentAsset: (assetId: string, direction: 'next' | 'previous') => Promise<string | null>;
  removeAsset: (assetId: string) => void;
  updateAsset: (assetId: string, isFavorite: boolean) => void;
  subscribe: (run: (value: AssetGridState) => void, invalidate?: (value?: AssetGridState) => void) => () => void;
}

export function createAssetStore(): AssetStore {
  let _loadingBuckets: { [key: string]: boolean } = {};
  let _assetGridState = new AssetGridState();

  const { subscribe, set, update } = writable(new AssetGridState());

  subscribe((state) => {
    _assetGridState = state;
  });

  const _estimateViewportHeight = (assetCount: number, viewportWidth: number): number => {
    // Ideally we would use the average aspect ratio for the photoset, however assume
    // a normal landscape aspect ratio of 3:2, then discount for the likelihood we
    // will be scaling down and coalescing.
    const thumbnailHeight = 235;
    const unwrappedWidth = (3 / 2) * assetCount * thumbnailHeight * (7 / 10);
    const rows = Math.ceil(unwrappedWidth / viewportWidth);
    const height = rows * thumbnailHeight;
    return height;
  };

  const refreshLoadedAssets = (state: AssetGridState): void => {
    state.loadedAssets = {};
    state.buckets.forEach((bucket, bucketIndex) =>
      bucket.assets.map((asset) => {
        state.loadedAssets[asset.id] = bucketIndex;
      }),
    );
  };

  const setInitialState = (
    viewportHeight: number,
    viewportWidth: number,
    data: AssetCountByTimeBucketResponseDto,
    userId: string | undefined,
  ) => {
    set({
      viewportHeight,
      viewportWidth,
      timelineHeight: 0,
      buckets: data.buckets.map((bucket) => ({
        bucketDate: bucket.timeBucket,
        bucketHeight: _estimateViewportHeight(bucket.count, viewportWidth),
        assets: [],
        cancelToken: new AbortController(),
        position: BucketPosition.Unknown,
      })),
      assets: [],
      loadedAssets: {},
      userId,
    });

    update((state) => {
      state.timelineHeight = state.buckets.reduce((acc, b) => acc + b.bucketHeight, 0);
      return state;
    });
  };

  const getAssetsByBucket = async (bucket: string, position: BucketPosition) => {
    try {
      const currentBucketData = _assetGridState.buckets.find((b) => b.bucketDate === bucket);
      if (currentBucketData?.assets && currentBucketData.assets.length > 0) {
        update((state) => {
          const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucket);
          state.buckets[bucketIndex].position = position;
          return state;
        });
        return;
      }

      _loadingBuckets = { ..._loadingBuckets, [bucket]: true };
      const { data: assets } = await api.assetApi.getAssetByTimeBucket(
        {
          getAssetByTimeBucketDto: {
            timeBucket: [bucket],
            userId: _assetGridState.userId,
            withoutThumbs: true,
          },
        },
        { signal: currentBucketData?.cancelToken.signal },
      );
      _loadingBuckets = { ..._loadingBuckets, [bucket]: false };

      update((state) => {
        const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucket);
        state.buckets[bucketIndex].assets = assets;
        state.buckets[bucketIndex].position = position;
        state.assets = state.buckets.flatMap((b) => b.assets);
        refreshLoadedAssets(state);
        return state;
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.name === 'CanceledError') {
        return;
      }
      console.error('Failed to get asset for bucket ', bucket);
      console.error(e);
    }
  };

  const removeAsset = (assetId: string) => {
    update((state) => {
      const bucketIndex = state.buckets.findIndex((b) => b.assets.some((a) => a.id === assetId));
      const assetIndex = state.buckets[bucketIndex].assets.findIndex((a) => a.id === assetId);
      state.buckets[bucketIndex].assets.splice(assetIndex, 1);

      if (state.buckets[bucketIndex].assets.length === 0) {
        _removeBucket(state.buckets[bucketIndex].bucketDate);
      }
      state.assets = state.buckets.flatMap((b) => b.assets);
      refreshLoadedAssets(state);
      return state;
    });
  };

  const _removeBucket = (bucketDate: string) => {
    update((state) => {
      const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucketDate);
      state.buckets.splice(bucketIndex, 1);
      state.assets = state.buckets.flatMap((b) => b.assets);
      refreshLoadedAssets(state);
      return state;
    });
  };

  const updateBucketHeight = (bucket: string, actualBucketHeight: number): number => {
    let scrollTimeline = false;
    let heightDelta = 0;

    update((state) => {
      const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucket);
      // Update timeline height based on the new bucket height
      const estimateBucketHeight = state.buckets[bucketIndex].bucketHeight;

      heightDelta = actualBucketHeight - estimateBucketHeight;
      state.timelineHeight += heightDelta;

      scrollTimeline = state.buckets[bucketIndex].position == BucketPosition.Above;

      state.buckets[bucketIndex].bucketHeight = actualBucketHeight;
      state.buckets[bucketIndex].position = BucketPosition.Unknown;

      return state;
    });

    if (scrollTimeline) {
      return heightDelta;
    }

    return 0;
  };

  const cancelBucketRequest = async (token: AbortController, bucketDate: string) => {
    if (!_loadingBuckets[bucketDate]) {
      return;
    }

    token.abort();

    update((state) => {
      const bucketIndex = state.buckets.findIndex((b) => b.bucketDate === bucketDate);
      state.buckets[bucketIndex].cancelToken = new AbortController();
      return state;
    });
  };

  const updateAsset = (assetId: string, isFavorite: boolean) => {
    update((state) => {
      const bucketIndex = state.buckets.findIndex((b) => b.assets.some((a) => a.id === assetId));
      const assetIndex = state.buckets[bucketIndex].assets.findIndex((a) => a.id === assetId);
      state.buckets[bucketIndex].assets[assetIndex].isFavorite = isFavorite;

      state.assets = state.buckets.flatMap((b) => b.assets);
      refreshLoadedAssets(state);
      return state;
    });
  };

  const _getNextAsset = async (currentBucketIndex: number, assetId: string): Promise<AssetResponseDto | null> => {
    const currentBucket = _assetGridState.buckets[currentBucketIndex];
    const assetIndex = currentBucket.assets.findIndex(({ id }) => id == assetId);
    if (assetIndex === -1) {
      return null;
    }

    if (assetIndex + 1 < currentBucket.assets.length) {
      return currentBucket.assets[assetIndex + 1];
    }

    const nextBucketIndex = currentBucketIndex + 1;
    if (nextBucketIndex >= _assetGridState.buckets.length) {
      return null;
    }

    const nextBucket = _assetGridState.buckets[nextBucketIndex];
    await getAssetsByBucket(nextBucket.bucketDate, BucketPosition.Unknown);

    return nextBucket.assets[0] ?? null;
  };

  const _getPrevAsset = async (currentBucketIndex: number, assetId: string): Promise<AssetResponseDto | null> => {
    const currentBucket = _assetGridState.buckets[currentBucketIndex];
    const assetIndex = currentBucket.assets.findIndex(({ id }) => id == assetId);
    if (assetIndex === -1) {
      return null;
    }

    if (assetIndex > 0) {
      return currentBucket.assets[assetIndex - 1];
    }

    const prevBucketIndex = currentBucketIndex - 1;
    if (prevBucketIndex < 0) {
      return null;
    }

    const prevBucket = _assetGridState.buckets[prevBucketIndex];
    await getAssetsByBucket(prevBucket.bucketDate, BucketPosition.Unknown);

    return prevBucket.assets[prevBucket.assets.length - 1] ?? null;
  };

  const getAdjacentAsset = async (assetId: string, direction: 'next' | 'previous'): Promise<string | null> => {
    const currentBucketIndex = _assetGridState.loadedAssets[assetId];
    if (currentBucketIndex < 0 || currentBucketIndex >= _assetGridState.buckets.length) {
      return null;
    }

    const asset =
      direction === 'next'
        ? await _getNextAsset(currentBucketIndex, assetId)
        : await _getPrevAsset(currentBucketIndex, assetId);

    return asset?.id ?? null;
  };

  return {
    setInitialState,
    getAssetsByBucket,
    removeAsset,
    updateBucketHeight,
    cancelBucketRequest,
    getAdjacentAsset,
    updateAsset,
    subscribe,
  };
}
