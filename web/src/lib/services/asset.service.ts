import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
import { user as authUser } from '$lib/stores/user.store';
import { openFileUploadDialog } from '$lib/utils/file-uploader';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { AssetVisibility, copyAsset, deleteAssets, updateAsset, type AssetResponseDto } from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import {
  mdiAlertOutline,
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
  const currentAuthUser = get(authUser);
  const isOwner = !!(currentAuthUser && currentAuthUser.id === asset.ownerId);

  const Share: ActionItem = {
    title: $t('share'),
    icon: mdiShareVariantOutline,
    type: $t('assets'),
    $if: () => !!(get(authUser) && !asset.isTrashed && asset.visibility !== AssetVisibility.Locked),
    onAction: () => modalManager.show(SharedLinkCreateModal, { assetIds: [asset.id] }),
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

  return { Share, Offline, Info, Favorite, Unfavorite, PlayMotionPhoto, StopMotionPhoto };
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
