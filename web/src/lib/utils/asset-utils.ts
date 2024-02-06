import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { downloadManager } from '$lib/stores/download';
import {
  api,
  type BulkIdResponseDto,
  type AssetResponseDto,
  type DownloadResponseDto,
  type DownloadInfoDto,
  AssetTypeEnum,
  type UserResponseDto,
} from '@api';
import { handleError } from './handle-error';
import { DateTime } from 'luxon';

export const addAssetsToAlbum = async (albumId: string, assetIds: Array<string>): Promise<BulkIdResponseDto[]> =>
  api.albumApi
    .addAssetsToAlbum({
      id: albumId,
      bulkIdsDto: { ids: assetIds },
      key: api.getKey(),
    })
    .then(({ data: results }) => {
      const count = results.filter(({ success }) => success).length;
      notificationController.show({
        type: NotificationType.Info,
        message: `Added ${count} asset${count === 1 ? '' : 's'}`,
      });

      return results;
    });

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
    const { data } = await api.downloadApi.getDownloadInfo({ downloadInfoDto: options, key: api.getKey() });
    downloadInfo = data;
  } catch (error) {
    handleError(error, 'Unable to download files');
    return;
  }

  // TODO: prompt for big download
  // const total = downloadInfo.totalSize;

  for (let index = 0; index < downloadInfo.archives.length; index++) {
    const archive = downloadInfo.archives[index];
    const suffix = downloadInfo.archives.length === 1 ? '' : `+${index + 1}`;
    const archiveName = fileName.replace('.zip', `${suffix}-${DateTime.now().toFormat('yyyy-LL-dd-HH-mm-ss')}.zip`);

    let downloadKey = `${archiveName} `;
    if (downloadInfo.archives.length > 1) {
      downloadKey = `${archiveName} (${index + 1}/${downloadInfo.archives.length})`;
    }

    const abort = new AbortController();
    downloadManager.add(downloadKey, archive.size, abort);

    try {
      const { data } = await api.downloadApi.downloadArchive(
        { assetIdsDto: { assetIds: archive.assetIds }, key: api.getKey() },
        {
          responseType: 'blob',
          signal: abort.signal,
          onDownloadProgress: (event) => downloadManager.update(downloadKey, event.loaded),
        },
      );

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
      filename: `${asset.originalFileName}.${getFilenameExtension(asset.originalPath)}`,
      id: asset.id,
      size: asset.exifInfo?.fileSizeInByte || 0,
    },
  ];
  if (asset.livePhotoVideoId) {
    assets.push({
      filename: `${asset.originalFileName}.mov`,
      id: asset.livePhotoVideoId,
      size: 0,
    });
  }

  for (const { filename, id, size } of assets) {
    const downloadKey = filename;

    try {
      const abort = new AbortController();
      downloadManager.add(downloadKey, size, abort);

      const { data } = await api.downloadApi.downloadFile(
        { id, key: api.getKey() },
        {
          responseType: 'blob',
          onDownloadProgress: ({ event }) => {
            if (event.lengthComputable) {
              downloadManager.update(downloadKey, event.loaded, event.total);
            }
          },
          signal: abort.signal,
        },
      );

      notificationController.show({
        type: NotificationType.Info,
        message: `Downloading asset ${asset.originalFileName}`,
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

/**
 * Returns aspect ratio for the asset
 */
export function getAssetRatio(asset: AssetResponseDto) {
  let height = asset.exifInfo?.exifImageHeight || 235;
  let width = asset.exifInfo?.exifImageWidth || 235;
  const orientation = Number(asset.exifInfo?.orientation);
  if (orientation && (isRotated90CW(orientation) || isRotated270CW(orientation))) {
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
  const ids = [...assets].filter((a) => !a.isExternal && user && a.ownerId === user.id).map((a) => a.id);

  const numberOfIssues = [...assets].filter((a) => a.isExternal || (user && a.ownerId !== user.id)).length;
  if (numberOfIssues > 0) {
    notificationController.show({
      message: `Can't change metadata of ${numberOfIssues} asset${numberOfIssues > 1 ? 's' : ''}`,
      type: NotificationType.Warning,
    });
  }
  return ids;
};
