import { authManager } from '$lib/managers/auth-manager.svelte';
import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
import { websocketEvents } from '$lib/stores/websocket';
import { toTimelineAsset } from '$lib/utils/timeline-util';
import { getAllAlbums, getAssetInfo, type AssetResponseDto } from '@immich/sdk';
import type { Unsubscriber } from 'svelte/store';

const PROCESS_DELAY_MS = 2500;

const fetchAssetInfos = async (assetIds: string[]) => {
  return await Promise.all(assetIds.map((id) => getAssetInfo({ id, key: authManager.key })));
};

export type AssetFilter = (
  asset: Awaited<ReturnType<typeof getAssetInfo>>,
  timelineManager: TimelineManager,
) => Promise<boolean> | boolean;

// Filter functions
const checkVisibilityProperty: AssetFilter = (asset, timelineManager) => {
  if (timelineManager.options.visibility === undefined) {
    return true;
  }

  const timelineAsset = toTimelineAsset(asset);
  return timelineManager.options.visibility === timelineAsset.visibility;
};

const checkFavoriteProperty: AssetFilter = (asset, timelineManager) => {
  if (timelineManager.options.isFavorite === undefined) {
    return true;
  }

  const timelineAsset = toTimelineAsset(asset);
  return timelineManager.options.isFavorite === timelineAsset.isFavorite;
};

const checkTrashedProperty: AssetFilter = (asset, timelineManager) => {
  if (timelineManager.options.isTrashed === undefined) {
    return true;
  }

  const timelineAsset = toTimelineAsset(asset);
  return timelineManager.options.isTrashed === timelineAsset.isTrashed;
};

const checkTagProperty: AssetFilter = (asset, timelineManager) => {
  if (!timelineManager.options.tagId) {
    return true;
  }

  return asset.tags?.some((tag: { id: string }) => tag.id === timelineManager.options.tagId) ?? false;
};

const checkAlbumProperty: AssetFilter = async (asset, timelineManager) => {
  if (!timelineManager.options.albumId) {
    return true;
  }
  const albums = await getAllAlbums({ assetId: asset.id });
  return albums.some((album) => album.id === timelineManager.options.albumId);
};

const checkPersonProperty: AssetFilter = (asset, timelineManager) => {
  if (!timelineManager.options.personId) {
    return true;
  }

  return asset.people?.some((person: { id: string }) => person.id === timelineManager.options.personId) ?? false;
};

export class WebsocketSupport {
  readonly #timelineManager: TimelineManager;
  #unsubscribers: Unsubscriber[] = [];

  #pendingUpdates: {
    updated: string[];
    trashed: string[];
    restored: string[];
    deleted: string[];
    personed: { assetId: string; personId: string | undefined; status: 'created' | 'removed' | 'removed_soft' }[];
    album: { albumId: string; assetId: string[]; status: 'added' | 'removed' }[];
  };
  /**
   * Count of pending updates across all categories.
   * This is used to determine if there are any updates to process.
   */
  #pendingCount() {
    return (
      this.#pendingUpdates.updated.length +
      this.#pendingUpdates.trashed.length +
      this.#pendingUpdates.restored.length +
      this.#pendingUpdates.deleted.length +
      this.#pendingUpdates.personed.length +
      this.#pendingUpdates.album.length
    );
  }
  #processTimeoutId: ReturnType<typeof setTimeout> | undefined;
  #isProcessing = false;

  constructor(timelineManager: TimelineManager) {
    this.#pendingUpdates = this.#init();
    this.#timelineManager = timelineManager;
  }

  #init() {
    return {
      updated: [],
      trashed: [],
      restored: [],
      deleted: [],
      personed: [],
      album: [],
    };
  }

  connectWebsocketEvents() {
    this.#unsubscribers.push(
      websocketEvents.on('on_asset_trash', (ids) => {
        this.#pendingUpdates.trashed.push(...ids);
        this.#scheduleProcessing();
      }),
      // this event is called when a person is added or removed from an asset
      websocketEvents.on('on_asset_person', (data) => {
        this.#pendingUpdates.personed.push(data);
        this.#scheduleProcessing();
      }),
      // uploads and tagging are handled by this event
      websocketEvents.on('on_asset_update', (ids) => {
        this.#pendingUpdates.updated.push(...ids);
        this.#scheduleProcessing();
      }),
      // this event is called when an asset is added or removed from an album
      websocketEvents.on('on_album_update', (data) => {
        this.#pendingUpdates.album.push(data);
        this.#scheduleProcessing();
      }),
      websocketEvents.on('on_asset_delete', (ids) => {
        this.#pendingUpdates.deleted.push(ids);
        this.#scheduleProcessing();
      }),
      websocketEvents.on('on_asset_restore', (ids) => {
        this.#pendingUpdates.restored.push(...ids);
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
      void this.#applyPendingChanges();
    }, PROCESS_DELAY_MS);
  }

  async #applyPendingChanges() {
    if (this.#isProcessing || this.#pendingCount() === 0) {
      return;
    }

    this.#isProcessing = true;

    try {
      await this.#processAllPendingUpdates();
    } finally {
      this.#isProcessing = false;

      if (this.#pendingCount() > 0) {
        this.#scheduleProcessing();
      }
    }
  }

  async #processAllPendingUpdates() {
    const pendingUpdates = this.#pendingUpdates;
    this.#pendingUpdates = this.#init();

    await this.#filterAndUpdateAssets(
      [...pendingUpdates.updated, ...pendingUpdates.trashed, ...pendingUpdates.restored],
      [checkVisibilityProperty, checkFavoriteProperty, checkTrashedProperty, checkTagProperty, checkAlbumProperty],
    );

    await this.#handlePersonUpdates(pendingUpdates.personed);
    await this.#handleAlbumUpdates(pendingUpdates.album);

    this.#timelineManager.removeAssets(pendingUpdates.deleted);
  }

  async #filterAndUpdateAssets(assetIds: string[], filters: AssetFilter[]) {
    if (assetIds.length === 0) {
      return;
    }

    const assets = await fetchAssetInfos(assetIds);
    const assetsToAdd = [];
    const assetsToRemove = [];

    for (const asset of assets) {
      if (await this.#shouldAssetBeIncluded(asset, filters)) {
        assetsToAdd.push(asset);
      } else {
        assetsToRemove.push(asset.id);
      }
    }

    this.#timelineManager.addAssets(assetsToAdd.map((asset) => toTimelineAsset(asset)));
    this.#timelineManager.removeAssets(assetsToRemove);
  }

  async #shouldAssetBeIncluded(asset: AssetResponseDto, filters: AssetFilter[]): Promise<boolean> {
    for (const filter of filters) {
      const result = await filter(asset, this.#timelineManager);
      if (!result) {
        return false;
      }
    }
    return true;
  }

  async #handlePersonUpdates(
    data: { assetId: string; personId: string | undefined; status: 'created' | 'removed' | 'removed_soft' }[],
  ) {
    if (data.length === 0) {
      return;
    }

    const assetsToRemove: string[] = [];
    const personAssetsToAdd: string[] = [];
    const targetPersonId = this.#timelineManager.options.personId;

    if (targetPersonId === undefined) {
      // If no person filter, add all assets with person changes
      personAssetsToAdd.push(...data.map((d) => d.assetId));
    } else {
      for (const { assetId, personId, status } of data) {
        if (status === 'created' && personId === targetPersonId) {
          personAssetsToAdd.push(assetId);
        } else if ((status === 'removed' || status === 'removed_soft') && personId === targetPersonId) {
          assetsToRemove.push(assetId);
        }
      }
    }

    this.#timelineManager.removeAssets(assetsToRemove);

    // Filter and add assets that now have the target person
    await this.#filterAndUpdateAssets(personAssetsToAdd, [
      checkVisibilityProperty,
      checkFavoriteProperty,
      checkTrashedProperty,
      checkTagProperty,
      checkAlbumProperty,
    ]);
  }

  async #handleAlbumUpdates(data: { albumId: string; assetId: string[]; status: 'added' | 'removed' }[]) {
    if (data.length === 0) {
      return;
    }

    const assetsToAdd: string[] = [];
    const assetsToRemove: string[] = [];
    const targetAlbumId = this.#timelineManager.options.albumId;

    if (targetAlbumId === undefined) {
      // If no album filter, add all assets with album changes
      assetsToAdd.push(...data.flatMap((d) => d.assetId));
    } else {
      for (const { albumId, assetId, status } of data) {
        if (albumId !== targetAlbumId) {
          continue;
        }

        if (status === 'added') {
          assetsToAdd.push(...assetId);
        } else if (status === 'removed') {
          assetsToRemove.push(...assetId);
        }
      }
    }

    this.#timelineManager.removeAssets(assetsToRemove);

    // Filter and add assets that are now in the target album
    await this.#filterAndUpdateAssets(assetsToAdd, [
      checkVisibilityProperty,
      checkFavoriteProperty,
      checkTrashedProperty,
      checkTagProperty,
      checkPersonProperty,
    ]);
  }
}
