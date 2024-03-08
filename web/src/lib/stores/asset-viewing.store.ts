import { getKey } from '$lib/utils';
import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

function createAssetViewingStore() {
  const viewingAssetStoreState = writable<AssetResponseDto>();
  const viewState = writable<boolean>(false);

  const setAssetId = async (id: string) => {
    const data = await getAssetInfo({ id, key: getKey() });
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
    isViewing: {
      subscribe: viewState.subscribe,
      set: viewState.set,
    },
    setAssetId,
    showAssetViewer,
  };
}

export const assetViewingStore = createAssetViewingStore();
