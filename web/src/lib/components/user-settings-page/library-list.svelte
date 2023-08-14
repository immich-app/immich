<script lang="ts">
  import { api, UpdateLibraryDto, LibraryResponseDto, LibraryType, LibraryStatsResponseDto } from '@api';
  import { onMount } from 'svelte';
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
  import LibraryScanSettingsForm from '../forms/library-scan-settings-form.svelte';
  import LibraryRenameForm from '../forms/library-rename-form.svelte';
  import { getBytesWithUnit } from '$lib/utils/byte-units';

  let libraries: LibraryResponseDto[] = [];

  let stats: LibraryStatsResponseDto[] = [];
  let photos: number[] = [];
  let videos: number[] = [];
  let totalCount: number[] = [];
  let diskUsage: number[] = [];
  let diskUsageUnit: string[] = [];

  let deleteLibrary: LibraryResponseDto | null = null;

  let editImportPaths: number | null;
  let editScanSettings: number | null;
  let renameLibrary: number | null;

  let dropdownOpen: boolean[] = [];


  let createLibraryDropdownOpen = false;

  onMount(() => {
    readLibraryList();
  });

  const closeAll = () => {
    editImportPaths = null;
    editScanSettings = null;
    renameLibrary = null;

    for (let i = 0; i < dropdownOpen.length; i++) {
      dropdownOpen[i] = false;
    }
  };

  const refreshStats = async (listIndex: number) => {
    const { data } = await api.libraryApi.getLibraryStatistics({ id: libraries[listIndex].id });
    stats[listIndex] = data;
    photos[listIndex] = stats[listIndex].photos;
    videos[listIndex] = stats[listIndex].videos;
    totalCount[listIndex] = stats[listIndex].total;
    [diskUsage[listIndex], diskUsageUnit[listIndex]] = getBytesWithUnit(stats[listIndex].usage, 0);
  };

  async function readLibraryList() {
    const { data } = await api.libraryApi.getAllLibraries();
    libraries = data;

    dropdownOpen.length = libraries.length;

    for (let i = 0; i < libraries.length; i++) {
      await refreshStats(i);
      dropdownOpen[i] = false;
    }
  }

  const handleCreate = async (libraryType: LibraryType) => {
    createLibraryDropdownOpen = false;
    try {
      let newLibraryName;
      switch (libraryType) {
        case LibraryType.External:
          newLibraryName = 'New External Library';
          break;
        case LibraryType.Upload:
          newLibraryName = 'New Upload Library';
          break;
      }
      const { data } = await api.libraryApi.createLibrary({
        createLibraryDto: { type: libraryType, name: newLibraryName, importPaths: [], excludePatterns: [] },
      });

      const createdLibrary = data;

      notificationController.show({
        message: `Created library: ${createdLibrary.name}`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to create library');
    } finally {
      await readLibraryList();
    }
  };

  const handleEdit = async (event: CustomEvent<UpdateLibraryDto>) => {
    try {
      const dto = event.detail;
      await api.libraryApi.updateLibrary({ updateLibraryDto: dto });
    } catch (error) {
      handleError(error, 'Unable to update library');
    } finally {
      closeAll();
      await readLibraryList();
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
      await readLibraryList();
    }
  };

  const handleRefresh = async (libraryId: string) => {
    try {
      await api.libraryApi.refreshLibrary({ id: libraryId, scanLibraryDto: {} });
      notificationController.show({
        message: `Refreshing library`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to refresh library');
    }
  };

  const handleAnalyze = async (libraryId: string) => {
    try {
      await api.libraryApi.refreshLibrary({ id: libraryId, scanLibraryDto: { analyze: true } });
      notificationController.show({
        message: `Refreshing library`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to analyze library assets');
    }
  };

  const handleEmptyTrash = async (libraryId: string) => {
    try {
      await api.libraryApi.refreshLibrary({ id: libraryId, scanLibraryDto: { emptyTrash: true } });
      notificationController.show({
        message: `Emptying library trash`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to empty trash');
    }
  };
</script>

{#if deleteLibrary}
  <ConfirmDialogue
    title="Warning!"
    prompt="Are you sure you want to delete this library? This will DELETE any and all contained assets and cannot be undone."
    on:confirm={handleDelete}
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
            <th class="w-1/6 text-center text-sm font-medium">Type</th>
            <th class="w-1/3 text-center text-sm font-medium">Name</th>
            <th class="w-1/5 text-center text-sm font-medium">Assets</th>
            <th class="w-1/6 text-center text-sm font-medium">Size</th>
            <th class="w-1/6 text-center text-sm font-medium" />
          </tr>
        </thead>
        <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
          {#each libraries as library, index}
            {#key library.id}
              <tr
                class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
                  index % 2 == 0
                    ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
                    : 'bg-immich-bg dark:bg-immich-dark-gray/50'
                }`}
              >
                <td class="w-1/6 px-4 text-left text-sm">
                  {#if library.type === LibraryType.External}
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
                    class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
                  >
                    <DotsVertical size="16" />
                  </button>

                  <Dropdown bind:open={dropdownOpen[index]}>
                    <DropdownItem
                      on:click={() => {
                        closeAll();
                        renameLibrary = index;
                      }}>Rename</DropdownItem
                    >
                    {#if library.type === LibraryType.External}
                      <DropdownItem
                        on:click={function () {
                          closeAll();
                          handleRefresh(library.id);
                        }}>Scan Library Files</DropdownItem
                      >
                      <DropdownItem
                        on:click={() => {
                          closeAll();
                          editImportPaths = index;
                        }}>Edit Import Paths</DropdownItem
                      >
                      <DropdownItem class="flex items-center justify-between">
                        Manage<Icon name="chevron-right-solid" class="text-primary-700 ml-2 h-3 w-3 dark:text-white" />
                      </DropdownItem>
                      <Dropdown placement="right-start">
                        <DropdownItem
                          on:click={() => {
                            closeAll();
                            editScanSettings = index;
                          }}>Scan Settings</DropdownItem
                        >
                        <DropdownDivider />
                        <DropdownItem
                          on:click={function () {
                            closeAll();
                            handleAnalyze(library.id);
                          }}>Analyze</DropdownItem
                        >
                        <DropdownItem
                          on:click={function () {
                            closeAll();
                            handleEmptyTrash(library.id);
                          }}>Empty Trash</DropdownItem
                        >
                      </Dropdown>
                    {/if}
                    <DropdownItem
                      on:click={function () {
                        closeAll();
                        deleteLibrary = library;
                      }}>Delete Library</DropdownItem
                    >
                  </Dropdown>
                </td>
              </tr>
              {#if renameLibrary == index}
                <div transition:slide={{ duration: 250 }} class="mb-2 ml-4">
                  <LibraryRenameForm {library} on:submit={handleEdit} on:cancel={() => (renameLibrary = null)} />
                </div>
              {/if}
              {#if editImportPaths == index}
                <div transition:slide={{ duration: 250 }} class="mb-2 ml-4">
                  <LibraryImportPathsForm {library} on:submit={handleEdit} on:cancel={() => (editImportPaths = null)} />
                </div>
              {/if}
              {#if editScanSettings == index}
                <div transition:slide={{ duration: 250 }} class="mb-2 ml-4">
                  <LibraryScanSettingsForm
                    {library}
                    on:submit={handleEdit}
                    on:cancel={() => (editScanSettings = null)}
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
          <DropdownItem on:click={() => handleCreate(LibraryType.External)}>Create External Library</DropdownItem>
        </Dropdown>
    </div>
  </div>
</section>
