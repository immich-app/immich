<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import PasswordField from '../shared-components/password-field.svelte';
  import { updateUser, type UserResponseDto } from '@immich/sdk';

  export let user: UserResponseDto;
  let errorMessage: string;
  let success: string;

  let password = '';
  let passwordConfirm = '';

  let valid = false;

  $: {
    if (password !== passwordConfirm && passwordConfirm.length > 0) {
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

  async function changePassword() {
    if (valid) {
      errorMessage = '';

      await updateUser({
        updateUserDto: {
          id: user.id,
          password: String(password),
          shouldChangePassword: false,
        },
      });

      dispatch('success');
    }
  }
</script>

<form on:submit|preventDefault={changePassword} method="post" class="mt-5 flex flex-col gap-5">
  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="password">New Password</label>
    <PasswordField id="password" bind:password autocomplete="new-password" />
  </div>

  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="confirmPassword">Confirm Password</label>
    <PasswordField id="confirmPassword" bind:password={passwordConfirm} autocomplete="new-password" />
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
