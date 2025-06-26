import { eventManager } from '$lib/managers/event-manager.svelte';
import { getSupportedMediaTypes, type ServerMediaTypesResponseDto } from '@immich/sdk';

class UploadManager {
  mediaTypes = $state<ServerMediaTypesResponseDto>({ image: [], sidecar: [], video: [] });

  constructor() {
    eventManager.on('app.init', () => void this.#loadExtensions());
  }

  async #loadExtensions() {
    try {
      this.mediaTypes = await getSupportedMediaTypes();
    } catch {
      console.error('Failed to load supported media types');
    }
  }

  getExtensions() {
    return [...this.mediaTypes.image, ...this.mediaTypes.video];
  }
}

export const uploadManager = new UploadManager();
