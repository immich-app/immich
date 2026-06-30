import { AssetVisibility, deleteAssets as deleteBulk, restoreAssets, type StackResponseDto } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { handleError } from './handle-error';

export type OnDelete = (assetIds: string[]) => void;
export type OnUndoDelete = (assets: TimelineAsset[]) => void;
export type OnRestore = (ids: string[]) => void;
export type OnLink = (assets: { still: TimelineAsset; motion: TimelineAsset }) => void;
export type OnUnlink = (assets: { still: TimelineAsset; motion: TimelineAsset }) => void;
export type OnAddToAlbum = (ids: string[], albumId: string) => void;
export type OnArchive = (ids: string[], visibility: AssetVisibility) => void;
export type OnFavorite = (ids: string[], favorite: boolean) => void;
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

    toastManager.primary(
      {
        description: force
          ? $t('assets_permanently_deleted_count', { values: { count: ids.length } })
          : $t('assets_trashed_count', { values: { count: ids.length } }),
        button:
          onUndoDelete && !force
            ? { label: $t('undo'), color: 'secondary', onclick: () => undoDeleteAssets(onUndoDelete, assets) }
            : undefined,
      },
      { timeout: 5000 },
    );
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
 * and removes the non-primary assets from the timeline.
 */
export function updateStackedAssetInTimeline(timelineManager: TimelineManager, stack: StackResponseDto) {
  timelineManager.update([stack.primaryAssetId], (asset) => {
    asset.stack = {
      id: stack.id,
      primaryAssetId: stack.primaryAssetId,
      assetCount: stack.assets.length,
    };
  });

  timelineManager.removeAssets(
    stack.assets.filter((asset) => asset.id !== stack.primaryAssetId).map((asset) => asset.id),
  );
}
