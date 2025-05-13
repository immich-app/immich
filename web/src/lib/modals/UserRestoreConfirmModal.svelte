<script lang="ts">
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import ConfirmModal from '$lib/modals/ConfirmModal.svelte';
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
      await restoreUserAdmin({ id: user.id });
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_restore_user'));
    }
  };
</script>

<ConfirmModal
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
</ConfirmModal>
