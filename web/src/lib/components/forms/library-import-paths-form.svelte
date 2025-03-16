<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { ValidateLibraryImportPathResponseDto } from '@immich/sdk';
  import { validate, type LibraryResponseDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiAlertOutline, mdiCheckCircleOutline, mdiPencilOutline, mdiRefresh } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { handleError } from '../../utils/handle-error';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import LibraryImportPathForm from './library-import-path-form.svelte';

  interface Props {
    library: LibraryResponseDto;
    onCancel: () => void;
    onSubmit: (library: LibraryResponseDto) => void;
  }

  let { library = $bindable(), onCancel, onSubmit }: Props = $props();

  let addImportPath = $state(false);
  let editImportPath: number | null = $state(null);

  let importPathToAdd: string | null = $state(null);
  let editedImportPath: string = $state('');

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

  const handleAddImportPath = async () => {
    if (!addImportPath || !importPathToAdd) {
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
    } finally {
      addImportPath = false;
      importPathToAdd = null;
    }
  };

  const handleEditImportPath = async () => {
    if (editImportPath === null) {
      return;
    }

    if (!library.importPaths) {
      library.importPaths = [];
    }

    try {
      // Check so that import path isn't duplicated

      if (!library.importPaths.includes(editedImportPath)) {
        // Update import path
        library.importPaths[editImportPath] = editedImportPath;
        await revalidate(false);
      }
    } catch (error) {
      editImportPath = null;
      handleError(error, $t('errors.unable_to_edit_import_path'));
    } finally {
      editImportPath = null;
    }
  };

  const handleDeleteImportPath = async () => {
    if (editImportPath === null) {
      return;
    }

    try {
      if (!library.importPaths) {
        library.importPaths = [];
      }

      const pathToDelete = library.importPaths[editImportPath];
      library.importPaths = library.importPaths.filter((path) => path != pathToDelete);
      await handleValidation();
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_import_path'));
    } finally {
      editImportPath = null;
    }
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onSubmit({ ...library });
  };
</script>

{#if addImportPath}
  <LibraryImportPathForm
    title={$t('add_import_path')}
    submitText={$t('add')}
    bind:importPath={importPathToAdd}
    {importPaths}
    onSubmit={handleAddImportPath}
    onCancel={() => {
      addImportPath = false;
      importPathToAdd = null;
    }}
  />
{/if}

{#if editImportPath != undefined}
  <LibraryImportPathForm
    title={$t('edit_import_path')}
    submitText={$t('save')}
    isEditing={true}
    bind:importPath={editedImportPath}
    {importPaths}
    onSubmit={handleEditImportPath}
    onDelete={handleDeleteImportPath}
    onCancel={() => (editImportPath = null)}
  />
{/if}

<form {onsubmit} autocomplete="off" class="m-4 flex flex-col gap-4">
  <table class="text-left">
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      {#each validatedPaths as validatedPath, listIndex (validatedPath.importPath)}
        <tr
          class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
            listIndex % 2 == 0
              ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
              : 'bg-immich-bg dark:bg-immich-dark-gray/50'
          }`}
        >
          <td class="w-1/8 text-ellipsis pl-8 text-sm">
            {#if validatedPath.isValid}
              <Icon
                path={mdiCheckCircleOutline}
                size="24"
                title={validatedPath.message}
                class="text-immich-success dark:text-immich-dark-success"
              />
            {:else}
              <Icon
                path={mdiAlertOutline}
                size="24"
                title={validatedPath.message}
                class="text-immich-warning dark:text-immich-dark-warning"
              />
            {/if}
          </td>

          <td class="w-4/5 text-ellipsis px-4 text-sm">{validatedPath.importPath}</td>
          <td class="w-1/5 text-ellipsis flex justify-center">
            <CircleIconButton
              color="primary"
              icon={mdiPencilOutline}
              title={$t('edit_import_path')}
              size="16"
              onclick={() => {
                editImportPath = listIndex;
                editedImportPath = validatedPath.importPath;
              }}
            />
          </td>
        </tr>
      {/each}
      <tr
        class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
          importPaths.length % 2 == 0
            ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
            : 'bg-immich-bg dark:bg-immich-dark-gray/50'
        }`}
      >
        <td class="w-4/5 text-ellipsis px-4 text-sm">
          {#if importPaths.length === 0}
            {$t('admin.no_paths_added')}
          {/if}</td
        >
        <td class="w-1/5 text-ellipsis px-4 text-sm">
          <Button shape="round" size="small" onclick={() => (addImportPath = true)}>{$t('add_path')}</Button>
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
