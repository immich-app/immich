import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { asLocalTimeISO } from '$lib/utils/date-time';
import { findMemoryAsset, removeAssetsFromMemoryList, type MemoryAssetSource } from '$lib/utils/memory-viewer-source';
import { deleteMemory, removeMemoryAssets, searchMemories, updateMemory, type MemoryResponseDto } from '@immich/sdk';
import { DateTime } from 'luxon';

export type MemoryAsset = MemoryAssetSource;

class MemoryManager {
  #loading: Promise<void> | undefined;

  constructor() {
    eventManager.on({
      AuthLogout: () => this.clearCache(),
      AuthUserLoaded: () => this.initialize(),
    });

    // loaded event might have already happened
    if (authManager.authenticated) {
      void this.initialize();
    }
  }

  ready() {
    return this.initialize();
  }

  memories = $state<MemoryResponseDto[]>([]);

  getMemoryAsset(assetId: string | undefined) {
    return findMemoryAsset(this.memories, assetId);
  }

  hideAssetsFromMemory(ids: string[]) {
    this.memories = removeAssetsFromMemoryList(this.memories, ids);
  }

  async deleteMemory(id: string) {
    const memory = this.memories.find((memory) => memory.id === id);
    if (memory) {
      await deleteMemory({ id: memory.id });
      this.memories = this.memories.filter((memory) => memory.id !== id);
    }
  }

  async deleteAssetFromMemory(assetId: string) {
    const memoryWithAsset = this.memories.find((memory) => memory.assets.some((asset) => asset.id === assetId));

    if (memoryWithAsset) {
      if (memoryWithAsset.assets.length === 1) {
        await this.deleteMemory(memoryWithAsset.id);
      } else {
        await removeMemoryAssets({ id: memoryWithAsset.id, bulkIdsDto: { ids: [assetId] } });
        memoryWithAsset.assets = memoryWithAsset.assets.filter((asset) => asset.id !== assetId);
      }
    }
  }

  async updateMemorySaved(id: string, isSaved: boolean) {
    const memory = this.memories.find((memory) => memory.id === id);
    if (memory) {
      await updateMemory({
        id,
        memoryUpdateDto: {
          isSaved,
        },
      });
      memory.isSaved = isSaved;
    }
  }

  private clearCache() {
    this.#loading = undefined;
    this.memories = [];
  }

  private initialize() {
    if (!this.#loading) {
      this.#loading = this.load();
    }

    return this.#loading;
  }

  private async load() {
    const memories = await searchMemories({ $for: asLocalTimeISO(DateTime.now()) });
    this.memories = memories.filter((memory) => memory.assets.length > 0);
  }
}

export const memoryManager = new MemoryManager();
