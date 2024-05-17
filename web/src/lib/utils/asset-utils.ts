import { goto } from '$app/navigation';
import { NotificationType, notificationController } from '$lib/components/shared-components/notification/notification';
import { AppRoute } from '$lib/constants';
import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
import { assetViewingStore } from '$lib/stores/asset-viewing.store';
import { BucketPosition, isSelectingAllAssets, type AssetStore } from '$lib/stores/assets.store';
import { downloadManager } from '$lib/stores/download';
import { downloadRequest, getKey } from '$lib/utils';
import { createAlbum } from '$lib/utils/album-utils';
import { encodeHTMLSpecialChars } from '$lib/utils/string-utils';
import {
  addAssetsToAlbum as addAssets,
  getBaseUrl,
  getDownloadInfo,
  updateAssets,
  type AlbumResponseDto,
  type AssetResponseDto,
  type AssetTypeEnum,
  type DownloadInfoDto,
  type DownloadResponseDto,
  type UserResponseDto,
} from '@immich/sdk';
import { DateTime } from 'luxon';
import { get } from 'svelte/store';
import { handleError } from './handle-error';

export const addAssetsToAlbum = async (albumId: string, assetIds: string[]) => {
  const result = await addAssets({
    id: albumId,
    bulkIdsDto: {
      ids: assetIds,
    },
    key: getKey(),
  });
  const count = result.filter(({ success }) => success).length;
  notificationController.show({
    type: NotificationType.Info,
    timeout: 5000,
    message:
      count > 0
        ? `Added ${count} asset${count === 1 ? '' : 's'} to the album`
        : `Asset${assetIds.length === 1 ? ' was' : 's were'} already part of the album`,
    button: {
      text: 'View Album',
      onClick() {
        return goto(`${AppRoute.ALBUMS}/${albumId}`);
      },
    },
  });
};

export const addAssetsToNewAlbum = async (albumName: string, assetIds: string[]) => {
  const album = await createAlbum(albumName, assetIds);
  if (!album) {
    return;
  }
  const displayName = albumName ? `<b>${encodeHTMLSpecialChars(albumName)}</b>` : 'new album';
  notificationController.show({
    type: NotificationType.Info,
    timeout: 5000,
    message: `Added ${assetIds.length} asset${assetIds.length === 1 ? '' : 's'} to ${displayName}`,
    html: true,
    button: {
      text: 'View Album',
      onClick() {
        return goto(`${AppRoute.ALBUMS}/${album.id}`);
      },
    },
  });
  return album;
};

export const downloadAlbum = async (album: AlbumResponseDto) => {
  await downloadArchive(`${album.albumName}.zip`, {
    albumId: album.id,
  });
};

export const downloadBlob = (data: Blob, filename: string) => {
  const url = URL.createObjectURL(data);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;

  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
};

export const downloadArchive = async (fileName: string, options: DownloadInfoDto) => {
  let downloadInfo: DownloadResponseDto | null = null;

  try {
    downloadInfo = await getDownloadInfo({ downloadInfoDto: options, key: getKey() });
  } catch (error) {
    handleError(error, 'Unable to download files');
    return;
  }

  // TODO: prompt for big download
  // const total = downloadInfo.totalSize;

  for (let index = 0; index < downloadInfo.archives.length; index++) {
    const archive = downloadInfo.archives[index];
    const suffix = downloadInfo.archives.length > 1 ? `+${index + 1}` : '';
    const archiveName = fileName.replace('.zip', `${suffix}-${DateTime.now().toFormat('yyyyLLdd_HHmmss')}.zip`);
    const key = getKey();

    let downloadKey = `${archiveName} `;
    if (downloadInfo.archives.length > 1) {
      downloadKey = `${archiveName} (${index + 1}/${downloadInfo.archives.length})`;
    }

    const abort = new AbortController();
    downloadManager.add(downloadKey, archive.size, abort);

    try {
      // TODO use sdk once it supports progress events
      const { data } = await downloadRequest({
        method: 'POST',
        url: getBaseUrl() + '/download/archive' + (key ? `?key=${key}` : ''),
        data: { assetIds: archive.assetIds },
        signal: abort.signal,
        onDownloadProgress: (event) => downloadManager.update(downloadKey, event.loaded),
      });

      downloadBlob(data, archiveName);
    } catch (error) {
      handleError(error, 'Unable to download files');
      downloadManager.clear(downloadKey);
      return;
    } finally {
      setTimeout(() => downloadManager.clear(downloadKey), 5000);
    }
  }
};

export const downloadFile = async (asset: AssetResponseDto) => {
  if (asset.isOffline) {
    notificationController.show({
      type: NotificationType.Info,
      message: `Asset ${asset.originalFileName} is offline`,
    });
    return;
  }
  const assets = [
    {
      filename: asset.originalFileName,
      id: asset.id,
      size: asset.exifInfo?.fileSizeInByte || 0,
    },
  ];
  if (asset.livePhotoVideoId) {
    assets.push({
      filename: asset.originalFileName,
      id: asset.livePhotoVideoId,
      size: 0,
    });
  }

  for (const { filename, id, size } of assets) {
    const downloadKey = filename;

    try {
      const abort = new AbortController();
      downloadManager.add(downloadKey, size, abort);
      const key = getKey();

      notificationController.show({
        type: NotificationType.Info,
        message: `Downloading asset ${asset.originalFileName}`,
      });

      // TODO use sdk once it supports progress events
      const { data } = await downloadRequest({
        method: 'POST',
        url: getBaseUrl() + `/download/asset/${id}` + (key ? `?key=${key}` : ''),
        signal: abort.signal,
        onDownloadProgress: (event) => downloadManager.update(downloadKey, event.loaded, event.total),
      });

      downloadBlob(data, filename);
    } catch (error) {
      handleError(error, `Error downloading ${filename}`);
      downloadManager.clear(downloadKey);
    } finally {
      setTimeout(() => downloadManager.clear(downloadKey), 5000);
    }
  }
};

/**
 * Returns the lowercase filename extension without a dot (.) and
 * an empty string when not found.
 */
export function getFilenameExtension(filename: string): string {
  const lastIndex = Math.max(0, filename.lastIndexOf('.'));
  const startIndex = (lastIndex || Number.POSITIVE_INFINITY) + 1;
  return filename.slice(startIndex).toLowerCase();
}

/**
 * Returns the filename of an asset including file extension
 */
export function getAssetFilename(asset: AssetResponseDto): string {
  const fileExtension = getFilenameExtension(asset.originalPath);
  return `${asset.originalFileName}.${fileExtension}`;
}

function isRotated90CW(orientation: number) {
  return orientation === 5 || orientation === 6 || orientation === 90;
}

function isRotated270CW(orientation: number) {
  return orientation === 7 || orientation === 8 || orientation === -90;
}

export function isFlipped(orientation?: string | null) {
  const value = Number(orientation);
  return value && (isRotated270CW(value) || isRotated90CW(value));
}

/**
 * Returns aspect ratio for the asset
 */
export function getAssetRatio(asset: AssetResponseDto) {
  let height = asset.exifInfo?.exifImageHeight || 235;
  let width = asset.exifInfo?.exifImageWidth || 235;
  if (isFlipped(asset.exifInfo?.orientation)) {
    [width, height] = [height, width];
  }
  return { width, height };
}

// list of supported image extensions from https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types excluding svg
const supportedImageExtensions = new Set(['apng', 'avif', 'gif', 'jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'png', 'webp']);

/**
 * Returns true if the asset is an image supported by web browsers, false otherwise
 */
export function isWebCompatibleImage(asset: AssetResponseDto): boolean {
  const imgExtension = getFilenameExtension(asset.originalPath);

  return supportedImageExtensions.has(imgExtension);
}

export const getAssetType = (type: AssetTypeEnum) => {
  switch (type) {
    case 'IMAGE': {
      return 'Photo';
    }
    case 'VIDEO': {
      return 'Video';
    }
    default: {
      return 'Asset';
    }
  }
};

export const getSelectedAssets = (assets: Set<AssetResponseDto>, user: UserResponseDto | null): string[] => {
  const ids = [...assets].filter((a) => user && a.ownerId === user.id).map((a) => a.id);

  const numberOfIssues = [...assets].filter((a) => user && a.ownerId !== user.id).length;
  if (numberOfIssues > 0) {
    notificationController.show({
      message: `Can't change metadata of ${numberOfIssues} asset${numberOfIssues > 1 ? 's' : ''}`,
      type: NotificationType.Warning,
    });
  }
  return ids;
};

export const stackAssets = async (assets: AssetResponseDto[]) => {
  if (assets.length < 2) {
    return false;
  }

  const parent = assets[0];
  const children = assets.slice(1);
  const ids = children.map(({ id }) => id);

  try {
    await updateAssets({
      assetBulkUpdateDto: {
        ids,
        stackParentId: parent.id,
      },
    });
  } catch (error) {
    handleError(error, 'Failed to stack assets');
    return false;
  }

  let grandChildren: AssetResponseDto[] = [];
  for (const asset of children) {
    asset.stackParentId = parent.id;
    if (asset.stack) {
      // Add grand-children to new parent
      grandChildren = grandChildren.concat(asset.stack);
      // Reset children stack info
      asset.stackCount = null;
      asset.stack = [];
    }
  }

  parent.stack ??= [];
  parent.stack = parent.stack.concat(children, grandChildren);
  parent.stackCount = parent.stack.length + 1;

  notificationController.show({
    message: `Stacked ${parent.stackCount} assets`,
    type: NotificationType.Info,
    button: {
      text: 'View Stack',
      onClick() {
        return assetViewingStore.setAssetId(parent.id);
      },
    },
  });

  return ids;
};

export const unstackAssets = async (assets: AssetResponseDto[]) => {
  const ids = assets.map(({ id }) => id);
  try {
    await updateAssets({
      assetBulkUpdateDto: {
        ids,
        removeParent: true,
      },
    });
  } catch (error) {
    handleError(error, 'Failed to un-stack assets');
    return;
  }
  for (const asset of assets) {
    asset.stackParentId = null;
    asset.stackCount = null;
    asset.stack = [];
  }
  notificationController.show({
    type: NotificationType.Info,
    message: `Un-stacked ${assets.length} assets`,
  });
  return assets;
};

export const selectAllAssets = async (assetStore: AssetStore, assetInteractionStore: AssetInteractionStore) => {
  if (get(isSelectingAllAssets)) {
    // Selection is already ongoing
    return;
  }
  isSelectingAllAssets.set(true);

  try {
    for (const bucket of assetStore.buckets) {
      await assetStore.loadBucket(bucket.bucketDate, BucketPosition.Unknown);

      if (!get(isSelectingAllAssets)) {
        break; // Cancelled
      }
      assetInteractionStore.selectAssets(bucket.assets);

      // We use setTimeout to allow the UI to update. Otherwise, this may
      // cause a long delay between the start of 'select all' and the
      // effective update of the UI, depending on the number of assets
      // to select
      await delay(0);
    }
  } catch (error) {
    handleError(error, 'Error selecting all assets');
    isSelectingAllAssets.set(false);
  }
};

export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
