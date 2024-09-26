<script lang="ts">
  import Button from '../elements/buttons/button.svelte';
  import PasswordField from '../shared-components/password-field.svelte';
  import { updateMyUser } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  export let onSuccess: () => void;

  let errorMessage: string;
  let success: string;

  let password = '';
  let passwordConfirm = '';

  let valid = false;

  $: {
    if (password !== passwordConfirm && passwordConfirm.length > 0) {
      errorMessage = $t('password_does_not_match');
      valid = false;
    } else {
      errorMessage = '';
      valid = true;
    }
  }

  async function changePassword() {
    if (valid) {
      errorMessage = '';

      await updateMyUser({ userUpdateMeDto: { password: String(password) } });

      onSuccess();
    }
  }
</script>

<form on:submit|preventDefault={changePassword} method="post" class="mt-5 flex flex-col gap-5">
  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="password">{$t('new_password')}</label>
    <PasswordField id="password" bind:password autocomplete="new-password" />
  </div>

  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="confirmPassword">{$t('confirm_password')}</label>
    <PasswordField id="confirmPassword" bind:password={passwordConfirm} autocomplete="new-password" />
  </div>

  {#if errorMessage}
    <p class="text-sm text-red-400">{errorMessage}</p>
  {/if}

  {#if success}
    <p class="text-sm text-immich-primary">{success}</p>
  {/if}
  <div class="my-5 flex w-full">
    <Button type="submit" size="lg" fullwidth>{$t('to_change_password')}</Button>
  </div>
</form>
