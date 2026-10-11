<script lang="ts">
  import { handleResetPasswordUserAdmin } from '$lib/services/user-admin.service';
  import { type UserAdminResponseDto } from '@immich/sdk';
  import { Checkbox, ConfirmModal, Label, Text } from '@immich/ui';
  import { mdiLockReset } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    user: UserAdminResponseDto;
    onClose: () => void;
  };

  let { user, onClose }: Props = $props();

  let notify = $state(false);

  const handleClose = async (confirmed?: boolean) => {
    if (!confirmed) {
      onClose();
      return;
    }

    await handleResetPasswordUserAdmin(user, notify);
    onClose();
  };
</script>

<ConfirmModal icon={mdiLockReset} title={$t('reset_password')} confirmText={$t('reset_password')} onClose={handleClose}>
  {#snippet prompt()}
    <div class="flex flex-col gap-4">
      <Text>{$t('admin.confirm_user_password_reset', { values: { user: user.name } })}</Text>

      <div class="flex items-center gap-2">
        <Checkbox id="notify-user-password-reset-checkbox" color="secondary" bind:checked={notify} />
        <Label label={$t('admin.user_password_reset_notify_checkbox')} for="notify-user-password-reset-checkbox" />
      </div>
    </div>
  {/snippet}
</ConfirmModal>
