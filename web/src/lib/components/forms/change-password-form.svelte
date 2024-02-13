<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
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
    <input
      class="immich-form-input"
      id="password"
      name="password"
      type="password"
      autocomplete="new-password"
      required
      bind:value={password}
    />
  </div>

  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="confirmPassword">Confirm Password</label>
    <input
      class="immich-form-input"
      id="confirmPassword"
      name="password"
      type="password"
      autocomplete="current-password"
      required
      bind:value={passwordConfirm}
    />
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
