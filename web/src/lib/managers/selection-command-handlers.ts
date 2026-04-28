import { MAX_SPACE_ASSETS_PER_REQUEST } from '$lib/constants';
import type { CommandContext, SelectionCommandContext } from '$lib/managers/command-context-manager.svelte';
import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import AssetAddToAlbumModal from '$lib/modals/AssetAddToAlbumModal.svelte';
import AssetAddToSpaceModal from '$lib/modals/AssetAddToSpaceModal.svelte';
import AssetDeleteConfirmModal from '$lib/modals/AssetDeleteConfirmModal.svelte';
import { showDeleteModal } from '$lib/stores/preferences.store';
import type { OnUndoDelete } from '$lib/utils/actions';
import { handleError } from '$lib/utils/handle-error';
import { AssetVisibility, deleteAssets as deleteBulk, restoreAssets, updateAssets } from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

const getSelection = (ctx?: CommandContext): SelectionCommandContext | null => ctx?.selection ?? null;

export const canAddSelectedToAlbum = (ctx: CommandContext) => {
  const selection = getSelection(ctx);
  return selection !== null && selection.canAddToAlbum;
};

export const canAddSelectedToCurrentSpace = (ctx: CommandContext) => {
  const selection = getSelection(ctx);
  const selectedCount = selection?.selectedAssetIds.length ?? 0;
  return (
    ctx.space?.canWrite === true &&
    selection?.addSelectedToCurrentSpace !== undefined &&
    selectedCount > 0 &&
    selectedCount <= MAX_SPACE_ASSETS_PER_REQUEST
  );
};

export const canAddSelectedToSpace = (ctx: CommandContext) => {
  const selection = getSelection(ctx);
  return selection !== null && selection.canAddToSpace;
};

export const canFavoriteSelected = (ctx: CommandContext) => {
  const selection = getSelection(ctx);
  return (
    selection !== null && selection.isAllUserOwned && selection.onFavorite !== undefined && !selection.isAllFavorite
  );
};

export const canArchiveSelected = (ctx: CommandContext) => {
  const selection = getSelection(ctx);
  return (
    selection !== null && selection.isAllUserOwned && selection.onArchive !== undefined && !selection.isAllArchived
  );
};

export const canDeleteSelected = (ctx: CommandContext) => {
  const selection = getSelection(ctx);
  return selection !== null && selection.isAllUserOwned && selection.onDelete !== undefined;
};

export function handleAddSelectedToAlbum(ctx?: CommandContext) {
  const selection = getSelection(ctx);
  if (!selection?.canAddToAlbum) {
    return;
  }
  return modalManager.show(AssetAddToAlbumModal, { assetIds: selection.selectedAssetIds });
}

export function handleAddSelectedToSpace(ctx?: CommandContext) {
  const selection = getSelection(ctx);
  if (!selection?.canAddToSpace) {
    return;
  }
  return modalManager.show(AssetAddToSpaceModal, { assetIds: selection.selectedAssetIds });
}

export async function handleAddSelectedToCurrentSpace(ctx?: CommandContext) {
  if (!ctx || !canAddSelectedToCurrentSpace(ctx)) {
    return false;
  }
  return getSelection(ctx)?.addSelectedToCurrentSpace?.() ?? false;
}

export async function handleFavoriteSelected(ctx?: CommandContext) {
  const selection = getSelection(ctx);
  if (!selection || !selection.isAllUserOwned || !selection.onFavorite) {
    return;
  }

  const assets = selection.ownedAssets.filter((asset) => !asset.isFavorite);
  const ids = assets.map((asset) => asset.id);
  if (ids.length === 0) {
    return;
  }

  const $t = get(t);
  try {
    await updateAssets({ assetBulkUpdateDto: { ids, isFavorite: true } });
    for (const asset of assets) {
      asset.isFavorite = true;
    }
    selection.onFavorite(ids, true);
    toastManager.primary($t('added_to_favorites_count', { values: { count: ids.length } }));
    selection.clearSelection();
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: true } }));
  }
}

export async function handleArchiveSelected(ctx?: CommandContext) {
  const selection = getSelection(ctx);
  if (!selection || !selection.isAllUserOwned || !selection.onArchive) {
    return;
  }

  const visibility = AssetVisibility.Archive;
  const assets = selection.ownedAssets.filter((asset) => asset.visibility !== visibility);
  const ids = assets.map((asset) => asset.id);
  if (ids.length === 0) {
    return;
  }

  const $t = get(t);
  try {
    await updateAssets({ assetBulkUpdateDto: { ids, visibility } });
    selection.onArchive(ids, visibility);
    toastManager.primary($t('archived_count', { values: { count: ids.length } }));
    selection.clearSelection();
  } catch (error) {
    handleError(error, $t('errors.unable_to_archive_unarchive', { values: { archived: true } }));
  }
}

export async function handleDeleteSelected(ctx?: CommandContext) {
  const selection = getSelection(ctx);
  if (!selection || !selection.isAllUserOwned || !selection.onDelete) {
    return false;
  }

  const assets = selection.ownedAssets;
  const ids = assets.map((asset) => asset.id);
  if (ids.length === 0) {
    return false;
  }

  const force = !featureFlagsManager.value.trash || assets.some((asset) => asset.isTrashed);
  if (force && get(showDeleteModal)) {
    const confirmed = await modalManager.show(AssetDeleteConfirmModal, { size: ids.length });
    if (!confirmed) {
      return false;
    }
  }

  const onUndoDelete = force ? undefined : selection.onUndoDelete;
  const $t = get(t);
  try {
    await deleteBulk({ assetBulkDeleteDto: { ids, force } });
    selection.onDelete(ids);
    toastManager.primary(
      {
        description: force
          ? $t('assets_permanently_deleted_count', { values: { count: ids.length } })
          : $t('assets_trashed_count', { values: { count: ids.length } }),
        button: onUndoDelete
          ? {
              label: $t('undo'),
              color: 'secondary' as const,
              onclick: () => void undoDeleteAssets(onUndoDelete, assets),
            }
          : undefined,
      },
      { timeout: 5000 },
    );
    selection.clearSelection();
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_assets'));
    return false;
  }
}

async function undoDeleteAssets(onUndoDelete: OnUndoDelete, assets: TimelineAsset[]) {
  const ids = assets.map((asset) => asset.id);
  const $t = get(t);
  try {
    await restoreAssets({ bulkIdsDto: { ids } });
    onUndoDelete(assets);
  } catch (error) {
    handleError(error, $t('errors.unable_to_restore_assets'));
  }
}
