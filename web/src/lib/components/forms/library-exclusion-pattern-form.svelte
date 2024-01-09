<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiFolderRemove } from '@mdi/js';

  export let exclusionPattern: string;
  export let canDelete = false;
  export let submitText = 'Submit';

  const dispatch = createEventDispatcher<{
    cancel: void;
    submit: { excludePattern: string };
    delete: void;
  }>();
  const handleCancel = () => dispatch('cancel');
  const handleSubmit = () => dispatch('submit', { excludePattern: exclusionPattern });
</script>

<FullScreenModal on:clickOutside={() => handleCancel()}>
  <div
    class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <Icon path={mdiFolderRemove} size="4em" />
      <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Ajouter un motif d'exclusion</h1>
    </div>

    <form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
      <p class="p-5 text-sm">
        Les motifs d'exclusion vous permettent d'ignorer des fichiers et des dossiers lors de la numérisation de votre bibliothèque. 
        Cela est utile si vous avez des dossiers contenant des fichiers que vous ne souhaitez pas importer, tels que des fichiers RAW.
        <br /><br />
        Ajoutez des motifs d'exclusion. La recherche avec , ** et ? est prise en charge. Pour ignorer tous les fichiers dans un répertoire nommé 'Raw',
         utilisez '/Raw/'. Pour ignorer tous les fichiers se terminant par '.tif', utilisez '**/.tif'. Pour ignorer un chemin absolu, utilisez '/chemin/à/ignorer'.
      </p>
      <div class="m-4 flex flex-col gap-2">
        <label class="immich-form-label" for="exclusionPattern">Motifs</label>
        <input
          class="immich-form-input"
          id="exclusionPattern"
          name="exclusionPattern"
          type="text"
          bind:value={exclusionPattern}
        />
      </div>
      <div class="mt-8 flex w-full gap-4 px-4">
        <Button color="gray" fullwidth on:click={() => handleCancel()}>Annuler</Button>
        {#if canDelete}
          <Button color="red" fullwidth on:click={() => dispatch('delete')}>Supprimer</Button>
        {/if}

        <Button type="submit" fullwidth>{submitText}</Button>
      </div>
    </form>
  </div>
</FullScreenModal>
