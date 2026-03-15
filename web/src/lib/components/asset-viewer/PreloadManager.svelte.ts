import { loadImage } from '$lib/actions/image-loader.svelte';
import { getAssetUrls } from '$lib/utils';
import { AdaptiveImageLoader, type QualityList } from '$lib/utils/adaptive-image-loader.svelte';
import type { AssetResponseDto, SharedLinkResponseDto } from '@immich/sdk';

type AssetCursor = {
  current: AssetResponseDto;
  nextAsset?: AssetResponseDto;
  previousAsset?: AssetResponseDto;
};

export class PreloadManager {
  private nextPreloader: AdaptiveImageLoader | undefined;
  private previousPreloader: AdaptiveImageLoader | undefined;

  private startPreloader(
    asset: AssetResponseDto | undefined,
    sharedlink: SharedLinkResponseDto | undefined,
  ): AdaptiveImageLoader | undefined {
    if (!asset) {
      return;
    }
    const urls = getAssetUrls(asset, sharedlink);
    const afterThumbnail = (loader: AdaptiveImageLoader) => loader.trigger('preview');
    const qualityList: QualityList = [
      {
        quality: 'thumbnail',
        url: urls.thumbnail,
        onAfterLoad: afterThumbnail,
        onAfterError: afterThumbnail,
      },
      {
        quality: 'preview',
        url: urls.preview,
        onAfterError: (loader) => loader.trigger('original'),
      },
      { quality: 'original', url: urls.original },
    ];
    const loader = new AdaptiveImageLoader(qualityList, undefined, loadImage);
    loader.start();
    return loader;
  }

  private destroyPreviousPreloader() {
    this.previousPreloader?.destroy();
    this.previousPreloader = undefined;
  }

  private destroyNextPreloader() {
    this.nextPreloader?.destroy();
    this.nextPreloader = undefined;
  }

  cancelBeforeNavigation(direction: 'previous' | 'next') {
    switch (direction) {
      case 'next': {
        this.destroyPreviousPreloader();
        break;
      }
      case 'previous': {
        this.destroyNextPreloader();
        break;
      }
    }
  }

  updateAfterNavigation(oldCursor: AssetCursor, newCursor: AssetCursor, sharedlink: SharedLinkResponseDto | undefined) {
    const movedForward = newCursor.current.id === oldCursor.nextAsset?.id;
    const movedBackward = newCursor.current.id === oldCursor.previousAsset?.id;

    if (!movedBackward) {
      this.destroyPreviousPreloader();
    }

    if (!movedForward) {
      this.destroyNextPreloader();
    }

    if (movedForward) {
      this.nextPreloader = this.startPreloader(newCursor.nextAsset, sharedlink);
    } else if (movedBackward) {
      this.previousPreloader = this.startPreloader(newCursor.previousAsset, sharedlink);
    } else {
      this.previousPreloader = this.startPreloader(newCursor.previousAsset, sharedlink);
      this.nextPreloader = this.startPreloader(newCursor.nextAsset, sharedlink);
    }
  }

  initializePreloads(cursor: AssetCursor, sharedlink: SharedLinkResponseDto | undefined) {
    if (cursor.nextAsset) {
      this.nextPreloader = this.startPreloader(cursor.nextAsset, sharedlink);
    }
    if (cursor.previousAsset) {
      this.previousPreloader = this.startPreloader(cursor.previousAsset, sharedlink);
    }
  }

  destroy() {
    this.destroyNextPreloader();
    this.destroyPreviousPreloader();
  }
}

export const preloadManager = new PreloadManager();
