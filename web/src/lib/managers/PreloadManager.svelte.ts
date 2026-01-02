import { getAssetUrl } from '$lib/utils';
import { cancelImageUrl, preloadImageUrl } from '$lib/utils/sw-messaging';
import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';

class PreloadManager {
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
}

export const preloadManager = new PreloadManager();
