<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { AppRoute } from '$lib/constants';
  import { serverInfo } from '$lib/stores/server-info.store';
  import { convertFromBytes, convertToBytes } from '$lib/utils/byte-converter';
  import { handleError } from '$lib/utils/handle-error';
  import { updateUserAdmin, type UserAdminResponseDto } from '@immich/sdk';
  import { mdiAccountEditOutline } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';

  export let user: UserAdminResponseDto;
  export let canResetPassword = true;
  export let newPassword: string;
  export let onClose: () => void;

  let error: string;
  let success: string;
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
      await updateUserAdmin({
        id,
        userAdminUpdateDto: {
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
    const isConfirmed = await dialogController.show({
      id: 'confirm-reset-password',
      prompt: `Are you sure you want to reset ${user.name}'s password?`,
    });

    if (!isConfirmed) {
      return;
    }

    try {
      newPassword = generatePassword();

      await updateUserAdmin({
        id: user.id,
        userAdminUpdateDto: {
          password: newPassword,
          shouldChangePassword: true,
        },
      });

      dispatch('resetPasswordSuccess');
    } catch (error) {
      handleError(error, 'Unable to reset password');
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

<FullScreenModal title="Edit user" icon={mdiAccountEditOutline} {onClose}>
  <form on:submit|preventDefault={editUser} autocomplete="off" id="edit-user-form">
    <div class="my-4 flex flex-col gap-2">
      <label class="immich-form-label" for="email">Email</label>
      <input class="immich-form-input" id="email" name="email" type="email" bind:value={user.email} />
    </div>

    <div class="my-4 flex flex-col gap-2">
      <label class="immich-form-label" for="name">Name</label>
      <input class="immich-form-input" id="name" name="name" type="text" required bind:value={user.name} />
    </div>

    <div class="my-4 flex flex-col gap-2">
      <label class="flex items-center gap-2 immich-form-label" for="quotaSize"
        >Quota Size (GiB) {#if quotaSizeWarning}
          <p class="text-red-400 text-sm">You set a quota higher than the disk size</p>
        {/if}</label
      >
      <input class="immich-form-input" id="quotaSize" name="quotaSize" type="number" min="0" bind:value={quotaSize} />
      <p>Note: Enter 0 for unlimited quota</p>
    </div>

    <div class="my-4 flex flex-col gap-2">
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
  </form>
  <svelte:fragment slot="sticky-bottom">
    {#if canResetPassword}
      <Button color="light-red" fullwidth on:click={resetPassword}>Reset password</Button>
    {/if}
    <Button type="submit" fullwidth form="edit-user-form">Confirm</Button>
  </svelte:fragment>
</FullScreenModal>
