<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { mdiShieldLockOutline } from '@mdi/js';
  import { api } from '@api';
  import { handleError } from '$lib/utils/handle-error';

  const dispatch = createEventDispatcher();
  let passwordElement: HTMLInputElement;
  let password = '';

  $: {
    if (passwordElement) {
      passwordElement.focus();
    }
  }

  const handleSubmitPassword = async () => {
    try {
      await api.userApi.validatePrivateAlbumPassword({ validatePrivateAlbumPasswordDto: { password } });
      dispatch('validate-success');
    } catch (error) {
      handleError(error, 'Invalid password');
    }
  };
</script>

<div
  class="max-h-screen w-[500px] max-w-[95vw] overflow-y-auto rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
>
  <div
    class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
  >
    <Icon path={mdiShieldLockOutline} size="4em" />
    <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Private album</h1>
  </div>

  <form on:submit|preventDefault={handleSubmitPassword} autocomplete="off">
    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="name">Password</label>
      <input class="immich-form-input" id="name" type="password" bind:this={passwordElement} bind:value={password} />
    </div>

    <div class="mt-8 flex w-full gap-4 px-4">
      <Button color="gray" fullwidth on:click={() => dispatch('cancel')}>Cancel</Button>
      <Button type="submit" fullwidth>Confirm</Button>
    </div>
  </form>
</div>
