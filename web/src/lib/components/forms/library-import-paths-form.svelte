<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import { handleError } from '../../utils/handle-error';
  import LibraryImportPathForm from './library-import-path-form.svelte';
  import { onMount } from 'svelte';
  import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
  import type { LibraryResponseDto } from '@api';

  export let library: Partial<LibraryResponseDto>;

  let addImportPath = false;
  let editImportPath: number | null = null;
  let deleteImportPath: number | null = null;

  let importPathToAdd: string;
  let editedImportPath: string;

  let importPaths: string[] = [];

  onMount(() => {
    if (library.importPaths) {
      importPaths = library.importPaths;
    } else {
      library.importPaths = [];
    }
  });

  const dispatch = createEventDispatcher();
  const handleCancel = () => {
    dispatch('cancel');
  };

  const handleSubmit = () => {
    dispatch('submit', { ...library });
  };

  const handleAddImportPath = async () => {
    if (!addImportPath) {
      return;
    }

    if (!library.importPaths) {
      library.importPaths = [];
    }

    try {
      library.importPaths.push(importPathToAdd);
      importPaths = library.importPaths;
    } catch (error) {
      handleError(error, 'Unable to remove import path');
    } finally {
      addImportPath = false;
    }
  };

  const handleEditImportPath = async () => {
    if (!editImportPath) {
      return;
    }

    if (!library.importPaths) {
      library.importPaths = [];
    }

    try {
      library.importPaths[editImportPath] = editedImportPath;
      importPaths = library.importPaths;
    } catch (error) {
      editImportPath = null;
      handleError(error, 'Unable to edit import path');
    } finally {
      editImportPath = null;
    }
  };

  const handleDeleteImportPath = async () => {
    if (!deleteImportPath) {
      return;
    }

    try {
      if (!library.importPaths) {
        library.importPaths = [];
      }

      const pathToDelete = library.importPaths[deleteImportPath];
      library.importPaths = library.importPaths.filter((path) => path != pathToDelete);
      importPaths = library.importPaths;
    } catch (error) {
      handleError(error, 'Unable to delete import path');
    } finally {
      deleteImportPath = null;
    }
  };
</script>

{#if addImportPath}
  <LibraryImportPathForm
    title="Add Import Path"
    submitText="Add"
    bind:importPath={importPathToAdd}
    on:submit={handleAddImportPath}
    on:cancel={() => {
      addImportPath = false;
    }}
  />
{/if}

{#if editImportPath != null}
  <LibraryImportPathForm
    title="Edit Import Path"
    submitText="Save"
    canDelete={true}
    importPath={editedImportPath}
    on:submit={handleEditImportPath}
    on:delete={handleDeleteImportPath}
    on:cancel={() => {
      editImportPath = null;
    }}
  />
{/if}

<form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
  <div class="mt-8 flex w-full gap-4 px-4">
    <Button color="gray" fullwidth on:click={() => handleCancel()}>Cancel</Button>
    <Button type="submit" fullwidth>Save</Button>
  </div>

  <table class="w-full text-left">
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      {#each importPaths as importPath, listIndex}
        <tr
          class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
            listIndex % 2 == 0
              ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
              : 'bg-immich-bg dark:bg-immich-dark-gray/50'
          }`}
        >
          <td class="w-4/5 text-ellipsis px-4 text-sm">{importPath}</td>
          <td class="w-1/5 text-ellipsis px-4 text-sm">
            <button
              on:click={() => {
                editImportPath = listIndex;
              }}
              class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
            >
              <PencilOutline size="16" />
            </button>
          </td>
        </tr>
      {/each}
      <tr
        class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
          importPaths.length % 2 == 0
            ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
            : 'bg-immich-bg dark:bg-immich-dark-gray/50'
        }`}
      >
        <td class="w-4/5 text-ellipsis px-4 text-sm" />
        <td class="w-1/5 text-ellipsis px-4 text-sm"
          ><Button
            size="sm"
            on:click={() => {
              addImportPath = true;
            }}>Add path</Button
          ></td
        ></tr
      >
    </tbody>
  </table>
  <div class="flex justify-end" />
</form>
