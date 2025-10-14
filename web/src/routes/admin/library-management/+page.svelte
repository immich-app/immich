<script lang="ts">
  import LibraryImportPathsForm from '$lib/components/forms/library-import-paths-form.svelte';
  import LibraryScanSettingsForm from '$lib/components/forms/library-scan-settings-form.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import LibraryImportPathModal from '$lib/modals/LibraryImportPathModal.svelte';
  import LibraryRenameModal from '$lib/modals/LibraryRenameModal.svelte';
  import LibraryUserPickerModal from '$lib/modals/LibraryUserPickerModal.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { ByteUnit, getBytesWithUnit } from '$lib/utils/byte-units';
  import { handleError } from '$lib/utils/handle-error';
  import {
    createLibrary,
    deleteLibrary,
    getAllLibraries,
    getLibraryStatistics,
    getUserAdmin,
    JobCommand,
    JobName,
    scanLibrary,
    sendJobCommand,
    updateLibrary,
    type LibraryResponseDto,
    type LibraryStatsResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Button, LoadingSpinner, modalManager, Text } from '@immich/ui';
  import { mdiDotsVertical, mdiPlusBoxOutline, mdiSync } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade, slide } from 'svelte/transition';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let libraries: LibraryResponseDto[] = $state([]);

  let stats: LibraryStatsResponseDto[] = [];
  let owner: UserResponseDto[] = $state([]);
  let photos: number[] = $state([]);
  let videos: number[] = $state([]);
  let totalCount: number[] = $state([]);
  let diskUsage: number[] = $state([]);
  let diskUsageUnit: ByteUnit[] = $state([]);
  let editImportPaths: number | undefined = $state();
  let editScanSettings: number | undefined = $state();
  let dropdownOpen: boolean[] = [];

  onMount(async () => {
    await readLibraryList();
  });

  const closeAll = () => {
    editImportPaths = undefined;
    editScanSettings = undefined;

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
    let createdLibrary: LibraryResponseDto | undefined;
    try {
      createdLibrary = await createLibrary({ createLibraryDto: { ownerId } });
      notificationController.show({
        message: $t('admin.library_created', { values: { library: createdLibrary.name } }),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_library'));
    } finally {
      await readLibraryList();
    }

    if (createdLibrary) {
      // Open the import paths form for the newly created library
      const createdLibraryIndex = libraries.findIndex((library) => library.id === createdLibrary.id);
      const result = await modalManager.show(LibraryImportPathModal, {
        title: $t('add_import_path'),
        submitText: $t('add'),
        importPath: null,
      });

      if (!result) {
        if (createdLibraryIndex !== null) {
          onEditImportPathClicked(createdLibraryIndex);
        }
        return;
      }

      switch (result.action) {
        case 'submit': {
          handleAddImportPath(result.importPath, createdLibraryIndex);
          break;
        }
        case 'delete': {
          await handleDelete(libraries[createdLibraryIndex], createdLibraryIndex);
          break;
        }
      }
    }
  };

  const handleAddImportPath = (newImportPath: string | null, libraryIndex: number) => {
    if ((libraryIndex !== 0 && !libraryIndex) || !newImportPath) {
      return;
    }

    try {
      onEditImportPathClicked(libraryIndex);

      libraries[libraryIndex].importPaths.push(newImportPath);
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_import_path'));
    }
  };

  const handleUpdate = async (library: Partial<LibraryResponseDto>, libraryIndex: number) => {
    try {
      const libraryId = libraries[libraryIndex].id;
      await updateLibrary({ id: libraryId, updateLibraryDto: library });
      closeAll();
      await readLibraryList();
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_library'));
    }
  };

  const handleScanAll = async () => {
    try {
      await sendJobCommand({ id: JobName.Library, jobCommandDto: { command: JobCommand.Start } });

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
      await scanLibrary({ id: libraryId });
      notificationController.show({
        message: $t('admin.scanning_library'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_scan_library'));
    }
  };

  const onRenameClicked = async (index: number) => {
    closeAll();
    const result = await modalManager.show(LibraryRenameModal, {
      library: libraries[index],
    });
    if (result) {
      await handleUpdate(result, index);
    }
  };

  const onEditImportPathClicked = (index: number) => {
    closeAll();
    editImportPaths = index;
  };

  const onScanClicked = async (library: LibraryResponseDto) => {
    closeAll();

    if (library) {
      await handleScan(library.id);
    }
  };

  const onCreateNewLibraryClicked = async () => {
    const result = await modalManager.show(LibraryUserPickerModal);
    if (result) {
      await handleCreate(result);
    }
  };

  const onScanSettingClicked = (index: number) => {
    closeAll();
    editScanSettings = index;
  };

  const handleDelete = async (library: LibraryResponseDto, index: number) => {
    closeAll();

    if (!library) {
      return;
    }

    const isConfirmed = await modalManager.showDialog({
      prompt: $t('admin.confirm_delete_library', { values: { library: library.name } }),
    });

    if (!isConfirmed) {
      return;
    }

    await refreshStats(index);
    const assetCount = totalCount[index];
    if (assetCount > 0) {
      const isConfirmed = await modalManager.showDialog({
        prompt: $t('admin.confirm_delete_library_assets', { values: { count: assetCount } }),
      });
      if (!isConfirmed) {
        return;
      }
    }

    try {
      await deleteLibrary({ id: library.id });
      notificationController.show({ message: $t('admin.library_deleted'), type: NotificationType.Info });
    } catch (error) {
      handleError(error, $t('errors.unable_to_remove_library'));
    } finally {
      await readLibraryList();
    }
  };
</script>

<AdminPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <div class="flex justify-end gap-2">
      {#if libraries.length > 0}
        <Button leadingIcon={mdiSync} onclick={handleScanAll} size="small" variant="ghost" color="secondary">
          <Text class="hidden md:block">{$t('scan_all_libraries')}</Text>
        </Button>
      {/if}
      <Button
        leadingIcon={mdiPlusBoxOutline}
        onclick={onCreateNewLibraryClicked}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('create_library')}</Text>
      </Button>
    </div>
  {/snippet}
  <section class="my-4">
    <div class="flex flex-col gap-2" in:fade={{ duration: 500 }}>
      {#if libraries.length > 0}
        <table class="w-full text-start">
          <thead
            class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray"
          >
            <tr class="grid grid-cols-6 w-full place-items-center">
              <th class="text-center text-sm font-medium">{$t('name')}</th>
              <th class="text-center text-sm font-medium">{$t('owner')}</th>
              <th class="text-center text-sm font-medium">{$t('photos')}</th>
              <th class="text-center text-sm font-medium">{$t('videos')}</th>
              <th class="text-center text-sm font-medium">{$t('size')}</th>
              <th class="text-center text-sm font-medium"></th>
            </tr>
          </thead>
          <tbody class="block overflow-y-auto rounded-md border dark:border-immich-dark-gray">
            {#each libraries as library, index (library.id)}
              <tr
                class="grid grid-cols-6 h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg even:bg-subtle/20 odd:bg-subtle/80"
              >
                <td class="text-ellipsis px-4 text-sm">{library.name}</td>
                <td class="text-ellipsis px-4 text-sm">
                  {#if owner[index] == undefined}
                    <LoadingSpinner size="large" />
                  {:else}{owner[index].name}{/if}
                </td>
                <td class="text-ellipsis px-4 text-sm">
                  {#if photos[index] == undefined}
                    <LoadingSpinner size="large" />
                  {:else}
                    {photos[index].toLocaleString($locale)}
                  {/if}
                </td>
                <td class="text-ellipsis px-4 text-sm">
                  {#if videos[index] == undefined}
                    <LoadingSpinner size="large" />
                  {:else}
                    {videos[index].toLocaleString($locale)}
                  {/if}
                </td>
                <td class="text-ellipsis px-4 text-sm">
                  {#if diskUsage[index] == undefined}
                    <LoadingSpinner size="large" />
                  {:else}
                    {diskUsage[index]}
                    {diskUsageUnit[index]}
                  {/if}
                </td>

                <td class="text-ellipsis px-4 text-sm">
                  <ButtonContextMenu
                    align="top-right"
                    direction="left"
                    color="primary"
                    size="medium"
                    icon={mdiDotsVertical}
                    title={$t('library_options')}
                    variant="filled"
                  >
                    <MenuOption onClick={() => onScanClicked(library)} text={$t('scan_library')} />
                    <hr />
                    <MenuOption onClick={() => onRenameClicked(index)} text={$t('rename')} />
                    <MenuOption onClick={() => onEditImportPathClicked(index)} text={$t('edit_import_paths')} />
                    <MenuOption onClick={() => onScanSettingClicked(index)} text={$t('scan_settings')} />
                    <hr />
                    <MenuOption
                      onClick={() => handleDelete(library, index)}
                      activeColor="bg-red-200"
                      textColor="text-red-600"
                      text={$t('delete_library')}
                    />
                  </ButtonContextMenu>
                </td>
              </tr>
              {#if editImportPaths === index}
                <!-- svelte-ignore node_invalid_placement_ssr -->
                <div transition:slide={{ duration: 250 }}>
                  <LibraryImportPathsForm
                    {library}
                    onSubmit={(lib) => handleUpdate(lib, index)}
                    onCancel={() => (editImportPaths = undefined)}
                  />
                </div>
              {/if}
              {#if editScanSettings === index}
                <!-- svelte-ignore node_invalid_placement_ssr -->
                <div transition:slide={{ duration: 250 }} class="mb-4 ms-4 me-4">
                  <LibraryScanSettingsForm
                    {library}
                    onSubmit={(lib) => handleUpdate(lib, index)}
                    onCancel={() => (editScanSettings = undefined)}
                  />
                </div>
              {/if}
            {/each}
          </tbody>
        </table>

        <!-- Empty message -->
      {:else}
        <EmptyPlaceholder text={$t('no_libraries_message')} onClick={onCreateNewLibraryClicked} />
      {/if}
    </div>
  </section>
</AdminPageLayout>
