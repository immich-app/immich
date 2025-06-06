import { eventManager } from '$lib/managers/event-manager.svelte';
import { TreeNode } from '$lib/utils/tree-utils';
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
  folders = $state.raw<TreeNode>();
  private initialized = false;
  private assets = $state<AssetCache>({});

  constructor() {
    eventManager.on('auth.logout', () => this.clearCache());
  }

  async fetchTree(): Promise<TreeNode> {
    if (this.initialized) {
      return this.folders!;
    }
    this.initialized = true;

    this.folders = TreeNode.fromPaths(await getUniqueOriginalPaths());
    this.folders.collapseTree();
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

  clearCache() {
    this.initialized = false;
    this.assets = {};
    this.folders = undefined;
  }
}

export const foldersStore = new FoldersStore();
