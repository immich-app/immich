import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
import type { PendingChange, TimelineAsset } from '$lib/managers/timeline-manager/types';
import { websocketEvents } from '$lib/stores/websocket';
import { toTimelineAsset } from '$lib/utils/timeline-util';
import { throttle } from 'lodash-es';
import type { Unsubscriber } from 'svelte/store';

export class WebsocketSupport {
  #pendingChanges: PendingChange[] = [];
  #unsubscribers: Unsubscriber[] = [];
  #timelineManager: TimelineManager;

  #processPendingChanges = throttle(() => {
    const { add, update, remove } = this.#getPendingChangeBatches();
    if (add.length > 0) {
      this.#timelineManager.addAssets(add);
    }
    if (update.length > 0) {
      this.#timelineManager.updateAssets(update);
    }
    if (remove.length > 0) {
      this.#timelineManager.removeAssets(remove);
    }
    this.#pendingChanges = [];
  }, 2500);

  constructor(timeineManager: TimelineManager) {
    this.#timelineManager = timeineManager;
  }

  connectWebsocketEvents() {
    this.#unsubscribers.push(
      websocketEvents.on('on_upload_success', (asset) =>
        this.#addPendingChanges({ type: 'add', values: [toTimelineAsset(asset)] }),
      ),
      websocketEvents.on('on_asset_trash', (ids) => this.#addPendingChanges({ type: 'trash', values: ids })),
      websocketEvents.on('on_asset_update', (asset) =>
        this.#addPendingChanges({ type: 'update', values: [toTimelineAsset(asset)] }),
      ),
      websocketEvents.on('on_asset_delete', (id: string) => this.#addPendingChanges({ type: 'delete', values: [id] })),
    );
  }

  disconnectWebsocketEvents() {
    for (const unsubscribe of this.#unsubscribers) {
      unsubscribe();
    }
    this.#unsubscribers = [];
  }

  #addPendingChanges(...changes: PendingChange[]) {
    this.#pendingChanges.push(...changes);
    this.#processPendingChanges();
  }

  #getPendingChangeBatches() {
    const batch: {
      add: TimelineAsset[];
      update: TimelineAsset[];
      remove: string[];
    } = {
      add: [],
      update: [],
      remove: [],
    };
    for (const { type, values } of this.#pendingChanges) {
      switch (type) {
        case 'add': {
          batch.add.push(...values);
          break;
        }
        case 'update': {
          batch.update.push(...values);
          break;
        }
        case 'delete':
        case 'trash': {
          batch.remove.push(...values);
          break;
        }
      }
    }
    return batch;
  }
}
