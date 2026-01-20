<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { deleteVault } from '@immich/sdk';
  import { Alert, ConfirmModal, Text, toastManager } from '@immich/ui';
  import { mdiTrashCanOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (success?: true) => void;
  };

  let { onClose }: Props = $props();

  const handleClose = async (confirmed?: boolean) => {
    if (!confirmed) {
      onClose();
      return;
    }

    try {
      await deleteVault();
      toastManager.success($t('vault_deleted'));
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_vault'));
    }
  };
</script>

<ConfirmModal
  icon={mdiTrashCanOutline}
  title={$t('vault_delete')}
  confirmText={$t('delete')}
  confirmColor="danger"
  onClose={handleClose}
>
  {#snippet promptSnippet()}
    <div class="flex flex-col gap-4">
      <Alert color="danger" icon={false}>
        <Text>{$t('vault_delete_warning')}</Text>
      </Alert>
    </div>
  {/snippet}
</ConfirmModal>
