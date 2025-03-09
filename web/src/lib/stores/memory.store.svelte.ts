import { asLocalTimeISO } from '$lib/utils/date-time';
import { type AssetResponseDto, type MemoryResponseDto, searchMemories } from '@immich/sdk';
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
  private initialized = false;
  memories = $state<MemoryResponseDto[]>([]);
  memoryAssets = $derived.by(() => {
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

  async initialize() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    await this.loadAllMemories();
  }

  async loadAllMemories() {
    const memories = await searchMemories({ $for: asLocalTimeISO(DateTime.now()) });
    this.memories = memories.filter((memory) => memory.assets.length > 0);
  }
}

export const memoryStore = new MemoryStoreSvelte();
