import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { api } from '@api';
import { handleError } from './handle-error';

export type OnDelete = (assetId: string) => void;
export type OnRestore = (ids: string[]) => void;
export type OnArchive = (ids: string[], isArchived: boolean) => void;
export type OnFavorite = (ids: string[], favorite: boolean) => void;
export type OnStack = (ids: string[]) => void;

export const deleteAssets = async (force: boolean, onAssetDelete: OnDelete, ids: string[]) => {
  try {
    await api.assetApi.deleteAssets({ assetBulkDeleteDto: { ids, force } });
    for (const id of ids) {
      onAssetDelete(id);
    }

    notificationController.show({
      message: `${force ? 'Permanently deleted' : 'Trashed'} ${ids.length} assets`,
      type: NotificationType.Info,
    });
  } catch (error) {
    handleError(error, 'Error deleting assets');
  }
};
