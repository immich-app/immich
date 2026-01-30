<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { handleRestoreUserAdmin } from '$lib/services/user-admin.service';
  import { type UserAdminResponseDto } from '@immich/sdk';
  import { ConfirmModal } from '@immich/ui';
  import { mdiDeleteRestore } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    user: UserAdminResponseDto;
    onClose: () => void;
  };

  let { user, onClose }: Props = $props();

  const handleClose = async (confirmed: boolean) => {
    if (!confirmed) {
      return;
    }

    const success = await handleRestoreUserAdmin(user);
    if (success) {
      onClose();
    }
  };
</script>

<ConfirmModal
  icon={mdiDeleteRestore}
  title={$t('restore_user')}
  confirmText={$t('restore')}
  confirmColor="primary"
  size="small"
  onClose={handleClose}
>
  {#snippet prompt()}
    <p>
      <FormatMessage key="admin.user_restore_description" values={{ user: user.name }}>
        {#snippet children({ message })}
          <b>{message}</b>
        {/snippet}
      </FormatMessage>
    </p>
  {/snippet}
</ConfirmModal>
