import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
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

/**
 * Update the asset stack state in the asset store based on the provided stack response.
 * This function updates the stack information so that the icon is shown for the primary asset
 * and removes any assets from the timeline that are marked for deletion.
 *
 * @param {TimelineManager} timelineManager - The timeline manager to update.
 * @param {StackResponse} stackResponse - The stack response containing the stack and assets to delete.
 */
export function updateStackedAssetInTimeline(timelineManager: TimelineManager, { stack, toDeleteIds }: StackResponse) {
  if (stack != undefined) {
    timelineManager.updateAssetOperation([stack.primaryAssetId], (asset) => {
      asset.stack = {
        id: stack.id,
        primaryAssetId: stack.primaryAssetId,
        assetCount: stack.assets.length,
      };
      return { remove: false };
    });

    timelineManager.removeAssets(toDeleteIds);
  }
}

/**
 * Update the timeline manager to reflect the unstacked state of assets.
 * This function updates the stack property of each asset to undefined, effectively unstacking them.
 * It also adds the unstacked assets back to the timeline manager.
 *
 * @param timelineManager - The timeline manager to update.
 * @param assets - The array of asset response DTOs to update in the timeline manager.
 */
export function updateUnstackedAssetInTimeline(timelineManager: TimelineManager, assets: TimelineAsset[]) {
  timelineManager.updateAssetOperation(
    assets.map((asset) => asset.id),
    (asset) => {
      asset.stack = null;
      return { remove: false };
    },
  );

  timelineManager.addAssets(assets);
}
