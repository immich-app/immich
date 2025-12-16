import { getAssetUrl } from '$lib/utils';
import { cancelImageUrl, isImageUrlCached, isServiceWorkerEnabled, preloadImageUrl } from '$lib/utils/sw-messaging';
import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';

class PreloadManager {
  #cachedImages = new Set<string>();
  loading(url: string) {
    if (!isServiceWorkerEnabled()) {
      this.#cachedImages.add(url);
    }
  }

  preload(asset: AssetResponseDto | undefined) {
    if (!asset) {
      return;
    }
    if (isServiceWorkerEnabled()) {
      preloadImageUrl(getAssetUrl({ asset }));
      return;
    }
    if (asset.type === AssetTypeEnum.Image) {
      const src = getAssetUrl({ asset });
      if (src) {
        const img = new Image();
        img.src = src;
      }
    }
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
    if (isServiceWorkerEnabled()) {
      return isImageUrlCached(url);
    }
    return Promise.resolve(this.#cachedImages.has(url));
  }

  cancel(asset: AssetResponseDto | undefined) {
    if (!isServiceWorkerEnabled() || !asset) {
      return;
    }
    const url = getAssetUrl({ asset });
    cancelImageUrl(url);
  }

  cancelUrl(url: string) {
    if (!isServiceWorkerEnabled()) {
      return;
    }

    cancelImageUrl(url);
  }
}

export const preloadManager = new PreloadManager();
