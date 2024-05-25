import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { deleteAssets as deleteBulk, updateAssets, type AssetResponseDto } from '@immich/sdk';
import { handleError } from './handle-error';

export type OnDelete = (assetIds: string[]) => void;
export type OnRestore = (ids: string[]) => void;
export type OnArchive = (ids: string[], isArchived: boolean) => void;
export type OnFavorite = (assets: AssetResponseDto[], isFavorite: boolean) => void;
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

export const favoriteAssets = async (isFavorite: boolean, onAssetFavorite: OnFavorite, assets: AssetResponseDto[]) => {
  try {
    const ids = assets.map((asset) => asset.id);
    await updateAssets({ assetBulkUpdateDto: { ids, isFavorite } });

    onAssetFavorite(assets, isFavorite);

    notificationController.show({
      message: isFavorite ? `Added ${ids.length} to favorites` : `Removed ${ids.length} from favorites`,
      type: NotificationType.Info,
    });
  } catch (error) {
    handleError(error, `Unable to ${isFavorite ? 'add to' : 'remove from'} favorites`);
  }
};

export const archiveAssets = async (isArchived: boolean, onAssetArchive: OnArchive, ids: string[]) => {
  try {
    await updateAssets({ assetBulkUpdateDto: { ids, isArchived } });

    onAssetArchive(ids, isArchived);

    notificationController.show({
      message: `${isArchived ? 'Archived' : 'Unarchived'} ${ids.length}`,
      type: NotificationType.Info,
    });
  } catch (error) {
    handleError(error, `Unable to ${isArchived ? 'archive' : 'unarchive'}`);
  }
};
