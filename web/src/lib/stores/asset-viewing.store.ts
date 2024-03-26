import { getKey } from '$lib/utils';
import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

function createAssetViewingStore() {
  const viewingAssetStoreState = writable<AssetResponseDto>();
  const preloadAssets = writable<AssetResponseDto[]>([]);
  const viewState = writable<boolean>(false);

  const setAssetId = async (id: string, preloadIds?: string[]) => {
    const data = await getAssetInfo({ id, key: getKey() });

    if (preloadIds) {
      const preloadList = [];
      for (const preloadId of preloadIds) {
        if (preloadId) {
          const preloadAsset = await getAssetInfo({ id: preloadId, key: getKey() });
          preloadList.push(preloadAsset);
        }
      }
      preloadAssets.set(preloadList);
    }

    viewingAssetStoreState.set(data);
    viewState.set(true);
  };

  const showAssetViewer = (show: boolean) => {
    viewState.set(show);
  };

  return {
    asset: {
      subscribe: viewingAssetStoreState.subscribe,
    },
    preloadAssets: {
      subscribe: preloadAssets.subscribe,
    },
    isViewing: {
      subscribe: viewState.subscribe,
      set: viewState.set,
    },
    setAssetId,
    showAssetViewer,
  };
}

export const assetViewingStore = createAssetViewingStore();
