import { getAssetUrl } from '$lib/utils';
import { cancelImageUrl, isImageUrlCached, preloadImageUrl } from '$lib/utils/sw-messaging';
import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';

class PreloadManager {
  #cachedImages = new Set<string>();
  loading(url: string) {
    if (!globalThis.isSecureContext) {
      this.#cachedImages.add(url);
    }
  }

  preload(asset: AssetResponseDto | undefined | null) {
    if (globalThis.isSecureContext) {
      preloadImageUrl(getAssetUrl({ asset }));
      return;
    }
    if (!asset || asset.type !== AssetTypeEnum.Image) {
      return;
    }
    const img = new Image();
    const url = getAssetUrl({ asset });
    if (!url) {
      return;
    }
    img.src = url;
  }

  cancel(asset: AssetResponseDto | undefined | null) {
    if (!globalThis.isSecureContext || !asset) {
      return;
    }
    const url = getAssetUrl({ asset });
    cancelImageUrl(url);
  }

  cancelPreloadUrl(url: string | undefined | null) {
    if (!globalThis.isSecureContext) {
      return;
    }
    cancelImageUrl(url);
  }

  isPreloaded(asset: AssetResponseDto | undefined) {
    if (!asset) {
      return Promise.resolve(false);
    }
    const url = getAssetUrl({ asset });
    return this.isUrlPreloaded(url);
  }

  isUrlPreloaded(url: string | undefined | null) {
    if (!url) {
      return Promise.resolve(false);
    }
    if (globalThis.isSecureContext) {
      return isImageUrlCached(url);
    }
    return Promise.resolve(this.#cachedImages.has(url));
  }
}

export const preloadManager = new PreloadManager();
