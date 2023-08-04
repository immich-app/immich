<script lang="ts">
  import { LibraryResponseDto, SetImportPathsDto, api } from '@api';
  import Close from 'svelte-material-icons/Close.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { handleError } from '../../utils/handle-error';
  import { onMount } from 'svelte';
  import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import LibraryImportPathForm from '../forms/library-import-path-form.svelte';

  export let library: LibraryResponseDto;

  let importPaths: string[] = [];
  let addPath = false;
  let importPathToAdd: string;
  let removeImportPath: string | null = null;

  const refreshPaths = async () => {
    const { data } = await api.libraryApi.getImportPaths({ id: library.id });
    importPaths = data;
  };

  const removeImportPath = async (path) => {
    try {
      library.importPaths = library.importPaths.filter((path) => path != removeImportPath);
      importPaths=library.importPaths;
      await setImportPaths();
    } catch (error) {
      handleError(error, 'Unable to remove path');
    }
  };

  const handleAddImportPath = async () => {
    if (!addPath) {
      return;
    }

    try {
      importPaths.push(importPathToAdd);
      addPath = false;
      await setImportPaths();
    } catch (error) {
      handleError(error, 'Unable to remove path');
    }
  };

  const setImportPaths = async () => {
    try {
      let a: SetImportPathsDto = { importPaths: importPaths };

      const { data } = await api.libraryApi.setImportPaths({ id: library.id, setImportPathsDto: a });
      importPaths = data.importPaths;
    } catch (error) {
      handleError(error, 'Unable to add paths');
    }
  };

  onMount(async () => {
    await refreshPaths();
  });
</script>

<section class="my-4">
  {#if importPaths.length > 0}
    <div class="flex flex-row gap-4">
      {#each importPaths as importPath}
        <div class="flex rounded-lg gap-4 py-4 px-5 transition-all">
          <div class="text-left">
            <p class="text-immich-fg dark:text-immich-dark-fg">{importPath}</p>
          </div>
          <CircleIconButton
            on:click={() => {removeImportPath = importPath;  handleRemoveImportPath()}}}
            logo={Close}
            size={'16'}
            title="Remove path"
          />
        </div>
      {/each}
    </div>
  {/if}
  <div class="flex justify-end">
    <Button size="sm" on:click={() => (addPath = true)}>Add path</Button>
  </div>
</section>

{#if addPath}
  <LibraryImportPathForm
    title="Add Library Import Path"
    submitText="Add"
    bind:importPath={importPathToAdd}
    on:submit={handleAddImportPath}
    on:cancel={() => (addPath = false)}
  />
{/if}

{#if removeImportPath}
  <ConfirmDialogue
    title="Remove path?"
    prompt="{removeImportPath} will be removed."
    on:cancel={() => (removeImportPath = null)}
    on:confirm={() => handleRemoveImportPath()}
  />
{/if}
