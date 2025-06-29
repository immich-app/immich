import { authManager } from '$lib/managers/auth-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { CancellableTask } from '$lib/utils/cancellable-task';
import type { AssetGridRouteSearchParams } from '$lib/utils/navigation';
import { toTimelineAsset } from '$lib/utils/timeline-util';
import {
  getAllAlbums,
  getAssetInfo,
  getAssetOriginalPath,
  getAssetPlaybackPath,
  getAssetThumbnailPath,
  getBaseUrl,
  type AlbumResponseDto,
  type AssetResponseDto,
} from '@immich/sdk';
import { type ZoomImageWheelState } from '@zoom-image/core';
import { isEqual } from 'lodash-es';

export enum AssetMediaSize {
  Original = 'original',
  Fullsize = 'fullsize',
  Preview = 'preview',
  Thumbnail = 'thumbnail',
  Playback = 'playback',
}

export type AssetManagerOptions = {
  assetId?: string;
  preloadAssetIds?: string[];
  loadAlbums?: boolean;
  size?: AssetMediaSize;
};

export class AssetManager {
  isInitialized = $state(false);
  isLoaded = $state(false);
  loadError = $state(false);
  asset: AssetResponseDto | undefined = $state();
  preloadAssets: TimelineAsset[] = $state([]);
  albums: AlbumResponseDto[] = $state([]);

  cacheKey: string | null = $derived(this.asset?.thumbhash ?? null);

  url: string | undefined = $derived.by(() => {
    if (this.asset) {
      return this.#getAssetUrl(toTimelineAsset(this.asset!));
    }
  });

  showAssetViewer: boolean = $state(false);
  gridScrollTarget: AssetGridRouteSearchParams | undefined = $state();
  zoomImageState: ZoomImageWheelState | undefined = $state();

  initTask = new CancellableTask(
    () => (this.isInitialized = true),
    () => {
      this.asset = undefined;
      this.preloadAssets = [];
      this.albums = [];
      this.isInitialized = false;
    },
    () => void 0,
  );

  static #INIT_OPTIONS = {};
  #options: AssetManagerOptions = AssetManager.#INIT_OPTIONS;

  constructor() {}

  async #initializeAsset() {
    if (this.#options.assetId) {
      const assetResponse = await getAssetInfo({ id: this.#options.assetId, key: authManager.key });
      if (!assetResponse) {
        return;
      }
      this.asset = assetResponse;
    } else {
      throw new Error('The assetId in required in options.');
    }

    // TODO: Preload assets.

    if (this.#options.loadAlbums ?? true) {
      const albumsResponse = await getAllAlbums({ assetId: this.#options.assetId });
      if (!albumsResponse) {
        return;
      }
      this.albums = albumsResponse;
    }
  }

  async updateOptions(options: AssetManagerOptions) {
    if (this.#options !== AssetManager.#INIT_OPTIONS && isEqual(this.#options, options)) {
      return;
    }
    await this.initTask.reset();
    await this.#init(options);
  }

  #checkOptions() {
    this.#options.size = AssetMediaSize.Original;

    if (!this.asset || !this.zoomImageState) {
      return;
    }

    if (this.asset.originalMimeType === 'image/gif' || this.zoomImageState.currentZoom > 1) {
      // TODO: use original image forcely and according to the setting.
    }
  }

  async #init(options: AssetManagerOptions) {
    this.isInitialized = false;
    this.asset = undefined;
    this.preloadAssets = [];
    this.albums = [];
    await this.initTask.execute(async () => {
      this.#options = options;
      await this.#initializeAsset();
      this.#checkOptions();
    }, true);
  }

  public destroy() {
    this.isInitialized = false;
  }

  async refreshAlbums() {}

  async refreshAsset() {}

  #preload() {
    for (const preloadAsset of this.preloadAssets) {
      if (preloadAsset.isImage) {
        let img = new Image();
        const preloadUrl = this.#getAssetUrl(preloadAsset);
        if (preloadUrl) {
          img.src = preloadUrl;
        } else {
          throw new Error('AssetManager is not initialized.');
        }
      }
    }
  }

  #getAssetUrl(asset: TimelineAsset) {
    if (!this.asset) {
      return;
    }

    let path = undefined;
    const searchParameters = new URLSearchParams();
    if (authManager.key) {
      searchParameters.set('key', authManager.key);
    }
    if (this.cacheKey) {
      searchParameters.set('c', this.cacheKey);
    }

    switch (this.#options.size) {
      case AssetMediaSize.Original: {
        path = getAssetOriginalPath(this.asset.id);
        break;
      }
      case AssetMediaSize.Fullsize:
      case AssetMediaSize.Thumbnail:
      case AssetMediaSize.Preview: {
        path = getAssetThumbnailPath(this.asset.id);
        break;
      }
      case AssetMediaSize.Playback: {
        path = getAssetPlaybackPath(this.asset.id);
        break;
      }
      default:
      // TODO: default AssetMediaSize
    }

    return getBaseUrl() + path + '?' + searchParameters.toString();
  }

  get isOriginalImage() {
    return this.#options.size === AssetMediaSize.Original || this.#options.size === AssetMediaSize.Fullsize;
  }
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
