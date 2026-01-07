import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
import { user as authUser, preferences } from '$lib/stores/user.store';
import { getSharedLink, sleep } from '$lib/utils';
import { downloadUrl } from '$lib/utils/asset-utils';
import { openFileUploadDialog } from '$lib/utils/file-uploader';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { asQueryString } from '$lib/utils/shared-links';
import {
  AssetVisibility,
  copyAsset,
  deleteAssets,
  getAssetInfo,
  getBaseUrl,
  updateAsset,
  type AssetResponseDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import {
  mdiAlertOutline,
  mdiDownload,
  mdiHeart,
  mdiHeartOutline,
  mdiInformationOutline,
  mdiMotionPauseOutline,
  mdiMotionPlayOutline,
  mdiShareVariantOutline,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { get } from 'svelte/store';

export const getAssetActions = ($t: MessageFormatter, asset: AssetResponseDto) => {
  const sharedLink = getSharedLink();
  const currentAuthUser = get(authUser);
  const isOwner = !!(currentAuthUser && currentAuthUser.id === asset.ownerId);

  const Share: ActionItem = {
    title: $t('share'),
    icon: mdiShareVariantOutline,
    type: $t('assets'),
    $if: () => !!(get(authUser) && !asset.isTrashed && asset.visibility !== AssetVisibility.Locked),
    onAction: () => modalManager.show(SharedLinkCreateModal, { assetIds: [asset.id] }),
  };

  const Download: ActionItem = {
    title: $t('download'),
    icon: mdiDownload,
    shortcuts: { key: 'd', shift: true },
    type: $t('assets'),
    $if: () => !!currentAuthUser,
    onAction: () => handleDownloadAsset(asset),
  };

  const SharedLinkDownload: ActionItem = {
    ...Download,
    $if: () => !currentAuthUser && sharedLink && sharedLink.allowDownload,
  };

  const PlayMotionPhoto: ActionItem = {
    title: $t('play_motion_photo'),
    icon: mdiMotionPlayOutline,
    type: $t('assets'),
    $if: () => !!asset.livePhotoVideoId && !assetViewerManager.isPlayingMotionPhoto,
    onAction: () => {
      assetViewerManager.isPlayingMotionPhoto = true;
    },
  };

  const StopMotionPhoto: ActionItem = {
    title: $t('stop_motion_photo'),
    icon: mdiMotionPauseOutline,
    type: $t('assets'),
    $if: () => !!asset.livePhotoVideoId && assetViewerManager.isPlayingMotionPhoto,
    onAction: () => {
      assetViewerManager.isPlayingMotionPhoto = false;
    },
  };

  const Favorite: ActionItem = {
    title: $t('to_favorite'),
    icon: mdiHeartOutline,
    type: $t('assets'),
    $if: () => isOwner && !asset.isFavorite,
    onAction: () => handleFavorite(asset),
    shortcuts: [{ key: 'f' }],
  };

  const Unfavorite: ActionItem = {
    title: $t('unfavorite'),
    icon: mdiHeart,
    type: $t('assets'),
    $if: () => isOwner && asset.isFavorite,
    onAction: () => handleUnfavorite(asset),
    shortcuts: [{ key: 'f' }],
  };

  const Offline: ActionItem = {
    title: $t('asset_offline'),
    icon: mdiAlertOutline,
    type: $t('assets'),
    color: 'danger',
    $if: () => !!asset.isOffline,
    onAction: () => assetViewerManager.toggleDetailPanel(),
  };

  const Info: ActionItem = {
    title: $t('info'),
    icon: mdiInformationOutline,
    type: $t('assets'),
    $if: () => asset.hasMetadata,
    onAction: () => assetViewerManager.toggleDetailPanel(),
    shortcuts: [{ key: 'i' }],
  };

  return { Share, Download, SharedLinkDownload, Offline, Info, Favorite, Unfavorite, PlayMotionPhoto, StopMotionPhoto };
};

export const handleDownloadAsset = async (asset: AssetResponseDto) => {
  const $t = await getFormatter();

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

const handleFavorite = async (asset: AssetResponseDto) => {
  const $t = await getFormatter();

  try {
    const response = await updateAsset({ id: asset.id, updateAssetDto: { isFavorite: true } });
    toastManager.success($t('added_to_favorites'));
    eventManager.emit('AssetUpdate', response);
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: asset.isFavorite } }));
  }
};

const handleUnfavorite = async (asset: AssetResponseDto) => {
  const $t = await getFormatter();

  try {
    const response = await updateAsset({ id: asset.id, updateAssetDto: { isFavorite: false } });
    toastManager.success($t('removed_from_favorites'));
    eventManager.emit('AssetUpdate', response);
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: asset.isFavorite } }));
  }
};

export const handleReplaceAsset = async (oldAssetId: string) => {
  const [newAssetId] = await openFileUploadDialog({ multiple: false });
  await copyAsset({ assetCopyDto: { sourceId: oldAssetId, targetId: newAssetId } });
  await deleteAssets({ assetBulkDeleteDto: { ids: [oldAssetId], force: true } });

  eventManager.emit('AssetReplace', { oldAssetId, newAssetId });
};
