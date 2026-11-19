import { asMutation, queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import {
  MemoryType,
  deleteMemory,
  memoriesStatistics,
  removeMemoryAssets,
  searchMemories,
  updateMemory,
  type MemoryResponseDto,
} from '@immich/sdk';
import { queryOptions, type MutationMeta } from '@tanstack/svelte-query';

export type MemoryFilters = Parameters<typeof searchMemories>[0];

const birthdaysFirst = (memories: MemoryResponseDto[]) =>
  [...memories].sort((a, b) => Number(b.type === MemoryType.Birthday) - Number(a.type === MemoryType.Birthday));

export const searchMemoriesQuery = (filters: MemoryFilters) =>
  queryOptions({
    queryKey: QueryKeys.memories(filters),
    queryFn: ({ signal }) => searchMemories(filters, { signal }),
    select: filters.$for ? birthdaysFirst : undefined,
  });

export const memoriesStatisticsQuery = (filters: MemoryFilters) =>
  queryOptions({
    queryKey: QueryKeys.memoryStatistics(filters),
    queryFn: ({ signal }) => memoriesStatistics(filters, { signal }),
    select: ({ total }) => total,
  });

export const updateMemoryMutation = (meta?: MutationMeta) =>
  asMutation(updateMemory, {
    onSuccess: (memory) =>
      updateCachedMemories((memories) => memories.map((item) => (item.id === memory.id ? memory : item))),
    meta,
  });

export const deleteMemoryMutation = (meta?: MutationMeta) =>
  asMutation(deleteMemory, {
    onSuccess: (_, [{ id }]) => {
      updateCachedMemories((memories) => memories.filter((memory) => memory.id !== id));
      return queryClient.invalidateQueries({ queryKey: QueryKeys.memoryStatistics() });
    },
    meta,
  });

export const removeMemoryAssetsMutation = () =>
  asMutation(removeMemoryAssets, {
    onSuccess: (_, [{ id, bulkIdsDto }]) => {
      const ids = new Set(bulkIdsDto.ids);
      updateCachedMemories((memories) =>
        memories.map((memory) =>
          memory.id === id ? { ...memory, assets: memory.assets.filter((asset) => !ids.has(asset.id)) } : memory,
        ),
      );
    },
  });

export const updateCachedMemories = (update: (memories: MemoryResponseDto[]) => MemoryResponseDto[]) =>
  queryClient.setQueriesData<MemoryResponseDto[]>(
    { queryKey: QueryKeys.memories(), predicate: ({ state }) => Array.isArray(state.data) },
    (memories) => memories && update(memories),
  );
