import { eventManager } from '$lib/managers/event-manager.svelte';
import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
import { user as authUser } from '$lib/stores/user.store';
import { openFileUploadDialog } from '$lib/utils/file-uploader';
import { AssetVisibility, copyAsset, deleteAssets, type AssetResponseDto } from '@immich/sdk';
import { modalManager, type ActionItem } from '@immich/ui';
import { mdiShareVariantOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { get } from 'svelte/store';

export const getAssetActions = ($t: MessageFormatter, asset: AssetResponseDto) => {
  const Share: ActionItem = {
    title: $t('share'),
    icon: mdiShareVariantOutline,
    $if: () => !!(get(authUser) && !asset.isTrashed && asset.visibility !== AssetVisibility.Locked),
    onAction: () => modalManager.show(SharedLinkCreateModal, { assetIds: [asset.id] }),
  };

  return { Share };
};

export const handleReplaceAsset = async (oldAssetId: string) => {
  const [newAssetId] = await openFileUploadDialog({ multiple: false });
  await copyAsset({ assetCopyDto: { sourceId: oldAssetId, targetId: newAssetId } });
  await deleteAssets({ assetBulkDeleteDto: { ids: [oldAssetId], force: true } });

  eventManager.emit('AssetReplace', { oldAssetId, newAssetId });
};
