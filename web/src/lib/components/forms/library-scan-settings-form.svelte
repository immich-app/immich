<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import { LibraryType, type LibraryResponseDto } from '@api';
  import { handleError } from '../../utils/handle-error';
  import LibraryImportPathForm from './library-import-path-form.svelte';
  import { onMount } from 'svelte';
  import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
  import LibraryExclusionPatternForm from './library-exclusion-pattern-form.svelte';

  export let library: Partial<LibraryResponseDto>;

  let addExclusionPattern = false;
  let editExclusionPattern: number | null = null;
  let deleteExcludePattern: number | null = null;

  let exclusionPatternToAdd: string;
  let editedExclusionPattern: string;

  let exclusionPatterns: string[] = [];

  onMount(() => {
    if (library.excludePatterns) {
      exclusionPatterns = library.excludePatterns;
    } else {
      library.excludePatterns = [];
    }
  });

  const dispatch = createEventDispatcher();
  const handleCancel = () => {
    dispatch('cancel');
  };

  const handleSubmit = () => {
    dispatch('submit', { ...library, libraryType: LibraryType.External });
  };

  const handleAddExclusionPattern = async () => {
    if (!addExclusionPattern) {
      return;
    }

    if (!library.excludePatterns) {
      library.excludePatterns = [];
    }

    try {
      library.excludePatterns.push(exclusionPatternToAdd);
      exclusionPatterns = library.excludePatterns;
      addExclusionPattern = false;
    } catch (error) {
      handleError(error, 'Unable to add exclude pattern');
    }
  };

  const handleEditExclusionPattern = async () => {
    if (!editExclusionPattern) {
      return;
    }

    if (!library.excludePatterns) {
      library.excludePatterns = [];
    }

    try {
      library.excludePatterns[editExclusionPattern] = editedExclusionPattern;
      exclusionPatterns = library.excludePatterns;
    } catch (error) {
      editExclusionPattern = null;
      handleError(error, 'Unable to edit exclude pattern');
    }
  };

  const handleDeleteExclusionPattern = async () => {
    if (!deleteExcludePattern) {
      return;
    }

    try {
      if (!library.excludePatterns) {
        library.excludePatterns = [];
      }

      const pathToDelete = library.excludePatterns[deleteExcludePattern];
      library.excludePatterns = library.excludePatterns.filter((path) => path != pathToDelete);
      exclusionPatterns = library.excludePatterns;
    } catch (error) {
      deleteExcludePattern = null;
      handleError(error, 'Unable to delete exclude pattern');
    }
  };
</script>

{#if addExclusionPattern}
  <LibraryExclusionPatternForm
    submitText="Add"
    bind:exclusionPattern={exclusionPatternToAdd}
    on:submit={handleAddExclusionPattern}
    on:cancel={() => {
      addExclusionPattern = false;
    }}
  />
{/if}

{#if editExclusionPattern}
  <LibraryExclusionPatternForm
    submitText="Save"
    canDelete={true}
    bind:exclusionPattern={editedExclusionPattern}
    on:submit={handleEditExclusionPattern}
    on:delete={handleDeleteExclusionPattern}
    on:cancel={() => {
      editExclusionPattern = null;
    }}
  />
{/if}

<form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
  <div class="mt-8 flex w-full gap-4 px-4">
    <Button color="gray" fullwidth on:click={() => handleCancel()}>Cancel</Button>
    <Button type="submit" fullwidth>Save</Button>
  </div>
  <table class="w-full text-left">
    <tbody class="dark:border-immich-dark-gray block w-full overflow-y-auto rounded-md border">
      {#each exclusionPatterns as excludePattern, listIndex}
        <tr
          class={`dark:text-immich-dark-fg flex h-[80px] w-full place-items-center text-center ${
            listIndex % 2 == 0
              ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
              : 'bg-immich-bg dark:bg-immich-dark-gray/50'
          }`}
        >
          <td class="w-3/4 text-ellipsis px-4 text-sm">{excludePattern}</td>
          <td class="w-1/4 text-ellipsis px-4 text-sm">
            <button
              on:click={() => {
                editExclusionPattern = listIndex;
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
          exclusionPatterns.length % 2 == 0
            ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
            : 'bg-immich-bg dark:bg-immich-dark-gray/50'
        }`}
      >
        <td class="w-3/4 text-ellipsis px-4 text-sm">
          {#if exclusionPatterns.length === 0}
            No pattern added
          {/if}
        </td>
        <td class="w-1/4 text-ellipsis px-4 text-sm"
          ><Button
            size="sm"
            on:click={() => {
              addExclusionPattern = true;
            }}>Add Exclusion Pattern</Button
          ></td
        ></tr
      >
    </tbody>
  </table>
  <div class="flex justify-end" />
</form>
