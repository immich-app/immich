<script lang="ts">
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { AppRoute } from '$lib/constants';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { ByteUnit, convertFromBytes, convertToBytes } from '$lib/utils/byte-units';
  import { handleError } from '$lib/utils/handle-error';
  import { updateUserAdmin, type UserAdminResponseDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiAccountEditOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    user: UserAdminResponseDto;
    canResetPassword?: boolean;
    newPassword: string;
    onClose: () => void;
    onResetPasswordSuccess: () => void;
    onEditSuccess: () => void;
  }

  let {
    user,
    canResetPassword = true,
    newPassword = $bindable(),
    onClose,
    onResetPasswordSuccess,
    onEditSuccess,
  }: Props = $props();

  let quotaSize = $state(user.quotaSizeInBytes ? convertFromBytes(user.quotaSizeInBytes, ByteUnit.GiB) : null);

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
      await updateUserAdmin({
        id,
        userAdminUpdateDto: {
          email,
          name,
          storageLabel: storageLabel || '',
          quotaSizeInBytes: quotaSize ? convertToBytes(Number(quotaSize), ByteUnit.GiB) : null,
        },
      });

      onEditSuccess();
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_user'));
    }
  };

  const resetPassword = async () => {
    const isConfirmed = await dialogController.show({
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

      onResetPasswordSuccess();
    } catch (error) {
      handleError(error, $t('errors.unable_to_reset_password'));
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

<FullScreenModal title={$t('edit_user')} icon={mdiAccountEditOutline} {onClose}>
  <form onsubmit={onSubmit} autocomplete="off" id="edit-user-form">
    <div class="my-4 flex flex-col gap-2">
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
      <input class="immich-form-input" id="quotaSize" name="quotaSize" type="number" min="0" bind:value={quotaSize} />
      <p>{$t('admin.note_unlimited_quota')}</p>
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

  {#snippet stickyBottom()}
    {#if canResetPassword}
      <Button shape="round" color="warning" variant="filled" fullWidth onclick={resetPassword}
        >{$t('reset_password')}</Button
      >
    {/if}
    <Button type="submit" shape="round" fullWidth form="edit-user-form">{$t('confirm')}</Button>
  {/snippet}
</FullScreenModal>
