import { QueryParameter } from '#lib/constants.ts';
import type { TimelineAsset } from '#lib/managers/timeline-manager/types.ts';
import { userPreferencesManager } from '#lib/managers/user-preferences-manager.svelte.ts';
import { executeMutation, queryClient } from '#lib/queries/client.ts';
import {
  deleteMemoryMutation,
  removeMemoryAssetsMutation,
  searchMemoriesQuery,
  updateCachedMemories,
  updateMemoryMutation,
  type MemoryFilters,
} from '#lib/queries/memory.query.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import { Route } from '#lib/route.ts';
import { memoryLaneTitle } from '#lib/utils.ts';
import { toTimelineAsset } from '#lib/utils/timeline-util.ts';
import { MemorySearchOrder, type AssetResponseDto, type MemoryResponseDto } from '@immich/sdk';
import { omitBy } from 'lodash-es';
import { DateTime } from 'luxon';
import { fromStore } from 'svelte/store';
import { goto } from '$app/navigation';
import { navigating, page } from '$app/state';

type AdjacentMemory = {
  href: string;
  assetId: string;
  title: string;
};

/** Everything the memory viewer renders, for the position currently in the url. */
export type MemoryState = {
  memory: MemoryResponseDto;
  asset: TimelineAsset;
  /** The assets the asset viewer can navigate through, spanning the adjacent memories. */
  viewerAssets: AssetResponseDto[];
  previousMemory?: AdjacentMemory;
  nextMemory?: AdjacentMemory;
  previousHref?: string;
  nextHref?: string;
  getAssetHref: (assetId: string) => string | undefined;
};

class MemoryManager {
  #filters = $state<MemoryFilters>({ size: 250, order: MemorySearchOrder.Desc });

  #memoryLaneTitle = fromStore(memoryLaneTitle);

  #url = $derived({
    memoryId: page.params.id,
    assetId: page.url.searchParams.get(QueryParameter.ASSET_ID) ?? undefined,
    isSaved: page.url.searchParams.get(QueryParameter.IS_SAVED) === 'true' || undefined,
  });

  memoriesHref = $derived(Route.memories({ isSaved: this.#url.isSaved }));

  constructor() {
    this.#scheduleHourlyRefresh();
  }

  get filters() {
    return this.#filters;
  }

  setFilters(filters: MemoryFilters) {
    this.#filters = omitBy(filters, (item) => item === undefined);
  }

  applyPreferences() {
    const { showUpcoming, onlyFavorites } = userPreferencesManager.memories;
    this.setFilters({
      order: MemorySearchOrder.Desc,
      isSaved: onlyFavorites || undefined,
      isUpcoming: showUpcoming && undefined,
    });
  }

  loadMemories() {
    return queryClient.query(searchMemoriesQuery(this.#filters));
  }

  /** Fetch a memory that is not part of the loaded list, i.e. when opening a link to an older one. */
  async loadMemory(id: string) {
    const memories = await this.loadMemories();
    const memory = memories.find((item) => item.id === id);
    if (memory) {
      return memory;
    }

    const [loaded] = await queryClient.query(searchMemoriesQuery({ id })).catch(() => []);
    if (!loaded) {
      return;
    }

    // memories are ordered by date, descending
    queryClient.setQueryData(searchMemoriesQuery(this.#filters).queryKey, (items = []) => {
      const index = items.findIndex(({ memoryAt }) => memoryAt < loaded.memoryAt);
      const insertAt = index === -1 ? items.length : index;
      return [...items.slice(0, insertAt), loaded, ...items.slice(insertAt)];
    });

    return loaded;
  }

  getCurrent(memories: MemoryResponseDto[]): MemoryState | undefined {
    const { memoryId, assetId } = this.#url;
    if (memoryId === undefined || assetId === undefined) {
      return;
    }

    const memoryIndex = memories.findIndex(({ id }) => id === memoryId);
    if (memoryIndex === -1) {
      return;
    }

    const memory = memories[memoryIndex];
    const assetIndex = memory.assets.findIndex(({ id }) => id === assetId);
    if (assetIndex === -1) {
      return;
    }

    const previousMemory = memories[memoryIndex - 1];
    const nextMemory = memories[memoryIndex + 1];

    return {
      memory,
      asset: toTimelineAsset(memory.assets[assetIndex]),
      viewerAssets: [...(previousMemory?.assets ?? []), ...memory.assets, ...(nextMemory?.assets ?? [])],
      previousMemory: this.#toAdjacentMemory(previousMemory),
      nextMemory: this.#toAdjacentMemory(nextMemory),
      previousHref:
        assetIndex > 0
          ? this.#toHref(memory, memory.assets[assetIndex - 1])
          : this.#toHref(previousMemory, previousMemory?.assets.at(-1)),
      nextHref:
        assetIndex < memory.assets.length - 1
          ? this.#toHref(memory, memory.assets[assetIndex + 1])
          : this.#toHref(nextMemory, nextMemory?.assets[0]),
      getAssetHref: (assetId: string) => this.#toHref(memory, { id: assetId }),
    };
  }

  #toHref(memory: { id: string } | undefined, asset: { id: string } | undefined) {
    return memory && asset
      ? Route.viewMemory({ id: memory.id, assetId: asset.id, isSaved: this.#url.isSaved })
      : undefined;
  }

  #toAdjacentMemory(memory: MemoryResponseDto | undefined): AdjacentMemory | undefined {
    if (!memory) {
      return;
    }

    const asset = memory.assets[0];
    const href = this.#toHref(memory, asset);
    if (!href) {
      return;
    }

    return { href, assetId: asset.id, title: this.#memoryLaneTitle.current(memory) };
  }

  // the memory holding an asset, checking the given memory first, then the ones next to it
  getMemoryWithAsset(memories: MemoryResponseDto[], assetId: string, memoryId: string) {
    const memoryIndex = memories.findIndex(({ id }) => id === memoryId);
    if (memoryIndex === -1) {
      return;
    }

    return [memoryIndex, memoryIndex - 1, memoryIndex + 1]
      .map((index) => memories[index])
      .find((memory) => memory?.assets.some(({ id }) => id === assetId));
  }

  async hideAssets(current: MemoryState | undefined, ids: string[]) {
    if (current && ids.includes(current.asset.id)) {
      await this.#leave(current);
    }

    const idSet = new Set<string>(ids);
    updateCachedMemories((memories) =>
      memories
        .map((memory) => ({ ...memory, assets: memory.assets.filter((asset) => !idSet.has(asset.id)) }))
        .filter((memory) => memory.assets.length > 0),
    );
  }

  async deleteCurrentAsset(current: MemoryState) {
    const { memory, asset } = current;
    await this.#leave(current);

    if (memory.assets.length === 1) {
      await executeMutation(deleteMemoryMutation, [{ id: memory.id }]);
      return;
    }

    await executeMutation(removeMemoryAssetsMutation, [{ id: memory.id, bulkIdsDto: { ids: [asset.id] } }]);
  }

  async deleteCurrentMemory(current: MemoryState) {
    await this.#goto(current.nextMemory?.href ?? current.previousMemory?.href ?? this.memoriesHref);
    await executeMutation(
      () => deleteMemoryMutation({ success: { toast: 'removed_memory' } }),
      [{ id: current.memory.id }],
    );
  }

  toggleSaved({ memory }: MemoryState) {
    const isSaved = !memory.isSaved;
    return executeMutation(
      () => updateMemoryMutation({ success: { toast: isSaved ? 'added_to_favorites' : 'removed_from_favorites' } }),
      [{ id: memory.id, memoryUpdateDto: { isSaved } }],
    );
  }

  // navigate away before removing something, so the url never points at a deleted position
  async #leave({ nextHref, previousHref }: MemoryState) {
    await this.#goto(nextHref ?? previousHref ?? this.memoriesHref);
    await navigating.complete;
  }

  #goto(href: string) {
    return goto(href, { replace: true, reset: false });
  }

  #scheduleHourlyRefresh() {
    const now = DateTime.utc();
    let nextEvent = now.set({ minute: 0, second: 5 });

    if (nextEvent <= now) {
      nextEvent = nextEvent.plus({ hours: 1 });
    }

    const refresh = () => void queryClient.invalidateQueries({ queryKey: QueryKeys.memories() });

    setTimeout(() => {
      refresh();
      setInterval(refresh, 60 * 60 * 1000);
    }, nextEvent.diff(now).as('milliseconds'));
  }
}

export const memoryManager = new MemoryManager();
