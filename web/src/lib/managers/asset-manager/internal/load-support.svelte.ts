import type { AssetManager } from '$lib/managers/asset-manager/asset-manager.svelte';
import { cancelImageUrl } from '$lib/utils/sw-messaging';

export function mediaLoaded(assetManager: AssetManager) {
  assetManager.isLoaded = true;
}

export function mediaLoadError(assetManager: AssetManager) {
  assetManager.isLoaded = assetManager.loadError = true;
}

export function cancelImageLoad(assetManager: AssetManager) {
  if (assetManager.url) {
    cancelImageUrl(assetManager.url);
  }
  assetManager.isLoaded = assetManager.loadError = false;
}
