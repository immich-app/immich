<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FolderSync from 'svelte-material-icons/FolderSync.svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';

  export let importPath: string;
  export let title = 'Import path';
  export let cancelText = 'Cancel';
  export let submitText = 'Save';
  export let canDelete = false;

  const dispatch = createEventDispatcher();
  const handleCancel = () => dispatch('cancel');
  const handleSubmit = () => dispatch('submit', { importPath });
</script>

<FullScreenModal on:clickOutside={() => handleCancel()}>
  <div
    class="bg-immich-bg dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg w-[500px] max-w-[95vw] rounded-3xl border p-4 py-8 shadow-sm"
  >
    <div
      class="text-immich-primary dark:text-immich-dark-primary flex flex-col place-content-center place-items-center gap-4 px-4"
    >
      <FolderSync size="4em" />
      <h1 class="text-immich-primary dark:text-immich-dark-primary text-2xl font-medium">
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
        <input class="immich-form-input" id="name" name="name" type="text" bind:value={importPath} />
      </div>

      <div class="mt-8 flex w-full gap-4 px-4">
        <Button color="gray" fullwidth on:click={() => handleCancel()}>{cancelText}</Button>
        {#if canDelete}
          <Button color="red" fullwidth on:click={() => dispatch('delete')}>Delete</Button>
        {/if}

        <Button type="submit" fullwidth>{submitText}</Button>
      </div>
    </form>
  </div>
</FullScreenModal>
