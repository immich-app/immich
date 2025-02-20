import { buildTree, type RecursiveObject } from '$lib/utils/tree-utils';
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
  rootPath = '';
  tree = $state<RecursiveObject>({});

  async fetchUniquePaths() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    const uniquePaths = await getUniqueOriginalPaths();
    this.uniquePaths.push(...uniquePaths);

    this.tree = buildTree(foldersStore.uniquePaths);

    const getAssets = async () => {
      await this.fetchAssetsByPath(this.rootPath);
      return this.assets[this.rootPath] || null;
    };

    let currentFolders = Object.keys(this.tree || {}).sort();
    let currentAssets = await getAssets();

    while (currentFolders.length === 1 && currentAssets.length === 0) {
      const folder = currentFolders[0];
      this.rootPath += `/${folder}`;
      this.tree = this.tree[folder];
      currentFolders = Object.keys(this.tree || {}).sort();
      currentAssets = await getAssets();
    }
  }

  bustAssetCache() {
    this.assets = {};
  }

  async refreshAssetsByPath(path: string | null) {
    if (!path) {
      return;
    }
    this.assets[path] = await getAssetsByOriginalPath({ path: this.getEffectivePath(path) });
  }

  async fetchAssetsByPath(path: string) {
    if (this.assets[path]) {
      return;
    }

    this.assets[path] = await getAssetsByOriginalPath({ path: this.getEffectivePath(path) });
  }

  private getEffectivePath(path: string) {
    return this.rootPath ? this.rootPath + '/' + path : path;
  }

  clearCache() {
    this.initialized = false;
    this.uniquePaths = [];
    this.assets = {};
  }
}

export const foldersStore = new FoldersStore();
