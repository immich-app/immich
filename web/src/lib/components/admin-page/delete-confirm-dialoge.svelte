<script lang="ts">
  import { api, UserResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import { handleError } from '../../utils/handle-error';

  export let user: UserResponseDto;

  const dispatch = createEventDispatcher<{
    success: void;
    fail: void;
  }>();

  const deleteUser = async () => {
    try {
      const deletedUser = await api.userApi.deleteUser({ id: user.id });
      if (deletedUser.data.deletedAt != null) {
        dispatch('success');
      } else {
        dispatch('fail');
      }
    } catch (error) {
      handleError(error, 'Unable to delete user');
      dispatch('fail');
    }
  };
</script>

<ConfirmDialogue title="Delete User" confirmText="Delete" on:confirm={deleteUser} on:cancel>
  <svelte:fragment slot="prompt">
    <div class="flex flex-col gap-4">
      <p>
        <b>{user.name}</b> : le compte et les actifs seront définitivement supprimés après 7 jours.
      </p>
      <p>Êtes-vous sûr de vouloir continuer ?</p>
      </div>      
  </svelte:fragment>
</ConfirmDialogue>
