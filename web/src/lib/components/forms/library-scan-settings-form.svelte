<script lang="ts">
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import LibraryExclusionPatternModal from '$lib/modals/LibraryExclusionPatternModal.svelte';
  import { type LibraryResponseDto } from '@immich/sdk';
  import { Button, IconButton } from '@immich/ui';
  import { mdiPencilOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { handleError } from '../../utils/handle-error';

  interface Props {
    library: Partial<LibraryResponseDto>;
    onCancel: () => void;
    onSubmit: (library: Partial<LibraryResponseDto>) => void;
  }

  let { library = $bindable(), onCancel, onSubmit }: Props = $props();

  let exclusionPatterns: string[] = $state([]);

  onMount(() => {
    if (library.exclusionPatterns) {
      exclusionPatterns = library.exclusionPatterns;
    } else {
      library.exclusionPatterns = [];
    }
  });

  const handleAddExclusionPattern = (exclusionPatternToAdd: string) => {
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
    }
  };

  const handleEditExclusionPattern = (editedExclusionPattern: string, patternIndex: number) => {
    if (!library.exclusionPatterns) {
      library.exclusionPatterns = [];
    }

    try {
      library.exclusionPatterns[patternIndex] = editedExclusionPattern;
      exclusionPatterns = library.exclusionPatterns;
    } catch (error) {
      handleError(error, $t('errors.unable_to_edit_exclusion_pattern'));
    }
  };

  const handleDeleteExclusionPattern = (patternIndexToDelete?: number) => {
    if (patternIndexToDelete === undefined) {
      return;
    }

    try {
      if (!library.exclusionPatterns) {
        library.exclusionPatterns = [];
      }

      const patternToDelete = library.exclusionPatterns[patternIndexToDelete];
      library.exclusionPatterns = library.exclusionPatterns.filter((path) => path != patternToDelete);
      exclusionPatterns = library.exclusionPatterns;
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_exclusion_pattern'));
    }
  };

  const onEditExclusionPattern = async (patternIndexToEdit?: number) => {
    const result = await modalManager.show(LibraryExclusionPatternModal, {
      submitText: patternIndexToEdit === undefined ? $t('add') : $t('save'),
      isEditing: patternIndexToEdit !== undefined,
      exclusionPattern: patternIndexToEdit === undefined ? '' : exclusionPatterns[patternIndexToEdit],
      exclusionPatterns,
    });

    if (!result) {
      return;
    }

    switch (result.action) {
      case 'submit': {
        if (patternIndexToEdit === undefined) {
          handleAddExclusionPattern(result.exclusionPattern);
        } else {
          handleEditExclusionPattern(result.exclusionPattern, patternIndexToEdit);
        }
        break;
      }
      case 'delete': {
        handleDeleteExclusionPattern(patternIndexToEdit);
        break;
      }
    }
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onSubmit(library);
  };
</script>

<form {onsubmit} autocomplete="off" class="m-4 flex flex-col gap-4">
  <table class="w-full text-start">
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      {#each exclusionPatterns as exclusionPattern, listIndex (exclusionPattern)}
        <tr
          class="flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg even:bg-subtle/20 odd:bg-subtle/80"
        >
          <td class="w-3/4 text-ellipsis px-4 text-sm">{exclusionPattern}</td>
          <td class="w-1/4 text-ellipsis flex justify-center">
            <IconButton
              shape="round"
              color="primary"
              icon={mdiPencilOutline}
              title={$t('edit_exclusion_pattern')}
              onclick={() => onEditExclusionPattern(listIndex)}
              aria-label={$t('edit_exclusion_pattern')}
              size="small"
            />
          </td>
        </tr>
      {/each}
      <tr
        class="flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg even:bg-subtle/20 odd:bg-subtle/80"
      >
        <td class="w-3/4 text-ellipsis px-4 text-sm">
          {#if exclusionPatterns.length === 0}
            {$t('admin.no_pattern_added')}
          {/if}
        </td>
        <td class="w-1/4 text-ellipsis px-4 text-sm flex justify-center">
          <Button size="small" shape="round" onclick={() => onEditExclusionPattern()}>
            {$t('add_exclusion_pattern')}
          </Button>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="flex w-full justify-end gap-2">
    <Button size="small" shape="round" color="secondary" onclick={onCancel}>{$t('cancel')}</Button>
    <Button size="small" shape="round" type="submit">{$t('save')}</Button>
  </div>
</form>
