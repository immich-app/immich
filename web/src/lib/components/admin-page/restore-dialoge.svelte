<script lang="ts">
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import { restoreUser, type UserResponseDto } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';

  export let user: UserResponseDto;

  const dispatch = createEventDispatcher<{
    success: void;
    fail: void;
    cancel: void;
  }>();

  const handleRestoreUser = async () => {
    const { deletedAt } = await restoreUser({ id: user.id });
    if (deletedAt == undefined) {
      dispatch('success');
    } else {
      dispatch('fail');
    }
  };
</script>

<ConfirmDialogue
  title="Restore User"
  confirmText="Continue"
  confirmColor="green"
  onConfirm={handleRestoreUser}
  onClose={() => dispatch('cancel')}
>
  <svelte:fragment slot="prompt">
    <p><b>{user.name}</b>'s account will be restored.</p>
  </svelte:fragment>
</ConfirmDialogue>
