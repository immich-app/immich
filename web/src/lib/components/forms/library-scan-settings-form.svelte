<script lang="ts">
  import { type LibraryResponseDto } from '@immich/sdk';
  import { mdiPencilOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { handleError } from '../../utils/handle-error';
  import Button from '../elements/buttons/button.svelte';
  import LibraryExclusionPatternForm from './library-exclusion-pattern-form.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    library: Partial<LibraryResponseDto>;
    onCancel: () => void;
    onSubmit: (library: Partial<LibraryResponseDto>) => void;
  }

  let { library = $bindable(), onCancel, onSubmit }: Props = $props();

  let addExclusionPattern = $state(false);
  let editExclusionPattern: number | null = $state(null);

  let exclusionPatternToAdd: string = $state('');
  let editedExclusionPattern: string = $state('');

  let exclusionPatterns: string[] = $state([]);

  onMount(() => {
    if (library.exclusionPatterns) {
      exclusionPatterns = library.exclusionPatterns;
    } else {
      library.exclusionPatterns = [];
    }
  });

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
      handleError(error, $t('errors.unable_to_add_exclusion_pattern'));
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
      handleError(error, $t('errors.unable_to_edit_exclusion_pattern'));
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
      handleError(error, $t('errors.unable_to_delete_exclusion_pattern'));
    } finally {
      editExclusionPattern = null;
    }
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onSubmit(library);
  };
</script>

{#if addExclusionPattern}
  <LibraryExclusionPatternForm
    submitText={$t('add')}
    bind:exclusionPattern={exclusionPatternToAdd}
    {exclusionPatterns}
    onSubmit={handleAddExclusionPattern}
    onCancel={() => (addExclusionPattern = false)}
  />
{/if}

{#if editExclusionPattern != undefined}
  <LibraryExclusionPatternForm
    submitText={$t('save')}
    isEditing={true}
    bind:exclusionPattern={editedExclusionPattern}
    {exclusionPatterns}
    onSubmit={handleEditExclusionPattern}
    onDelete={handleDeleteExclusionPattern}
    onCancel={() => (editExclusionPattern = null)}
  />
{/if}

<form {onsubmit} autocomplete="off" class="m-4 flex flex-col gap-4">
  <table class="w-full text-start">
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      {#each exclusionPatterns as exclusionPattern, listIndex (exclusionPattern)}
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
              title={$t('edit_exclusion_pattern')}
              size="16"
              onclick={() => {
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
            {$t('admin.no_pattern_added')}
          {/if}
        </td>
        <td class="w-1/4 text-ellipsis px-4 text-sm"
          ><Button
            size="sm"
            onclick={() => {
              addExclusionPattern = true;
            }}>{$t('add_exclusion_pattern')}</Button
          ></td
        ></tr
      >
    </tbody>
  </table>

  <div class="flex w-full justify-end gap-4">
    <Button size="sm" color="gray" onclick={onCancel}>{$t('cancel')}</Button>
    <Button size="sm" type="submit">{$t('save')}</Button>
  </div>
</form>
