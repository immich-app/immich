import type { LoadImageFunction } from '$lib/actions/image-loader.svelte';
import { cancelImageUrl } from '$lib/utils/sw-messaging';

export type ImageQuality = 'thumbnail' | 'preview' | 'original';

export type ImageStatus = 'unloaded' | 'success' | 'error';

export type ImageLoaderStatus = {
  urls: Record<ImageQuality, string | undefined>;
  quality: Record<ImageQuality, ImageStatus>;
  started: boolean;
  hasError: boolean;
};

type ImageLoaderCallbacks = {
  onUrlChange?: (url: string) => void;
  onImageReady?: () => void;
  onError?: () => void;
};

export type QualityConfig = {
  url: string;
  quality: ImageQuality;
  onAfterLoad?: (loader: AdaptiveImageLoader) => void;
  onAfterError?: (loader: AdaptiveImageLoader) => void;
};

export type QualityList = [
  QualityConfig & { quality: 'thumbnail' },
  QualityConfig & { quality: 'preview' },
  QualityConfig & { quality: 'original' },
];

export class AdaptiveImageLoader {
  private destroyFunctions: (() => void)[] = [];
  private qualityConfigs: Record<ImageQuality, QualityConfig>;
  private highestLoadedQualityIndex = -1;
  private destroyed = false;

  status = $state<ImageLoaderStatus>({
    started: false,
    hasError: false,
    urls: { thumbnail: undefined, preview: undefined, original: undefined },
    quality: { thumbnail: 'unloaded', preview: 'unloaded', original: 'unloaded' },
  });

  constructor(
    private readonly qualityList: QualityList,
    private readonly callbacks?: ImageLoaderCallbacks,
    private readonly imageLoader?: LoadImageFunction,
  ) {
    this.qualityConfigs = {
      thumbnail: qualityList[0],
      preview: qualityList[1],
      original: qualityList[2],
    };
    this.status.urls.thumbnail = qualityList[0].url;
  }

  start() {
    if (!this.imageLoader) {
      throw new Error('Start requires imageLoader to be specified');
    }

    this.destroyFunctions.push(
      this.imageLoader(
        this.qualityList[0].url,
        () => this.onLoad('thumbnail'),
        () => this.onError('thumbnail'),
        () => this.onStart('thumbnail'),
      ),
    );
  }

  onStart(_: ImageQuality) {
    if (this.destroyed) {
      return;
    }
    this.status.started = true;
  }

  onLoad(quality: ImageQuality) {
    if (this.destroyed) {
      return;
    }

    const config = this.qualityConfigs[quality];

    if (!this.status.urls[quality]) {
      return;
    }

    const index = this.qualityList.indexOf(config);
    if (index <= this.highestLoadedQualityIndex) {
      return;
    }

    this.highestLoadedQualityIndex = index;
    this.status.quality[quality] = 'success';
    this.callbacks?.onUrlChange?.(this.qualityConfigs[quality].url);
    this.callbacks?.onImageReady?.();

    config.onAfterLoad?.(this);
  }

  onError(quality: ImageQuality) {
    if (this.destroyed) {
      return;
    }

    const config = this.qualityConfigs[quality];

    this.status.hasError = true;
    this.status.quality[quality] = 'error';
    this.status.urls[quality] = undefined;
    this.callbacks?.onError?.();

    config.onAfterError?.(this);
  }

  trigger(quality: ImageQuality) {
    if (this.destroyed) {
      return false;
    }

    const url = this.qualityConfigs[quality].url;
    if (!url) {
      this.qualityConfigs[quality].onAfterError?.(this);
      return false;
    }

    if (this.status.urls[quality]) {
      return true;
    }

    this.status.hasError = false;
    this.status.urls[quality] = url;
    if (this.imageLoader) {
      this.destroyFunctions.push(
        this.imageLoader(
          url,
          () => this.onLoad(quality),
          () => this.onError(quality),
          () => this.onStart(quality),
        ),
      );
    }
    return false;
  }

  destroy() {
    this.destroyed = true;
    if (this.imageLoader) {
      for (const destroy of this.destroyFunctions) {
        destroy();
      }
      return;
    }

    for (const config of Object.values(this.qualityConfigs)) {
      cancelImageUrl(config.url);
    }
  }
}
