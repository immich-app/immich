<script lang="ts">
  import { api } from '@api';
  import { createEventDispatcher } from 'svelte';
  import ImmichLogo from '../shared-components/immich-logo.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import Button from '../elements/buttons/button.svelte';
  import { convertToBytes } from '$lib/utils/byte-converter';
  import { serverInfo } from '$lib/stores/server-info.store';

  let error: string;
  let success: string;

  let password = '';
  let confirmPassowrd = '';

  let canCreateUser = false;
  let quotaSize: number | undefined;
  let isCreatingUser = false;

  $: quotaSizeWarning = quotaSize && convertToBytes(Number(quotaSize), 'GiB') > $serverInfo.diskSizeRaw;

  $: {
    if (password !== confirmPassowrd && confirmPassowrd.length > 0) {
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

  async function registerUser(event: SubmitEvent) {
    if (canCreateUser && !isCreatingUser) {
      isCreatingUser = true;

      error = '';

      const formElement = event.target as HTMLFormElement;

      const form = new FormData(formElement);

      const email = form.get('email');
      const password = form.get('password');
      const name = form.get('name');
      const quotaSize = form.get('quotaSize');

      try {
        const { status } = await api.userApi.createUser({
          createUserDto: {
            email: String(email),
            password: String(password),
            name: String(name),
            quotaSizeInBytes: quotaSize ? convertToBytes(Number(quotaSize), 'GiB') : null,
          },
        });

        if (status === 201) {
          success = 'New user created';

          dispatch('submit');

          isCreatingUser = false;
          return;
        } else {
          error = 'Error create user account';
          isCreatingUser = false;
        }
      } catch (error) {
        isCreatingUser = false;

        console.log('[ERROR] registerUser', error);

        notificationController.show({
          message: `Error create new user, check console for more detail`,
          type: NotificationType.Error,
        });
      }
    }
  }
</script>

<div
  class="max-h-screen w-[500px] max-w-[95vw] overflow-y-scroll rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
>
  <div class="flex flex-col place-content-center place-items-center gap-4 px-4">
    <ImmichLogo class="text-center" height="100" width="100" />
    <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Create new user</h1>
    <p class="rounded-md border p-4 font-mono text-sm text-gray-600 dark:border-immich-dark-bg dark:text-gray-300">
      Please provide your user with the password, they will have to change it on their first sign in.
    </p>
  </div>

  <form on:submit|preventDefault={registerUser} autocomplete="off">
    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="email">Email</label>
      <input class="immich-form-input" id="email" name="email" type="email" required />
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="password">Password</label>
      <input class="immich-form-input" id="password" name="password" type="password" required bind:value={password} />
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="confirmPassword">Confirm Password</label>
      <input
        class="immich-form-input"
        id="confirmPassword"
        name="password"
        type="password"
        required
        bind:value={confirmPassowrd}
      />
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="name">Name</label>
      <input class="immich-form-input" id="name" name="name" type="text" required />
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="flex items-center gap-2 immich-form-label" for="quotaSize"
        >Quota Size (GiB) {#if quotaSizeWarning}
          <p class="text-red-400 text-sm">You set a quota higher than the disk size</p>
        {/if}</label
      >
      <input class="immich-form-input" id="quotaSize" name="quotaSize" type="number" min="0" bind:value={quotaSize} />
    </div>

    {#if error}
      <p class="ml-4 text-sm text-red-400">{error}</p>
    {/if}

    {#if success}
      <p class="ml-4 text-sm text-immich-primary">{success}</p>
    {/if}
    <div class="flex w-full gap-4 p-4">
      <Button color="gray" fullwidth on:click={() => dispatch('cancel')}>Cancel</Button>
      <Button type="submit" disabled={isCreatingUser} fullwidth>Create</Button>
    </div>
  </form>
</div>
