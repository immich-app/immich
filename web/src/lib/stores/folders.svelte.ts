import {
  getAssetsByOriginalPath,
  getUniqueOriginalPaths,
  /**
   * TODO: Incorrect type
   */
  type AssetResponseDto,
} from '@immich/sdk';

type AssetCache = {
  [path: string]: AssetResponseDto[];
};

class FoldersStore {
  private initialized = false;
  uniquePaths = $state<string[]>([]);
  assets = $state<AssetCache>({});

  async fetchUniquePaths() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    const uniquePaths = await getUniqueOriginalPaths();
    this.uniquePaths.push(...uniquePaths);
    this.uniquePaths.sort();
  }

  async fetchAssetsByPath(path: string) {
    if (this.assets[path]) {
      return;
    }

    this.assets[path] = await getAssetsByOriginalPath({ path });
  }

  clearCache() {
    this.initialized = false;
    this.uniquePaths = [];
    this.assets = {};
  }
}

export const foldersStore = new FoldersStore();
