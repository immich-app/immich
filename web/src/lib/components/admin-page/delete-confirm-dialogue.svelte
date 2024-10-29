<script lang="ts">
  import Checkbox from '$lib/components/elements/checkbox.svelte';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { deleteUserAdmin, type UserResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  export let user: UserResponseDto;
  export let onSuccess: () => void;
  export let onFail: () => void;
  export let onCancel: () => void;

  let forceDelete = false;
  let deleteButtonDisabled = false;
  let userIdInput: string = '';

  const handleDeleteUser = async () => {
    try {
      const { deletedAt } = await deleteUserAdmin({
        id: user.id,
        userAdminDeleteDto: { force: forceDelete },
      });

      if (deletedAt == undefined) {
        onFail();
      } else {
        onSuccess();
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_user'));
      onFail();
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
  {onCancel}
  disabled={deleteButtonDisabled}
>
  <svelte:fragment slot="prompt">
    <div class="flex flex-col gap-4">
      {#if forceDelete}
        <p>
          <FormatMessage key="admin.user_delete_immediately" values={{ user: user.name }} let:message>
            <b>{message}</b>
          </FormatMessage>
        </p>
      {:else}
        <p>
          <FormatMessage
            key="admin.user_delete_delay"
            values={{ user: user.name, delay: $serverConfig.userDeleteDelay }}
            let:message
          >
            <b>{message}</b>
          </FormatMessage>
        </p>
      {/if}

      <div class="flex justify-center m-4 gap-2">
        <Checkbox
          id="queue-user-deletion-checkbox"
          label={$t('admin.user_delete_immediately_checkbox')}
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
