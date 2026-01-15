import { getAssetMediaUrl } from '$lib/utils';
import { cancelImageUrl } from '$lib/utils/sw-messaging';
import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';

type AllAssetMediaSize = AssetMediaSize | 'all';

type AssetLoadState = 'loading' | 'cancelled';

class ImageManager {
  // track recently canceled assets, so know if an load "error" is due to
  // cancelation
  private assetStates = new Map<string, AssetLoadState>();
  private readonly MAX_TRACKED_ASSETS = 10;

  private trackAction(asset: AssetResponseDto, action: AssetLoadState) {
    // Remove if exists to reset insertion order
    this.assetStates.delete(asset.id);
    this.assetStates.set(asset.id, action);

    // Only keep recent assets (Map maintains insertion order)
    if (this.assetStates.size > this.MAX_TRACKED_ASSETS) {
      const firstKey = this.assetStates.keys().next().value!;
      this.assetStates.delete(firstKey);
    }
  }

  isCanceled(asset: AssetResponseDto) {
    return 'cancelled' === this.assetStates.get(asset.id);
  }

  trackLoad(asset: AssetResponseDto) {
    this.trackAction(asset, 'loading');
  }

  trackCancelled(asset: AssetResponseDto) {
    this.trackAction(asset, 'cancelled');
  }

  preload(asset: AssetResponseDto | undefined, size: AssetMediaSize = AssetMediaSize.Preview) {
    if (!asset) {
      return;
    }

    const url = getAssetMediaUrl({ id: asset.id, size, cacheKey: asset.thumbhash });
    if (!url) {
      return;
    }

    this.trackLoad(asset);

    const img = new Image();
    img.src = url;
  }

  cancel(asset: AssetResponseDto | undefined, size: AllAssetMediaSize = AssetMediaSize.Preview) {
    if (!asset) {
      return;
    }

    this.trackCancelled(asset);

    const sizes = size === 'all' ? Object.values(AssetMediaSize) : [size];
    for (const size of sizes) {
      const url = getAssetMediaUrl({ id: asset.id, size, cacheKey: asset.thumbhash });
      if (url) {
        cancelImageUrl(url);
      }
    }
  }
}

export const imageManager = new ImageManager();
