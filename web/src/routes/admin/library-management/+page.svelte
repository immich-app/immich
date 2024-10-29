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
  import { locale } from '$lib/stores/preferences.store';

  export let data: PageData;

  let libraries: LibraryResponseDto[] = [];

  let stats: LibraryStatsResponseDto[] = [];
  let owner: UserResponseDto[] = [];
  let photos: number[] = [];
  let videos: number[] = [];
  let totalCount: number[] = [];
  let diskUsage: number[] = [];
  let diskUsageUnit: ByteUnit[] = [];
  let editImportPaths: number | null;
  let editScanSettings: number | null;
  let renameLibrary: number | null;
  let updateLibraryIndex: number | null;
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

  const handleScanAll = async () => {
    try {
      for (const library of libraries) {
        await scanLibrary({ id: library.id });
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
      await scanLibrary({ id: libraryId });
      notificationController.show({
        message: $t('admin.scanning_library'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_scan_library'));
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

  const onScanClicked = async (library: LibraryResponseDto) => {
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

  const handleDelete = async (library: LibraryResponseDto, index: number) => {
    closeAll();

    if (!library) {
      return;
    }

    const isConfirmed = await dialogController.show({
      prompt: $t('admin.confirm_delete_library', { values: { library: library.name } }),
    });

    if (!isConfirmed) {
      return;
    }

    await refreshStats(index);
    const assetCount = totalCount[index];
    if (assetCount > 0) {
      const isConfirmed = await dialogController.show({
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

{#if toCreateLibrary}
  <LibraryUserPickerForm onSubmit={handleCreate} onCancel={() => (toCreateLibrary = false)} />
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
                <td class=" text-ellipsis px-4 text-sm">
                  {#if totalCount[index] == undefined}
                    <LoadingSpinner size="40" />
                  {:else}
                    {totalCount[index].toLocaleString($locale)}
                  {/if}
                </td>
                <td class=" text-ellipsis px-4 text-sm">
                  {#if diskUsage[index] == undefined}
                    <LoadingSpinner size="40" />
                  {:else}
                    {diskUsage[index]}
                    {diskUsageUnit[index]}
                  {/if}
                </td>

                <td class=" text-ellipsis px-4 text-sm">
                  <ButtonContextMenu
                    align="top-right"
                    direction="left"
                    color="primary"
                    size="16"
                    icon={mdiDotsVertical}
                    title={$t('library_options')}
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
              {#if renameLibrary === index}
                <div transition:slide={{ duration: 250 }}>
                  <LibraryRenameForm {library} onSubmit={handleUpdate} onCancel={() => (renameLibrary = null)} />
                </div>
              {/if}
              {#if editImportPaths === index}
                <div transition:slide={{ duration: 250 }}>
                  <LibraryImportPathsForm {library} onSubmit={handleUpdate} onCancel={() => (editImportPaths = null)} />
                </div>
              {/if}
              {#if editScanSettings === index}
                <div transition:slide={{ duration: 250 }} class="mb-4 ml-4 mr-4">
                  <LibraryScanSettingsForm
                    {library}
                    onSubmit={handleUpdate}
                    onCancel={() => (editScanSettings = null)}
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
