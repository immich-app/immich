import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { deleteAssets as deleteBulk, type AssetResponseDto } from '@immich/sdk';
import { handleError } from './handle-error';

export type OnDelete = (assetIds: string[]) => void;
export type OnRestore = (ids: string[]) => void;
export type OnArchive = (ids: string[], isArchived: boolean) => void;
export type OnFavorite = (ids: string[], favorite: boolean) => void;
export type OnStack = (ids: string[]) => void;
export type OnUnstack = (assets: AssetResponseDto[]) => void;

export const deleteAssets = async (force: boolean, onAssetDelete: OnDelete, ids: string[]) => {
  try {
    await deleteBulk({ assetBulkDeleteDto: { ids, force } });
    onAssetDelete(ids);

    notificationController.show({
      message: `${force ? 'Permanently deleted' : 'Trashed'} ${ids.length} assets`,
      type: NotificationType.Info,
    });
  } catch (error) {
    handleError(error, 'Error deleting assets');
  }
};
