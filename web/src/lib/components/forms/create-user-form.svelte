<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { serverInfo } from '$lib/stores/server-info.store';
  import { ByteUnit, convertToBytes } from '$lib/utils/byte-units';
  import { handleError } from '$lib/utils/handle-error';
  import { createUserAdmin } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import Button from '../elements/buttons/button.svelte';
  import Slider from '../elements/slider.svelte';
  import PasswordField from '../shared-components/password-field.svelte';

  export let onClose: () => void;
  export let onSubmit: () => void;
  export let onCancel: () => void;

  let error: string;
  let success: string;

  let email = '';
  let password = '';
  let confirmPassword = '';
  let name = '';
  let shouldChangePassword = true;
  let notify = true;

  let canCreateUser = false;
  let quotaSize: number | undefined;
  let isCreatingUser = false;

  $: quotaSizeInBytes = quotaSize ? convertToBytes(quotaSize, ByteUnit.GiB) : null;
  $: quotaSizeWarning = quotaSizeInBytes && quotaSizeInBytes > $serverInfo.diskSizeRaw;

  $: {
    if (password !== confirmPassword && confirmPassword.length > 0) {
      error = $t('password_does_not_match');
      canCreateUser = false;
    } else {
      error = '';
      canCreateUser = true;
    }
  }

  async function registerUser() {
    if (canCreateUser && !isCreatingUser) {
      isCreatingUser = true;
      error = '';

      try {
        await createUserAdmin({
          userAdminCreateDto: {
            email,
            password,
            shouldChangePassword,
            name,
            quotaSizeInBytes,
            notify,
          },
        });

        success = $t('new_user_created');

        onSubmit();

        return;
      } catch (error) {
        handleError(error, $t('errors.unable_to_create_user'));
      } finally {
        isCreatingUser = false;
      }
    }
  }
</script>

<FullScreenModal title={$t('create_new_user')} showLogo {onClose}>
  <form on:submit|preventDefault={registerUser} autocomplete="off" id="create-new-user-form">
    <div class="my-4 flex flex-col gap-2">
      <label class="immich-form-label" for="email">{$t('email')}</label>
      <input class="immich-form-input" id="email" bind:value={email} type="email" required />
    </div>

    {#if $featureFlags.email}
      <div class="my-4 flex place-items-center justify-between gap-2">
        <label class="text-sm dark:text-immich-dark-fg" for="send-welcome-email">
          {$t('admin.send_welcome_email')}
        </label>
        <Slider id="send-welcome-email" bind:checked={notify} />
      </div>
    {/if}

    <div class="my-4 flex flex-col gap-2">
      <label class="immich-form-label" for="password">{$t('password')}</label>
      <PasswordField id="password" bind:password autocomplete="new-password" />
    </div>

    <div class="my-4 flex flex-col gap-2">
      <label class="immich-form-label" for="confirmPassword">{$t('confirm_password')}</label>
      <PasswordField id="confirmPassword" bind:password={confirmPassword} autocomplete="new-password" />
    </div>

    <div class="my-4 flex place-items-center justify-between gap-2">
      <label class="text-sm dark:text-immich-dark-fg" for="require-password-change">
        {$t('admin.require_password_change_on_login')}
      </label>
      <Slider id="require-password-change" bind:checked={shouldChangePassword} />
    </div>

    <div class="my-4 flex flex-col gap-2">
      <label class="immich-form-label" for="name">{$t('name')}</label>
      <input class="immich-form-input" id="name" bind:value={name} type="text" required />
    </div>

    <div class="my-4 flex flex-col gap-2">
      <label class="flex items-center gap-2 immich-form-label" for="quotaSize">
        {$t('admin.quota_size_gib')}
        {#if quotaSizeWarning}
          <p class="text-red-400 text-sm">{$t('errors.quota_higher_than_disk_size')}</p>
        {/if}
      </label>
      <input class="immich-form-input" id="quotaSize" type="number" min="0" bind:value={quotaSize} />
    </div>

    {#if error}
      <p class="text-sm text-red-400">{error}</p>
    {/if}

    {#if success}
      <p class="text-sm text-immich-primary">{success}</p>
    {/if}
  </form>
  <svelte:fragment slot="sticky-bottom">
    <Button color="gray" fullwidth on:click={onCancel}>{$t('cancel')}</Button>
    <Button type="submit" disabled={isCreatingUser} fullwidth form="create-new-user-form">{$t('create')}</Button>
  </svelte:fragment>
</FullScreenModal>
