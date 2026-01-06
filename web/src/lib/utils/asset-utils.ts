import { goto } from '$app/navigation';
import ToastAction from '$lib/components/ToastAction.svelte';
import { AppRoute } from '$lib/constants';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { downloadManager } from '$lib/managers/download-manager.svelte';
import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
import { isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
import { preferences } from '$lib/stores/user.store';
import { downloadRequest, sleep, withError } from '$lib/utils';
import { getByteUnitString } from '$lib/utils/byte-units';
import { getFormatter } from '$lib/utils/i18n';
import { navigate } from '$lib/utils/navigation';
import { asQueryString } from '$lib/utils/shared-links';
import {
  addAssetsToAlbum as addAssets,
  addAssetsToAlbums as addToAlbums,
  AssetVisibility,
  BulkIdErrorReason,
  bulkTagAssets,
  createStack,
  deleteAssets,
  deleteStacks,
  getAssetInfo,
  getBaseUrl,
  getDownloadInfo,
  getStack,
  untagAssets,
  updateAsset,
  updateAssets,
  type AssetResponseDto,
  type AssetTypeEnum,
  type DownloadInfoDto,
  type ExifResponseDto,
  type StackResponseDto,
  type UserPreferencesResponseDto,
  type UserResponseDto,
} from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { DateTime } from 'luxon';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import { handleError } from './handle-error';

export const addAssetsToAlbum = async (albumId: string, assetIds: string[], showNotification = true) => {
  const result = await addAssets({
    ...authManager.params,
    id: albumId,
    bulkIdsDto: {
      ids: assetIds,
    },
  });
  const count = result.filter(({ success }) => success).length;
  const duplicateErrorCount = result.filter(({ error }) => error === 'duplicate').length;
  const $t = get(t);

  if (showNotification) {
    let description = $t('assets_cannot_be_added_to_album_count', { values: { count: assetIds.length } });
    if (count > 0) {
      description = $t('assets_added_to_album_count', { values: { count } });
    } else if (duplicateErrorCount > 0) {
      description = $t('assets_were_part_of_album_count', { values: { count: duplicateErrorCount } });
    }
    toastManager.custom(
      {
        component: ToastAction,
        props: {
          title: $t('info'),
          color: 'primary',
          description,
          button: {
            text: $t('view_album'),
            color: 'primary',
            onClick() {
              return goto(`${AppRoute.ALBUMS}/${albumId}`);
            },
          },
        },
      },
      { timeout: 5000 },
    );
  }
};

export const addAssetsToAlbums = async (albumIds: string[], assetIds: string[], showNotification = true) => {
  const result = await addToAlbums({
    ...authManager.params,
    albumsAddAssetsDto: {
      albumIds,
      assetIds,
    },
  });

  if (!showNotification) {
    return result;
  }

  if (showNotification) {
    const $t = get(t);

    if (result.error === BulkIdErrorReason.Duplicate) {
      toastManager.info($t('assets_were_part_of_albums_count', { values: { count: assetIds.length } }));
      return result;
    }
    if (result.error) {
      toastManager.warning($t('assets_cannot_be_added_to_albums', { values: { count: assetIds.length } }));
      return result;
    }
    toastManager.success(
      $t('assets_added_to_albums_count', { values: { albumTotal: albumIds.length, assetTotal: assetIds.length } }),
    );
    return result;
  }
};

export const tagAssets = async ({
  assetIds,
  tagIds,
  showNotification = true,
}: {
  assetIds: string[];
  tagIds: string[];
  showNotification?: boolean;
}) => {
  await bulkTagAssets({ tagBulkAssetsDto: { tagIds, assetIds } });

  if (showNotification) {
    const $t = await getFormatter();
    toastManager.success($t('tagged_assets', { values: { count: assetIds.length } }));
  }

  return assetIds;
};

export const removeTag = async ({
  assetIds,
  tagIds,
  showNotification = true,
}: {
  assetIds: string[];
  tagIds: string[];
  showNotification?: boolean;
}) => {
  for (const tagId of tagIds) {
    await untagAssets({ id: tagId, bulkIdsDto: { ids: assetIds } });
  }

  if (showNotification) {
    const $t = await getFormatter();
    toastManager.success($t('removed_tagged_assets', { values: { count: assetIds.length } }));
  }

  return assetIds;
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

export const downloadUrl = (url: string, filename: string) => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;

  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
};

export const downloadArchive = async (fileName: string, options: Omit<DownloadInfoDto, 'archiveSize'>) => {
  const $preferences = get<UserPreferencesResponseDto | undefined>(preferences);
  const dto = { ...options, archiveSize: $preferences?.download.archiveSize };

  const [error, downloadInfo] = await withError(() => getDownloadInfo({ ...authManager.params, downloadInfoDto: dto }));
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
    const queryParams = asQueryString(authManager.params);

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
        url: getBaseUrl() + '/download/archive' + (queryParams ? `?${queryParams}` : ''),
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
  const assets = [
    {
      filename: asset.originalFileName,
      id: asset.id,
      size: asset.exifInfo?.fileSizeInByte || 0,
    },
  ];

  const isAndroidMotionVideo = (asset: AssetResponseDto) => {
    return asset.originalPath.includes('encoded-video');
  };

  if (asset.livePhotoVideoId) {
    const motionAsset = await getAssetInfo({ ...authManager.params, id: asset.livePhotoVideoId });
    if (!isAndroidMotionVideo(motionAsset) || get(preferences)?.download.includeEmbeddedVideos) {
      assets.push({
        filename: motionAsset.originalFileName,
        id: asset.livePhotoVideoId,
        size: motionAsset.exifInfo?.fileSizeInByte || 0,
      });
    }
  }

  const queryParams = asQueryString(authManager.params);

  for (const [i, { filename, id }] of assets.entries()) {
    if (i !== 0) {
      // play nice with Safari
      await sleep(500);
    }

    try {
      toastManager.success($t('downloading_asset_filename', { values: { filename: asset.originalFileName } }));
      downloadUrl(getBaseUrl() + `/assets/${id}/original` + (queryParams ? `?${queryParams}` : ''), filename);
    } catch (error) {
      handleError(error, $t('errors.error_downloading', { values: { filename } }));
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

export const getDimensions = (exifInfo: ExifResponseDto) => {
  const { exifImageWidth: width, exifImageHeight: height } = exifInfo;
  if (isFlipped(exifInfo.orientation)) {
    return { width: height, height: width };
  }

  return { width, height };
};

export function getFileSize(asset: AssetResponseDto, maxPrecision = 4): string {
  const size = asset.exifInfo?.fileSizeInByte || 0;
  return size > 0 ? getByteUnitString(size, undefined, maxPrecision) : 'Invalid Data';
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
  supportedImageMimeTypes.add('image/heic').add('image/heif').add('image/jxl');
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

export const getOwnedAssetsWithWarning = (assets: TimelineAsset[], user: UserResponseDto | null): string[] => {
  const ids = [...assets].filter((a) => user && a.ownerId === user.id).map((a) => a.id);

  const numberOfIssues = [...assets].filter((a) => user && a.ownerId !== user.id).length;
  if (numberOfIssues > 0) {
    const $t = get(t);
    toastManager.warning($t('errors.cant_change_metadata_assets_count', { values: { count: numberOfIssues } }));
  }
  return ids;
};

export type StackResponse = {
  stack?: StackResponseDto;
  toDeleteIds: string[];
};

export const stackAssets = async (assets: { id: string }[], showNotification = true): Promise<StackResponse> => {
  if (assets.length < 2) {
    return { stack: undefined, toDeleteIds: [] };
  }

  const $t = get(t);

  try {
    const stack = await createStack({ stackCreateDto: { assetIds: assets.map(({ id }) => id) } });
    if (showNotification) {
      toastManager.custom({
        component: ToastAction,
        props: {
          title: $t('success'),
          description: $t('stacked_assets_count', { values: { count: stack.assets.length } }),
          color: 'success',
          button: {
            text: $t('view_stack'),
            onClick: () => navigate({ targetRoute: 'current', assetId: stack.primaryAssetId }),
          },
        },
      });
    }

    return {
      stack,
      toDeleteIds: assets.slice(1).map((asset) => asset.id),
    };
  } catch (error) {
    handleError(error, $t('errors.failed_to_stack_assets'));
    return { stack: undefined, toDeleteIds: [] };
  }
};

export const deleteStack = async (stackIds: string[]) => {
  const ids = [...new Set(stackIds)];
  if (ids.length === 0) {
    return;
  }

  const $t = get(t);

  try {
    const stacks = await Promise.all(ids.map((id) => getStack({ id })));
    const count = stacks.reduce((sum, stack) => sum + stack.assets.length, 0);

    await deleteStacks({ bulkIdsDto: { ids: [...ids] } });

    toastManager.success($t('unstacked_assets_count', { values: { count } }));

    const assets = stacks.flatMap((stack) => stack.assets);
    for (const asset of assets) {
      asset.stack = null;
    }

    return assets;
  } catch (error) {
    handleError(error, $t('errors.failed_to_unstack_assets'));
  }
};

export const keepThisDeleteOthers = async (keepAsset: AssetResponseDto, stack: StackResponseDto) => {
  const $t = get(t);

  try {
    const assetsToDeleteIds = stack.assets.filter((asset) => asset.id !== keepAsset.id).map((asset) => asset.id);
    await deleteAssets({ assetBulkDeleteDto: { ids: assetsToDeleteIds } });
    await deleteStacks({ bulkIdsDto: { ids: [stack.id] } });

    toastManager.success($t('kept_this_deleted_others', { values: { count: assetsToDeleteIds.length } }));

    keepAsset.stack = null;
    return keepAsset;
  } catch (error) {
    handleError(error, $t('errors.failed_to_keep_this_delete_others'));
  }
};

export const selectAllAssets = async (timelineManager: TimelineManager, assetInteraction: AssetInteraction) => {
  if (get(isSelectingAllAssets)) {
    // Selection is already ongoing
    return;
  }
  isSelectingAllAssets.set(true);

  try {
    for (const monthGroup of timelineManager.months) {
      await timelineManager.loadMonthGroup(monthGroup.yearMonth);

      if (!get(isSelectingAllAssets)) {
        assetInteraction.clearMultiselect();
        break; // Cancelled
      }
      assetInteraction.selectAssets(assetsSnapshot([...monthGroup.assetsIterator()]));

      for (const dateGroup of monthGroup.dayGroups) {
        assetInteraction.addGroupToMultiselectGroup(dateGroup.groupTitle);
      }
    }
  } catch (error) {
    const $t = get(t);
    handleError(error, $t('errors.error_selecting_all_assets'));
    isSelectingAllAssets.set(false);
  }
};

export const cancelMultiselect = (assetInteraction: AssetInteraction) => {
  isSelectingAllAssets.set(false);
  assetInteraction.clearMultiselect();
};

export const toggleArchive = async (asset: AssetResponseDto) => {
  const $t = get(t);
  try {
    const data = await updateAsset({
      id: asset.id,
      updateAssetDto: {
        visibility: asset.isArchived ? AssetVisibility.Timeline : AssetVisibility.Archive,
      },
    });

    asset.isArchived = data.isArchived;
    toastManager.success(asset.isArchived ? $t(`added_to_archive`) : $t(`removed_from_archive`));
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_remove_archive', { values: { archived: asset.isArchived } }));
  }

  return asset;
};

export const archiveAssets = async (assets: { id: string }[], visibility: AssetVisibility) => {
  const ids = assets.map(({ id }) => id);
  const $t = get(t);

  try {
    if (ids.length > 0) {
      await updateAssets({
        assetBulkUpdateDto: { ids, visibility },
      });
    }

    toastManager.success(
      visibility === AssetVisibility.Archive
        ? $t('archived_count', { values: { count: ids.length } })
        : $t('unarchived_count', { values: { count: ids.length } }),
    );
  } catch (error) {
    handleError(
      error,
      $t('errors.unable_to_archive_unarchive', { values: { archived: visibility === AssetVisibility.Archive } }),
    );
  }

  return ids;
};

export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const canCopyImageToClipboard = (): boolean => {
  return !!(navigator.clipboard && globalThis.ClipboardItem);
};

const imgToBlob = async (imageElement: HTMLImageElement) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;

  if (context) {
    context.drawImage(imageElement, 0, 0);

    return await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          throw new Error('Canvas conversion to Blob failed');
        }
      });
    });
  }

  throw new Error('Canvas context is null');
};

export const copyImageToClipboard = async (source: HTMLImageElement) => {
  // do not await, so the Safari clipboard write happens in the context of the user gesture
  await navigator.clipboard.write([new ClipboardItem({ ['image/png']: imgToBlob(source) })]);
};
