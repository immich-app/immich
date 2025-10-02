<script lang="ts">
  import LibraryImportPathModal from '$lib/modals/LibraryImportPathModal.svelte';
  import type { ValidateLibraryImportPathResponseDto } from '@immich/sdk';
  import { validate, type LibraryResponseDto } from '@immich/sdk';
  import { Button, Icon, IconButton, modalManager } from '@immich/ui';
  import { mdiAlertOutline, mdiCheckCircleOutline, mdiPencilOutline, mdiRefresh } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { handleError } from '../../utils/handle-error';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';

  interface Props {
    library: LibraryResponseDto;
    onCancel: () => void;
    onSubmit: (library: LibraryResponseDto) => void;
  }

  let { library = $bindable(), onCancel, onSubmit }: Props = $props();

  let validatedPaths: ValidateLibraryImportPathResponseDto[] = $state([]);

  let importPaths = $derived(validatedPaths.map((validatedPath) => validatedPath.importPath));

  onMount(async () => {
    if (library.importPaths) {
      await handleValidation();
    } else {
      library.importPaths = [];
    }
  });

  const handleValidation = async () => {
    if (library.importPaths) {
      const validation = await validate({
        id: library.id,
        validateLibraryDto: { importPaths: library.importPaths },
      });

      validatedPaths = validation.importPaths ?? [];
    }
  };

  const revalidate = async (notifyIfSuccessful = true) => {
    await handleValidation();
    let failedPaths = 0;
    for (const validatedPath of validatedPaths) {
      if (!validatedPath.isValid) {
        failedPaths++;
      }
    }
    if (failedPaths === 0) {
      if (notifyIfSuccessful) {
        notificationController.show({
          message: $t('admin.paths_validated_successfully'),
          type: NotificationType.Info,
        });
      }
    } else {
      notificationController.show({
        message: $t('errors.paths_validation_failed', { values: { paths: failedPaths } }),
        type: NotificationType.Warning,
      });
    }
  };

  const handleAddImportPath = async (importPathToAdd: string | null) => {
    if (!importPathToAdd) {
      return;
    }

    if (!library.importPaths) {
      library.importPaths = [];
    }

    try {
      // Check so that import path isn't duplicated
      if (!library.importPaths.includes(importPathToAdd)) {
        library.importPaths.push(importPathToAdd);
        await revalidate(false);
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_import_path'));
    }
  };

  const handleEditImportPath = async (editedImportPath: string | null, pathIndexToEdit: number) => {
    if (editedImportPath === null) {
      return;
    }

    if (!library.importPaths) {
      library.importPaths = [];
    }

    try {
      // Check so that import path isn't duplicated
      if (!library.importPaths.includes(editedImportPath)) {
        // Update import path
        library.importPaths[pathIndexToEdit] = editedImportPath;
        await revalidate(false);
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_edit_import_path'));
    }
  };

  const handleDeleteImportPath = async (pathIndexToDelete?: number) => {
    if (pathIndexToDelete === undefined) {
      return;
    }

    try {
      if (!library.importPaths) {
        library.importPaths = [];
      }

      const pathToDelete = library.importPaths[pathIndexToDelete];
      library.importPaths = library.importPaths.filter((path) => path != pathToDelete);
      await handleValidation();
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_import_path'));
    }
  };

  const onEditImportPath = async (pathIndexToEdit?: number) => {
    const result = await modalManager.show(LibraryImportPathModal, {
      title: pathIndexToEdit === undefined ? $t('add_import_path') : $t('edit_import_path'),
      submitText: pathIndexToEdit === undefined ? $t('add') : $t('save'),
      isEditing: pathIndexToEdit !== undefined,
      importPath: pathIndexToEdit === undefined ? null : library.importPaths[pathIndexToEdit],
      importPaths: library.importPaths,
    });

    if (!result) {
      return;
    }

    switch (result.action) {
      case 'submit': {
        // eslint-disable-next-line unicorn/prefer-ternary
        if (pathIndexToEdit === undefined) {
          await handleAddImportPath(result.importPath);
        } else {
          await handleEditImportPath(result.importPath, pathIndexToEdit);
        }
        break;
      }
      case 'delete': {
        await handleDeleteImportPath(pathIndexToEdit);
        break;
      }
    }
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onSubmit({ ...library });
  };
</script>

<form {onsubmit} autocomplete="off" class="m-4 flex flex-col gap-4">
  <table class="text-start">
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      {#each validatedPaths as validatedPath, listIndex (validatedPath.importPath)}
        <tr
          class="flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg even:bg-subtle/20 odd:bg-subtle/80"
        >
          <td class="w-1/8 text-ellipsis ps-8 text-sm">
            {#if validatedPath.isValid}
              <Icon icon={mdiCheckCircleOutline} size="24" title={validatedPath.message} class="text-success" />
            {:else}
              <Icon icon={mdiAlertOutline} size="24" title={validatedPath.message} class="text-warning" />
            {/if}
          </td>

          <td class="w-4/5 text-ellipsis px-4 text-sm">{validatedPath.importPath}</td>
          <td class="w-1/5 text-ellipsis flex justify-center">
            <IconButton
              shape="round"
              color="primary"
              icon={mdiPencilOutline}
              aria-label={$t('edit_import_path')}
              onclick={() => onEditImportPath(listIndex)}
              size="small"
            />
          </td>
        </tr>
      {/each}
      <tr
        class="flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg even:bg-subtle/20 odd:bg-subtle/80"
      >
        <td class="w-4/5 text-ellipsis px-4 text-sm">
          {#if importPaths.length === 0}
            {$t('admin.no_paths_added')}
          {/if}</td
        >
        <td class="w-1/5 text-ellipsis px-4 text-sm">
          <Button shape="round" size="small" onclick={() => onEditImportPath()}>{$t('add_path')}</Button>
        </td>
      </tr>
    </tbody>
  </table>
  <div class="flex justify-between w-full">
    <div class="justify-end gap-2">
      <Button shape="round" leadingIcon={mdiRefresh} size="small" color="secondary" onclick={() => revalidate()}
        >{$t('validate')}</Button
      >
    </div>
    <div class="flex justify-end gap-2">
      <Button shape="round" size="small" color="secondary" onclick={onCancel}>{$t('cancel')}</Button>
      <Button shape="round" size="small" type="submit">{$t('save')}</Button>
    </div>
  </div>
</form>
