import { AssetBucket, AssetGridState, BucketPosition, Viewport } from '$lib/models/asset-grid-state';
import type { AssetCountByTimeBucket } from '@api';

export interface AssetStore {
  init: (viewport: Viewport, data: AssetCountByTimeBucket[], userId: string | undefined) => void;

  // bucket
  loadBucket: (bucket: string, position: BucketPosition) => Promise<void>;
  updateBucket: (bucket: string, actualBucketHeight: number) => number;
  cancelBucket: (bucket: AssetBucket) => void;

  // asset
  removeAsset: (assetId: string) => void;
  updateAsset: (assetId: string, isFavorite: boolean) => void;

  // asset navigation
  getNextAssetId: (assetId: string) => Promise<string | null>;
  getPreviousAssetId: (assetId: string) => Promise<string | null>;

  // store
  subscribe: (run: (value: AssetGridState) => void, invalidate?: (value?: AssetGridState) => void) => () => void;
}

export function createAssetStore(): AssetStore {
  const store = new AssetGridState();

  return {
    init: store.init.bind(store),
    loadBucket: store.loadBucket.bind(store),
    updateBucket: store.updateBucket.bind(store),
    cancelBucket: store.cancelBucket.bind(store),
    removeAsset: store.removeAsset.bind(store),
    updateAsset: store.updateAsset.bind(store),
    getNextAssetId: store.getNextAssetId.bind(store),
    getPreviousAssetId: store.getPreviousAssetId.bind(store),
    subscribe: store.subscribe,
  };
}
