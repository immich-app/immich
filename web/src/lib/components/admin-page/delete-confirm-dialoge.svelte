<script lang="ts">
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { deleteUser, type UserResponseDto } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';

  export let user: UserResponseDto;

  const dispatch = createEventDispatcher<{
    success: void;
    fail: void;
  }>();

  const handleDeleteUser = async () => {
    try {
      const { deletedAt } = await deleteUser({ id: user.id });
      if (deletedAt == undefined) {
        dispatch('fail');
      } else {
        dispatch('success');
      }
    } catch (error) {
      handleError(error, 'Unable to delete user');
      dispatch('fail');
    }
  };
</script>

<ConfirmDialogue title="Delete User" confirmText="Delete" on:confirm={handleDeleteUser} on:cancel>
  <svelte:fragment slot="prompt">
    <div class="flex flex-col gap-4">
      <p>
        <b>{user.name}</b>'s account and assets will be permanently deleted after 7 days.
      </p>
      <p>Are you sure you want to continue?</p>
    </div>
  </svelte:fragment>
</ConfirmDialogue>
