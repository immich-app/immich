<script lang="ts">
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import { AppRoute } from '$lib/constants';
  import { serverInfo } from '$lib/stores/server-info.store';
  import { convertFromBytes, convertToBytes } from '$lib/utils/byte-converter';
  import { handleError } from '$lib/utils/handle-error';
  import { updateUser, type UserResponseDto } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';

  export let user: UserResponseDto;
  export let canResetPassword = true;
  export let newPassword: string;

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
      newPassword = generatePassword();

      await updateUser({
        updateUserDto: {
          id: user.id,
          password: newPassword,
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

  // TODO move password reset server-side
  function generatePassword(length: number = 16) {
    let generatedPassword = '';

    const characterSet = '0123456789' + 'abcdefghijklmnopqrstuvwxyz' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + ',.-{}+!#$%/()=?';

    for (let i = 0; i < length; i++) {
      let randomNumber = crypto.getRandomValues(new Uint32Array(1))[0];
      randomNumber = randomNumber / 2 ** 32;
      randomNumber = Math.floor(randomNumber * characterSet.length);

      generatedPassword += characterSet[randomNumber];
    }

    return generatedPassword;
  }
</script>

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
      <a href={AppRoute.ADMIN_JOBS} class="text-immich-primary dark:text-immich-dark-primary"> Storage Migration Job</a>
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

{#if isShowResetPasswordConfirmation}
  <ConfirmDialogue
    title="Reset Password"
    confirmText="Reset"
    onConfirm={resetPassword}
    onClose={() => (isShowResetPasswordConfirmation = false)}
  >
    <svelte:fragment slot="prompt">
      <p>
        Are you sure you want to reset <b>{user.name}</b>'s password?
      </p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
