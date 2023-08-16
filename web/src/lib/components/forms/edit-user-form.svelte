<script lang="ts">
  import { api, UserResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import AccountEditOutline from 'svelte-material-icons/AccountEditOutline.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import Button from '../elements/buttons/button.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import { handleError } from '../../utils/handle-error';

  export let user: UserResponseDto;
  export let canResetPassword = true;

  let error: string;
  let success: string;

  let isShowResetPasswordConfirmation = false;

  const dispatch = createEventDispatcher();

  const editUser = async () => {
    try {
      const { id, email, firstName, lastName, storageLabel, externalPath } = user;
      const { status } = await api.userApi.updateUser({
        updateUserDto: {
          id,
          email,
          firstName,
          lastName,
          storageLabel: storageLabel || '',
          externalPath: externalPath || '',
        },
      });

      if (status === 200) {
        dispatch('edit-success');
      }
    } catch (error) {
      handleError(error, 'Unable to update user');
    }
  };

  const resetPassword = async () => {
    try {
      const defaultPassword = 'password';

      const { status } = await api.userApi.updateUser({
        updateUserDto: {
          id: user.id,
          password: defaultPassword,
          shouldChangePassword: true,
        },
      });

      if (status == 200) {
        dispatch('reset-password-success');
      }
    } catch (e) {
      console.error('Error reseting user password', e);
      notificationController.show({
        message: 'Error reseting user password, check console for more details',
        type: NotificationType.Error,
      });
    } finally {
      isShowResetPasswordConfirmation = false;
    }
  };
</script>

<div
  class="max-h-screen w-[500px] max-w-[95vw] overflow-y-auto rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
>
  <div
    class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
  >
    <AccountEditOutline size="4em" />
    <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Edit user</h1>
  </div>

  <form on:submit|preventDefault={editUser} autocomplete="off">
    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="email">Email</label>
      <input class="immich-form-input" id="email" name="email" type="email" bind:value={user.email} />
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="firstName">First Name</label>
      <input
        class="immich-form-input"
        id="firstName"
        name="firstName"
        type="text"
        required
        bind:value={user.firstName}
      />
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="lastName">Last Name</label>
      <input class="immich-form-input" id="lastName" name="lastName" type="text" required bind:value={user.lastName} />
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="storage-label">Storage Label</label>
      <input
        class="immich-form-input"
        id="storage-label"
        name="storage-label"
        type="text"
        bind:value={user.storageLabel}
      />

      <p>
        Note: To apply the Storage Label to previously uploaded assets, run the
        <a href="/admin/jobs-status" class="text-immich-primary dark:text-immich-dark-primary">
          Storage Migration Job</a
        >
      </p>
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="external-path">External Path</label>
      <input
        class="immich-form-input"
        id="external-path"
        name="external-path"
        type="text"
        bind:value={user.externalPath}
      />

      <p>
        Note: Absolute path of parent import directory. A user can only import files if they exist at or under this
        path.
      </p>
    </div>

    {#if error}
      <p class="ml-4 text-sm text-red-400">{error}</p>
    {/if}

    {#if success}
      <p class="ml-4 text-sm text-immich-primary">{success}</p>
    {/if}
    <div class="mt-8 flex w-full gap-4 px-4">
      {#if canResetPassword}
        <Button color="light-red" fullwidth on:click={() => (isShowResetPasswordConfirmation = true)}
          >Reset password</Button
        >
      {/if}
      <Button type="submit" fullwidth>Confirm</Button>
    </div>
  </form>
</div>

{#if isShowResetPasswordConfirmation}
  <ConfirmDialogue
    title="Reset Password"
    confirmText="Reset"
    on:confirm={resetPassword}
    on:cancel={() => (isShowResetPasswordConfirmation = false)}
  >
    <svelte:fragment slot="prompt">
      <p>
        Are you sure you want to reset <b>{user.firstName} {user.lastName}</b>'s password?
      </p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
