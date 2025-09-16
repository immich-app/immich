import { eventManager } from '$lib/managers/event-manager.svelte';
import { uploadAssetsStore } from '$lib/stores/upload';
import { getSupportedMediaTypes, type ServerMediaTypesResponseDto } from '@immich/sdk';

class UploadManager {
  mediaTypes = $state<ServerMediaTypesResponseDto>({ image: [], sidecar: [], video: [] });

  constructor() {
    eventManager.on('app.init', () => void this.#loadExtensions()).on('auth.logout', () => void this.reset());
  }

  reset() {
    uploadAssetsStore.reset();
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
