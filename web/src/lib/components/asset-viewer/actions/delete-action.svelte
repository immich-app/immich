<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import DeleteAssetDialog from '$lib/components/photos-page/delete-asset-dialog.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { AssetAction } from '$lib/constants';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { deleteAssets, type AssetResponseDto } from '@immich/sdk';
  import { mdiDeleteForeverOutline, mdiDeleteOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  export let asset: AssetResponseDto;
  export let onAction: OnAction;

  let showConfirmModal = false;

  const trashOrDelete = async (force = false) => {
    if (force || !$featureFlags.trash) {
      if ($showDeleteModal) {
        showConfirmModal = true;
        return;
      }
      await deleteAsset();
      return;
    }

    await trashAsset();
    return;
  };

  const trashAsset = async () => {
    try {
      await deleteAssets({ assetBulkDeleteDto: { ids: [asset.id] } });
      onAction({ type: AssetAction.TRASH, asset });

      notificationController.show({
        message: $t('moved_to_trash'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_trash_asset'));
    }
  };

  const deleteAsset = async () => {
    try {
      await deleteAssets({ assetBulkDeleteDto: { ids: [asset.id], force: true } });
      onAction({ type: AssetAction.DELETE, asset });

      notificationController.show({
        message: $t('permanently_deleted_asset'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_asset'));
    } finally {
      showConfirmModal = false;
    }
  };
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'Delete' }, onShortcut: () => trashOrDelete(asset.isTrashed) },
    { shortcut: { key: 'Delete', shift: true }, onShortcut: () => trashOrDelete(true) },
  ]}
/>

<CircleIconButton
  color="opaque"
  icon={asset.isTrashed ? mdiDeleteForeverOutline : mdiDeleteOutline}
  title={asset.isTrashed ? $t('permanently_delete') : $t('delete')}
  on:click={() => trashOrDelete(asset.isTrashed)}
/>

{#if showConfirmModal}
  <Portal target="body">
    <DeleteAssetDialog size={1} onCancel={() => (showConfirmModal = false)} onConfirm={deleteAsset} />
  </Portal>
{/if}
