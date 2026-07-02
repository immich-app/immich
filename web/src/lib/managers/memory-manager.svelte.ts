import {
  deleteMemory,
  type MemoryResponseDto,
  removeMemoryAssets,
  searchMemories,
  updateMemory,
  MemorySearchOrder,
  MemoryType,
  memoriesStatistics,
} from '@immich/sdk';
import { DateTime } from 'luxon';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { toTimelineAsset } from '$lib/utils/timeline-util';

type MemoryIndex = {
  memoryIndex: number;
  assetIndex: number;
};

export type MemoryAsset = MemoryIndex & {
  memory: MemoryResponseDto;
  asset: TimelineAsset;
  previousMemory?: MemoryResponseDto;
  previous?: MemoryAsset;
  next?: MemoryAsset;
  nextMemory?: MemoryResponseDto;
};

const PAGE_SIZE = 250;

class MemoryManager {
  #loading: Promise<void> | undefined;
  #filters:
    | {
        $for?: string;
        isSaved?: boolean;
        isTrashed?: boolean;
        order?: MemorySearchOrder;
        page?: number;
        size?: number;
        $type?: MemoryType;
      }
    | undefined;
  #hasNextPage: boolean;
  #page: number;
  #total: number | undefined;

  constructor() {
    this.#filters = undefined;
    this.#hasNextPage = true;
    this.#page = 1;
    this.#total = $state(undefined);

    eventManager.on({
      AuthLogout: () => this.clearCache(),
      AuthUserLoaded: () => this.initialize(),
    });

    // loaded event might have already happened
    if (authManager.authenticated) {
      void this.initialize();
    }

    this.scheduleHourlyRefresh();
  }

  get filters() {
    return this.#filters;
  }

  set filters(filters) {
    this.#filters = filters;
    this.clearCache();
    void this.loadNextPage();
  }

  ready() {
    return this.initialize();
  }

  memories = $state<MemoryResponseDto[]>([]);
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

  loadNextPage() {
    if (this.#hasNextPage) {
      if (this.#loading === undefined) {
        this.#loading = this.load(this.#page++);
      } else {
        void this.#loading.then(() => (this.#loading = this.load(this.#page++)));
      }
    }
  }

  get hasNextPage() {
    return this.#hasNextPage;
  }

  get total() {
    return this.#total;
  }

  private clearCache() {
    this.#loading = undefined;
    this.#hasNextPage = true;
    this.#page = 1;
    this.#total = undefined;
    this.memories = [];
  }

  private initialize() {
    if (!this.#loading) {
      this.#loading = this.load(this.#page++);
    }

    return this.#loading;
  }

  private async load(page: number) {
    if (this.#filters !== undefined) {
      const items = await searchMemories({ size: PAGE_SIZE, ...this.#filters, page });
      this.memories.push(...items);

      if (this.#total === undefined) {
        const { total } = await memoriesStatistics(this.#filters);
        this.#total = total;
      }

      this.#hasNextPage = this.memories.length < this.#total;
    }
  }

  private scheduleHourlyRefresh() {
    const now = DateTime.utc();
    let nextEvent = now.set({ minute: 0, second: 5 });

    if (nextEvent <= now) {
      nextEvent = nextEvent.plus({ hours: 1 });
    }

    const initialDelay = nextEvent.diff(now).as('milliseconds');

    setTimeout(() => {
      if (this.#page <= 2) {
        this.clearCache();
        this.loadNextPage();
      }

      // Schedule subsequent events hourly
      setInterval(
        () => {
          if (this.#page <= 2) {
            this.clearCache();
            this.loadNextPage();
          }
        },
        60 * 60 * 1000,
      );
    }, initialDelay);
  }
}

export const memoryManager = new MemoryManager();
