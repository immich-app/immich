<script lang="ts">
  import { LibraryResponseDto, api } from '@api';
  import Close from 'svelte-material-icons/Close.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { handleError } from '../../utils/handle-error';
  import { onMount } from 'svelte';
  import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import LibraryImportPathForm from '../forms/library-import-path-form.svelte';

  export let library: LibraryResponseDto;

  let importPaths: string[] = [];

  let addImportPath = false;
  let importPathToAdd: string;
  let removeImportPath: string | null = null;

  const refreshPaths = () => api.libraryApi.getImportPaths({ id: library.id }).then(({ data }) => (importPaths = data));

  const handleRemoveImportPath = async () => {
    if (!removeImportPath) {
      return;
    }

    try {
      importPaths = importPaths.filter((path) => path != removeImportPath);

      removeImportPath = null;
      await handleSetImportPaths();
    } catch (error) {
      handleError(error, 'Unable to remove path');
    }
  };

  const handleAddImportPath = async () => {
    if (!addImportPath) {
      return;
    }

    try {
      importPaths.push(importPathToAdd);

      addImportPath = false;
      await handleSetImportPaths();
    } catch (error) {
      handleError(error, 'Unable to remove path');
    }
  };

  const handleSetImportPaths = async () => {
    try {
      await api.libraryApi.setImportPaths({ id: library.id, setImportPathsDto: { importPaths: importPaths } });

      await refreshPaths();
      addImportPath = false;
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
            <p class="text-immich-fg dark:text-immich-dark-fg">path</p>
          </div>
          <CircleIconButton
            on:click={() => (removeImportPath = importPath)}
            logo={Close}
            size={'16'}
            title="Remove path"
          />
        </div>
      {/each}
    </div>
  {/if}
  <div class="flex justify-end">
    <Button size="sm" on:click={() => (addImportPath = true)}>Add path</Button>
  </div>
</section>

{#if addImportPath}
  <LibraryImportPathForm
    title="Add Library Import Path"
    submitText="Add"
    importPath={importPathToAdd}
    on:close={() => (addImportPath = false)}
    on:add-import-paths={() => handleAddImportPath()}
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
