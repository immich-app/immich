import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import type { StackResponse } from '$lib/utils/asset-utils';
import { AssetVisibility, deleteAssets as deleteBulk, restoreAssets } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import { handleError } from './handle-error';

export type OnDelete = (assetIds: string[]) => void;
export type OnUndoDelete = (assets: TimelineAsset[]) => void;
export type OnRestore = (ids: string[]) => void;
export type OnLink = (assets: { still: TimelineAsset; motion: TimelineAsset }) => void;
export type OnUnlink = (assets: { still: TimelineAsset; motion: TimelineAsset }) => void;
export type OnAddToAlbum = (ids: string[], albumId: string) => void;
export type OnArchive = (ids: string[], visibility: AssetVisibility) => void;
export type OnFavorite = (ids: string[], favorite: boolean) => void;
export type OnStack = (result: StackResponse) => void;
export type OnUnstack = (assets: TimelineAsset[]) => void;
export type OnSetVisibility = (ids: string[]) => void;

export const deleteAssets = async (
  force: boolean,
  onAssetDelete: OnDelete,
  assets: TimelineAsset[],
  onUndoDelete: OnUndoDelete | undefined = undefined,
) => {
  const $t = get(t);
  try {
    const ids = assets.map((a) => a.id);
    await deleteBulk({ assetBulkDeleteDto: { ids, force } });
    onAssetDelete(ids);

    notificationController.show({
      message: force
        ? $t('assets_permanently_deleted_count', { values: { count: ids.length } })
        : $t('assets_trashed_count', { values: { count: ids.length } }),
      type: NotificationType.Info,
      ...(onUndoDelete &&
        !force && {
          button: { text: $t('undo'), onClick: () => undoDeleteAssets(onUndoDelete, assets) },
          timeout: 5000,
        }),
    });
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_assets'));
  }
};

const undoDeleteAssets = async (onUndoDelete: OnUndoDelete, assets: TimelineAsset[]) => {
  const $t = get(t);
  try {
    const ids = assets.map((a) => a.id);
    await restoreAssets({ bulkIdsDto: { ids } });
    onUndoDelete?.(assets);
  } catch (error) {
    handleError(error, $t('errors.unable_to_restore_assets'));
  }
};
