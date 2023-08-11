<script lang="ts">
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

  let addExcludePattern = false;
  let editExcludePattern: number | null = null;
  let deleteExcludePattern: number | null = null;

  let excludePatternToAdd: string;
  let excludePatternToEdit: string;
  let editedExcludePattern: string;

  let excludePatterns: string[] = [];

  onMount(() => {
    if (library.excludePatterns) {
      excludePatterns = library.excludePatterns;
    } else {
      library.excludePatterns = [];
    }
  });

  const dispatch = createEventDispatcher();
  const handleCancel = () => {
    dispatch('cancel');
  };

  const handleSubmit = () => {
    dispatch('submit', { ...library, libraryType: LibraryType.Import });
  };

  const handleAddExcludePattern = async () => {
    if (!addExcludePattern) {
      return;
    }

    if (!library.excludePatterns) {
      library.excludePatterns = [];
    }

    try {
      library.excludePatterns.push(excludePatternToAdd);
      excludePatterns = library.excludePatterns;
      addExcludePattern = false;
    } catch (error) {
      handleError(error, 'Unable to add exclude pattern');
    }
  };

  const handleEditExcludePattern = async () => {
    if (!editExcludePattern) {
      return;
    }

    if (!library.excludePatterns) {
      library.excludePatterns = [];
    }

    try {
      library.excludePatterns[editExcludePattern] = editedExcludePattern;
      excludePatterns = library.excludePatterns;
    } catch (error) {
      editExcludePattern = null;
      handleError(error, 'Unable to edit exclude pattern');
    }
  };

  const handleDeleteExcludePattern = async () => {
    if (!deleteExcludePattern) {
      return;
    }

    try {
      if (!library.excludePatterns) {
        library.excludePatterns = [];
      }

      const pathToDelete = library.excludePatterns[deleteExcludePattern];
      library.excludePatterns = library.excludePatterns.filter((path) => path != pathToDelete);
      excludePatterns = library.excludePatterns;
    } catch (error) {
      deleteExcludePattern = null;
      handleError(error, 'Unable to delete exclude pattern');
    }
  };
</script>

{#if addExcludePattern}
  <LibraryImportPathForm
    title="Add Import Path"
    submitText="Add"
    bind:importPath={excludePatternToAdd}
    on:submit={handleAddExcludePattern}
    on:cancel={() => {
      addExcludePattern = false;
    }}
  />
{/if}

{#if editExcludePattern}
  <LibraryImportPathForm
    title="Edit Import Path"
    submitText="Save"
    canDelete={true}
    bind:importPath={editedExcludePattern}
    on:submit={handleEditExcludePattern}
    on:delete={handleDeleteExcludePattern}
    on:cancel={() => {
      editExcludePattern = null;
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
      {#each excludePatterns as excludePattern, listIndex}
        <tr
          class={`dark:text-immich-dark-fg flex h-[80px] w-full place-items-center text-center ${
            listIndex % 2 == 0
              ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
              : 'bg-immich-bg dark:bg-immich-dark-gray/50'
          }`}
        >
          <td class="w-4/5 text-ellipsis px-4 text-sm">{excludePattern}</td>
          <td class="w-1/5 text-ellipsis px-4 text-sm">
            <button
              on:click={() => {
                editExcludePattern = listIndex;
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
          excludePatterns.length % 2 == 0
            ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
            : 'bg-immich-bg dark:bg-immich-dark-gray/50'
        }`}
      >
        <td class="w-4/5 text-ellipsis px-4 text-sm" />
        <td class="w-1/5 text-ellipsis px-4 text-sm"
          ><Button
            size="sm"
            on:click={() => {
              addExcludePattern = true;
            }}>Add Exclusion Pattern</Button
          ></td
        ></tr
      >
    </tbody>
  </table>
  <div class="flex justify-end" />
</form>
