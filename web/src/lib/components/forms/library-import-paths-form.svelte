<script lang="ts">
  import { api } from '@api';
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import { LibraryType, type LibraryResponseDto } from '@api';
  import { handleError } from '../../utils/handle-error';
  import LibraryImportPathForm from './library-import-path-form.svelte';
  import { onMount } from 'svelte';
  import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';

  let cancelText = 'Cancel';
  let submitText = 'Save';

  export let library: Partial<LibraryResponseDto>;

  let addPath = false;
  let editImportPath: number | null = null;
  let deleteImportPath: number | null = null;

  let importPathToAdd: string;
  let importPathToEdit: string;
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
    dispatch('submit', { ...library, libraryType: LibraryType.Import });
  };

  const handleAddImportPath = async () => {
    if (!addPath) {
      return;
    }

    if (!library.importPaths) {
      library.importPaths = [];
    }

    try {
      library.importPaths.push(importPathToAdd);
      importPaths = library.importPaths;
      addPath = false;
    } catch (error) {
      handleError(error, 'Unable to remove import path');
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
      deleteImportPath = null;
      handleError(error, 'Unable to delete import path');
    }
  };
</script>

{#if addPath}
  <LibraryImportPathForm
    title="Add Import Path"
    submitText="Add"
    bind:importPath={importPathToAdd}
    on:submit={handleAddImportPath}
    on:cancel={() => {
      addPath = false;
    }}
  />
{/if}

{#if editImportPath}
  <LibraryImportPathForm
    title="Edit Import Path"
    submitText="Save"
    canDelete={true}
    bind:importPath={editedImportPath}
    on:submit={handleEditImportPath}
    on:delete={handleDeleteImportPath}
    on:cancel={() => {
      editImportPath = null;
    }}
  />
{/if}

<form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
  <div class="mt-8 flex w-full gap-4 px-4">
    <Button color="gray" fullwidth on:click={() => handleCancel()}>{cancelText}</Button>
    <Button type="submit" fullwidth>{submitText}</Button>
  </div>

  <table class="w-full text-left">
    <tbody class="dark:border-immich-dark-gray block w-full overflow-y-auto rounded-md border">
      {#each importPaths as importPath, listIndex}
        <tr
          class={`dark:text-immich-dark-fg flex h-[80px] w-full place-items-center text-center ${
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
              class="bg-immich-primary hover:bg-immich-primary/75 dark:bg-immich-dark-primary rounded-full p-3 text-gray-100 transition-all duration-150 dark:text-gray-700"
            >
              <PencilOutline size="16" />
            </button>
          </td>
        </tr>
      {/each}
      <tr
        class={`dark:text-immich-dark-fg flex h-[80px] w-full place-items-center text-center ${
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
              addPath = true;
            }}>Add path</Button
          ></td
        ></tr
      >
    </tbody>
  </table>
  <div class="flex justify-end" />
</form>
