<script lang="ts">
  import { changePassword } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import PasswordField from '../shared-components/password-field.svelte';
  import { handleError } from '$lib/utils/handle-error';

  let errorMessage: string;
  let success: string;

  let password = '';
  let newPassword = '';
  let confirmPassword = '';

  let valid = false;

  $: {
    if (newPassword !== confirmPassword && confirmPassword.length > 0) {
      errorMessage = 'Password does not match';
      valid = false;
    } else {
      errorMessage = '';
      valid = true;
    }
  }

  const dispatch = createEventDispatcher<{
    success: void;
  }>();

  async function handleChangePassword() {
    if (valid) {
      errorMessage = '';
      try {
        await changePassword({ changePasswordDto: { password, newPassword } });

        dispatch('success');
      } catch (error) {
        handleError(error, 'Unable to change password');
      }
    }
  }
</script>

<form on:submit|preventDefault={handleChangePassword} method="post" class="mt-5 flex flex-col gap-5">
  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="password">Current Password</label>
    <PasswordField id="password" bind:password autocomplete="password" />
  </div>

  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="password-new">New Password</label>
    <PasswordField id="password-new" bind:password={newPassword} autocomplete="new-password" />
  </div>

  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="password-confirm">Confirm Password</label>
    <PasswordField id="password-confirm" bind:password={confirmPassword} autocomplete="new-password" />
  </div>

  {#if errorMessage}
    <p class="text-sm text-red-400">{errorMessage}</p>
  {/if}

  {#if success}
    <p class="text-sm text-immich-primary">{success}</p>
  {/if}
  <div class="my-5 flex w-full">
    <Button type="submit" size="lg" fullwidth>Change password</Button>
  </div>
</form>
