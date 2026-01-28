import { getAssetMediaUrl } from '$lib/utils';
import { cancelImageUrl } from '$lib/utils/sw-messaging';
import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';

type AllAssetMediaSize = AssetMediaSize | 'all';

class ImageManager {
  preload(asset: AssetResponseDto | undefined, size: AssetMediaSize = AssetMediaSize.Preview) {
    if (!asset) {
      return;
    }

    const url = getAssetMediaUrl({ id: asset.id, size, cacheKey: asset.thumbhash });
    if (!url) {
      return;
    }

    const img = new Image();
    img.src = url;
  }

  cancel(asset: AssetResponseDto | undefined, size: AllAssetMediaSize = AssetMediaSize.Preview) {
    if (!asset) {
      return;
    }

    const sizes = size === 'all' ? Object.values(AssetMediaSize) : [size];
    for (const size of sizes) {
      const url = getAssetMediaUrl({ id: asset.id, size, cacheKey: asset.thumbhash });
      if (url) {
        cancelImageUrl(url);
      }
    }
  }

  cancelPreloadUrl(url: string | undefined) {
    if (url) {
      cancelImageUrl(url);
    }
  }
}

export const imageManager = new ImageManager();
