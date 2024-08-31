import { buildTree, type RecursiveObject } from '$lib/utils/tree-utils';
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
  folders: RecursiveObject | null;
  assets: AssetCache;
};

function createFoldersStore() {
  const { subscribe, set, update } = writable({ uniquePaths: null, folders: null, assets: {} } as FoldersStore);

  async function fetchUniquePaths() {
    let state = get(foldersStore);

    if (state.folders === null) {
      const uniquePaths = await getUniqueOriginalPaths();
      if (uniquePaths) {
        state = { ...state, folders: buildTree(uniquePaths) };
        update(() => state);
      }
    }

    return state;
  }

  async function fetchAssetsByPath(path: string) {
    const state = get(foldersStore);

    if (!state.assets[path]) {
      const assets = await getAssetsByOriginalPath({ path });
      if (assets) {
        state.assets[path] = assets;
        update(() => state);
      }
    }

    return state;
  }

  function clearCache() {
    set({ uniquePaths: null, folders: null, assets: {} });
  }

  return {
    subscribe,
    fetchUniquePaths,
    fetchAssetsByPath,
    clearCache,
  };
}

export const foldersStore = createFoldersStore();
