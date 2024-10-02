import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { deleteAssets as deleteBulk, type AssetResponseDto } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import { handleError } from './handle-error';

export type OnDelete = (assetIds: string[]) => void;
export type OnRestore = (ids: string[]) => void;
export type OnLink = (assets: { still: AssetResponseDto; motion: AssetResponseDto }) => void;
export type OnUnlink = (assets: { still: AssetResponseDto; motion: AssetResponseDto }) => void;
export type OnArchive = (ids: string[], isArchived: boolean) => void;
export type OnFavorite = (ids: string[], favorite: boolean) => void;
export type OnStack = (ids: string[]) => void;
export type OnUnstack = (assets: AssetResponseDto[]) => void;

export const deleteAssets = async (force: boolean, onAssetDelete: OnDelete, ids: string[]) => {
  const $t = get(t);
  try {
    await deleteBulk({ assetBulkDeleteDto: { ids, force } });
    onAssetDelete(ids);

    notificationController.show({
      message: force
        ? $t('assets_permanently_deleted_count', { values: { count: ids.length } })
        : $t('assets_trashed_count', { values: { count: ids.length } }),
      type: NotificationType.Info,
    });
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_assets'));
  }
};
