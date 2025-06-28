import { authManager } from '$lib/managers/auth-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { CancellableTask } from '$lib/utils/cancellable-task';
import type { AssetGridRouteSearchParams } from '$lib/utils/navigation';
import {
  AssetMediaSize,
  AssetTypeEnum,
  AssetVisibility,
  getAllAlbums,
  getAssetInfo,
  getAssetOriginalPath,
  getAssetPlaybackPath,
  getAssetThumbnailPath,
  getBaseUrl,
  type AlbumResponseDto,
  type AssetResponseDto,
} from '@immich/sdk';
import { isEqual } from 'lodash-es';

export type AssetManagerOptions = {
  assetId?: string;
  preloadAssetIds?: string[];
  size?: AssetMediaSize;
};

export class AssetManager {
  isInitialized = $state(false);
  #asset: AssetResponseDto | undefined = $state();
  preloadAssets: TimelineAsset[] = $state([]);
  cacheKey: string | null = $state(null);
  albums: AlbumResponseDto[] = $state([]);

  showAssetViewer: boolean = $state(false);
  gridScrollTarget: AssetGridRouteSearchParams | undefined = $state();

  initTask = new CancellableTask(
    () => (this.isInitialized = true),
    () => (this.isInitialized = false),
    () => void 0,
  );

  // TODO: Delete this after development
  #emptyAsset: AssetResponseDto = {
    checksum: '',
    deviceAssetId: '',
    deviceId: '',
    duration: '',
    fileCreatedAt: '',
    fileModifiedAt: '',
    hasMetadata: true,
    id: '',
    isArchived: false,
    isFavorite: false,
    isOffline: false,
    isTrashed: false,
    localDateTime: '',
    originalFileName: '',
    originalPath: '',
    ownerId: '',
    thumbhash: null,
    type: AssetTypeEnum.Image,
    updatedAt: '',
    visibility: AssetVisibility.Timeline,
  };

  static #INIT_OPTIONS = {};
  #options: AssetManagerOptions = AssetManager.#INIT_OPTIONS;

  constructor() {}

  async #initializeAsset(id: string) {
    const assetResponse = await getAssetInfo({ id, key: authManager.key });

    if (!assetResponse) {
      return;
    }
    this.#asset = assetResponse;

    const albumsResponse = await getAllAlbums({ assetId: this.asset.id });

    if (!albumsResponse) {
      return;
    }
    this.albums = albumsResponse;
  }

  async refreshAlbums() {}

  async refreshAsset() {}

  async updateOptions(options: AssetManagerOptions) {
    if (this.#options !== AssetManager.#INIT_OPTIONS && isEqual(this.#options, options)) {
      return;
    }
    await this.initTask.reset();
    await this.#init(options);
  }

  async #init(options: AssetManagerOptions) {
    this.isInitialized = false;
    await this.initTask.execute(async () => {
      this.#options = options;
      // TODO: If assetId is undefined, throw an exception.
      await this.#initializeAsset(this.#options.assetId!);
      // TODO: Preload assets.
    }, true);
  }

  public destroy() {
    this.isInitialized = false;
  }

  #createUrl(path: string, parameters?: Record<string, unknown>) {
    const searchParameters = new URLSearchParams();
    for (const key in parameters) {
      const value = parameters[key];
      if (value !== undefined && value !== null) {
        searchParameters.set(key, value.toString());
      }
    }
    return getBaseUrl() + path + searchParameters.toString();
  }

  get asset() {
    return this.#asset ?? this.#emptyAsset;
  }

  get originalUrl() {
    return this.#createUrl(getAssetOriginalPath(this.asset.id), { key: authManager.key, c: this.cacheKey });
  }

  get thumbnailUrl() {
    return this.#createUrl(getAssetThumbnailPath(this.asset.id), {
      key: authManager.key,
      c: this.cacheKey,
      size: this.#options.size,
    });
  }

  get playbackUrl() {
    return this.#createUrl(getAssetPlaybackPath(this.asset.id), { key: authManager.key, c: this.cacheKey });
  }
}
