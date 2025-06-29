import type { AssetPackage } from '$lib/managers/asset-manager/asset-package.svelte';
import { loadFromAssetPackage } from '$lib/managers/asset-manager/internal/load-support.svelte';
import { CancellableTask } from '$lib/utils/cancellable-task';
import type { AssetGridRouteSearchParams } from '$lib/utils/navigation';
import { type ZoomImageWheelState } from '@zoom-image/core';
import { isEqual } from 'lodash-es';
import { LRUCache } from 'lru-cache';

export enum AssetMediaSize {
  Original = 'original',
  Fullsize = 'fullsize',
  Preview = 'preview',
  Thumbnail = 'thumbnail',
  Playback = 'playback',
}

export type LoadAssetOptions = {
  loadAlbums?: boolean;
  loadStack?: boolean;
};

export type AssetManagerOptions = {};

export class AssetManager {
  isInitialized = $state(false);
  isLoaded = $state(false);
  loadError = $state(false);
  // The queue waited for load. The first is the currect and the next is preload.
  // The preload asset is not need to loading immediately.
  assetLoadingQueue: AssetPackage[] = $state([]);

  // url: string | undefined = $derived.by(() => {
  //   if (this.asset) {
  //     return this.#getAssetUrl(toTimelineAsset(this.asset!));
  //   }
  // });

  #maximumLRUCache: number = $state(10);

  // TODO: This function is used to test.
  dispose(value: AssetPackage, key: string) {
    console.log(key);
    console.log(value);
  }

  assetCache: LRUCache<string, AssetPackage> = $state(
    new LRUCache({ max: this.#maximumLRUCache, dispose: this.dispose }),
  );

  showAssetViewer: boolean = $state(false);
  gridScrollTarget: AssetGridRouteSearchParams | undefined = $state();
  zoomImageState: ZoomImageWheelState | undefined = $state();

  initTask = new CancellableTask(
    () => (this.isInitialized = true),
    () => {
      this.assetLoadingQueue = [];
      this.assetCache.clear();
      this.isInitialized = false;
    },
    () => void 0,
  );

  static #INIT_OPTIONS = {};
  #options: AssetManagerOptions = AssetManager.#INIT_OPTIONS;

  static #DEFAULT_LOAD_ASSET_OPTIONS: LoadAssetOptions = {
    loadAlbums: false,
    loadStack: false,
  };

  constructor() {}

  async loadAssetPackage(options?: LoadAssetOptions, cancelable?: boolean): Promise<void> {
    cancelable = cancelable ?? true;
    options = options ?? AssetManager.#DEFAULT_LOAD_ASSET_OPTIONS;

    const assetPackage = this.assetLoadingQueue[0];
    if (!assetPackage) {
      return;
    }

    if (assetPackage.loader?.executed) {
      return;
    }

    const result = await assetPackage.loader?.execute(async (signal: AbortSignal) => {
      await loadFromAssetPackage(this, assetPackage, options, signal);
    }, cancelable);
  }

  async #initializeAsset() {
    // TODO: Preload assets.
  }

  async updateOptions(options: AssetManagerOptions) {
    if (this.#options !== AssetManager.#INIT_OPTIONS && isEqual(this.#options, options)) {
      return;
    }
    await this.initTask.reset();
    await this.#init(options);
  }

  async #init(options: AssetManagerOptions) {
    this.isInitialized = false;
    this.assetLoadingQueue = [];
    this.assetCache.clear();
    await this.initTask.execute(async () => {
      this.#options = options;
      await this.#initializeAsset();
    }, true);
  }

  public destroy() {
    this.isInitialized = false;
  }

  // #checkOptions() {
  //   this.#options.size = AssetMediaSize.Original;

  //   if (!this.asset || !this.zoomImageState) {
  //     return;
  //   }

  //   if (this.asset.originalMimeType === 'image/gif' || this.zoomImageState.currentZoom > 1) {
  //     // TODO: use original image forcely and according to the setting.
  //   }
  // }

  // #preload() {
  //   for (const preloadAsset of this.preloadAssets) {
  //     if (preloadAsset.isImage) {
  //       let img = new Image();
  //       const preloadUrl = this.#getAssetUrl(preloadAsset);
  //       if (preloadUrl) {
  //         img.src = preloadUrl;
  //       } else {
  //         throw new Error('AssetManager is not initialized.');
  //       }
  //     }
  //   }
  // }

  // #getAssetUrl(asset: TimelineAsset) {
  //   if (!this.asset) {
  //     return;
  //   }

  //   let path = undefined;
  //   const searchParameters = new URLSearchParams();
  //   if (authManager.key) {
  //     searchParameters.set('key', authManager.key);
  //   }
  //   if (this.cacheKey) {
  //     searchParameters.set('c', this.cacheKey);
  //   }

  //   switch (this.#options.size) {
  //     case AssetMediaSize.Original: {
  //       path = getAssetOriginalPath(this.asset.id);
  //       break;
  //     }
  //     case AssetMediaSize.Fullsize:
  //     case AssetMediaSize.Thumbnail:
  //     case AssetMediaSize.Preview: {
  //       path = getAssetThumbnailPath(this.asset.id);
  //       break;
  //     }
  //     case AssetMediaSize.Playback: {
  //       path = getAssetPlaybackPath(this.asset.id);
  //       break;
  //     }
  //     default:
  //     // TODO: default AssetMediaSize
  //   }

  //   return getBaseUrl() + path + '?' + searchParameters.toString();
  // }

  // get isOriginalImage() {
  //   return this.#options.size === AssetMediaSize.Original || this.#options.size === AssetMediaSize.Fullsize;
  // }
}

// const getAssetUrl = (id: string, targetSize: AssetMediaSize | 'original', cacheKey: string | null) => {
//   if (sharedLink && (!sharedLink.allowDownload || !sharedLink.showMetadata)) {
//     return getAssetThumbnailUrl({ id, size: AssetMediaSize.Preview, cacheKey });
//   }

//   return targetSize === 'original'
//     ? getAssetOriginalUrl({ id, cacheKey })
//     : getAssetThumbnailUrl({ id, size: targetSize, cacheKey });
// };

// $effect(() => {
//   if ($alwaysLoadOriginalFile || forceUseOriginal || originalImageLoaded) {
//     assetManager.updateOptions({
//       size: isWebCompatibleImage(asset) ? AssetMediaSize.Original : AssetMediaSize.Fullsize,
//     });
//   }
//   assetManager.updateOptions({ size: AssetMediaSize.Preview });
// });
