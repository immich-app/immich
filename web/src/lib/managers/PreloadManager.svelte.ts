import { getAssetUrl } from '$lib/utils';
import { cancelImageUrl, isImageUrlCached, preloadImageUrl } from '$lib/utils/sw-messaging';
import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';

class PreloadManager {
  preload(asset: AssetResponseDto | undefined) {
    if (!asset) {
      return;
    }
    if (globalThis.isSecureContext) {
      preloadImageUrl(getAssetUrl({ asset }));
      return;
    }
    if (asset.type === AssetTypeEnum.Image) {
      const img = new Image();
      img.src = getAssetUrl({ asset });
    }
  }

  isPreloaded(asset: AssetResponseDto | undefined) {
    if (!asset) {
      return false;
    }
    if (globalThis.isSecureContext) {
      const img = getAssetUrl({ asset });

      return isImageUrlCached(img);
    }
    return false;
  }

  cancel(asset: AssetResponseDto | undefined) {
    if (!globalThis.isSecureContext || !asset) {
      return;
    }
    const url = getAssetUrl({ asset });
    cancelImageUrl(url);
  }

  cancelPreloadUrl(url: string) {
    if (!globalThis.isSecureContext) {
      return;
    }

    cancelImageUrl(url);
  }
}

export const preloadManager = new PreloadManager();
