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

const qualityOrder: Record<ImageQuality, number> = {
  basic: 0,
  'loading-thumbnail': 1,
  thumbnail: 2,
  'loading-preview': 3,
  preview: 4,
  'loading-original': 5,
  original: 6,
};

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
let nextLoaderId = 0;

export class AdaptiveImageLoader {
  readonly id = nextLoaderId++;

  private internalState = $state<ImageLoaderState>({
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
  readonly sharedLink?: SharedLinkResponseDto;
  readonly callbacks?: {
    currentZoomFn: () => number;
    onImageReady?: () => void;
    onError?: () => void;
    onUrlChange?: (url: string) => void;
  };
  destroyed = false;

  constructor(
    asset: AssetResponseDto,
    sharedLink: SharedLinkResponseDto | undefined,
    callbacks?: {
      currentZoomFn: () => number;
      onUrlChange?: (url: string) => void;
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
    this.internalState.thumbnailUrl = this.thumbnailUrl;
    this.sharedLink = sharedLink;
  }

  start() {
    if (!this.imageLoader) {
      throw new Error('Start requires imageLoader to be specified');
    }
    this.destroyFunctions.push(
      this.imageLoader(
        this.thumbnailUrl,

        () => this.onThumbnailLoad(),
        () => this.onThumbnailError(),
        () => this.onThumbnailStart(),
      ),
    );
  }

  get state(): ImageLoaderState {
    return this.internalState;
  }

  private shouldUpdateQuality(newQuality: ImageQuality): boolean {
    const currentLevel = qualityOrder[this.internalState.quality];
    const newLevel = qualityOrder[newQuality];
    return newLevel > currentLevel;
  }

  onThumbnailStart() {
    if (this.destroyed) {
      return;
    }
    if (!this.shouldUpdateQuality('loading-thumbnail')) {
      return;
    }
    this.internalState.quality = 'loading-thumbnail';
  }

  onThumbnailLoad() {
    if (this.destroyed) {
      return;
    }
    if (!this.shouldUpdateQuality('thumbnail')) {
      return;
    }
    this.internalState.quality = 'thumbnail';
    this.internalState.thumbnailImage = ImageStatus.Success;
    this.callbacks?.onUrlChange?.(this.thumbnailUrl);
    this.callbacks?.onImageReady?.();
    this.triggerMainImage();
  }

  onThumbnailError() {
    if (this.destroyed) {
      return;
    }
    this.internalState.hasError = true;
    this.internalState.thumbnailUrl = undefined;
    this.internalState.thumbnailImage = ImageStatus.Error;
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
    if (this.internalState.previewUrl) {
      // Already triggered
      return true;
    }
    this.internalState.hasError = false;
    this.internalState.previewUrl = this.previewUrl;
    if (this.imageLoader) {
      this.destroyFunctions.push(
        this.imageLoader(
          this.previewUrl,

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
    if (!this.shouldUpdateQuality('loading-preview')) {
      return;
    }
    this.internalState.quality = 'loading-preview';
  }

  onPreviewLoad() {
    if (this.destroyed) {
      return;
    }
    if (!this.internalState.previewUrl) {
      return;
    }
    if (!this.shouldUpdateQuality('preview')) {
      return;
    }
    this.internalState.quality = 'preview';
    this.internalState.previewImage = ImageStatus.Success;
    this.callbacks?.onUrlChange?.(this.previewUrl);
    this.callbacks?.onImageReady?.();
  }

  onPreviewError() {
    if (this.destroyed || imageManager.isCanceled(this.asset)) {
      return;
    }
    this.internalState.hasError = true;
    this.internalState.previewImage = ImageStatus.Error;
    this.internalState.previewUrl = undefined;
    this.callbacks?.onError?.();
    this.triggerOriginal();
  }

  triggerOriginal() {
    if (!this.originalUrl) {
      return false;
    }
    if (this.internalState.originalUrl) {
      // Already triggered
      return true;
    }
    this.internalState.hasError = false;
    this.internalState.originalUrl = this.originalUrl;

    if (this.imageLoader) {
      this.destroyFunctions.push(
        this.imageLoader(
          this.originalUrl,

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
    if (!this.shouldUpdateQuality('loading-original')) {
      return;
    }
    this.internalState.quality = 'loading-original';
  }

  onOriginalLoad() {
    if (this.destroyed || imageManager.isCanceled(this.asset)) {
      return;
    }
    if (!this.internalState.originalUrl) {
      return;
    }
    if (!this.shouldUpdateQuality('original')) {
      return;
    }
    this.internalState.quality = 'original';
    this.internalState.originalImage = ImageStatus.Success;
    this.callbacks?.onUrlChange?.(this.originalUrl);
    this.callbacks?.onImageReady?.();
  }

  onOriginalError() {
    if (this.destroyed || imageManager.isCanceled(this.asset)) {
      return;
    }
    this.internalState.hasError = true;
    this.internalState.originalImage = ImageStatus.Error;
    this.internalState.originalUrl = undefined;
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
