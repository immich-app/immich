import {
  getAssetsByOriginalPath,
  getUniqueOriginalPaths,
  /**
   * TODO: Incorrect type
   */
  type AssetResponseDto,
} from '@immich/sdk';
import { get, writable } from 'svelte/store';

type AssetCache = {
  [path: string]: AssetResponseDto[];
};

type FoldersStore = {
  uniquePaths: string[] | null;
  assets: AssetCache;
};

function createFoldersStore() {
  const initialState: FoldersStore = {
    uniquePaths: null,
    assets: {},
  };

  const { subscribe, set, update } = writable(initialState);

  async function fetchUniquePaths() {
    const state = get(foldersStore);

    if (state.uniquePaths !== null) {
      return;
    }

    const uniquePaths = await getUniqueOriginalPaths();
    if (uniquePaths) {
      update((state) => ({ ...state, uniquePaths }));
    }
  }

  async function fetchAssetsByPath(path: string) {
    const state = get(foldersStore);

    if (state.assets[path]) {
      return;
    }

    const assets = await getAssetsByOriginalPath({ path });
    if (assets) {
      update((state) => ({
        ...state,
        assets: { ...state.assets, [path]: assets },
      }));
    }
  }

  function clearCache() {
    set(initialState);
  }

  return {
    subscribe,
    fetchUniquePaths,
    fetchAssetsByPath,
    clearCache,
  };
}

export const foldersStore = createFoldersStore();
