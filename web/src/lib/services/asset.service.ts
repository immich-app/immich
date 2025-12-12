import { eventManager } from '$lib/managers/event-manager.svelte';
import { openFileUploadDialog } from '$lib/utils/file-uploader';
import { copyAsset, deleteAssets } from '@immich/sdk';

export const handleReplaceAsset = async (oldAssetId: string) => {
  const [newAssetId] = await openFileUploadDialog({ multiple: false });
  await copyAsset({ assetCopyDto: { sourceId: oldAssetId, targetId: newAssetId } });
  await deleteAssets({ assetBulkDeleteDto: { ids: [oldAssetId], force: true } });

  eventManager.emit('AssetReplace', { oldAssetId, newAssetId });
};
