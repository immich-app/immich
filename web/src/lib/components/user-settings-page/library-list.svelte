<script lang="ts">
  import { api, CreateLibraryDto, UpdateLibraryDto, LibraryResponseDto, LibraryType } from '@api';
  import { onMount } from 'svelte';
  import UploadLibraryForm from '../forms/upload-library-form.svelte';
  import ImportLibraryForm from '../forms/import-library-form.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { fade } from 'svelte/transition';
  import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
  import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';

  let libraries: LibraryResponseDto[] = [];

  let newUploadLibrary: Partial<LibraryResponseDto> | null = null;
  let newImportLibrary: Partial<LibraryResponseDto> | null = null;

  let editImportLibrary: Partial<LibraryResponseDto> | null = null;
  let editUploadLibrary: Partial<LibraryResponseDto> | null = null;
  let deleteLibrary: LibraryResponseDto | null = null;

  onMount(() => {
    refreshLibraries();
  });

  async function refreshLibraries() {
    const { data } = await api.libraryApi.getAllLibraries();
    libraries = data;
  }

  const handleCreate = async (event: CustomEvent<CreateLibraryDto>) => {
    try {
      const dto: CreateLibraryDto = event.detail;
      if (newUploadLibrary) {
        dto.libraryType = LibraryType.Upload;
      } else if (newImportLibrary) {
        dto.libraryType = LibraryType.Import;
      }
      await api.libraryApi.createLibrary({ createLibraryDto: dto });
    } catch (error) {
      handleError(error, 'Unable to create a new library');
    } finally {
      await refreshLibraries();
      newUploadLibrary = null;
      newImportLibrary = null;
    }
  };

  const handleEdit = async (event: CustomEvent<UpdateLibraryDto>) => {
    try {
      const dto = event.detail;
      await api.libraryApi.updateLibrary({ updateLibraryDto: dto });
    } catch (error) {
      handleError(error, 'Unable to update library');
    } finally {
      await refreshLibraries();
      editUploadLibrary = null;
      editImportLibrary = null;
    }
  };

  const handleDelete = async () => {
    if (!deleteLibrary) {
      return;
    }

    try {
      await api.libraryApi.deleteLibrary({ id: deleteLibrary.id });
      notificationController.show({
        message: `Removed library: ${deleteLibrary.name}`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to remove library');
    } finally {
      await refreshLibraries();
      deleteLibrary = null;
    }
  };
</script>

{#if newUploadLibrary}
  <UploadLibraryForm
    title="New Upload Library"
    submitText="Create"
    library={newUploadLibrary}
    on:submit={handleCreate}
    on:cancel={() => (newUploadLibrary = null)}
  />
{/if}

{#if newImportLibrary}
  <ImportLibraryForm
    title="New Import Library"
    submitText="Create"
    library={newImportLibrary}
    on:submit={handleCreate}
    on:cancel={() => (newImportLibrary = null)}
  />
{/if}

{#if editImportLibrary}
  <ImportLibraryForm
    title="Edit Library"
    submitText="Save"
    library={editImportLibrary}
    on:submit={handleEdit}
    on:cancel={() => (editImportLibrary = null)}
  />
{/if}

{#if editUploadLibrary}
  <UploadLibraryForm
    title="Edit Library"
    submitText="Save"
    library={editUploadLibrary}
    on:submit={handleEdit}
    on:cancel={() => (editUploadLibrary = null)}
  />
{/if}

{#if deleteLibrary}
  <ConfirmDialogue
    prompt="Are you sure you want to delete this library?"
    on:confirm={() => handleDelete()}
    on:cancel={() => (deleteLibrary = null)}
  />
{/if}

<section class="my-4">
  <div class="flex flex-col gap-2" in:fade={{ duration: 500 }}>
    {#if libraries.length > 0}
      <table class="w-full text-left">
        <thead
          class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
        >
          <tr class="flex w-full place-items-center">
            <th class="w-1/3 text-center text-sm font-medium">Name</th>
            <th class="w-1/3 text-center text-sm font-medium">Type</th>
            <th class="w-1/3 text-center text-sm font-medium">Assets</th>
            <th class="w-1/3 text-center text-sm font-medium">Action</th>
          </tr>
        </thead>
        <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
          {#each libraries as library, i}
            {#key library.id}
              <tr
                class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
                  i % 2 == 0 ? 'bg-immich-gray dark:bg-immich-dark-gray/75' : 'bg-immich-bg dark:bg-immich-dark-gray/50'
                }`}
              >
                <td class="w-1/3 text-ellipsis px-4 text-sm">{library.name}</td>
                <td class="w-1/3 text-ellipsis px-4 text-sm">{library.type}</td>
                <td class="w-1/3 text-ellipsis px-4 text-sm">{library.assetCount} </td>
                <td class="w-1/3 text-ellipsis px-4 text-sm">
                  <button
                    on:click={() => {
                      if (library.type === LibraryType.Import) {
                        editImportLibrary = library;
                      } else if (library.type === LibraryType.Upload) {
                        editUploadLibrary = library;
                      }
                    }}
                    class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
                  >
                    <PencilOutline size="16" />
                  </button>
                  <button
                    on:click={() => (deleteLibrary = library)}
                    class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
                  >
                    <TrashCanOutline size="16" />
                  </button>
                </td>
              </tr>
            {/key}
          {/each}
        </tbody>
      </table>
    {/if}
    <div class="mb-2 flex justify-end">
      <Button size="sm" on:click={() => (newUploadLibrary = { name: 'New Upload Library' })}
        >Create upload library</Button
      >
      <Button size="sm" on:click={() => (newImportLibrary = { name: 'New Import Library' })}
        >Create external library</Button
      >
    </div>
  </div>
</section>
