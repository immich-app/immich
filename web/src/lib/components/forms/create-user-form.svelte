<script lang="ts">
  import { serverInfo } from '$lib/stores/server-info.store';
  import { convertToBytes } from '$lib/utils/byte-converter';
  import { handleError } from '$lib/utils/handle-error';
  import { createUser } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import PasswordField from '../shared-components/password-field.svelte';
  import Slider from '../elements/slider.svelte';

  let error: string;
  let success: string;

  let email = '';
  let password = '';
  let confirmPassword = '';
  let name = '';
  let shouldChangePassword = true;

  let canCreateUser = false;
  let quotaSize: number | undefined;
  let isCreatingUser = false;

  $: quotaSizeInBytes = quotaSize ? convertToBytes(quotaSize, 'GiB') : null;
  $: quotaSizeWarning = quotaSizeInBytes && quotaSizeInBytes > $serverInfo.diskSizeRaw;

  $: {
    if (password !== confirmPassword && confirmPassword.length > 0) {
      error = 'Password does not match';
      canCreateUser = false;
    } else {
      error = '';
      canCreateUser = true;
    }
  }
  const dispatch = createEventDispatcher<{
    submit: void;
    cancel: void;
  }>();

  async function registerUser() {
    if (canCreateUser && !isCreatingUser) {
      isCreatingUser = true;
      error = '';

      try {
        await createUser({
          createUserDto: {
            email,
            password,
            shouldChangePassword,
            name,
            quotaSizeInBytes,
          },
        });

        success = 'New user created';

        dispatch('submit');

        return;
      } catch (error) {
        handleError(error, 'Unable to create user');
      } finally {
        isCreatingUser = false;
      }
    }
  }
</script>

<form on:submit|preventDefault={registerUser} autocomplete="off">
  <div class="my-4 flex flex-col gap-2">
    <label class="immich-form-label" for="email">Email</label>
    <input class="immich-form-input" id="email" bind:value={email} type="email" required />
  </div>

  <div class="my-4 flex flex-col gap-2">
    <label class="immich-form-label" for="password">Password</label>
    <PasswordField id="password" bind:password autocomplete="new-password" />
  </div>

  <div class="my-4 flex flex-col gap-2">
    <label class="immich-form-label" for="confirmPassword">Confirm Password</label>
    <PasswordField id="confirmPassword" bind:password={confirmPassword} autocomplete="new-password" />
  </div>

  <div class="my-4 flex place-items-center justify-between gap-2">
    <label class="text-sm dark:text-immich-dark-fg" for="require-password-change">
      Require user to change password on first login
    </label>
    <Slider id="require-password-change" bind:checked={shouldChangePassword} />
  </div>

  <div class="my-4 flex flex-col gap-2">
    <label class="immich-form-label" for="name">Name</label>
    <input class="immich-form-input" id="name" bind:value={name} type="text" required />
  </div>

  <div class="my-4 flex flex-col gap-2">
    <label class="flex items-center gap-2 immich-form-label" for="quotaSize">
      Quota Size (GiB)
      {#if quotaSizeWarning}
        <p class="text-red-400 text-sm">You set a quota higher than the disk size</p>
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
  <div class="flex w-full gap-4 pt-4">
    <Button color="gray" fullwidth on:click={() => dispatch('cancel')}>Cancel</Button>
    <Button type="submit" disabled={isCreatingUser} fullwidth>Create</Button>
  </div>
</form>
