import { goto } from '$app/navigation';
import { NotificationType, notificationController } from '$lib/components/shared-components/notification/notification';
import { AppRoute } from '$lib/constants';
import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
import { assetViewingStore } from '$lib/stores/asset-viewing.store';
import { BucketPosition, isSelectingAllAssets, type AssetStore } from '$lib/stores/assets.store';
import { downloadManager } from '$lib/stores/download';
import { preferences } from '$lib/stores/user.store';
import { downloadRequest, getKey, withError } from '$lib/utils';
import { createAlbum } from '$lib/utils/album-utils';
import { getByteUnitString } from '$lib/utils/byte-units';
import { encodeHTMLSpecialChars } from '$lib/utils/string-utils';
import {
  addAssetsToAlbum as addAssets,
  getAssetInfo,
  getBaseUrl,
  getDownloadInfo,
  updateAsset,
  updateAssets,
  type AlbumResponseDto,
  type AssetResponseDto,
  type AssetTypeEnum,
  type DownloadInfoDto,
  type UserResponseDto,
} from '@immich/sdk';
import { DateTime } from 'luxon';
import { t } from 'svelte-i18n';
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
  const $t = get(t);
  notificationController.show({
    type: NotificationType.Info,
    timeout: 5000,
    message:
      count > 0
        ? $t('assets_added_to_album_count', { values: { count: count } })
        : $t('assets_were_part_of_album_count', { values: { count: assetIds.length } }),
    button: {
      text: $t('view_album'),
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
  const $t = get(t);
  notificationController.show({
    type: NotificationType.Info,
    timeout: 5000,
    message: $t('assets_added_to_name_count', { values: { count: assetIds.length, name: displayName } }),
    html: true,
    button: {
      text: $t('view_album'),
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

export const downloadArchive = async (fileName: string, options: Omit<DownloadInfoDto, 'archiveSize'>) => {
  const $preferences = get(preferences);
  const dto = { ...options, archiveSize: $preferences.download.archiveSize };

  const [error, downloadInfo] = await withError(() => getDownloadInfo({ downloadInfoDto: dto, key: getKey() }));
  if (error) {
    const $t = get(t);
    handleError(error, $t('errors.unable_to_download_files'));
    return;
  }

  if (!downloadInfo) {
    return;
  }

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
      const $t = get(t);
      handleError(error, $t('errors.unable_to_download_files'));
      downloadManager.clear(downloadKey);
      return;
    } finally {
      setTimeout(() => downloadManager.clear(downloadKey), 5000);
    }
  }
};

export const downloadFile = async (asset: AssetResponseDto) => {
  const $t = get(t);
  if (asset.isOffline) {
    notificationController.show({
      type: NotificationType.Info,
      message: $t('asset_filename_is_offline', { values: { filename: asset.originalFileName } }),
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
    const motionAsset = await getAssetInfo({ id: asset.livePhotoVideoId, key: getKey() });
    assets.push({
      filename: motionAsset.originalFileName,
      id: asset.livePhotoVideoId,
      size: motionAsset.exifInfo?.fileSizeInByte || 0,
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
        message: $t('downloading_asset_filename', { values: { filename: asset.originalFileName } }),
      });

      // TODO use sdk once it supports progress events
      const { data } = await downloadRequest({
        method: 'GET',
        url: getBaseUrl() + `/assets/${id}/original` + (key ? `?key=${key}` : ''),
        signal: abort.signal,
        onDownloadProgress: (event) => downloadManager.update(downloadKey, event.loaded, event.total),
      });

      downloadBlob(data, filename);
    } catch (error) {
      handleError(error, $t('errors.error_downloading', { values: { filename: filename } }));
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

export function getFileSize(asset: AssetResponseDto): string {
  const size = asset.exifInfo?.fileSizeInByte || 0;
  return size > 0 ? getByteUnitString(size, undefined, 4) : 'Invalid Data';
}

export function getAssetResolution(asset: AssetResponseDto): string {
  const { width, height } = getAssetRatio(asset);

  if (width === 235 && height === 235) {
    return 'Invalid Data';
  }

  return `${width} x ${height}`;
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
const supportedImageMimeTypes = new Set([
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent); // https://stackoverflow.com/a/23522755
if (isSafari) {
  supportedImageMimeTypes.add('image/heic').add('image/heif');
}

/**
 * Returns true if the asset is an image supported by web browsers, false otherwise
 */
export function isWebCompatibleImage(asset: AssetResponseDto): boolean {
  if (!asset.originalMimeType) {
    return false;
  }

  return supportedImageMimeTypes.has(asset.originalMimeType);
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
    const $t = get(t);
    notificationController.show({
      message: $t('errors.cant_change_metadata_assets_count', { values: { count: numberOfIssues } }),
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
  const $t = get(t);

  try {
    await updateAssets({
      assetBulkUpdateDto: {
        ids,
        stackParentId: parent.id,
      },
    });
  } catch (error) {
    handleError(error, $t('errors.failed_to_stack_assets'));
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
    message: $t('stacked_assets_count', { values: { count: parent.stackCount } }),
    type: NotificationType.Info,
    button: {
      text: $t('view_stack'),
      onClick() {
        return assetViewingStore.setAssetId(parent.id);
      },
    },
  });

  return ids;
};

export const unstackAssets = async (assets: AssetResponseDto[]) => {
  const ids = assets.map(({ id }) => id);
  const $t = get(t);
  try {
    await updateAssets({
      assetBulkUpdateDto: {
        ids,
        removeParent: true,
      },
    });
  } catch (error) {
    handleError(error, $t('errors.failed_to_unstack_assets'));
    return;
  }
  for (const asset of assets) {
    asset.stackParentId = null;
    asset.stackCount = null;
    asset.stack = [];
  }
  notificationController.show({
    type: NotificationType.Info,
    message: $t('unstacked_assets_count', { values: { count: assets.length } }),
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
    const $t = get(t);
    handleError(error, $t('errors.error_selecting_all_assets'));
    isSelectingAllAssets.set(false);
  }
};

export const toggleArchive = async (asset: AssetResponseDto) => {
  const $t = get(t);
  try {
    const data = await updateAsset({
      id: asset.id,
      updateAssetDto: {
        isArchived: !asset.isArchived,
      },
    });

    asset.isArchived = data.isArchived;

    notificationController.show({
      type: NotificationType.Info,
      message: asset.isArchived ? $t(`added_to_archive`) : $t(`removed_from_archive`),
    });
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_remove_archive', { values: { archived: asset.isArchived } }));
  }

  return asset;
};

export const archiveAssets = async (assets: AssetResponseDto[], archive: boolean) => {
  const isArchived = archive;
  const ids = assets.map(({ id }) => id);
  const $t = get(t);

  try {
    if (ids.length > 0) {
      await updateAssets({ assetBulkUpdateDto: { ids, isArchived } });
    }

    for (const asset of assets) {
      asset.isArchived = isArchived;
    }

    notificationController.show({
      message: isArchived
        ? $t('archived_count', { values: { count: ids.length } })
        : $t('unarchived_count', { values: { count: ids.length } }),
      type: NotificationType.Info,
    });
  } catch (error) {
    handleError(error, $t('errors.unable_to_archive_unarchive', { values: { archived: isArchived } }));
  }

  return ids;
};

export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
