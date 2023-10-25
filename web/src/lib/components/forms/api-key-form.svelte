<script lang="ts">
  import type { APIKeyResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiKeyVariant } from '@mdi/js';

  export let apiKey: Partial<APIKeyResponseDto>;
  export let title = 'API Key';
  export let cancelText = 'Cancel';
  export let submitText = 'Save';

  const dispatch = createEventDispatcher();
  const handleCancel = () => dispatch('cancel');
  const handleSubmit = () => dispatch('submit', { ...apiKey, name: apiKey.name });
</script>

<FullScreenModal on:clickOutside={() => handleCancel()}>
  <div
    class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <Icon path={mdiKeyVariant} size="4em" />
      <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">
        {title}
      </h1>
    </div>

    <form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
      <div class="m-4 flex flex-col gap-2">
        <label class="immich-form-label" for="name">Name</label>
        <input class="immich-form-input" id="name" name="name" type="text" bind:value={apiKey.name} />
      </div>

      <div class="mt-8 flex w-full gap-4 px-4">
        <Button color="gray" fullwidth on:click={() => handleCancel()}>{cancelText}</Button>
        <Button type="submit" fullwidth>{submitText}</Button>
      </div>
    </form>
  </div>
</FullScreenModal>
