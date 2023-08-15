<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import { LibraryType, type LibraryResponseDto } from '@api';
  import { handleError } from '../../utils/handle-error';
  import { onMount } from 'svelte';
  import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
  import LibraryExclusionPatternForm from './library-exclusion-pattern-form.svelte';

  export let library: Partial<LibraryResponseDto>;

  let addExclusionPattern = false;
  let editExclusionPattern: number | null = null;
  let deleteExclusionPattern: number | null = null;

  let exclusionPatternToAdd: string;
  let editedExclusionPattern: string;

  let exclusionPatterns: string[] = [];

  onMount(() => {
    if (library.exclusionPatterns) {
      exclusionPatterns = library.exclusionPatterns;
    } else {
      library.exclusionPatterns = [];
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

    if (!library.exclusionPatterns) {
      library.exclusionPatterns = [];
    }

    try {
      library.exclusionPatterns.push(exclusionPatternToAdd);
      exclusionPatterns = library.exclusionPatterns;
      addExclusionPattern = false;
      console.log(library);
    } catch (error) {
      handleError(error, 'Unable to add exclude pattern');
    }
  };

  const handleEditExclusionPattern = async () => {
    if (!editExclusionPattern) {
      return;
    }

    if (!library.exclusionPatterns) {
      library.exclusionPatterns = [];
    }

    try {
      library.exclusionPatterns[editExclusionPattern] = editedExclusionPattern;
      exclusionPatterns = library.exclusionPatterns;
    } catch (error) {
      editExclusionPattern = null;
      handleError(error, 'Unable to edit exclude pattern');
    }
  };

  const handleDeleteExclusionPattern = async () => {
    if (!deleteExclusionPattern) {
      return;
    }

    try {
      if (!library.exclusionPatterns) {
        library.exclusionPatterns = [];
      }

      const pathToDelete = library.exclusionPatterns[deleteExclusionPattern];
      library.exclusionPatterns = library.exclusionPatterns.filter((path) => path != pathToDelete);
      exclusionPatterns = library.exclusionPatterns;
    } catch (error) {
      deleteExclusionPattern = null;
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
  <div class="flex w-full gap-4">
    <Button color="gray" fullwidth on:click={() => handleCancel()}>Cancel</Button>
    <Button type="submit" fullwidth>Save</Button>
  </div>

  <div class="mt-4 flex w-full gap-4">
    <table class="w-full text-left">
      <tbody class="dark:border-immich-dark-gray block w-full overflow-y-auto rounded-md border">
        {#each exclusionPatterns as exclusionPatterns, listIndex}
          <tr
            class={`dark:text-immich-dark-fg flex h-[80px] w-full place-items-center text-center ${
              listIndex % 2 == 0
                ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
                : 'bg-immich-bg dark:bg-immich-dark-gray/50'
            }`}
          >
            <td class="w-3/4 text-ellipsis px-4 text-sm">{exclusionPatterns}</td>
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
  </div>
  <div class="flex justify-end" />
</form>
