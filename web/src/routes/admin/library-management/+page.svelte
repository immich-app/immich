<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import LibraryImportPathsForm from '$lib/components/forms/library-import-paths-form.svelte';
  import LibraryRenameForm from '$lib/components/forms/library-rename-form.svelte';
  import LibraryScanSettingsForm from '$lib/components/forms/library-scan-settings-form.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import { getContextMenuPosition } from '$lib/utils/context-menu';
  import { handleError } from '$lib/utils/handle-error';
  import {
    LibraryType,
    createLibrary,
    deleteLibrary,
    getLibraryStatistics,
    removeOfflineFiles,
    scanLibrary,
    updateLibrary,
    type LibraryResponseDto,
    type LibraryStatsResponseDto,
    getAllLibraries,
    type UserResponseDto,
    getUserById,
    type CreateLibraryDto,
  } from '@immich/sdk';
  import { mdiDatabase, mdiDotsVertical, mdiUpload } from '@mdi/js';
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import type { PageData } from './$types';
  import LibraryUserPickerForm from '$lib/components/forms/library-user-picker-form.svelte';

  export let data: PageData;

  let libraries: LibraryResponseDto[] = [];

  let stats: LibraryStatsResponseDto[] = [];
  let owner: UserResponseDto[] = [];
  let photos: number[] = [];
  let videos: number[] = [];
  let totalCount: number[] = [];
  let diskUsage: number[] = [];
  let diskUsageUnit: string[] = [];

  let confirmDeleteLibrary: LibraryResponseDto | null = null;
  let deletedLibrary: LibraryResponseDto | null = null;

  let editImportPaths: number | null;
  let editScanSettings: number | null;
  let renameLibrary: number | null;

  let updateLibraryIndex: number | null;

  let deleteAssetCount = 0;

  let dropdownOpen: boolean[] = [];
  let showContextMenu = false;
  let contextMenuPosition = { x: 0, y: 0 };
  let selectedLibraryIndex = 0;
  let selectedLibrary: LibraryResponseDto | null = null;

  let toCreateLibrary = false;

  onMount(async () => {
    await readLibraryList();
  });

  const closeAll = () => {
    editImportPaths = null;
    editScanSettings = null;
    renameLibrary = null;
    updateLibraryIndex = null;
    showContextMenu = false;

    for (let index = 0; index < dropdownOpen.length; index++) {
      dropdownOpen[index] = false;
    }
  };

  const showMenu = (event: MouseEvent, library: LibraryResponseDto, index: number) => {
    contextMenuPosition = getContextMenuPosition(event);
    showContextMenu = !showContextMenu;

    selectedLibraryIndex = index;
    selectedLibrary = library;
  };

  const onMenuExit = () => {
    showContextMenu = false;
  };

  const refreshStats = async (listIndex: number) => {
    stats[listIndex] = await getLibraryStatistics({ id: libraries[listIndex].id });
    owner[listIndex] = await getUserById({ id: libraries[listIndex].ownerId });
    photos[listIndex] = stats[listIndex].photos;
    videos[listIndex] = stats[listIndex].videos;
    totalCount[listIndex] = stats[listIndex].total;
    [diskUsage[listIndex], diskUsageUnit[listIndex]] = getBytesWithUnit(stats[listIndex].usage, 0);
  };

  async function readLibraryList() {
    libraries = await getAllLibraries({ $type: LibraryType.External });
    dropdownOpen.length = libraries.length;

    for (let index = 0; index < libraries.length; index++) {
      await refreshStats(index);
      dropdownOpen[index] = false;
    }
  }

  const handleCreate = async (ownerId: string | null) => {
    try {
      let createLibraryDto: CreateLibraryDto = { type: LibraryType.External };
      if (ownerId) {
        createLibraryDto = { ...createLibraryDto, ownerId };
      }

      const createdLibrary = await createLibrary({ createLibraryDto });

      notificationController.show({
        message: `Created library: ${createdLibrary.name}`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to create library');
    } finally {
      toCreateLibrary = false;
      await readLibraryList();
    }
  };

  const handleUpdate = async (event: Partial<LibraryResponseDto>) => {
    if (updateLibraryIndex === null) {
      return;
    }

    try {
      const libraryId = libraries[updateLibraryIndex].id;
      await updateLibrary({ id: libraryId, updateLibraryDto: { ...event } });
      closeAll();
      await readLibraryList();
    } catch (error) {
      handleError(error, 'Unable to update library');
    }
  };

  const handleDelete = async () => {
    if (confirmDeleteLibrary) {
      deletedLibrary = confirmDeleteLibrary;
    }

    if (!deletedLibrary) {
      return;
    }

    try {
      await deleteLibrary({ id: deletedLibrary.id });
      notificationController.show({
        message: `Library deleted`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to remove library');
    } finally {
      confirmDeleteLibrary = null;
      deletedLibrary = null;
      await readLibraryList();
    }
  };

  const handleScanAll = async () => {
    try {
      for (const library of libraries) {
        if (library.type === LibraryType.External) {
          await scanLibrary({ id: library.id, scanLibraryDto: {} });
        }
      }
      notificationController.show({
        message: `Refreshing all libraries`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to scan libraries');
    }
  };

  const handleScan = async (libraryId: string) => {
    try {
      await scanLibrary({ id: libraryId, scanLibraryDto: {} });
      notificationController.show({
        message: `Scanning library for new files`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to scan library');
    }
  };

  const handleScanChanges = async (libraryId: string) => {
    try {
      await scanLibrary({ id: libraryId, scanLibraryDto: { refreshModifiedFiles: true } });
      notificationController.show({
        message: `Scanning library for changed files`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to scan library');
    }
  };

  const handleForceScan = async (libraryId: string) => {
    try {
      await scanLibrary({ id: libraryId, scanLibraryDto: { refreshAllFiles: true } });
      notificationController.show({
        message: `Forcing refresh of all library files`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to scan library');
    }
  };

  const handleRemoveOffline = async (libraryId: string) => {
    try {
      await removeOfflineFiles({ id: libraryId });
      notificationController.show({
        message: `Removing Offline Files`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to remove offline files');
    }
  };

  const onRenameClicked = () => {
    closeAll();
    renameLibrary = selectedLibraryIndex;
    updateLibraryIndex = selectedLibraryIndex;
  };

  const onEditImportPathClicked = () => {
    closeAll();
    editImportPaths = selectedLibraryIndex;
    updateLibraryIndex = selectedLibraryIndex;
  };

  const onScanNewLibraryClicked = async () => {
    closeAll();

    if (selectedLibrary) {
      await handleScan(selectedLibrary.id);
    }
  };

  const onScanSettingClicked = () => {
    closeAll();
    editScanSettings = selectedLibraryIndex;
    updateLibraryIndex = selectedLibraryIndex;
  };

  const onScanAllLibraryFilesClicked = async () => {
    closeAll();
    if (selectedLibrary) {
      await handleScanChanges(selectedLibrary.id);
    }
  };

  const onForceScanAllLibraryFilesClicked = async () => {
    closeAll();
    if (selectedLibrary) {
      await handleForceScan(selectedLibrary.id);
    }
  };

  const onRemoveOfflineFilesClicked = async () => {
    closeAll();
    if (selectedLibrary) {
      await handleRemoveOffline(selectedLibrary.id);
    }
  };

  const onDeleteLibraryClicked = async () => {
    closeAll();

    if (selectedLibrary && confirm(`Are you sure you want to delete ${selectedLibrary.name} library?`) == true) {
      await refreshStats(selectedLibraryIndex);
      if (totalCount[selectedLibraryIndex] > 0) {
        deleteAssetCount = totalCount[selectedLibraryIndex];
        confirmDeleteLibrary = selectedLibrary;
      } else {
        deletedLibrary = selectedLibrary;
        await handleDelete();
      }
    }
  };
</script>

{#if confirmDeleteLibrary}
  <ConfirmDialogue
    title="Warning!"
    prompt="Are you sure you want to delete this library? This will delete all {deleteAssetCount} contained assets from Immich and cannot be undone. Files will remain on disk."
    on:confirm={handleDelete}
    on:cancel={() => (confirmDeleteLibrary = null)}
  />
{/if}

{#if toCreateLibrary}
  <LibraryUserPickerForm
    on:submit={({ detail }) => handleCreate(detail.ownerId)}
    on:cancel={() => (toCreateLibrary = false)}
  />
{/if}

<UserPageLayout title={data.meta.title} admin>
  <section class="my-4">
    <div class="flex flex-col gap-2" in:fade={{ duration: 500 }}>
      {#if libraries.length > 0}
        <table class="w-full text-left">
          <thead
            class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
          >
            <tr class="grid grid-cols-6 w-full place-items-center">
              <th class="text-center text-sm font-medium">Type</th>
              <th class="text-center text-sm font-medium">Name</th>
              <th class="text-center text-sm font-medium">Owner</th>
              <th class="text-center text-sm font-medium">Assets</th>
              <th class="text-center text-sm font-medium">Size</th>
              <th class="text-center text-sm font-medium" />
            </tr>
          </thead>
          <tbody class="block overflow-y-auto rounded-md border dark:border-immich-dark-gray">
            {#each libraries as library, index (library.id)}
              <tr
                class={`grid grid-cols-6 h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
                  index % 2 == 0
                    ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
                    : 'bg-immich-bg dark:bg-immich-dark-gray/50'
                }`}
              >
                <td class=" px-10 text-sm">
                  {#if library.type === LibraryType.External}
                    <Icon path={mdiDatabase} size="40" title="External library (created on {library.createdAt})" />
                  {:else if library.type === LibraryType.Upload}
                    <Icon path={mdiUpload} size="40" title="Upload library (created on {library.createdAt})" />
                  {/if}</td
                >

                <td class=" text-ellipsis px-4 text-sm">{library.name}</td>
                <td class=" text-ellipsis px-4 text-sm">
                  {#if owner[index] == undefined}
                    <LoadingSpinner size="40" />
                  {:else}{owner[index].name}{/if}
                </td>

                {#if totalCount[index] == undefined}
                  <td colspan="2" class="flex w-1/3 items-center justify-center text-ellipsis px-4 text-sm">
                    <LoadingSpinner size="40" />
                  </td>
                {:else}
                  <td class=" text-ellipsis px-4 text-sm">
                    {totalCount[index]}
                  </td>
                  <td class=" text-ellipsis px-4 text-sm">{diskUsage[index]} {diskUsageUnit[index]}</td>
                {/if}

                <td class=" text-ellipsis px-4 text-sm">
                  <button
                    class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
                    on:click|stopPropagation|preventDefault={(e) => showMenu(e, library, index)}
                  >
                    <Icon path={mdiDotsVertical} size="16" />
                  </button>

                  {#if showContextMenu}
                    <Portal target="body">
                      <ContextMenu {...contextMenuPosition} on:outclick={() => onMenuExit()}>
                        <MenuOption on:click={() => onRenameClicked()} text={`Rename`} />

                        {#if selectedLibrary && selectedLibrary.type === LibraryType.External}
                          <MenuOption on:click={() => onEditImportPathClicked()} text="Edit Import Paths" />
                          <MenuOption on:click={() => onScanSettingClicked()} text="Scan Settings" />
                          <hr />
                          <MenuOption on:click={() => onScanNewLibraryClicked()} text="Scan New Library Files" />
                          <MenuOption
                            on:click={() => onScanAllLibraryFilesClicked()}
                            text="Re-scan All Library Files"
                            subtitle={'Only refreshes modified files'}
                          />
                          <MenuOption
                            on:click={() => onForceScanAllLibraryFilesClicked()}
                            text="Force Re-scan All Library Files"
                            subtitle={'Refreshes every file'}
                          />
                          <hr />
                          <MenuOption on:click={() => onRemoveOfflineFilesClicked()} text="Remove Offline Files" />
                          <MenuOption on:click={() => onDeleteLibraryClicked()}>
                            <p class="text-red-600">Delete library</p>
                          </MenuOption>
                        {/if}
                      </ContextMenu>
                    </Portal>
                  {/if}
                </td>
              </tr>
              {#if renameLibrary === index}
                <div transition:slide={{ duration: 250 }}>
                  <LibraryRenameForm
                    {library}
                    on:submit={({ detail }) => handleUpdate(detail)}
                    on:cancel={() => (renameLibrary = null)}
                  />
                </div>
              {/if}
              {#if editImportPaths === index}
                <div transition:slide={{ duration: 250 }}>
                  <LibraryImportPathsForm
                    {library}
                    on:submit={({ detail }) => handleUpdate(detail)}
                    on:cancel={() => (editImportPaths = null)}
                  />
                </div>
              {/if}
              {#if editScanSettings === index}
                <div transition:slide={{ duration: 250 }} class="mb-4 ml-4 mr-4">
                  <LibraryScanSettingsForm
                    {library}
                    on:submit={({ detail }) => handleUpdate(detail.library)}
                    on:cancel={() => (editScanSettings = null)}
                  />
                </div>
              {/if}
            {/each}
          </tbody>
        </table>
      {/if}
      <div class="my-2 flex justify-end gap-2">
        <Button size="sm" on:click={() => handleScanAll()}>Scan All Libraries</Button>
        <Button size="sm" on:click={() => (toCreateLibrary = true)}>Create Library</Button>
      </div>
    </div>
  </section>
</UserPageLayout>
