<script lang="ts">
  import { api, UpdateLibraryDto, LibraryResponseDto, LibraryType, LibraryStatsResponseDto } from '@api';
  import { onMount } from 'svelte';
  import UploadLibraryForm from '../forms/upload-library-form.svelte';
  import ImportLibraryForm from '../forms/import-library-path-form.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { fade } from 'svelte/transition';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
  import Database from 'svelte-material-icons/Database.svelte';
  import Upload from 'svelte-material-icons/Upload.svelte';

  import { slide } from 'svelte/transition';
  import { Dropdown, DropdownDivider, DropdownItem } from 'flowbite-svelte';
  import { Icon } from 'flowbite-svelte-icons';
  import LibraryImportPathsForm from '../forms/library-import-paths-form.svelte';
  import LibraryRenameForm from '../forms/library-rename-form.svelte';
  import { getBytesWithUnit } from '$lib/utils/byte-units';

  let libraries: LibraryResponseDto[] = [];

  let stats: LibraryStatsResponseDto[] = [];
  let photos: number[] = [];
  let videos: number[] = [];
  let totalCount: number[] = [];
  let diskUsage: number[] = [];
  let diskUsageUnit: string[] = [];

  let isOpen: boolean[] = [];

  const toggle = (index: number) => (isOpen[index] = !isOpen[index]);

  let editUploadLibrary: Partial<LibraryResponseDto> | null = null;
  let deleteLibrary: LibraryResponseDto | null = null;

  let editImportPaths: number | null;

  let renameLibrary: number | null;

  let dropdownOpen: boolean[] = [];
  const closeDropdown = (index: number) => (dropdownOpen[index] = false);

  let createLibraryDropdownOpen = false;

  onMount(() => {
    refreshLibraries();
  });

  const refreshStats = async (listIndex: number) => {
    const { data } = await api.libraryApi.getLibraryStatistics({ id: libraries[listIndex].id });
    stats[listIndex] = data;
    photos[listIndex] = stats[listIndex].photos;
    videos[listIndex] = stats[listIndex].videos;
    totalCount[listIndex] = stats[listIndex].total;
    [diskUsage[listIndex], diskUsageUnit[listIndex]] = getBytesWithUnit(stats[listIndex].usage, 0);
  };

  async function refreshLibraries() {
    const { data } = await api.libraryApi.getAllLibraries();
    libraries = data;

    for (let i = 0; i < libraries.length; i++) {
      await refreshStats(i);
    }
  }

  const handleCreate = async (libraryType: LibraryType) => {
    createLibraryDropdownOpen = false;
    try {
      let newLibraryName;
      switch (libraryType) {
        case LibraryType.Import:
          newLibraryName = 'New Import Library';
          break;
        case LibraryType.Upload:
          newLibraryName = 'New Upload Library';
          break;
      }
      const { data } = await api.libraryApi.createLibrary({
        createLibraryDto: { libraryType: libraryType, name: newLibraryName, importPaths: [], excludePatterns: [] },
      });

      const createdLibrary = data;

      notificationController.show({
        message: `Created library: ${createdLibrary.name}`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to create a new library');
    } finally {
      await refreshLibraries();
    }
  };

  const handleEdit = async (event: CustomEvent<UpdateLibraryDto>, index?: number) => {
    try {
      const dto = event.detail;
      await api.libraryApi.updateLibrary({ updateLibraryDto: dto });
      if (index !== undefined) {
        isOpen[index] = false;
      }
    } catch (error) {
      handleError(error, 'Unable to update library');
    } finally {
      editUploadLibrary = null;
      editImportPaths = null;
      renameLibrary = null;
      await refreshLibraries();
    }
  };

  const handleDelete = async () => {
    if (!deleteLibrary) {
      return;
    }

    try {
      await api.libraryApi.deleteLibrary({ id: deleteLibrary.id });
      notificationController.show({
        message: `Library deleted`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to remove library');
    } finally {
      deleteLibrary = null;
      await refreshLibraries();
    }
  };
</script>

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
    on:confirm={handleDelete}
    on:cancel={() => (deleteLibrary = null)}
  />
{/if}

<section class="my-4">
  <div class="flex flex-col gap-2" in:fade={{ duration: 500 }}>
    {#if libraries.length > 0}
      <table class="w-full text-left">
        <thead
          class="text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary mb-4 flex h-12 w-full rounded-md border bg-gray-50"
        >
          <tr class="flex w-full place-items-center">
            <th class="w-1/6 text-center text-sm font-medium">Type</th>
            <th class="w-1/3 text-center text-sm font-medium">Name</th>
            <th class="w-1/5 text-center text-sm font-medium">Assets</th>
            <th class="w-1/6 text-center text-sm font-medium">Size</th>
            <th class="w-1/6 text-center text-sm font-medium" />
          </tr>
        </thead>
        <tbody class="dark:border-immich-dark-gray block w-full overflow-y-auto rounded-md border">
          {#each libraries as library, index}
            {#key library.id}
              <tr
                class={`dark:text-immich-dark-fg flex h-[80px] w-full place-items-center text-center ${
                  index % 2 == 0
                    ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
                    : 'bg-immich-bg dark:bg-immich-dark-gray/50'
                }`}
              >
                <td class="w-1/6 px-4 text-left text-sm">
                  {#if library.type === LibraryType.Import}
                    <Database size="40" />
                  {:else if library.type === LibraryType.Upload}
                    <Upload size="40" />
                  {/if}</td
                >

                <td class="w-1/3 text-ellipsis px-4 text-sm">{library.name}</td>
                <td class="w-1/6 text-ellipsis px-4 text-sm">{totalCount[index]} </td>
                <td class="w-1/6 text-ellipsis px-4 text-sm">{diskUsage[index]} {diskUsageUnit[index]} </td>
                <td class="w-1/6 text-ellipsis px-4 text-sm">
                  <button
                    class="bg-immich-primary hover:bg-immich-primary/75 dark:bg-immich-dark-primary rounded-full p-3 text-gray-100 transition-all duration-150 dark:text-gray-700"
                  >
                    <DotsVertical size="16" />
                  </button>

                  <Dropdown bind:open={dropdownOpen[index]}>
                    <DropdownItem
                      on:click={() => {
                        closeDropdown(index);
                        renameLibrary = index;
                      }}>Rename</DropdownItem
                    >
                    {#if library.type === LibraryType.Import}
                      <DropdownItem>Refresh Library Files</DropdownItem>
                      <DropdownItem
                        on:click={() => {
                          closeDropdown(index);
                          editImportPaths = index;
                        }}>Edit Import Paths</DropdownItem
                      >
                      <DropdownItem class="flex items-center justify-between">
                        Manage<Icon name="chevron-right-solid" class="text-primary-700 ml-2 h-3 w-3 dark:text-white" />
                      </DropdownItem>
                      <Dropdown placement="right-start">
                        <DropdownItem>Scan Settings</DropdownItem>
                        <DropdownDivider />
                        <DropdownItem>Force Refresh</DropdownItem>
                        <DropdownItem>Empty Trash</DropdownItem>
                      </Dropdown>
                    {/if}
                    <DropdownItem
                      on:click={function () {
                        deleteLibrary = library;
                      }}>Delete Library</DropdownItem
                    >
                  </Dropdown>
                  <button
                    on:click={function () {
                      toggle(index);
                    }}
                    aria-expanded={isOpen[index]}
                    class="bg-immich-primary hover:bg-immich-primary/75 dark:bg-immich-dark-primary rounded-full p-3 text-gray-100 transition-all duration-150 dark:text-gray-700"
                  >
                    <svg
                      style="tran"
                      width="16"
                      height="16"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </td>
              </tr>
              {#if renameLibrary == index}
                <div transition:slide={{ duration: 250 }} class="mb-2 ml-4">
                  <LibraryRenameForm {library} on:submit={(event) => handleEdit(event, index)} />
                </div>
              {/if}
              {#if editImportPaths == index}
                <div transition:slide={{ duration: 250 }} class="mb-2 ml-4">
                  <LibraryImportPathsForm {library} on:submit={(event) => handleEdit(event, index)} />
                </div>
              {/if}

              {#if isOpen[index]}
                <div transition:slide={{ duration: 250 }} class="mb-2 ml-4">
                  <ImportLibraryForm
                    title="Edit Library"
                    submitText="Save"
                    {library}
                    on:submit={(event) => handleEdit(event, index)}
                  />
                </div>
              {/if}
            {/key}
          {/each}
        </tbody>
      </table>
    {/if}
    <div class="mb-2 flex justify-end">
      <Button>Create Library</Button>
      <Dropdown bind:open={createLibraryDropdownOpen}>
        <DropdownItem on:click={() => handleCreate(LibraryType.Upload)}>Create Upload Library</DropdownItem>
        <DropdownItem on:click={() => handleCreate(LibraryType.Import)}>Create External Library</DropdownItem>
      </Dropdown>
    </div>
  </div>
</section>

<style>
  svg {
    transition: transform 0.2s ease-in;
  }

  [aria-expanded='true'] svg {
    transform: rotate(0.5turn);
  }
</style>
