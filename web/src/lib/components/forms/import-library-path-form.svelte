<script lang="ts">
  import { api } from '@api';
  import { createEventDispatcher } from 'svelte';
  import FolderSync from 'svelte-material-icons/FolderSync.svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { LibraryType, type LibraryResponseDto } from '@api';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import Close from 'svelte-material-icons/Close.svelte';
  import Pencil from 'svelte-material-icons/Pencil.svelte';
  import { handleError } from '../../utils/handle-error';
  import LibraryImportPathForm from './library-import-path-form.svelte';
  import { onMount } from 'svelte';
  import LibraryExcludePatternForm from './library-exclude-pattern-form.svelte';
  import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
  import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';

  export let title = 'Create Import Library';

  export let cancelText = 'Cancel';
  export let submitText = 'Save';

  export let refreshText = 'Refresh Library';
  export let forceRefreshText = 'Force Refresh';
  export let emptyTrashText = 'Empty Trash';

  export let library: Partial<LibraryResponseDto>;

  let disableForm = false;

  let addPath = false;
  let editPath = false;

  let importPathToAdd: string;
  let importPathToEdit: string;
  let editedImportPath: string;

  let importPaths: string[] = [];

  let addPattern = false;
  let editPattern = false;

  let excludePatternToAdd: string;
  let excludePatternToEdit: string;
  let editedExcludePattern: string;

  let excludePatterns: string[] = [];

  onMount(() => {
    if (library.importPaths) {
      importPaths = library.importPaths;
    } else {
      library.importPaths = [];
    }

    if (library.excludePatterns) {
      excludePatterns = library.excludePatterns;
    } else {
      library.excludePatterns = [];
    }
  });

  const dispatch = createEventDispatcher();
  const handleCancel = () => {
    if (!disableForm) {
      dispatch('cancel');
    }
  };

  const handleSubmit = () => {
    if (!disableForm) {
      dispatch('submit', { ...library, libraryType: LibraryType.Import });
    }
  };

  const removeImportPath = async (pathToRemove: string) => {
    if (!library.importPaths) {
      library.importPaths = [];
    }

    try {
      library.importPaths = library.importPaths.filter((path) => path != pathToRemove);
      importPaths = library.importPaths;
    } catch (error) {
      handleError(error, 'Unable to remove path');
    }
    disableForm = false;
  };

  const editImportPath = async (pathToEdit: string) => {
    importPathToEdit = pathToEdit;
    editedImportPath = pathToEdit;

    editPath = true;
    disableForm = true;
  };

  const handleAddImportPath = async () => {
    disableForm = false;
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
    disableForm = false;
    if (!editPath) {
      return;
    }

    if (!library.importPaths) {
      library.importPaths = [];
    }

    try {
      const index = library.importPaths.indexOf(importPathToEdit);
      library.importPaths[index] = editedImportPath;
      importPaths = library.importPaths;
      editPath = false;
    } catch (error) {
      handleError(error, 'Unable to edit import path');
    }
  };

  const handleDeleteImportPath = async () => {
    disableForm = false;
    if (!editPath) {
      return;
    }

    try {
      if (!library.importPaths) {
        library.importPaths = [];
      }
      library.importPaths = library.importPaths.filter((path) => path != importPathToEdit);

      importPaths = library.importPaths;
      editPath = false;
    } catch (error) {
      handleError(error, 'Unable to edit import path');
    }
  };

  const handleRefresh = async () => {
    if (!library.id) {
      return;
    }

    try {
      await api.libraryApi.refreshLibrary({ id: library.id, scanLibraryDto: {} });
    } catch (error) {
      handleError(error, 'Unable to refresh library');
    }
  };

  const handleForceRefresh = async () => {
    if (!library.id) {
      return;
    }

    try {
      await api.libraryApi.refreshLibrary({ id: library.id, scanLibraryDto: { forceRefresh: true } });
    } catch (error) {
      handleError(error, 'Unable to force refresh library');
    }
  };

  const handleEmptyTrash = async () => {
    if (!library.id) {
      return;
    }

    try {
      await api.libraryApi.refreshLibrary({ id: library.id, scanLibraryDto: { emptyTrash: true } });
    } catch (error) {
      handleError(error, 'Unable to empty trash');
    }
  };

  const removeExcludePattern = async (patternToRemove: string) => {
    if (!library.excludePatterns) {
      library.excludePatterns = [];
    }

    try {
      library.excludePatterns = library.excludePatterns.filter((pattern) => pattern != patternToRemove);
      excludePatterns = library.excludePatterns;
    } catch (error) {
      handleError(error, 'Unable to remove pattern');
    }
    disableForm = false;
  };

  const editExcludePattern = async (patternToEdit: string) => {
    excludePatternToEdit = patternToEdit;
    editedExcludePattern = patternToEdit;

    editPattern = true;
    disableForm = true;
  };

  const handleAddExcludePattern = async () => {
    disableForm = false;
    if (!addPattern) {
      return;
    }

    if (!library.excludePatterns) {
      library.excludePatterns = [];
    }

    try {
      library.excludePatterns.push(excludePatternToAdd);
      excludePatterns = library.excludePatterns;
      console.log(excludePatterns);
      addPattern = false;
    } catch (error) {
      handleError(error, 'Unable to remove exclude pattern');
    }
  };

  const handleDeleteExcludePattern = async () => {
    disableForm = false;
    if (!editPattern) {
      return;
    }

    try {
      if (!library.excludePatterns) {
        library.excludePatterns = [];
      }
      library.excludePatterns = library.excludePatterns.filter((pattern) => pattern != excludePatternToEdit);

      excludePatterns = library.excludePatterns;
      editPattern = false;
    } catch (error) {
      handleError(error, 'Unable to edit exclude pattern');
    }
  };

  const handleEditExcludePattern = async () => {
    disableForm = false;
    if (!editPattern) {
      return;
    }

    if (!library.excludePatterns) {
      library.excludePatterns = [];
    }

    try {
      const index = library.excludePatterns.indexOf(excludePatternToEdit);
      library.excludePatterns[index] = editedExcludePattern;
      excludePatterns = library.excludePatterns;
      editPattern = false;
    } catch (error) {
      handleError(error, 'Unable to edit exclude pattern');
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
      disableForm = false;
    }}
  />
{/if}

{#if editPath}
  <LibraryImportPathForm
    title="Edit Import Path"
    submitText="Save"
    canDelete={true}
    bind:importPath={editedImportPath}
    on:submit={handleEditImportPath}
    on:delete={handleDeleteImportPath}
    on:cancel={() => {
      editPath = false;
      disableForm = false;
    }}
  />
{/if}

{#if addPattern}
  <LibraryExcludePatternForm
    title="Add Exclude Pattern"
    submitText="Add"
    bind:excludePattern={excludePatternToAdd}
    on:submit={handleAddExcludePattern}
    on:cancel={() => {
      addPattern = false;
      disableForm = false;
    }}
  />
{/if}

{#if editPattern}
  <LibraryExcludePatternForm
    title="Edit Exclude Pattern"
    submitText="Save"
    canDelete={true}
    bind:excludePattern={editedExcludePattern}
    on:submit={handleEditExcludePattern}
    on:delete={handleDeleteExcludePattern}
    on:cancel={() => {
      editPattern = false;
      disableForm = false;
    }}
  />
{/if}

<form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
  <div class="flex w-full px-4 gap-4 mt-8">
    <Button color="gray" fullwidth on:click={() => handleCancel()}>{cancelText}</Button>
    <Button color="red" fullwidth on:click={() => dispatch('delete')}>Delete</Button>
    <Button type="submit" fullwidth>{submitText}</Button>
  </div>
  {#if library.id}
    <div class="flex w-full px-4 gap-4 mt-8">
      <Button color="gray" fullwidth on:click={() => handleRefresh()}>{refreshText}</Button>
      <Button color="gray" fullwidth on:click={() => handleForceRefresh()}>{forceRefreshText}</Button>
      <Button color="gray" fullwidth on:click={() => handleEmptyTrash()}>{emptyTrashText}</Button>
    </div>
  {/if}

  <div class="m-4 flex flex-col gap-2">
    <label class="immich-form-label" for="path">Name</label>
    <input class="immich-form-input" id="name" name="name" type="text" bind:value={library.name} />
  </div>

  {#if importPaths.length > 0}
    <table class="w-full text-left">
      <thead
        class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
      >
        <tr class="flex w-full place-items-center">
          <th class="w-2/3 text-center text-sm font-medium">Path</th>
          <th class="w-1/3 text-center text-sm font-medium">Action</th>
        </tr>
      </thead>
      <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
        {#each importPaths as importPath, i}
          <tr
            class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
              i % 2 == 0 ? 'bg-immich-gray dark:bg-immich-dark-gray/75' : 'bg-immich-bg dark:bg-immich-dark-gray/50'
            }`}
          >
            <td class="w-2/3 text-ellipsis px-4 text-sm">{importPath}</td>
            <td class="w-1/3 text-ellipsis px-4 text-sm">
              <button
                on:click={() => {
                  editImportPath(importPath);
                }}
                class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
              >
                <PencilOutline size="16" />
              </button>

              <button
                on:click={() => {
                  removeImportPath(importPath);
                }}
                class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
              >
                <TrashCanOutline size="16" />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="text-immich-fg dark:text-immich-dark-fg text-center">No paths added</p>
  {/if}
  <div class="flex justify-end">
    <Button
      size="sm"
      on:click={() => {
        addPath = true;
        disableForm = true;
      }}>Add path</Button
    >
  </div>

  {#if excludePatterns.length > 0}
    <table class="w-full text-left">
      <thead
        class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
      >
        <tr class="flex w-full place-items-center">
          <th class="w-2/3 text-center text-sm font-medium">Pattern</th>
          <th class="w-1/3 text-center text-sm font-medium">Action</th>
        </tr>
      </thead>
      <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
        {#each excludePatterns as excludePattern, i}
          <tr
            class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
              i % 2 == 0 ? 'bg-immich-gray dark:bg-immich-dark-gray/75' : 'bg-immich-bg dark:bg-immich-dark-gray/50'
            }`}
          >
            <td class="w-2/3 text-ellipsis px-4 text-sm">{excludePattern}</td>
            <td class="w-1/3 text-ellipsis px-4 text-sm">
              <button
                on:click={() => {
                  editExcludePattern(excludePattern);
                }}
                class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
              >
                <PencilOutline size="16" />
              </button>

              <button
                on:click={() => {
                  removeExcludePattern(excludePattern);
                }}
                class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
              >
                <TrashCanOutline size="16" />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="text-immich-fg dark:text-immich-dark-fg text-center">No exclude pattern</p>
  {/if}

  <div class="flex justify-end">
    <Button
      size="sm"
      on:click={() => {
        addPattern = true;
        disableForm = true;
      }}>Add exclude pattern</Button
    >
  </div>
</form>
