<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { signUpAdmin } from '@immich/sdk';
  import { handleError } from '../../utils/handle-error';
  import Button from '../elements/buttons/button.svelte';
  import PasswordField from '../shared-components/password-field.svelte';
  import { t } from 'svelte-i18n';
  import { retrieveServerConfig } from '$lib/stores/server-config.store';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let name = '';

  let errorMessage: string;
  let canRegister = false;

  $: {
    if (password !== confirmPassword && confirmPassword.length > 0) {
      errorMessage = $t('password_does_not_match');
      canRegister = false;
    } else {
      errorMessage = '';
      canRegister = true;
    }
  }

  async function registerAdmin() {
    if (canRegister) {
      errorMessage = '';

      try {
        await signUpAdmin({ signUpDto: { email, password, name } });
        await retrieveServerConfig();
        await goto(AppRoute.AUTH_LOGIN);
      } catch (error) {
        handleError(error, $t('errors.unable_to_create_admin_account'));
        errorMessage = $t('errors.unable_to_create_admin_account');
      }
    }
  }
</script>

<form on:submit|preventDefault={registerAdmin} method="post" class="mt-5 flex flex-col gap-5">
  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="email">{$t('admin_email')}</label>
    <input class="immich-form-input" id="email" bind:value={email} type="email" autocomplete="email" required />
  </div>

  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="password">{$t('admin_password')}</label>
    <PasswordField id="password" bind:password autocomplete="new-password" />
  </div>

  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="confirmPassword">{$t('confirm_admin_password')}</label>
    <PasswordField id="confirmPassword" bind:password={confirmPassword} autocomplete="new-password" />
  </div>

  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="name">{$t('name')}</label>
    <input class="immich-form-input" id="name" bind:value={name} type="text" autocomplete="name" required />
  </div>

  {#if errorMessage}
    <p class="text-red-400">{errorMessage}</p>
  {/if}

  <div class="my-5 flex w-full">
    <Button type="submit" size="lg" fullwidth>{$t('sign_up')}</Button>
  </div>
</form>
