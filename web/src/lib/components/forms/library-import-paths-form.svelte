<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import { handleError } from '../../utils/handle-error';
  import LibraryImportPathForm from './library-import-path-form.svelte';
  import { onMount } from 'svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { LibraryResponseDto } from '@api';
  import { mdiPencilOutline } from '@mdi/js';

  export let library: Partial<LibraryResponseDto>;

  let addImportPath = false;
  let editImportPath: number | null = null;

  let importPathToAdd: string | null = null;
  let editedImportPath: string;

  let importPaths: string[] = [];

  onMount(() => {
    if (library.importPaths) {
      importPaths = library.importPaths;
    } else {
      library.importPaths = [];
    }
  });

  const dispatch = createEventDispatcher<{
    cancel: void;
    submit: Partial<LibraryResponseDto>;
  }>();
  const handleCancel = () => {
    dispatch('cancel');
  };

  const handleSubmit = () => {
    dispatch('submit', { ...library });
  };

  const handleAddImportPath = async () => {
    if (!addImportPath || !importPathToAdd) {
      return;
    }

    if (!library.importPaths) {
      library.importPaths = [];
    }

    try {
      // Check so that import path isn't duplicated
      if (!library.importPaths.includes(importPathToAdd)) {
        library.importPaths.push(importPathToAdd);
        importPaths = library.importPaths;
      }
    } catch (error) {
      handleError(error, 'Unable to add import path');
    } finally {
      addImportPath = false;
      importPathToAdd = null;
    }
  };

  const handleEditImportPath = async () => {
    if (editImportPath === null) {
      return;
    }

    if (!library.importPaths) {
      library.importPaths = [];
    }

    try {
      // Check so that import path isn't duplicated

      if (!library.importPaths.includes(editedImportPath)) {
        // Update import path
        library.importPaths[editImportPath] = editedImportPath;
        importPaths = library.importPaths;
      }
    } catch (error) {
      editImportPath = null;
      handleError(error, 'Unable to edit import path');
    } finally {
      editImportPath = null;
    }
  };

  const handleDeleteImportPath = async () => {
    if (editImportPath === null) {
      return;
    }

    try {
      if (!library.importPaths) {
        library.importPaths = [];
      }

      const pathToDelete = library.importPaths[editImportPath];
      library.importPaths = library.importPaths.filter((path) => path != pathToDelete);
      importPaths = library.importPaths;
    } catch (error) {
      handleError(error, 'Unable to delete import path');
    } finally {
      editImportPath = null;
    }
  };
</script>

{#if addImportPath}
  <LibraryImportPathForm
    title="Add Import Path"
    submitText="Add"
    bind:importPath={importPathToAdd}
    {importPaths}
    on:submit={handleAddImportPath}
    on:cancel={() => {
      addImportPath = false;
      importPathToAdd = null;
    }}
  />
{/if}

{#if editImportPath != undefined}
  <LibraryImportPathForm
    title="Edit Import Path"
    submitText="Save"
    isEditing={true}
    bind:importPath={editedImportPath}
    {importPaths}
    on:submit={handleEditImportPath}
    on:delete={handleDeleteImportPath}
    on:cancel={() => {
      editImportPath = null;
    }}
  />
{/if}

<form on:submit|preventDefault={() => handleSubmit()} autocomplete="off" class="m-4 flex flex-col gap-4">
  <table class="text-left">
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
              type="button"
              on:click={() => {
                editImportPath = listIndex;
                editedImportPath = importPath;
              }}
              class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
            >
              <Icon path={mdiPencilOutline} size="16" />
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
        <td class="w-4/5 text-ellipsis px-4 text-sm">
          {#if importPaths.length === 0}
            No paths added
          {/if}</td
        >
        <td class="w-1/5 text-ellipsis px-4 text-sm"
          ><Button
            type="button"
            size="sm"
            on:click={() => {
              addImportPath = true;
            }}>Add path</Button
          ></td
        ></tr
      >
    </tbody>
  </table>

  <div class="flex w-full justify-end gap-2">
    <Button size="sm" color="gray" on:click={() => handleCancel()}>Cancel</Button>
    <Button size="sm" type="submit">Save</Button>
  </div>
</form>
