<script lang="ts">
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { deleteUser, type UserResponseDto } from '@immich/sdk';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { createEventDispatcher } from 'svelte';

  export let user: UserResponseDto;

  let forceDelete = false;

  const dispatch = createEventDispatcher<{
    success: void;
    fail: void;
    cancel: void;
  }>();

  const handleDeleteUser = async () => {
    try {
      const { deletedAt } = await deleteUser({
        id: user.id,
        deleteUserOptionsDto: { force: forceDelete },
      });

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

<ConfirmDialogue
  title="Delete User"
  confirmText="Delete"
  onConfirm={handleDeleteUser}
  onClose={() => dispatch('cancel')}
>
  <svelte:fragment slot="prompt">
    <div class="flex flex-col gap-4">
      {#if !forceDelete}
        <p>
          <b>{user.name}</b>'s account and assets will be scheduled for permanent deletion in {$serverConfig.userDeleteDelay}
          days.
        </p>
      {/if}
      {#if forceDelete}
        <p>
          <b>{user.name}</b>'s account and assets will be queued for permanent deletion <b>immediately</b>.
        </p>
      {/if}

      <div class="flex justify-center m-4 gap-2">
        <label class="text-sm dark:text-immich-dark-fg" for="forceDelete">
          Queue user and assets for immediate deletion
        </label>

        <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={forceDelete} />
      </div>

      <p>Are you sure you want to continue?</p>
    </div>
  </svelte:fragment>
</ConfirmDialogue>
