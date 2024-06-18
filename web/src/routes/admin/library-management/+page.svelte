<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import LibraryImportPathsForm from '$lib/components/forms/library-import-paths-form.svelte';
  import LibraryRenameForm from '$lib/components/forms/library-rename-form.svelte';
  import LibraryScanSettingsForm from '$lib/components/forms/library-scan-settings-form.svelte';
  import LibraryUserPickerForm from '$lib/components/forms/library-user-picker-form.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { ByteUnit, getBytesWithUnit } from '$lib/utils/byte-units';
  import { handleError } from '$lib/utils/handle-error';
  import {
    createLibrary,
    deleteLibrary,
    getAllLibraries,
    getLibraryStatistics,
    getUserAdmin,
    removeOfflineFiles,
    scanLibrary,
    updateLibrary,
    type LibraryResponseDto,
    type LibraryStatsResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { mdiDatabase, mdiDotsVertical, mdiPlusBoxOutline, mdiSync } from '@mdi/js';
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import LinkButton from '../../../lib/components/elements/buttons/link-button.svelte';
  import type { PageData } from './$types';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import { t } from 'svelte-i18n';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';

  export let data: PageData;

  let libraries: LibraryResponseDto[] = [];

  let stats: LibraryStatsResponseDto[] = [];
  let owner: UserResponseDto[] = [];
  let photos: number[] = [];
  let videos: number[] = [];
  let totalCount: number[] = [];
  let diskUsage: number[] = [];
  let diskUsageUnit: ByteUnit[] = [];

  let confirmDeleteLibrary: LibraryResponseDto | null = null;
  let deletedLibrary: LibraryResponseDto | null = null;

  let editImportPaths: number | null;
  let editScanSettings: number | null;
  let renameLibrary: number | null;

  let updateLibraryIndex: number | null;

  let deleteAssetCount = 0;

  let dropdownOpen: boolean[] = [];

  let toCreateLibrary = false;

  onMount(async () => {
    await readLibraryList();
  });

  const closeAll = () => {
    editImportPaths = null;
    editScanSettings = null;
    renameLibrary = null;
    updateLibraryIndex = null;

    for (let index = 0; index < dropdownOpen.length; index++) {
      dropdownOpen[index] = false;
    }
  };

  const refreshStats = async (listIndex: number) => {
    stats[listIndex] = await getLibraryStatistics({ id: libraries[listIndex].id });
    owner[listIndex] = await getUserAdmin({ id: libraries[listIndex].ownerId });
    photos[listIndex] = stats[listIndex].photos;
    videos[listIndex] = stats[listIndex].videos;
    totalCount[listIndex] = stats[listIndex].total;
    [diskUsage[listIndex], diskUsageUnit[listIndex]] = getBytesWithUnit(stats[listIndex].usage, 0);
  };

  async function readLibraryList() {
    libraries = await getAllLibraries();
    dropdownOpen.length = libraries.length;

    for (let index = 0; index < libraries.length; index++) {
      await refreshStats(index);
      dropdownOpen[index] = false;
    }
  }

  const handleCreate = async (ownerId: string) => {
    try {
      const createdLibrary = await createLibrary({ createLibraryDto: { ownerId } });
      notificationController.show({
        message: $t('admin.library_created', { values: { library: createdLibrary.name } }),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_library'));
    } finally {
      toCreateLibrary = false;
      await readLibraryList();
    }
  };

  const handleUpdate = async (library: Partial<LibraryResponseDto>) => {
    if (updateLibraryIndex === null) {
      return;
    }

    try {
      const libraryId = libraries[updateLibraryIndex].id;
      await updateLibrary({ id: libraryId, updateLibraryDto: library });
      closeAll();
      await readLibraryList();
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_library'));
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
        message: $t('admin.library_deleted'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_remove_library'));
    } finally {
      confirmDeleteLibrary = null;
      deletedLibrary = null;
      await readLibraryList();
    }
  };

  const handleScanAll = async () => {
    try {
      for (const library of libraries) {
        await scanLibrary({ id: library.id, scanLibraryDto: {} });
      }
      notificationController.show({
        message: $t('admin.refreshing_all_libraries'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_scan_libraries'));
    }
  };

  const handleScan = async (libraryId: string) => {
    try {
      await scanLibrary({ id: libraryId, scanLibraryDto: {} });
      notificationController.show({
        message: $t('admin.scanning_library_for_new_files'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_scan_library'));
    }
  };

  const handleScanChanges = async (libraryId: string) => {
    try {
      await scanLibrary({ id: libraryId, scanLibraryDto: { refreshModifiedFiles: true } });
      notificationController.show({
        message: $t('admin.scanning_library_for_changed_files'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_scan_library'));
    }
  };

  const handleForceScan = async (libraryId: string) => {
    try {
      await scanLibrary({ id: libraryId, scanLibraryDto: { refreshAllFiles: true } });
      notificationController.show({
        message: $t('admin.forcing_refresh_library_files'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_scan_library'));
    }
  };

  const handleRemoveOffline = async (libraryId: string) => {
    try {
      await removeOfflineFiles({ id: libraryId });
      notificationController.show({
        message: $t('admin.removing_offline_files'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_remove_offline_files'));
    }
  };

  const onRenameClicked = (index: number) => {
    closeAll();
    renameLibrary = index;
    updateLibraryIndex = index;
  };

  const onEditImportPathClicked = (index: number) => {
    closeAll();
    editImportPaths = index;
    updateLibraryIndex = index;
  };

  const onScanNewLibraryClicked = async (library: LibraryResponseDto) => {
    closeAll();

    if (library) {
      await handleScan(library.id);
    }
  };

  const onScanSettingClicked = (index: number) => {
    closeAll();
    editScanSettings = index;
    updateLibraryIndex = index;
  };

  const onScanAllLibraryFilesClicked = async (library: LibraryResponseDto) => {
    closeAll();
    if (library) {
      await handleScanChanges(library.id);
    }
  };

  const onForceScanAllLibraryFilesClicked = async (library: LibraryResponseDto) => {
    closeAll();
    if (library) {
      await handleForceScan(library.id);
    }
  };

  const onRemoveOfflineFilesClicked = async (library: LibraryResponseDto) => {
    closeAll();
    if (library) {
      await handleRemoveOffline(library.id);
    }
  };

  const onDeleteLibraryClicked = async (library: LibraryResponseDto, index: number) => {
    closeAll();

    if (!library) {
      return;
    }

    const isConfirmedLibrary = await dialogController.show({
      id: 'delete-library',
      prompt: $t('admin.confirm_delete_library', { values: { library: library.name } }),
    });

    if (!isConfirmedLibrary) {
      return;
    }

    await refreshStats(index);
    if (totalCount[index] > 0) {
      deleteAssetCount = totalCount[index];

      const isConfirmedLibraryAssetCount = await dialogController.show({
        id: 'delete-library-assets',
        prompt: $t('admin.confirm_delete_library_assets', { values: { count: deleteAssetCount } }),
      });

      if (!isConfirmedLibraryAssetCount) {
        return;
      }
      await handleDelete();
    } else {
      deletedLibrary = library;
      await handleDelete();
    }
  };
</script>

{#if toCreateLibrary}
  <LibraryUserPickerForm
    on:submit={({ detail }) => handleCreate(detail.ownerId)}
    on:cancel={() => (toCreateLibrary = false)}
  />
{/if}

<UserPageLayout title={data.meta.title} admin>
  <div class="flex justify-end gap-2" slot="buttons">
    {#if libraries.length > 0}
      <LinkButton on:click={() => handleScanAll()}>
        <div class="flex gap-1 text-sm">
          <Icon path={mdiSync} size="18" />
          <span>{$t('scan_all_libraries')}</span>
        </div>
      </LinkButton>
    {/if}
    <LinkButton on:click={() => (toCreateLibrary = true)}>
      <div class="flex gap-1 text-sm">
        <Icon path={mdiPlusBoxOutline} size="18" />
        <span>{$t('create_library')}</span>
      </div>
    </LinkButton>
  </div>
  <section class="my-4">
    <div class="flex flex-col gap-2" in:fade={{ duration: 500 }}>
      {#if libraries.length > 0}
        <table class="w-full text-left">
          <thead
            class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
          >
            <tr class="grid grid-cols-6 w-full place-items-center">
              <th class="text-center text-sm font-medium">{$t('type')}</th>
              <th class="text-center text-sm font-medium">{$t('name')}</th>
              <th class="text-center text-sm font-medium">{$t('owner')}</th>
              <th class="text-center text-sm font-medium">{$t('assets')}</th>
              <th class="text-center text-sm font-medium">{$t('size')}</th>
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
                  <Icon
                    path={mdiDatabase}
                    size="40"
                    title={$t('admin.external_library_created_at', { values: { date: library.createdAt } })}
                  />
                </td>

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
                  <ButtonContextMenu
                    align="top-right"
                    direction="left"
                    color="primary"
                    size="16"
                    icon={mdiDotsVertical}
                    title={$t('library_options')}
                  >
                    <MenuOption onClick={() => onRenameClicked(index)} text={$t('rename')} />
                    <MenuOption onClick={() => onEditImportPathClicked(index)} text={$t('edit_import_paths')} />
                    <MenuOption onClick={() => onScanSettingClicked(index)} text={$t('scan_settings')} />
                    <hr />
                    <MenuOption onClick={() => onScanNewLibraryClicked(library)} text={$t('scan_new_library_files')} />
                    <MenuOption
                      onClick={() => onScanAllLibraryFilesClicked(library)}
                      text={$t('scan_all_library_files')}
                      subtitle={$t('only_refreshes_modified_files')}
                    />
                    <MenuOption
                      onClick={() => onForceScanAllLibraryFilesClicked(library)}
                      text={$t('force_re-scan_library_files')}
                      subtitle={$t('refreshes_every_file')}
                    />
                    <hr />
                    <MenuOption
                      onClick={() => onRemoveOfflineFilesClicked(library)}
                      text={$t('remove_offline_files')}
                    />
                    <MenuOption
                      text={$t('delete_library')}
                      activeColor="bg-red-200"
                      textColor="text-red-600"
                      onClick={() => onDeleteLibraryClicked(library, index)}
                    />
                  </ButtonContextMenu>
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
                    on:submit={({ detail: library }) => handleUpdate(library)}
                    on:cancel={() => (editScanSettings = null)}
                  />
                </div>
              {/if}
            {/each}
          </tbody>
        </table>

        <!-- Empty message -->
      {:else}
        <EmptyPlaceholder text={$t('no_libraries_message')} onClick={() => (toCreateLibrary = true)} />
      {/if}
    </div>
  </section>
</UserPageLayout>
