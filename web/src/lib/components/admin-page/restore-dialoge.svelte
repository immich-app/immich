<script lang="ts">
  import { api, type UserResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';

  export let user: UserResponseDto;

  const dispatch = createEventDispatcher<{
    success: void;
    fail: void;
  }>();

  const restoreUser = async () => {
    const restoredUser = await api.userApi.restoreUser({ id: user.id });
    if (restoredUser.data.deletedAt == undefined) {
      dispatch('success');
    } else {
      dispatch('fail');
    }
  };
</script>

<ConfirmDialogue title="Restore User" confirmText="Continue" confirmColor="green" on:confirm={restoreUser} on:cancel>
  <svelte:fragment slot="prompt">
    <p><b>{user.name}</b>'s account will be restored.</p>
  </svelte:fragment>
</ConfirmDialogue>
