import type { AssetManager, LoadAssetOptions } from '$lib/managers/asset-manager/asset-manager.svelte';
import { AssetPackage } from '$lib/managers/asset-manager/asset-package.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
// import { cancelImageUrl } from '$lib/utils/sw-messaging';
import { getAllAlbums, getAssetInfo, getStack } from '@immich/sdk';

export async function loadFromAssetPackage(
  assetManager: AssetManager,
  assetPackage: AssetPackage,
  options: LoadAssetOptions,
  signal: AbortSignal,
): Promise<void> {
  const assetId = assetPackage.assetId;
  const assetCache = assetManager.assetCache.get(assetId);
  if (assetCache && assetCache.options === options) {
    return;
  }

  // TODO: Compare between assetCache and assetCache.options to ensure whether we need update or not.

  // If there is assetCache, then asset info is not need to update.
  if (!assetCache) {
    const key = authManager.key;
    const assetResponse = await getAssetInfo(
      {
        id: assetId,
        key,
      },
      { signal },
    );

    if (!assetResponse) {
      throw new Error('get AssetInfo error');
    }
    assetPackage.asset = assetResponse;
  }

  // TODO: need to update albums
  if (options.loadAlbums) {
    const albumsResponse = await getAllAlbums(
      {
        assetId,
      },
      { signal },
    );

    if (!albumsResponse) {
      throw new Error('get AllAlbums error');
    }
    assetPackage.albums = albumsResponse;
  }

  if (options.loadStack) {
    const stackResponse = await getStack(
      {
        id: assetId,
      },
      { signal },
    );

    if (!stackResponse) {
      throw new Error('get Stack error');
    }
    assetPackage.stack = stackResponse;
  }
}

export function mediaLoaded(assetManager: AssetManager) {
  assetManager.isLoaded = true;
}

export function mediaLoadError(assetManager: AssetManager) {
  assetManager.isLoaded = assetManager.loadError = true;
}

// export function cancelImageLoad(assetManager: AssetManager) {
//   if (assetManager.url) {
//     cancelImageUrl(assetManager.url);
//   }
//   assetManager.isLoaded = assetManager.loadError = false;
// }
