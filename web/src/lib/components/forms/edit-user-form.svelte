<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import { AppRoute } from '$lib/constants';
  import { serverInfo } from '$lib/stores/server-info.store';
  import { convertFromBytes, convertToBytes } from '$lib/utils/byte-converter';
  import { handleError } from '$lib/utils/handle-error';
  import { updateUser, type UserResponseDto } from '@immich/sdk';
  import { mdiAccountEditOutline, mdiClose } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';

  export let user: UserResponseDto;
  export let canResetPassword = true;

  let error: string;
  let success: string;
  let isShowResetPasswordConfirmation = false;
  let quotaSize = user.quotaSizeInBytes ? convertFromBytes(user.quotaSizeInBytes, 'GiB') : null;

  const previousQutoa = user.quotaSizeInBytes;

  $: quotaSizeWarning =
    previousQutoa !== convertToBytes(Number(quotaSize), 'GiB') &&
    !!quotaSize &&
    convertToBytes(Number(quotaSize), 'GiB') > $serverInfo.diskSizeRaw;

  const dispatch = createEventDispatcher<{
    close: void;
    resetPasswordSuccess: void;
    editSuccess: void;
  }>();

  const editUser = async () => {
    try {
      const { id, email, name, storageLabel } = user;
      await updateUser({
        updateUserDto: {
          id,
          email,
          name,
          storageLabel: storageLabel || '',
          quotaSizeInBytes: quotaSize ? convertToBytes(Number(quotaSize), 'GiB') : null,
        },
      });

      dispatch('editSuccess');
    } catch (error) {
      handleError(error, 'Unable to update user');
    }
  };

  const resetPassword = async () => {
    try {
      const defaultPassword = 'password';

      await updateUser({
        updateUserDto: {
          id: user.id,
          password: defaultPassword,
          shouldChangePassword: true,
        },
      });

      dispatch('resetPasswordSuccess');
    } catch (error) {
      handleError(error, 'Unable to reset password');
    } finally {
      isShowResetPasswordConfirmation = false;
    }
  };
</script>

<div
  class="relative max-h-screen w-[500px] max-w-[95vw] overflow-y-auto rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
>
  <div class="absolute top-0 right-0 px-2 py-2 h-fit">
    <CircleIconButton icon={mdiClose} on:click={() => dispatch('close')} />
  </div>

  <div
    class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
  >
    <Icon path={mdiAccountEditOutline} size="4em" />
    <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Edit user</h1>
  </div>

  <form on:submit|preventDefault={editUser} autocomplete="off">
    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="email">Email</label>
      <input class="immich-form-input" id="email" name="email" type="email" bind:value={user.email} />
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="name">Name</label>
      <input class="immich-form-input" id="name" name="name" type="text" required bind:value={user.name} />
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="flex items-center gap-2 immich-form-label" for="quotaSize"
        >Quota Size (GiB) {#if quotaSizeWarning}
          <p class="text-red-400 text-sm">You set a quota higher than the disk size</p>
        {/if}</label
      >
      <input class="immich-form-input" id="quotaSize" name="quotaSize" type="number" min="0" bind:value={quotaSize} />
      <p>Note: Enter 0 for unlimited quota</p>
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
        <a href={AppRoute.ADMIN_JOBS} class="text-immich-primary dark:text-immich-dark-primary">
          Storage Migration Job</a
        >
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
        Are you sure you want to reset <b>{user.name}</b>'s password?
      </p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
