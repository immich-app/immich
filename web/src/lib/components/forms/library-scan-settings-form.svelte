<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import { type LibraryResponseDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiPencilOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { handleError } from '../../utils/handle-error';
  import LibraryExclusionPatternForm from './library-exclusion-pattern-form.svelte';

  interface Props {
    library: Partial<LibraryResponseDto>;
    onCancel: () => void;
    onSubmit: (library: Partial<LibraryResponseDto>) => void;
  }

  let { library = $bindable(), onCancel, onSubmit }: Props = $props();

  let editExclusionPattern: number | null = $state(null);

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
    } finally {
      exclusionPatternToAdd = '';
    }
  };

  const handleEditExclusionPattern = (editedExclusionPattern: string) => {
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
    }
  };

  const onAddExclusionPattern = async () => {
    const result = await modalManager.show(LibraryExclusionPatternForm, {
      submitText: $t('add'),
      exclusionPattern: '',
      exclusionPatterns,
    });

    if (!result) {
      return;
    }

    switch (result.action) {
      case 'submit': {
        handleAddExclusionPattern(result.exclusionPattern);
        break;
      }
      case 'delete': {
        handleDeleteExclusionPattern();
        break;
      }
    }
  };

  const onEditExclusionPattern = async () => {
    if (editExclusionPattern === null) {
      return;
    }

    const result = await modalManager.show(LibraryExclusionPatternForm, {
      submitText: $t('save'),
      isEditing: true,
      exclusionPattern: exclusionPatterns[editExclusionPattern],
      exclusionPatterns,
    });

    if (!result) {
      return;
    }

    switch (result.action) {
      case 'submit': {
        handleEditExclusionPattern(result.exclusionPattern);
        break;
      }
      case 'delete': {
        handleDeleteExclusionPattern();
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
            <CircleIconButton
              color="primary"
              icon={mdiPencilOutline}
              title={$t('edit_exclusion_pattern')}
              size="16"
              onclick={async () => {
                editExclusionPattern = listIndex;
                await onEditExclusionPattern();
              }}
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
          <Button size="small" shape="round" onclick={onAddExclusionPattern}>
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
