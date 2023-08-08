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

<FullScreenModal on:clickOutside={() => handleCancel()}>
  <div
    class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] max-w-[95vw] rounded-3xl py-8 dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-items-center place-content-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <FolderSync size="4em" />
      <h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium">
        {title}
      </h1>
    </div>

    <form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
      <div class="m-4 flex flex-col gap-2">
        <label class="immich-form-label" for="path">Name</label>
        <input class="immich-form-input" id="name" name="name" type="text" bind:value={library.name} />
      </div>

      {#if importPaths.length > 0}
        <div class="flex flex-row gap-4">
          {#each importPaths as importPath}
            <div class="flex rounded-lg gap-4 py-4 px-5 transition-all">
              <div class="text-left">
                <p class="text-immich-fg dark:text-immich-dark-fg">{importPath}</p>
              </div>
              <CircleIconButton
                on:click={() => {
                  editImportPath(importPath);
                }}
                logo={Pencil}
                size={'16'}
                title="Edit path"
              />
              <CircleIconButton
                on:click={() => {
                  removeImportPath(importPath);
                }}
                logo={Close}
                size={'16'}
                title="Remove path"
              />
            </div>
          {/each}
        </div>
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
        <div class="flex flex-row gap-4">
          {#each excludePatterns as excludePattern}
            <div class="flex rounded-lg gap-4 py-4 px-5 transition-all">
              <div class="text-left">
                <p class="text-immich-fg dark:text-immich-dark-fg">{excludePattern}</p>
              </div>
              <CircleIconButton
                on:click={() => {
                  editExcludePattern(excludePattern);
                }}
                logo={Pencil}
                size={'16'}
                title="Edit pattern"
              />
              <CircleIconButton
                on:click={() => {
                  removeExcludePattern(excludePattern);
                }}
                logo={Close}
                size={'16'}
                title="Remove pattern"
              />
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-immich-fg dark:text-immich-dark-fg text-center">No exclude patterns</p>
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
      {#if library.id}
        <div class="flex w-full px-4 gap-4 mt-8">
          <Button color="gray" fullwidth on:click={() => handleRefresh()}>{refreshText}</Button>
          <Button color="gray" fullwidth on:click={() => handleForceRefresh()}>{forceRefreshText}</Button>
          <Button color="gray" fullwidth on:click={() => handleEmptyTrash()}>{emptyTrashText}</Button>
        </div>
      {/if}
      <div class="flex w-full px-4 gap-4 mt-8">
        <Button color="gray" fullwidth on:click={() => handleCancel()}>{cancelText}</Button>
        <Button type="submit" fullwidth>{submitText}</Button>
      </div>
    </form>
  </div>
</FullScreenModal>
