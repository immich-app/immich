<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { ByteUnit, convertFromBytes, convertToBytes } from '$lib/utils/byte-units';
  import { handleError } from '$lib/utils/handle-error';
  import { updateUserAdmin, type UserAdminResponseDto } from '@immich/sdk';
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiAccountEditOutline, mdiLockSmart, mdiOnepassword } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    user: UserAdminResponseDto;
    canResetPassword?: boolean;
    onClose: (
      data?:
        | { action: 'update'; data: UserAdminResponseDto }
        | { action: 'resetPassword'; data: string }
        | { action: 'resetPinCode' },
    ) => void;
  }

  let { user, canResetPassword = true, onClose }: Props = $props();

  let quotaSize = $state(user.quotaSizeInBytes === null ? null : convertFromBytes(user.quotaSizeInBytes, ByteUnit.GiB));
  let newPassword = $state<string>('');

  const previousQutoa = user.quotaSizeInBytes;

  let quotaSizeWarning = $derived(
    previousQutoa !== convertToBytes(Number(quotaSize), ByteUnit.GiB) &&
      !!quotaSize &&
      userInteraction.serverInfo &&
      convertToBytes(Number(quotaSize), ByteUnit.GiB) > userInteraction.serverInfo.diskSizeRaw,
  );

  const editUser = async () => {
    try {
      const { id, email, name, storageLabel } = user;
      const newUser = await updateUserAdmin({
        id,
        userAdminUpdateDto: {
          email,
          name,
          storageLabel: storageLabel || '',
          quotaSizeInBytes: quotaSize === null ? null : convertToBytes(Number(quotaSize), ByteUnit.GiB),
        },
      });

      onClose({ action: 'update', data: newUser });
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_user'));
    }
  };

  const resetPassword = async () => {
    const isConfirmed = await modalManager.openDialog({
      prompt: $t('admin.confirm_user_password_reset', { values: { user: user.name } }),
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

      onClose({ action: 'resetPassword', data: newPassword });
    } catch (error) {
      handleError(error, $t('errors.unable_to_reset_password'));
    }
  };

  const resetUserPincode = async () => {
    const isConfirmed = await modalManager.openDialog({
      prompt: $t('admin.confirm_user_pin_code_reset', { values: { user: user.name } }),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await updateUserAdmin({ id: user.id, userAdminUpdateDto: { pinCode: null } });

      onClose({ action: 'resetPinCode' });
    } catch (error) {
      handleError(error, $t('errors.unable_to_reset_pin_code'));
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

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    await editUser();
  };
</script>

<Modal title={$t('edit_user')} size="small" icon={mdiAccountEditOutline} {onClose} class="text-dark bg-light">
  <ModalBody>
    <form onsubmit={onSubmit} autocomplete="off" id="edit-user-form">
      <div class="mb-4 flex flex-col gap-2">
        <label class="immich-form-label" for="email">{$t('email')}</label>
        <input class="immich-form-input" id="email" name="email" type="email" bind:value={user.email} />
      </div>

      <div class="my-4 flex flex-col gap-2">
        <label class="immich-form-label" for="name">{$t('name')}</label>
        <input class="immich-form-input" id="name" name="name" type="text" required bind:value={user.name} />
      </div>

      <div class="my-4 flex flex-col gap-2">
        <label class="flex items-center gap-2 immich-form-label" for="quotaSize">
          {$t('admin.quota_size_gib')}
          {#if quotaSizeWarning}
            <p class="text-red-400 text-sm">{$t('errors.quota_higher_than_disk_size')}</p>
          {/if}</label
        >
        <input
          class="immich-form-input"
          id="quotaSize"
          name="quotaSize"
          placeholder={$t('unlimited')}
          type="number"
          min="0"
          bind:value={quotaSize}
        />
      </div>

      <div class="my-4 flex flex-col gap-2">
        <label class="immich-form-label" for="storage-label">{$t('storage_label')}</label>
        <input
          class="immich-form-input"
          id="storage-label"
          name="storage-label"
          type="text"
          bind:value={user.storageLabel}
        />

        <p>
          {$t('admin.note_apply_storage_label_previous_assets')}
          <a href={AppRoute.ADMIN_JOBS} class="text-immich-primary dark:text-immich-dark-primary">
            {$t('admin.storage_template_migration_job')}
          </a>
        </p>
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <div class="w-full">
      <div class="flex gap-3 w-full">
        {#if canResetPassword}
          <Button
            shape="round"
            color="warning"
            variant="filled"
            fullWidth
            onclick={resetPassword}
            leadingIcon={mdiOnepassword}
          >
            {$t('reset_password')}</Button
          >
        {/if}

        <Button
          shape="round"
          color="warning"
          variant="filled"
          fullWidth
          onclick={resetUserPincode}
          leadingIcon={mdiLockSmart}>{$t('reset_pin_code')}</Button
        >
      </div>

      <div class="w-full mt-4">
        <Button type="submit" shape="round" fullWidth form="edit-user-form">{$t('confirm')}</Button>
      </div>
    </div>
  </ModalFooter>
</Modal>
