import { derived, get, writable } from 'svelte/store';
import { UploadState, type UploadAsset } from '../models/upload-asset';

function createUploadStore() {
  const uploadAssets = writable<Array<UploadAsset>>([]);

  const duplicateCounter = writable(0);
  const successCounter = writable(0);
  const totalUploadCounter = writable(0);

  const { subscribe } = uploadAssets;

  const isUploading = derived(uploadAssets, ($uploadAssets) => {
    return $uploadAssets.length > 0;
  });
  const errorsAssets = derived(uploadAssets, (a) => a.filter((e) => e.state === UploadState.ERROR));
  const errorCounter = derived(errorsAssets, (values) => values.length);
  const hasError = derived(errorCounter, (values) => values > 0);
  const remainingUploads = derived(
    uploadAssets,
    (values) => values.filter((a) => a.state === UploadState.PENDING || a.state === UploadState.STARTED).length,
  );

  const addNewUploadAsset = (newAsset: UploadAsset) => {
    const assets = get(uploadAssets);
    const duplicate = assets.find((asset) => asset.id === newAsset.id);
    if (duplicate) {
      uploadAssets.update((assets) => assets.map((asset) => (asset.id === newAsset.id ? newAsset : asset)));
    } else {
      totalUploadCounter.update((c) => c + 1);
      uploadAssets.update((assets) => [
        ...assets,
        {
          ...newAsset,
          speed: 0,
          state: UploadState.PENDING,
          progress: 0,
          eta: 0,
        },
      ]);
    }
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
    updateAsset(id, {
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

  const updateAsset = (id: string, partialObject: Partial<UploadAsset>) => {
    updateAssetMap(id, (v) => ({ ...v, ...partialObject }));
  };

  const removeUploadAsset = (id: string) => {
    uploadAssets.update((uploadingAsset) => uploadingAsset.filter((a) => a.id != id));
  };

  const dismissErrors = () => uploadAssets.update((value) => value.filter((e) => e.state !== UploadState.ERROR));

  const resetStore = () => {
    uploadAssets.set([]);
    duplicateCounter.set(0);
    successCounter.set(0);
    totalUploadCounter.set(0);
  };

  return {
    subscribe,
    errorCounter,
    duplicateCounter,
    successCounter,
    totalUploadCounter,
    remainingUploads,
    hasError,
    dismissErrors,
    isUploading,
    resetStore,
    addNewUploadAsset,
    markStarted,
    updateProgress,
    updateAsset,
    removeUploadAsset,
  };
}

export const uploadAssetsStore = createUploadStore();
