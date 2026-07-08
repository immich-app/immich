import {
  getAssetsByOriginalPath,
  getUniqueOriginalPaths,
  /**
   * TODO: Incorrect type
   */
  type AssetResponseDto,
} from '@immich/sdk';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { TreeNode } from '$lib/utils/tree-utils';

type AssetCache = {
  [path: string]: AssetResponseDto[];
};

class FoldersStore {
  folders = $state.raw<TreeNode | null>(null);
  private initialized = false;
  private assets = $state<AssetCache>({});

  constructor() {
    eventManager.on({
      AuthLogout: () => this.clearCache(),
    });
  }

  async fetchTree(): Promise<TreeNode> {
    if (this.initialized) {
      return this.folders!;
    }
    return this.refreshTree();
  }

  async refreshTree(): Promise<TreeNode> {
    this.folders = TreeNode.fromPaths(await getUniqueOriginalPaths());
    this.folders.collapse();
    this.initialized = true;
    return this.folders;
  }

  bustAssetCache() {
    this.assets = {};
  }

  async refreshAssetsByPath(path: string) {
    return (this.assets[path] = await getAssetsByOriginalPath({ path }));
  }

  async fetchAssetsByPath(path: string) {
    return (this.assets[path] ??= await getAssetsByOriginalPath({ path }));
  }

  async refreshFolderAssets(path: string) {
    const assets = await this.refreshAssetsByPath(path);
    if (assets.length === 0) {
      await this.refreshTree();
    }

    return assets;
  }

  clearCache() {
    this.initialized = false;
    this.assets = {};
    this.folders = null;
  }
}

export const foldersStore = new FoldersStore();
