<script lang="ts">
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { restoreUser, type UserResponseDto } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';

  export let user: UserResponseDto;

  const dispatch = createEventDispatcher<{
    success: void;
    fail: void;
    cancel: void;
  }>();

  const handleRestoreUser = async () => {
    try {
      const { deletedAt } = await restoreUser({ id: user.id });
      if (deletedAt == undefined) {
        dispatch('success');
      } else {
        dispatch('fail');
      }
    } catch (error) {
      handleError(error, 'Unable to restore user');
      dispatch('fail');
    }
  };
</script>

<ConfirmDialog
  id="restore-user-modal"
  title="Restore user"
  confirmText="Continue"
  confirmColor="green"
  onConfirm={handleRestoreUser}
  onCancel={() => dispatch('cancel')}
>
  <svelte:fragment slot="prompt">
    <p><b>{user.name}</b>'s account will be restored.</p>
  </svelte:fragment>
</ConfirmDialog>
