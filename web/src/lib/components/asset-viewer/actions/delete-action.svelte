<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import DeleteAssetDialog from '$lib/components/photos-page/delete-asset-dialog.svelte';
  import { AssetAction } from '$lib/constants';
  import Portal from '$lib/elements/Portal.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { deleteAssets as deleteAssetsUtil, type OnUndoDelete } from '$lib/utils/actions';
  import { handleError } from '$lib/utils/handle-error';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { deleteAssets, type AssetResponseDto } from '@immich/sdk';
  import { IconButton, toastManager } from '@immich/ui';
  import { mdiDeleteForeverOutline, mdiDeleteOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction, PreAction } from './action';

  interface Props {
    asset: AssetResponseDto;
    onAction: OnAction;
    preAction: PreAction;
    onUndoDelete?: OnUndoDelete;
  }

  let { asset, onAction, preAction, onUndoDelete = undefined }: Props = $props();

  let showConfirmModal = $state(false);

  const trashOrDelete = async (force = false) => {
    if (force || !featureFlagsManager.value.trash) {
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
    const timelineAsset = toTimelineAsset(asset);
    preAction({ type: AssetAction.TRASH, asset: timelineAsset });
    await deleteAssetsUtil(
      false,
      () => onAction({ type: AssetAction.TRASH, asset: timelineAsset }),
      [timelineAsset],
      onUndoDelete,
    );
  };

  const deleteAsset = async () => {
    try {
      preAction({ type: AssetAction.DELETE, asset: toTimelineAsset(asset) });
      await deleteAssets({ assetBulkDeleteDto: { ids: [asset.id], force: true } });
      onAction({ type: AssetAction.DELETE, asset: toTimelineAsset(asset) });
      toastManager.success($t('permanently_deleted_asset'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_asset'));
    } finally {
      showConfirmModal = false;
    }
  };
</script>

<svelte:document
  use:shortcuts={[
    { shortcut: { key: 'Delete' }, onShortcut: () => trashOrDelete(asset.isTrashed) },
    { shortcut: { key: 'Delete', shift: true }, onShortcut: () => trashOrDelete(true) },
  ]}
/>

<IconButton
  color="secondary"
  shape="round"
  variant="ghost"
  icon={asset.isTrashed ? mdiDeleteForeverOutline : mdiDeleteOutline}
  aria-label={asset.isTrashed ? $t('permanently_delete') : $t('delete')}
  onclick={() => trashOrDelete(asset.isTrashed)}
/>

{#if showConfirmModal}
  <Portal target="body">
    <DeleteAssetDialog size={1} onCancel={() => (showConfirmModal = false)} onConfirm={deleteAsset} />
  </Portal>
{/if}
