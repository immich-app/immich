<script lang="ts">
  import { api, UserResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import { handleError } from '../../utils/handle-error';

  export let user: UserResponseDto;

  const dispatch = createEventDispatcher();

  const deleteUser = async () => {
    try {
      const deletedUser = await api.userApi.deleteUser({ id: user.id });
      if (deletedUser.data.deletedAt != null) {
        dispatch('user-delete-success');
      } else {
        dispatch('user-delete-fail');
      }
    } catch (error) {
      handleError(error, 'Unable to delete user');
      dispatch('user-delete-fail');
    }
  };
</script>

<ConfirmDialogue title="Delete User" confirmText="Delete" on:confirm={deleteUser} on:cancel>
  <svelte:fragment slot="prompt">
    <div class="flex flex-col gap-4">
      <p>
        <b>{user.firstName} {user.lastName}</b>'s account and assets will be permanently deleted after 7 days.
      </p>
      <p>Are you sure you want to continue?</p>
    </div>
  </svelte:fragment>
</ConfirmDialogue>
