import { eventManager } from '$lib/stores/event-manager.svelte';
import { asLocalTimeISO } from '$lib/utils/date-time';
import {
  type AssetResponseDto,
  deleteMemory,
  type MemoryResponseDto,
  removeMemoryAssets,
  searchMemories,
  updateMemory,
} from '@immich/sdk';
import { DateTime } from 'luxon';

type MemoryIndex = {
  memoryIndex: number;
  assetIndex: number;
};

export type MemoryAsset = MemoryIndex & {
  memory: MemoryResponseDto;
  asset: AssetResponseDto;
  previousMemory?: MemoryResponseDto;
  previous?: MemoryAsset;
  next?: MemoryAsset;
  nextMemory?: MemoryResponseDto;
};

class MemoryStoreSvelte {
  constructor() {
    eventManager.on('auth.logout', () => this.clearCache());
  }

  memories = $state<MemoryResponseDto[]>([]);
  private initialized = false;
  private memoryAssets = $derived.by(() => {
    const memoryAssets: MemoryAsset[] = [];
    let previous: MemoryAsset | undefined;
    for (const [memoryIndex, memory] of this.memories.entries()) {
      for (const [assetIndex, asset] of memory.assets.entries()) {
        const current = {
          memory,
          memoryIndex,
          previousMemory: this.memories[memoryIndex - 1],
          nextMemory: this.memories[memoryIndex + 1],
          asset,
          assetIndex,
          previous,
        };

        memoryAssets.push(current);

        if (previous) {
          previous.next = current;
        }

        previous = current;
      }
    }

    return memoryAssets;
  });

  getMemoryAsset(assetId: string | undefined) {
    return this.memoryAssets.find((memoryAsset) => memoryAsset.asset.id === assetId) ?? this.memoryAssets[0];
  }

  hideAssetsFromMemory(ids: string[]) {
    const idSet = new Set<string>(ids);
    for (const memory of this.memories) {
      memory.assets = memory.assets.filter((asset) => !idSet.has(asset.id));
    }
    // if we removed all assets from a memory, then lets remove those memories (we don't show memories with 0 assets)
    this.memories = this.memories.filter((memory) => memory.assets.length > 0);
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

  async initialize() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    await this.loadAllMemories();
  }

  clearCache() {
    this.initialized = false;
    this.memories = [];
  }

  private async loadAllMemories() {
    const memories = await searchMemories({ $for: asLocalTimeISO(DateTime.now()) });
    this.memories = memories.filter((memory) => memory.assets.length > 0);
  }
}

export const memoryStore = new MemoryStoreSvelte();
