import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { Route } from '$lib/route';
import { toTimelineAsset } from '$lib/utils/timeline-util';
import type { MemoryResponseDto } from '@immich/sdk';

export type MemoryAssetSource = {
  memoryIndex: number;
  assetIndex: number;
  memory: MemoryResponseDto;
  asset: TimelineAsset;
  previousMemory?: MemoryResponseDto;
  previous?: MemoryAssetSource;
  next?: MemoryAssetSource;
  nextMemory?: MemoryResponseDto;
};

export const buildMemoryAssets = (memories: MemoryResponseDto[]) => {
  const memoryAssets: MemoryAssetSource[] = [];
  let previous: MemoryAssetSource | undefined;

  for (const [memoryIndex, memory] of memories.entries()) {
    for (const [assetIndex, asset] of memory.assets.entries()) {
      const current: MemoryAssetSource = {
        memory,
        memoryIndex,
        previousMemory: memories[memoryIndex - 1],
        nextMemory: memories[memoryIndex + 1],
        asset: toTimelineAsset(asset),
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
};

export const findMemoryAsset = (memories: MemoryResponseDto[], assetId: string | undefined) => {
  const memoryAssets = buildMemoryAssets(memories);
  return memoryAssets.find((memoryAsset) => memoryAsset.asset.id === assetId) ?? memoryAssets[0];
};

export const removeAssetsFromMemoryList = (memories: MemoryResponseDto[], ids: string[]) => {
  const idSet = new Set<string>(ids);

  return memories
    .map((memory) => ({
      ...memory,
      assets: memory.assets.filter((asset) => !idSet.has(asset.id)),
    }))
    .filter((memory) => memory.assets.length > 0);
};

export const getMemoryViewerExitRoute = (source?: 'history') =>
  source === 'history' ? Route.memories() : Route.photos();
