import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
import { user as authUser } from '$lib/stores/user.store';
import { openFileUploadDialog } from '$lib/utils/file-uploader';
import { AssetVisibility, copyAsset, deleteAssets, type AssetResponseDto } from '@immich/sdk';
import { modalManager, type ActionItem } from '@immich/ui';
import {
  mdiAlertOutline,
  mdiInformationOutline,
  mdiMotionPauseOutline,
  mdiMotionPlayOutline,
  mdiShareVariantOutline,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { get } from 'svelte/store';

export const getAssetActions = ($t: MessageFormatter, asset: AssetResponseDto) => {
  const Share: ActionItem = {
    title: $t('share'),
    icon: mdiShareVariantOutline,
    $if: () => !!(get(authUser) && !asset.isTrashed && asset.visibility !== AssetVisibility.Locked),
    onAction: () => modalManager.show(SharedLinkCreateModal, { assetIds: [asset.id] }),
  };

  const PlayMotionPhoto: ActionItem = {
    title: $t('play_motion_photo'),
    icon: mdiMotionPlayOutline,
    $if: () => !!asset.livePhotoVideoId && !assetViewerManager.isPlayingMotionPhoto,
    onAction: () => {
      assetViewerManager.isPlayingMotionPhoto = true;
    },
  };

  const StopMotionPhoto: ActionItem = {
    title: $t('stop_motion_photo'),
    icon: mdiMotionPauseOutline,
    $if: () => !!asset.livePhotoVideoId && assetViewerManager.isPlayingMotionPhoto,
    onAction: () => {
      assetViewerManager.isPlayingMotionPhoto = false;
    },
  };

  const Offline: ActionItem = {
    title: $t('asset_offline'),
    icon: mdiAlertOutline,
    color: 'danger',
    $if: () => !!asset.isOffline,
    onAction: () => assetViewerManager.toggleDetailPanel(),
  };

  const Info: ActionItem = {
    title: $t('info'),
    icon: mdiInformationOutline,
    $if: () => asset.hasMetadata,
    onAction: () => assetViewerManager.toggleDetailPanel(),
    shortcuts: [{ key: 'i' }],
  };

  return { Share, PlayMotionPhoto, StopMotionPhoto, Offline, Info };
};

export const handleReplaceAsset = async (oldAssetId: string) => {
  const [newAssetId] = await openFileUploadDialog({ multiple: false });
  await copyAsset({ assetCopyDto: { sourceId: oldAssetId, targetId: newAssetId } });
  await deleteAssets({ assetBulkDeleteDto: { ids: [oldAssetId], force: true } });

  eventManager.emit('AssetReplace', { oldAssetId, newAssetId });
};
