import { writable } from 'svelte/store';
import { api, type AssetResponseDto } from '@api';
import { persisted } from 'svelte-local-storage-store';

export enum SlideshowState {
  PlaySlideshow = 'play-slideshow',
  StopSlideshow = 'stop-slideshow',
  None = 'none',
}

function createAssetViewingStore() {
  const viewingAssetStoreState = writable<AssetResponseDto>();
  const viewState = writable<boolean>(false);

  const slideshowShuffle = persisted<boolean>('slideshow-shuffle', true);
  const slideshowState = writable<SlideshowState>(SlideshowState.None);

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
    slideshowShuffle,
    slideshowState,
  };
}

export const assetViewingStore = createAssetViewingStore();
