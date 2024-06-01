<script lang="ts">
  import { createEventDispatcher } from 'svelte';
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

<FullScreenModal {title} icon={mdiFolderSync} onClose={handleCancel}>
  <form on:submit|preventDefault={() => handleSubmit()} autocomplete="off" id="library-import-path-form">
    <p class="py-5 text-sm">
      Specify a folder to import. This folder, including subfolders, will be scanned for images and videos.
    </p>

    <div class="my-4 flex flex-col gap-2">
      <label class="immich-form-label" for="path">Path</label>
      <input class="immich-form-input" id="path" name="path" type="text" bind:value={importPath} />
    </div>

    <div class="mt-8 flex w-full gap-4">
      {#if isDuplicate}
        <p class="text-red-500 text-sm">This import path already exists.</p>
      {/if}
    </div>
  </form>
  <svelte:fragment slot="sticky-bottom">
    <Button color="gray" fullwidth on:click={() => handleCancel()}>{cancelText}</Button>
    {#if isEditing}
      <Button color="red" fullwidth on:click={() => dispatch('delete')}>Delete</Button>
    {/if}
    <Button type="submit" disabled={!canSubmit} fullwidth form="library-import-path-form">{submitText}</Button>
  </svelte:fragment>
</FullScreenModal>
