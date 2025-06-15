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
  const timelineAsset = toTimelineAsset(asset);
  return (
    timelineManager.options.visibility === undefined || timelineManager.options.visibility === timelineAsset.visibility
  );
};

const checkFavoriteProperty: AssetFilter = (asset, timelineManager) => {
  const timelineAsset = toTimelineAsset(asset);
  return (
    timelineManager.options.isFavorite === undefined || timelineManager.options.isFavorite === timelineAsset.isFavorite
  );
};

const checkTrashedProperty: AssetFilter = (asset, timelineManager) => {
  const timelineAsset = toTimelineAsset(asset);
  return (
    timelineManager.options.isTrashed === undefined || timelineManager.options.isTrashed === timelineAsset.isTrashed
  );
};

const checkTagProperty: AssetFilter = (asset, timelineManager) => {
  if (!timelineManager.options.tagId) {
    return true;
  }
  const hasMatchingTag = asset.tags?.some((tag: { id: string }) => tag.id === timelineManager.options.tagId);
  return !!hasMatchingTag;
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
  const hasMatchingPerson = asset.people?.some(
    (person: { id: string }) => person.id === timelineManager.options.personId,
  );
  return !!hasMatchingPerson;
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
      // this event is called when an person is added or removed from an asset
      websocketEvents.on('on_asset_person', (data) => {
        this.#pendingUpdates.personed.push(data);
        this.#scheduleProcessing();
      }),
      // uploads and tagging are handled by this event
      websocketEvents.on('on_asset_update', (ids) => {
        this.#pendingUpdates.updated.push(...ids);
        this.#scheduleProcessing();
      }),
      // this event is called when an asseted is added or removed from an album
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
    this.#pendingUpdates = this.#init();

    await this.#handleGeneric(
      [...pendingUpdates.updated, ...pendingUpdates.trashed, ...pendingUpdates.restored],
      [checkVisibilityProperty, checkFavoriteProperty, checkTrashedProperty, checkTagProperty, checkAlbumProperty],
    );

    await this.#handleUpdatedAssetsPerson(pendingUpdates.personed);
    await this.#handleUpdatedAssetsAlbum(pendingUpdates.album);

    this.#timelineManager.removeAssets(pendingUpdates.deleted);
  }

  async #handleGeneric(assetIds: string[], filters: AssetFilter[]) {
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

  async #handleUpdatedAssetsPerson(
    data: { assetId: string; personId: string | undefined; status: 'created' | 'removed' | 'removed_soft' }[],
  ) {
    const assetsToRemove: string[] = [];
    const personAssetsToAdd: string[] = [];

    if (this.#timelineManager.options.personId === undefined) {
      // If no person filter, we just add all assets with a person change
      personAssetsToAdd.push(...data.map((d) => d.assetId));
    } else {
      for (const { assetId, personId, status } of data) {
        if (status === 'created' && personId === this.#timelineManager.options.personId) {
          personAssetsToAdd.push(assetId);
        } else if (
          (status === 'removed' || status === 'removed_soft') &&
          personId === this.#timelineManager.options.personId
        ) {
          assetsToRemove.push(assetId);
        }
      }
    }

    this.#timelineManager.removeAssets(assetsToRemove);
    // At this point, personAssetsToAdd contains assets that now have the target person,
    // but we need to check if they still match other filters.
    await this.#handleGeneric(personAssetsToAdd, [
      checkVisibilityProperty,
      checkFavoriteProperty,
      checkTrashedProperty,
      checkTagProperty,
      checkAlbumProperty,
    ]);
  }

  async #handleUpdatedAssetsAlbum(data: { albumId: string; assetId: string[]; status: 'added' | 'removed' }[]) {
    const assetsToAdd: string[] = [];
    const assetsToRemove: string[] = [];

    if (this.#timelineManager.options.albumId === undefined) {
      // If no album filter, we just add all assets with an album change
      assetsToAdd.push(...data.flatMap((d) => d.assetId));
    } else {
      for (const { albumId, assetId, status } of data) {
        if (albumId !== this.#timelineManager.options.albumId) {
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
    // At this point, assetsToAdd contains assets that now have the target person,
    // but we need to check if they still match other filters.
    await this.#handleGeneric(assetsToAdd, [
      checkVisibilityProperty,
      checkFavoriteProperty,
      checkTrashedProperty,
      checkTagProperty,
      checkPersonProperty,
    ]);
  }
}
