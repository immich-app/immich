<script lang="ts">
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { restoreUserAdmin, type UserResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  export let user: UserResponseDto;
  export let onSuccess: () => void;
  export let onFail: () => void;
  export let onCancel: () => void;

  const handleRestoreUser = async () => {
    try {
      const { deletedAt } = await restoreUserAdmin({ id: user.id });
      if (deletedAt == undefined) {
        onSuccess();
      } else {
        onFail();
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_restore_user'));
      onFail();
    }
  };
</script>

<ConfirmDialog
  title={$t('restore_user')}
  confirmText={$t('continue')}
  confirmColor="green"
  onConfirm={handleRestoreUser}
  {onCancel}
>
  <svelte:fragment slot="prompt">
    <p>
      <FormatMessage key="admin.user_restore_description" values={{ user: user.name }} let:message>
        <b>{message}</b>
      </FormatMessage>
    </p>
  </svelte:fragment>
</ConfirmDialog>
