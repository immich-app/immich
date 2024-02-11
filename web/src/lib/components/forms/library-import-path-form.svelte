<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { mdiFolderSync } from '@mdi/js';
  import { onMount } from 'svelte';

  export let importPath: string | null;
  export let importPaths: string[] = [];
  export let title = 'Import path';
  export let cancelText = 'Cancel';
  export let submitText = 'Save';
  export let isEditing = false;

  onMount(() => {
    if (isEditing) {
      importPaths = importPaths.filter((path) => path !== importPath);
    }
  });

  $: isDuplicate = importPath !== null && importPaths.includes(importPath);
  $: canSubmit = importPath !== '' && importPath !== null && !importPaths.includes(importPath);

  const dispatch = createEventDispatcher<{
    cancel: void;
    submit: { importPath: string | null };
    delete: void;
  }>();
  const handleCancel = () => dispatch('cancel');
  const handleSubmit = () => dispatch('submit', { importPath });
</script>

<FullScreenModal on:clickOutside={() => handleCancel()}>
  <div
    class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <Icon path={mdiFolderSync} size="4em" />
      <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">
        {title}
      </h1>
    </div>

    <form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
      <p class="p-5 text-sm">
        Specify a folder to import. This folder, including subfolders, will be scanned for images and videos. Note that
        you are only allowed to import paths inside of your account's external path, configured in the administrative
        settings.
      </p>

      <div class="m-4 flex flex-col gap-2">
        <label class="immich-form-label" for="path">Path</label>
        <input class="immich-form-input" id="path" name="path" type="text" bind:value={importPath} />
      </div>

      <div class="mt-8 flex w-full gap-4 px-4">
        <Button color="gray" fullwidth on:click={() => handleCancel()}>{cancelText}</Button>
        {#if isEditing}
          <Button color="red" fullwidth on:click={() => dispatch('delete')}>Delete</Button>
        {/if}

        <Button type="submit" disabled={!canSubmit} fullwidth>{submitText}</Button>
      </div>

      <div class="mt-8 flex w-full gap-4 px-4">
        {#if isDuplicate}
          <p class="text-red-500 text-sm">This import path already exists.</p>
        {/if}
      </div>
    </form>
  </div>
</FullScreenModal>
