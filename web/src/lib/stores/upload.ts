import { derived, writable } from 'svelte/store';
import { UploadState, type UploadAsset } from '../models/upload-asset';

function createUploadStore() {
  const uploadAssets = writable<Array<UploadAsset>>([]);
  const stats = writable<{ errors: number; duplicates: number; success: number; total: number }>({
    errors: 0,
    duplicates: 0,
    success: 0,
    total: 0,
  });

  const { subscribe } = uploadAssets;

  const isUploading = derived(uploadAssets, (items) => items.length > 0);
  const isDismissible = derived(uploadAssets, (items) =>
    items.some((item) => item.state === UploadState.ERROR || item.state === UploadState.DUPLICATED),
  );
  const remainingUploads = derived(
    uploadAssets,
    (values) => values.filter((a) => a.state === UploadState.PENDING || a.state === UploadState.STARTED).length,
  );

  const addItem = (newAsset: UploadAsset) => {
    uploadAssets.update(($assets) => {
      const duplicate = $assets.find((asset) => asset.id === newAsset.id);
      if (duplicate) {
        return $assets.map((asset) => (asset.id === newAsset.id ? newAsset : asset));
      }

      stats.update((stats) => {
        stats.total++;
        return stats;
      });

      $assets.push({
        ...newAsset,
        speed: 0,
        state: UploadState.PENDING,
        progress: 0,
        eta: 0,
      });

      return $assets;
    });
  };

  const updateProgress = (id: string, loaded: number, total: number) => {
    updateAssetMap(id, (v) => {
      const uploadSpeed = v.startDate ? loaded / ((Date.now() - v.startDate) / 1000) : 0;
      return {
        ...v,
        progress: Math.floor((loaded / total) * 100),
        speed: uploadSpeed,
        eta: Math.ceil((total - loaded) / uploadSpeed),
      };
    });
  };

  const markStarted = (id: string) => {
    updateItem(id, {
      state: UploadState.STARTED,
      startDate: Date.now(),
    });
  };

  const updateAssetMap = (id: string, mapper: (assets: UploadAsset) => UploadAsset) => {
    uploadAssets.update((uploadingAssets) => {
      return uploadingAssets.map((asset) => {
        if (asset.id == id) {
          return mapper(asset);
        }
        return asset;
      });
    });
  };

  const updateItem = (id: string, partialObject: Partial<UploadAsset>) => {
    updateAssetMap(id, (v) => ({ ...v, ...partialObject }));
  };

  const removeItem = (id: string) => {
    uploadAssets.update((uploadingAsset) => uploadingAsset.filter((a) => a.id != id));
  };

  const dismissErrors = () =>
    uploadAssets.update((value) =>
      value.filter((e) => e.state !== UploadState.ERROR && e.state !== UploadState.DUPLICATED),
    );

  const reset = () => {
    uploadAssets.set([]);
    stats.set({ errors: 0, duplicates: 0, success: 0, total: 0 });
  };

  const track = (value: 'success' | 'duplicate' | 'error') => {
    stats.update((stats) => {
      switch (value) {
        case 'success': {
          stats.success++;
          break;
        }

        case 'duplicate': {
          stats.duplicates++;
          break;
        }

        case 'error': {
          stats.errors++;
          break;
        }
      }

      return stats;
    });
  };

  return {
    stats,
    remainingUploads,
    isDismissible,
    isUploading,
    track,
    dismissErrors,
    reset,
    markStarted,
    addItem,
    updateItem,
    removeItem,
    updateProgress,
    subscribe,
  };
}

export const uploadAssetsStore = createUploadStore();
