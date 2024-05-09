<script lang="ts">
  import { LibraryType, type LibraryResponseDto } from '@immich/sdk';
  import { mdiPencilOutline } from '@mdi/js';
  import { createEventDispatcher, onMount } from 'svelte';
  import { handleError } from '../../utils/handle-error';
  import Button from '../elements/buttons/button.svelte';
  import LibraryExclusionPatternForm from './library-exclusion-pattern-form.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';

  export let library: Partial<LibraryResponseDto>;

  let addExclusionPattern = false;
  let editExclusionPattern: number | null = null;

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

  const dispatch = createEventDispatcher<{
    cancel: void;
    submit: { library: Partial<LibraryResponseDto>; type: LibraryType };
  }>();
  const handleCancel = () => {
    dispatch('cancel');
  };

  const handleSubmit = () => {
    dispatch('submit', { library, type: LibraryType.External });
  };

  const handleAddExclusionPattern = () => {
    if (!addExclusionPattern) {
      return;
    }

    if (!library.exclusionPatterns) {
      library.exclusionPatterns = [];
    }

    try {
      // Check so that exclusion pattern isn't duplicated
      if (!library.exclusionPatterns.includes(exclusionPatternToAdd)) {
        library.exclusionPatterns.push(exclusionPatternToAdd);
        exclusionPatterns = library.exclusionPatterns;
      }
    } catch (error) {
      handleError(error, 'Unable to add exclusion pattern');
    } finally {
      exclusionPatternToAdd = '';
      addExclusionPattern = false;
    }
  };

  const handleEditExclusionPattern = () => {
    if (editExclusionPattern === null) {
      return;
    }

    if (!library.exclusionPatterns) {
      library.exclusionPatterns = [];
    }

    try {
      library.exclusionPatterns[editExclusionPattern] = editedExclusionPattern;
      exclusionPatterns = library.exclusionPatterns;
    } catch (error) {
      handleError(error, 'Unable to edit exclude pattern');
    } finally {
      editExclusionPattern = null;
    }
  };

  const handleDeleteExclusionPattern = () => {
    if (editExclusionPattern === null) {
      return;
    }

    try {
      if (!library.exclusionPatterns) {
        library.exclusionPatterns = [];
      }

      const pathToDelete = library.exclusionPatterns[editExclusionPattern];
      library.exclusionPatterns = library.exclusionPatterns.filter((path) => path != pathToDelete);
      exclusionPatterns = library.exclusionPatterns;
    } catch (error) {
      handleError(error, 'Unable to delete exclude pattern');
    } finally {
      editExclusionPattern = null;
    }
  };
</script>

{#if addExclusionPattern}
  <LibraryExclusionPatternForm
    submitText="Add"
    bind:exclusionPattern={exclusionPatternToAdd}
    {exclusionPatterns}
    on:submit={handleAddExclusionPattern}
    on:cancel={() => {
      addExclusionPattern = false;
    }}
  />
{/if}

{#if editExclusionPattern != undefined}
  <LibraryExclusionPatternForm
    submitText="Save"
    isEditing={true}
    bind:exclusionPattern={editedExclusionPattern}
    {exclusionPatterns}
    on:submit={handleEditExclusionPattern}
    on:delete={handleDeleteExclusionPattern}
    on:cancel={() => {
      editExclusionPattern = null;
    }}
  />
{/if}

<form on:submit|preventDefault={() => handleSubmit()} autocomplete="off" class="m-4 flex flex-col gap-4">
  <table class="w-full text-left">
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      {#each exclusionPatterns as exclusionPattern, listIndex}
        <tr
          class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
            listIndex % 2 == 0
              ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
              : 'bg-immich-bg dark:bg-immich-dark-gray/50'
          }`}
        >
          <td class="w-3/4 text-ellipsis px-4 text-sm">{exclusionPattern}</td>
          <td class="w-1/4 text-ellipsis flex justify-center">
            <CircleIconButton
              color="primary"
              icon={mdiPencilOutline}
              title="Edit exclusion pattern"
              size="16"
              on:click={() => {
                editExclusionPattern = listIndex;
                editedExclusionPattern = exclusionPattern;
              }}
            />
          </td>
        </tr>
      {/each}
      <tr
        class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
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
            }}>Add exclusion pattern</Button
          ></td
        ></tr
      >
    </tbody>
  </table>

  <div class="flex w-full justify-end gap-4">
    <Button size="sm" color="gray" on:click={() => handleCancel()}>Cancel</Button>
    <Button size="sm" type="submit">Save</Button>
  </div>
</form>
