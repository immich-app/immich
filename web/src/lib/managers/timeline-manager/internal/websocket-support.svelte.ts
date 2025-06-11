import { authManager } from '$lib/managers/auth-manager.svelte';
import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
import { websocketEvents } from '$lib/stores/websocket';
import { toTimelineAsset } from '$lib/utils/timeline-util';
import { getAllAlbums, getAssetInfo, type AssetResponseDto } from '@immich/sdk';
import type { Unsubscriber } from 'svelte/store';

const PROCESS_DELAY_MS = 2500;

export class WebsocketSupport {
  readonly #timelineManager: TimelineManager;
  #unsubscribers: Unsubscriber[] = [];

  #pendingUpdates: {
    updated: AssetResponseDto[];
    trashed: string[];
    deleted: string[];
    personed: { assetId: string; personId: string | undefined; status: 'created' | 'removed' | 'removed_soft' }[];
    album: { albumId: string; assetId: string[]; status: 'added' | 'removed' }[];
  } = {
    updated: [],
    trashed: [],
    deleted: [],
    personed: [],
    album: [],
  };
  #pendingCount() {
    return (
      this.#pendingUpdates.updated.length +
      this.#pendingUpdates.trashed.length +
      this.#pendingUpdates.deleted.length +
      this.#pendingUpdates.personed.length +
      this.#pendingUpdates.album.length
    );
  }
  #processTimeoutId: ReturnType<typeof setTimeout> | undefined;
  #isProcessing = false;

  constructor(timelineManager: TimelineManager) {
    this.#timelineManager = timelineManager;
  }

  connectWebsocketEvents() {
    this.#unsubscribers.push(
      websocketEvents.on('on_asset_trash', (ids) => {
        this.#pendingUpdates.trashed.push(...ids);
        this.#scheduleProcessing();
      }),
      websocketEvents.on('on_asset_person', (data) => {
        this.#pendingUpdates.personed.push(data);
        this.#scheduleProcessing();
      }),
      // uploads and tagging are handled by this event
      websocketEvents.on('on_asset_update', (asset) => {
        this.#pendingUpdates.updated.push(asset);
        this.#scheduleProcessing();
      }),
      websocketEvents.on('on_album_update', (data) => {
        this.#pendingUpdates.album.push(data);
        this.#scheduleProcessing();
      }),
      websocketEvents.on('on_asset_trash', (ids) => {
        this.#pendingUpdates.trashed.push(...ids);
        this.#scheduleProcessing();
      }),
      websocketEvents.on('on_asset_delete', (ids) => {
        this.#pendingUpdates.deleted.push(ids);
        this.#scheduleProcessing();
      }),
    );
  }

  disconnectWebsocketEvents() {
    this.#cleanup();
  }

  #cleanup() {
    for (const unsubscribe of this.#unsubscribers) {
      unsubscribe();
    }
    this.#unsubscribers = [];
    this.#cancelScheduledProcessing();
  }

  #cancelScheduledProcessing() {
    if (this.#processTimeoutId) {
      clearTimeout(this.#processTimeoutId);
      this.#processTimeoutId = undefined;
    }
  }

  #scheduleProcessing() {
    if (this.#processTimeoutId) {
      return;
    }

    this.#processTimeoutId = setTimeout(() => {
      this.#processTimeoutId = undefined;
      void this.#processPendingChanges();
    }, PROCESS_DELAY_MS);
  }

  async #processPendingChanges() {
    if (this.#isProcessing || this.#pendingCount() === 0) {
      return;
    }

    this.#isProcessing = true;

    try {
      await this.#process();
    } finally {
      this.#isProcessing = false;

      if (this.#pendingCount() > 0) {
        this.#scheduleProcessing();
      }
    }
  }

  async #process() {
    const pendingUpdates = this.#pendingUpdates;
    this.#pendingUpdates = {
      updated: [],
      trashed: [],
      deleted: [],
      personed: [],
      album: [],
    };
    await this.#handleUpdatedAssets(pendingUpdates.updated);
    await this.#handleUpdatedAssetsPerson(pendingUpdates.personed);
    await this.#handleUpdatedAssetsAlbum(pendingUpdates.album);
    await this.#handleUpdatedAssetsTrashed(pendingUpdates.trashed);
    this.#timelineManager.removeAssets(pendingUpdates.deleted);
  }

  async #handleUpdatedAssets(assets: AssetResponseDto[]) {
    const prefilteredAssets = assets.filter((asset) => !this.#timelineManager.isExcluded(toTimelineAsset(asset)));
    if (!this.#timelineManager.options.albumId) {
      // also check tags
      if (!this.#timelineManager.options.tagId) {
        return this.#timelineManager.addAssets(prefilteredAssets.map((asset) => toTimelineAsset(asset)));
      }
      for (const asset of prefilteredAssets) {
        if (asset.tags?.some((tag) => tag.id === this.#timelineManager.options.tagId)) {
          this.#timelineManager.addAssets([toTimelineAsset(asset)]);
        } else {
          this.#timelineManager.removeAssets([asset.id]);
        }
      }
    }
    const matchingAssets = [];
    for (const asset of prefilteredAssets) {
      const albums = await getAllAlbums({ assetId: asset.id });
      if (albums.some((album) => album.id === this.#timelineManager.options.albumId)) {
        if (this.#timelineManager.options.tagId) {
          if (asset.tags?.some((tag) => tag.id === this.#timelineManager.options.tagId)) {
            matchingAssets.push(asset);
          } else {
            this.#timelineManager.removeAssets([asset.id]);
          }
        } else {
          matchingAssets.push(asset);
        }
      }
    }
    return this.#timelineManager.addAssets(matchingAssets.map((asset) => toTimelineAsset(asset)));
  }

  async #handleUpdatedAssetsPerson(
    data: { assetId: string; personId: string | undefined; status: 'created' | 'removed' | 'removed_soft' }[],
  ) {
    if (!this.#timelineManager.options.personId) {
      for (const { assetId } of data) {
        const asset = await getAssetInfo({ id: assetId, key: authManager.key });
        this.#timelineManager.addAssets([toTimelineAsset(asset)]);
      }
      return;
    }
    for (const { assetId, personId, status } of data) {
      if (status === 'created') {
        if (personId !== this.#timelineManager.options.personId) {
          continue;
        }
        const asset = await getAssetInfo({ id: assetId, key: authManager.key });
        this.#timelineManager.addAssets([toTimelineAsset(asset)]);
      } else if (personId === this.#timelineManager.options.personId) {
        this.#timelineManager.removeAssets([assetId]);
      }
    }
  }
  async #handleUpdatedAssetsAlbum(data: { albumId: string; assetId: string[]; status: 'added' | 'removed' }[]) {
    if (!this.#timelineManager.options.albumId) {
      return;
    }
    for (const { albumId, assetId, status } of data) {
      if (albumId !== this.#timelineManager.options.albumId) {
        continue;
      }
      if (status === 'added') {
        const assets = await Promise.all(assetId.map((id) => getAssetInfo({ id, key: authManager.key })));
        this.#timelineManager.addAssets(assets.map((element) => toTimelineAsset(element)));
      } else if (status === 'removed') {
        this.#timelineManager.removeAssets(assetId);
      }
    }
  }
  async #handleUpdatedAssetsTrashed(trashed: string[]) {
    if (this.#timelineManager.options.isTrashed === undefined) {
      return;
    }
    if (this.#timelineManager.options.isTrashed) {
      const assets = await Promise.all(trashed.map((id) => getAssetInfo({ id, key: authManager.key })));
      this.#timelineManager.addAssets(assets.map((element) => toTimelineAsset(element)));
    } else {
      this.#timelineManager.removeAssets(trashed);
    }
  }
}
