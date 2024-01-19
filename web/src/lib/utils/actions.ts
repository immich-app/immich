import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { api, AssetResponseDto } from '@api';
import { handleError } from './handle-error';
import { isSelectAllCancelled, type AssetStore, BucketPosition } from '$lib/stores/assets.store';
import { get } from 'svelte/store';
import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';

export type OnDelete = (assetId: string) => void;
export type OnRestore = (ids: string[]) => void;
export type OnArchive = (ids: string[], isArchived: boolean) => void;
export type OnFavorite = (ids: string[], favorite: boolean) => void;
export type OnStack = (ids: string[]) => void;

export const deleteAssets = async (force: boolean, onAssetDelete: OnDelete, ids: string[]): Promise<boolean> => {
  try {
    await api.assetApi.deleteAssets({ assetBulkDeleteDto: { ids, force } });
    for (const id of ids) {
      onAssetDelete(id);
    }

    notificationController.show({
      message: `${force ? 'Permanently deleted' : 'Trashed'} ${ids.length} assets`,
      type: NotificationType.Info,
    });
    return true;
  } catch (e) {
    handleError(e, 'Error deleting assets');
  }
  return false;
};

export const favoriteAssets = async (
  isFavorite: boolean,
  onFavorite: OnFavorite | undefined,
  assets: AssetResponseDto[],
): Promise<boolean> => {
  try {
    const ids = assets.map(({ id }) => id);

    if (ids.length > 0) {
      await api.assetApi.updateAssets({ assetBulkUpdateDto: { ids, isFavorite } });
    }

    for (const asset of assets) {
      asset.isFavorite = isFavorite;
    }

    onFavorite?.(ids, isFavorite);

    notificationController.show({
      message: isFavorite ? `Added ${ids.length} to favorites` : `Removed ${ids.length} from favorites`,
      type: NotificationType.Info,
    });

    return true;
  } catch (error) {
    handleError(error, `Unable to ${isFavorite ? 'add to' : 'remove from'} favorites`);
  }
  return false;
};

export const archiveAssets = async (
  isArchived: boolean,
  onArchive: OnArchive | undefined,
  assets: AssetResponseDto[],
) => {
  try {
    const ids = assets.map(({ id }) => id);

    if (ids.length > 0) {
      await api.assetApi.updateAssets({ assetBulkUpdateDto: { ids, isArchived } });
    }

    for (const asset of assets) {
      asset.isArchived = isArchived;
    }

    onArchive?.(ids, isArchived);

    notificationController.show({
      message: `${isArchived ? 'Archived' : 'Unarchived'} ${ids.length}`,
      type: NotificationType.Info,
    });

    return true;
  } catch (error) {
    handleError(error, `Unable to ${isArchived ? 'archive' : 'unarchive'}`);
  }
  return false;
};

export const selectAll = async (
  assetGridState: AssetStore,
  assetStore: AssetStore,
  assetInteractionStore: AssetInteractionStore,
): Promise<boolean> => {
  isSelectAllCancelled.set(false);
  try {
    for (const bucket of assetGridState.buckets) {
      if (get(isSelectAllCancelled)) {
        break;
      }
      await assetStore.loadBucket(bucket.bucketDate, BucketPosition.Unknown);
      for (const asset of bucket.assets) {
        assetInteractionStore.selectAsset(asset);
      }
    }
    return true;
  } catch (e) {
    handleError(e, 'Error selecting all assets');
  }
  return false;
};
