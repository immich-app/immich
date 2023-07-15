<script lang="ts">
  import { api, UserResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';

  export let user: UserResponseDto;

  const dispatch = createEventDispatcher();

  const restoreUser = async () => {
    const restoredUser = await api.userApi.restoreUser({ userId: user.id });
    if (restoredUser.data.deletedAt == null) dispatch('user-restore-success');
    else dispatch('user-restore-fail');
  };
</script>

<ConfirmDialogue title="Restore User" confirmText="Continue" confirmColor="green" on:confirm={restoreUser} on:cancel>
  <svelte:fragment slot="prompt">
    <p><b>{user.firstName} {user.lastName}</b>'s account will be restored.</p>
  </svelte:fragment>
</ConfirmDialogue>
