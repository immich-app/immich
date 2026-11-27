import { TimelineManager } from '#lib/managers/timeline-manager/timeline-manager.svelte.ts';
import type { TimelineAsset } from '#lib/managers/timeline-manager/types.ts';
import { deleteAssetsMutation } from '#lib/queries/asset.query.ts';
import { executeMutation } from '#lib/queries/client.ts';
import { restoreAssetsMutation } from '#lib/queries/trash.query.ts';
import { AssetVisibility, type StackResponseDto } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

export type OnDelete = (assetIds: string[]) => void;
export type OnUndoDelete = (assets: TimelineAsset[]) => void;
export type OnRestore = (ids: string[]) => void;
export type OnLink = (assets: { still: TimelineAsset; motion: TimelineAsset }) => void;
export type OnUnlink = (assets: { still: TimelineAsset; motion: TimelineAsset }) => void;
export type OnArchive = (ids: string[], visibility: AssetVisibility) => void;
export type OnFavorite = (ids: string[], favorite: boolean) => void;
export type OnSetVisibility = (ids: string[]) => void;

type UndoableDelete = {
  assets: TimelineAsset[];
  onUndoDelete: OnUndoDelete;
  state: 'trashed' | 'restoring' | 'restored';
};

// Trash operations that Ctrl+Z can still undo, the most recent last. The user layout empties it
// whenever the page changes: each callback belongs to the page that deleted the assets, and from
// another page the assets may already have been restored or purged.
let undoableDeletes: UndoableDelete[] = [];

export const deleteAssets = async (
  force: boolean,
  onAssetDelete: OnDelete,
  assets: TimelineAsset[],
  onUndoDelete: OnUndoDelete | undefined = undefined,
) => {
  const $t = get(t);
  const ids = assets.map((a) => a.id);
  await executeMutation(deleteAssetsMutation, [{ assetBulkDeleteDto: { ids, force } }], {
    onSuccess: () => {
      onAssetDelete(ids);

      const undoable: UndoableDelete | undefined =
        onUndoDelete && !force ? { assets, onUndoDelete, state: 'trashed' } : undefined;
      if (undoable) {
        undoableDeletes.push(undoable);
      }

      toastManager.primary(
        {
          description: force
            ? $t('assets_permanently_deleted_count', { values: { count: ids.length } })
            : $t('assets_trashed_count', { values: { count: ids.length } }),
          button: undoable ? { label: $t('undo'), color: 'secondary', onclick: () => undoDelete(undoable) } : undefined,
        },
        { timeout: 5000 },
      );
    },
  });
};

/** Forgets every delete that Ctrl+Z could still undo. */
export const forgetUndoableDeletes = () => {
  undoableDeletes = [];
};

/** Restores the assets trashed by the most recent delete not undone yet; resolves whether it succeeded. */
export const undoLastDelete = async () => {
  const undoable = undoableDeletes.findLast(({ state }) => state === 'trashed');
  if (!undoable) {
    return false;
  }
  return undoDelete(undoable);
};

// A failed restore leaves the delete undoable, so Ctrl+Z or the toast button can try it again.
const undoDelete = async (undoable: UndoableDelete) => {
  if (undoable.state !== 'trashed') {
    return false;
  }
  undoable.state = 'restoring';
  const restored = await undoDeleteAssets(undoable.onUndoDelete, undoable.assets);
  undoable.state = restored ? 'restored' : 'trashed';
  if (restored) {
    undoableDeletes = undoableDeletes.filter((other) => other !== undoable);
  }
  return restored;
};

// executeMutation swallows a failed mutation, which the mutation cache already reports, so onSuccess tells them apart.
const undoDeleteAssets = async (onUndoDelete: OnUndoDelete, assets: TimelineAsset[]) => {
  let restored = false;
  await executeMutation(restoreAssetsMutation, [{ bulkIdsDto: { ids: assets.map((a) => a.id) } }], {
    onSuccess: () => {
      restored = true;
      onUndoDelete(assets);
    },
  });
  return restored;
};

/**
Update the asset stack state in the asset store based on the provided stack response.
This function updates the stack information so that the icon is shown for the primary asset
and removes the non-primary assets from the timeline.
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
