<script lang="ts">
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { deleteUserAdmin, type UserResponseDto } from '@immich/sdk';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { createEventDispatcher } from 'svelte';
  import Checkbox from '$lib/components/elements/checkbox.svelte';
  import { t } from 'svelte-i18n';

  export let user: UserResponseDto;

  let forceDelete = false;
  let deleteButtonDisabled = false;
  let userIdInput: string = '';

  const dispatch = createEventDispatcher<{
    success: void;
    fail: void;
    cancel: void;
  }>();

  const handleDeleteUser = async () => {
    try {
      const { deletedAt } = await deleteUserAdmin({
        id: user.id,
        userAdminDeleteDto: { force: forceDelete },
      });

      if (deletedAt == undefined) {
        dispatch('fail');
      } else {
        dispatch('success');
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_user'));
      dispatch('fail');
    }
  };

  const handleConfirm = (e: Event) => {
    userIdInput = (e.target as HTMLInputElement).value;
    deleteButtonDisabled = userIdInput != user.email;
  };
</script>

<ConfirmDialog
  title={$t('delete_user')}
  confirmText={forceDelete ? $t('permanently_delete') : $t('delete')}
  onConfirm={handleDeleteUser}
  onCancel={() => dispatch('cancel')}
  disabled={deleteButtonDisabled}
>
  <svelte:fragment slot="prompt">
    <div class="flex flex-col gap-4">
      {#if forceDelete}
        <p>
          <b>{user.name}</b>'s account and assets will be queued for permanent deletion <b>immediately</b>.
        </p>
      {:else}
        <p>
          <b>{user.name}</b>'s account and assets will be scheduled for permanent deletion in {$serverConfig.userDeleteDelay}
          days.
        </p>
      {/if}

      <div class="flex justify-center m-4 gap-2">
        <Checkbox
          id="queue-user-deletion-checkbox"
          label="Queue user and assets for immediate deletion"
          labelClass="text-sm dark:text-immich-dark-fg"
          bind:checked={forceDelete}
          on:change={() => {
            deleteButtonDisabled = forceDelete;
          }}
        />
      </div>

      {#if forceDelete}
        <p class="text-immich-error">{$t('admin.force_delete_user_warning')}</p>

        <p class="immich-form-label text-sm" id="confirm-user-desc">
          {$t('admin.confirm_email_below', { values: { email: user.email } })}
        </p>

        <input
          class="immich-form-input w-full pb-2"
          id="confirm-user-id"
          aria-describedby="confirm-user-desc"
          name="confirm-user-id"
          type="text"
          on:input={handleConfirm}
        />
      {/if}
    </div>
  </svelte:fragment>
</ConfirmDialog>
