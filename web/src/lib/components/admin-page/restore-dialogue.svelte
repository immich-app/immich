<script lang="ts">
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { restoreUserAdmin, type UserResponseDto } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';
  import { t } from 'svelte-i18n';

  export let user: UserResponseDto;

  const dispatch = createEventDispatcher<{
    success: void;
    fail: void;
    cancel: void;
  }>();

  const handleRestoreUser = async () => {
    try {
      const { deletedAt } = await restoreUserAdmin({ id: user.id });
      if (deletedAt == undefined) {
        dispatch('success');
      } else {
        dispatch('fail');
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_restore_user'));
      dispatch('fail');
    }
  };
</script>

<ConfirmDialog
  title={$t('restore_user')}
  confirmText={$t('continue')}
  confirmColor="green"
  onConfirm={handleRestoreUser}
  onCancel={() => dispatch('cancel')}
>
  <svelte:fragment slot="prompt">
    <p><b>{user.name}</b>'s account will be restored.</p>
  </svelte:fragment>
</ConfirmDialog>
