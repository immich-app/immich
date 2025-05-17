import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import type { AssetStore } from '$lib/stores/assets-store.svelte';
import type { StackResponse } from '$lib/utils/asset-utils';
import { deleteAssets as deleteBulk, type AssetResponseDto } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import { handleError } from './handle-error';

export type OnDelete = (assetIds: string[]) => void;
export type OnRestore = (ids: string[]) => void;
export type OnLink = (assets: { still: AssetResponseDto; motion: AssetResponseDto }) => void;
export type OnUnlink = (assets: { still: AssetResponseDto; motion: AssetResponseDto }) => void;
export type OnAddToAlbum = (ids: string[], albumId: string) => void;
export type OnArchive = (ids: string[], isArchived: boolean) => void;
export type OnFavorite = (ids: string[], favorite: boolean) => void;
export type OnStack = (result: StackResponse) => void;
export type OnUnstack = (assets: AssetResponseDto[]) => void;
export type OnSetVisibility = (ids: string[]) => void;

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

/**
 * Update the asset stack state in the asset store based on the provided stack response.
 * This function updates the stack information so that the icon is shown for the primary asset
 * and removes any assets from the timeline that are marked for deletion.
 *
 * @param {AssetStore} assetStore - The asset store to update.
 * @param {StackResponse} stackResponse - The stack response containing the stack and assets to delete.
 */
export function updateStackedAssetInTimeline(assetStore: AssetStore, { stack, toDeleteIds }: StackResponse) {
  if (stack != undefined) {
    assetStore.updateAssetOperation([stack.primaryAssetId], (asset) => {
      asset.stack = {
        id: stack.id,
        primaryAssetId: stack.primaryAssetId,
        assetCount: stack.assets.length,
      };
      return { remove: false };
    });

    assetStore.removeAssets(toDeleteIds);
  }
}

/**
 * Update the asset store to reflect the unstacked state of assets.
 * This function updates the stack property of each asset to undefined, effectively unstacking them.
 * It also adds the unstacked assets back to the asset store.
 *
 * @param assetStore - The asset store to update.
 * @param assets - The array of asset response DTOs to update in the asset store.
 */
export function updateUnstackedAssetInTimeline(assetStore: AssetStore, assets: AssetResponseDto[]) {
  assetStore.updateAssetOperation(
    assets.map((asset) => asset.id),
    (asset) => {
      asset.stack = undefined;
      return { remove: false };
    },
  );

  assetStore.addAssets(assets);
}
