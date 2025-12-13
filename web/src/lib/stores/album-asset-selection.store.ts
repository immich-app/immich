import { writable } from 'svelte/store';

function createAlbumAssetSelectionStore() {
  const isAlbumAssetSelectionOpen = writable<boolean>(false);
  return {
    isAlbumAssetSelectionOpen,
  };
}

export const albumAssetSelectionStore = createAlbumAssetSelectionStore();
