import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { api } from '@api';
import { handleError } from './handle-error';
import type { OnAssetDelete } from '$lib/components/photos-page/asset-select-control-bar.svelte';

export const deleteAssets = async (force: boolean, onAssetDelete: OnAssetDelete, ids: string[]) => {
  try {
    await api.assetApi.deleteAssets({ assetBulkDeleteDto: { ids, force } });
    for (const id of ids) {
      onAssetDelete(id);
    }

    notificationController.show({
      message: `${force ? 'Permanently deleted' : 'Trashed'} ${ids.length} assets`,
      type: NotificationType.Info,
    });
  } catch (e) {
    handleError(e, 'Error deleting assets');
  }
};
