<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { handleError } from '../../utils/handle-error';
  import Button from '../elements/buttons/button.svelte';
  import LibraryImportPathForm from './library-import-path-form.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiAlertOutline, mdiCheckCircleOutline, mdiPencilOutline, mdiRefresh } from '@mdi/js';
  import { validate, type LibraryResponseDto } from '@immich/sdk';
  import type { ValidateLibraryImportPathResponseDto } from '@immich/sdk';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';

  export let library: LibraryResponseDto;

  let addImportPath = false;
  let editImportPath: number | null = null;

  let importPathToAdd: string | null = null;
  let editedImportPath: string;

  let validatedPaths: ValidateLibraryImportPathResponseDto[] = [];

  $: importPaths = validatedPaths.map((validatedPath) => validatedPath.importPath);

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
          message: `All paths validated successfully`,
          type: NotificationType.Info,
        });
      }
    } else if (failedPaths === 1) {
      notificationController.show({
        message: `${failedPaths} path failed validation`,
        type: NotificationType.Warning,
      });
    } else {
      notificationController.show({
        message: `${failedPaths} paths failed validation`,
        type: NotificationType.Warning,
      });
    }
  };

  const dispatch = createEventDispatcher<{
    cancel: void;
    submit: Partial<LibraryResponseDto>;
  }>();

  const handleCancel = () => {
    dispatch('cancel');
  };

  const handleSubmit = () => {
    dispatch('submit', { ...library });
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
      handleError(error, 'Unable to add import path');
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
      handleError(error, 'Unable to edit import path');
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
      handleError(error, 'Unable to delete import path');
    } finally {
      editImportPath = null;
    }
  };
</script>

{#if addImportPath}
  <LibraryImportPathForm
    title="Add import path"
    submitText="Add"
    bind:importPath={importPathToAdd}
    {importPaths}
    on:submit={handleAddImportPath}
    on:cancel={() => {
      addImportPath = false;
      importPathToAdd = null;
    }}
  />
{/if}

{#if editImportPath != undefined}
  <LibraryImportPathForm
    title="Edit import path"
    submitText="Save"
    isEditing={true}
    bind:importPath={editedImportPath}
    {importPaths}
    on:submit={handleEditImportPath}
    on:delete={handleDeleteImportPath}
    on:cancel={() => {
      editImportPath = null;
    }}
  />
{/if}

<form on:submit|preventDefault={() => handleSubmit()} autocomplete="off" class="m-4 flex flex-col gap-4">
  <table class="text-left">
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      {#each validatedPaths as validatedPath, listIndex}
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
              title="Edit import path"
              size="16"
              on:click={() => {
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
            No paths added
          {/if}</td
        >
        <td class="w-1/5 text-ellipsis px-4 text-sm"
          ><Button
            type="button"
            size="sm"
            on:click={() => {
              addImportPath = true;
            }}>Add path</Button
          ></td
        >
      </tr>
    </tbody>
  </table>
  <div class="flex justify-between w-full">
    <div class="justify-end gap-2">
      <Button size="sm" color="gray" on:click={() => revalidate()}><Icon path={mdiRefresh} size={20} />Validate</Button>
    </div>
    <div class="justify-end gap-2">
      <Button size="sm" color="gray" on:click={() => handleCancel()}>Cancel</Button>
      <Button size="sm" type="submit">Save</Button>
    </div>
  </div>
</form>
