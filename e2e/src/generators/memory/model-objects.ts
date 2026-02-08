import { faker } from '@faker-js/faker';
import { MemoryType, type MemoryResponseDto, type OnThisDayDto } from '@immich/sdk';
import { DateTime } from 'luxon';
import { toAssetResponseDto } from 'src/generators/timeline/rest-response';
import type { MockTimelineAsset } from 'src/generators/timeline/timeline-config';
import { SeededRandom, selectRandomMultiple } from 'src/generators/timeline/utils';

export type MemoryConfig = {
  id?: string;
  ownerId: string;
  year: number;
  memoryAt: string;
  isSaved?: boolean;
};

export type MemoryYearConfig = {
  year: number;
  assetCount: number;
};

export function generateMemory(config: MemoryConfig, assets: MockTimelineAsset[]): MemoryResponseDto {
  const now = new Date().toISOString();
  const memoryId = config.id ?? faker.string.uuid();

  return {
    id: memoryId,
    assets: assets.map((asset) => toAssetResponseDto(asset)),
    data: { year: config.year } as OnThisDayDto,
    memoryAt: config.memoryAt,
    createdAt: now,
    updatedAt: now,
    isSaved: config.isSaved ?? false,
    ownerId: config.ownerId,
    type: MemoryType.OnThisDay,
  };
}

export function generateMemoriesFromTimeline(
  timelineAssets: MockTimelineAsset[],
  ownerId: string,
  memoryConfigs: MemoryYearConfig[],
  seed: number = 42,
): MemoryResponseDto[] {
  const rng = new SeededRandom(seed);
  const memories: MemoryResponseDto[] = [];
  const usedAssetIds = new Set<string>();

  for (const config of memoryConfigs) {
    const yearAssets = timelineAssets.filter((asset) => {
      const assetYear = DateTime.fromISO(asset.fileCreatedAt).year;
      return assetYear === config.year && !usedAssetIds.has(asset.id);
    });

    if (yearAssets.length === 0) {
      continue;
    }

    const countToSelect = Math.min(config.assetCount, yearAssets.length);
    const selectedAssets = selectRandomMultiple(yearAssets, countToSelect, rng);

    for (const asset of selectedAssets) {
      usedAssetIds.add(asset.id);
    }

    selectedAssets.sort(
      (a, b) => DateTime.fromISO(b.fileCreatedAt).diff(DateTime.fromISO(a.fileCreatedAt)).milliseconds,
    );

    const memoryAt = DateTime.now().set({ year: config.year }).toISO()!;

    memories.push(
      generateMemory(
        {
          ownerId,
          year: config.year,
          memoryAt,
        },
        selectedAssets,
      ),
    );
  }

  return memories;
}
