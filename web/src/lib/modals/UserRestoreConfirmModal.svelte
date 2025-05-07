<script lang="ts">
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { restoreUserAdmin, type UserResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    user: UserResponseDto;
    onClose: (confirmed?: true) => void;
  }

  let { user, onClose }: Props = $props();

  const handleRestoreUser = async () => {
    try {
      const { deletedAt } = await restoreUserAdmin({ id: user.id });

      if (deletedAt === undefined) {
        onClose(true);
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_restore_user'));
    }
  };
</script>

<ConfirmDialog
  title={$t('restore_user')}
  confirmText={$t('continue')}
  confirmColor="success"
  onClose={(confirmed) => (confirmed ? handleRestoreUser() : onClose())}
>
  {#snippet promptSnippet()}
    <p>
      <FormatMessage key="admin.user_restore_description" values={{ user: user.name }}>
        {#snippet children({ message })}
          <b>{message}</b>
        {/snippet}
      </FormatMessage>
    </p>
  {/snippet}
</ConfirmDialog>
