import type { LoadImageFunction } from '$lib/actions/image-loader.svelte';
import { imageManager } from '$lib/managers/ImageManager.svelte';
import { getAssetMediaUrl, getAssetUrl } from '$lib/utils';
import { AssetMediaSize, type AssetResponseDto, type SharedLinkResponseDto } from '@immich/sdk';

/**
 * Quality levels for progressive image loading
 */
type ImageQuality =
  | 'basic'
  | 'loading-thumbnail'
  | 'thumbnail'
  | 'loading-preview'
  | 'preview'
  | 'loading-original'
  | 'original';

export interface ImageLoaderState {
  previewUrl?: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  quality: ImageQuality;
  hasError: boolean;
  thumbnailImage: ImageStatus;
  previewImage: ImageStatus;
  originalImage: ImageStatus;
}
enum ImageStatus {
  Unloaded = 'Unloaded',
  Success = 'Success',
  Error = 'Error',
}

/**
 * Coordinates adaptive loading of a single asset image:
 * thumbhash → thumbnail → preview → original (on zoom)
 *
 */
export class AdaptiveImageLoader {
  private state = $state<ImageLoaderState>({
    quality: 'basic',
    hasError: false,
    thumbnailImage: ImageStatus.Unloaded,
    previewImage: ImageStatus.Unloaded,
    originalImage: ImageStatus.Unloaded,
  });

  private readonly currentZoomFn?: () => number;
  private readonly imageLoader?: LoadImageFunction;
  private readonly destroyFunctions: (() => void)[] = [];
  readonly thumbnailUrl: string;
  readonly previewUrl: string;
  readonly originalUrl: string;
  readonly asset: AssetResponseDto;
  readonly callbacks?: {
    currentZoomFn: () => number;
    onImageReady?: () => void;
    onError?: () => void;
  };
  destroyed = false;

  constructor(
    asset: AssetResponseDto,
    sharedLink: SharedLinkResponseDto | undefined,
    callbacks?: {
      currentZoomFn: () => number;
      onImageReady?: () => void;
      onError?: () => void;
    },
    imageLoader?: LoadImageFunction,
  ) {
    imageManager.trackLoad(asset);
    this.asset = asset;
    this.callbacks = callbacks;
    this.imageLoader = imageLoader;
    this.thumbnailUrl = getAssetMediaUrl({ id: asset.id, cacheKey: asset.thumbhash, size: AssetMediaSize.Thumbnail });
    this.previewUrl = getAssetUrl({ asset, sharedLink });
    this.originalUrl = getAssetUrl({ asset, sharedLink, forceOriginal: true });
    this.state.thumbnailUrl = this.thumbnailUrl;
  }

  start() {
    if (!this.imageLoader) {
      throw new Error('Start requires imageLoader to be specified');
    }
    this.destroyFunctions.push(
      this.imageLoader(
        this.thumbnailUrl,
        {},
        () => this.onThumbnailLoad(),
        () => this.onThumbnailError(),
        () => this.onThumbnailStart(),
      ),
    );
  }

  get adaptiveLoaderState(): ImageLoaderState {
    return this.state;
  }

  onThumbnailStart() {
    if (this.destroyed) {
      return;
    }
    this.state.quality = 'loading-thumbnail';
  }

  onThumbnailLoad() {
    if (this.destroyed) {
      return;
    }
    this.state.quality = 'thumbnail';
    this.state.thumbnailImage = ImageStatus.Success;
    this.callbacks?.onImageReady?.();
    this.triggerMainImage();
  }

  onThumbnailError() {
    if (this.destroyed) {
      return;
    }
    this.state.hasError = true;
    this.state.thumbnailUrl = undefined;
    this.state.thumbnailImage = ImageStatus.Error;
    this.callbacks?.onError?.();
    this.triggerMainImage();
  }

  triggerMainImage() {
    const wantsOriginal = (this.currentZoomFn?.() ?? 1) > 1;
    return wantsOriginal ? this.triggerOriginal() : this.triggerPreview();
  }

  triggerPreview() {
    if (!this.previewUrl) {
      // no preview, try original?
      this.triggerOriginal();
      return false;
    }
    this.state.hasError = false;
    this.state.previewUrl = this.previewUrl;
    if (this.imageLoader) {
      this.destroyFunctions.push(
        this.imageLoader(
          this.previewUrl,
          {},
          () => this.onPreviewLoad(),
          () => this.onPreviewError(),
          () => this.onPreviewStart(),
        ),
      );
    }
  }

  onPreviewStart() {
    if (this.destroyed) {
      return;
    }
    this.state.quality = 'loading-preview';
  }

  onPreviewLoad() {
    if (this.destroyed) {
      return;
    }
    this.state.quality = 'preview';
    this.state.previewImage = ImageStatus.Success;
    this.callbacks?.onImageReady?.();
  }

  onPreviewError() {
    if (this.destroyed || imageManager.isCanceled(this.asset)) {
      return;
    }

    this.state.hasError = true;
    this.state.previewImage = ImageStatus.Error;
    this.state.previewUrl = undefined;
    this.callbacks?.onError?.();
    this.triggerOriginal();
  }

  triggerOriginal() {
    if (!this.originalUrl) {
      return false;
    }
    this.state.hasError = false;

    this.state.originalUrl = this.originalUrl;

    if (this.imageLoader) {
      this.destroyFunctions.push(
        this.imageLoader(
          this.originalUrl,
          {},
          () => this.onOriginalLoad(),
          () => this.onOriginalError(),
          () => this.onOriginalStart(),
        ),
      );
    }
  }

  onOriginalStart() {
    if (this.destroyed || imageManager.isCanceled(this.asset)) {
      return;
    }
    this.state.quality = 'loading-original';
  }

  onOriginalLoad() {
    if (this.destroyed || imageManager.isCanceled(this.asset)) {
      return;
    }
    this.state.quality = 'original';
    this.state.originalImage = ImageStatus.Success;
    this.callbacks?.onImageReady?.();
  }

  onOriginalError() {
    if (this.destroyed || imageManager.isCanceled(this.asset)) {
      return;
    }

    this.state.hasError = true;
    this.state.originalImage = ImageStatus.Error;
    this.state.originalUrl = undefined;
    this.callbacks?.onError?.();
  }

  destroy(): void {
    this.destroyed = true;
    if (this.imageLoader) {
      for (const destroy of this.destroyFunctions) {
        destroy();
      }
      return;
    }
    imageManager.cancel(this.asset);
  }
}
