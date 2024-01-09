<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { mdiFolderSync } from '@mdi/js';

  export let importPath: string;
  export let title = 'Import path';
  export let cancelText = 'Cancel';
  export let submitText = 'Save';
  export let canDelete = false;

  const dispatch = createEventDispatcher<{
    cancel: void;
    submit: { importPath: string };
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
        Spécifiez un dossier à importer. Ce dossier, y compris les sous-dossiers, sera analysé à la recherche d'images et de vidéos. 
        Notez que vous n'êtes autorisé à importer que des chemins situés à l'intérieur du chemin externe de votre compte, 
        configuré dans les paramètres administratifs.
      </p>

      <div class="m-4 flex flex-col gap-2">
        <label class="immich-form-label" for="path">Chemin</label>
        <input class="immich-form-input" id="path" name="path" type="text" bind:value={importPath} />
      </div>

      <div class="mt-8 flex w-full gap-4 px-4">
        <Button color="gray" fullwidth on:click={() => handleCancel()}>{cancelText}</Button>
        {#if canDelete}
          <Button color="red" fullwidth on:click={() => dispatch('delete')}>Supprimer</Button>
        {/if}

        <Button type="submit" fullwidth>{submitText}</Button>
      </div>
    </form>
  </div>
</FullScreenModal>
