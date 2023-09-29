import { writable } from 'svelte/store';
import { api, type AssetResponseDto } from '@api';
import { persisted } from 'svelte-local-storage-store';

function createAssetViewingStore() {
  const viewingAssetStoreState = writable<AssetResponseDto>();
  const viewState = writable<boolean>(false);
  const slideshow = writable<boolean>(false);
  const slideshowShuffle = persisted<boolean>('slideshow-shuffle', true);

  const setAssetId = async (id: string) => {
    const { data } = await api.assetApi.getAssetById({ id, key: api.getKey() });
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
    slideshow,
    slideshowShuffle,
  };
}

export const assetViewingStore = createAssetViewingStore();
