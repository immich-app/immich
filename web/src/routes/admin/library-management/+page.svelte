<script lang="ts">
  import LibraryImportPathsForm from '$lib/components/forms/library-import-paths-form.svelte';
  import LibraryScanSettingsForm from '$lib/components/forms/library-scan-settings-form.svelte';
  import HeaderButton from '$lib/components/HeaderButton.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import TableButton from '$lib/components/TableButton.svelte';
  import LibraryRenameModal from '$lib/modals/LibraryRenameModal.svelte';
  import { getLibrariesActions, getLibraryActions, handleLibraryCreate } from '$lib/services/library.service';
  import { locale } from '$lib/stores/preferences.store';
  import { ByteUnit, getBytesWithUnit } from '$lib/utils/byte-units';
  import { handleError } from '$lib/utils/handle-error';
  import {
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
  import { LoadingSpinner, modalManager, toastManager } from '@immich/ui';
  import { mdiDotsVertical } from '@mdi/js';
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

  const handleScan = async (libraryId: string) => {
    try {
      await scanLibrary({ id: libraryId });
      toastManager.info($t('admin.scanning_library'));
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
      toastManager.success($t('admin.library_deleted'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_remove_library'));
    } finally {
      await readLibraryList();
    }
  };

  const { Create, ScanAll } = $derived(getLibrariesActions($t));
</script>

<!-- TODO fetching everything again is overkill, we know what's new -->
<OnEvents
  onLibraryCreate={() => readLibraryList()}
  onLibraryUpdate={() => readLibraryList()}
  onLibraryDelete={() => readLibraryList()}
/>

<AdminPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <div class="flex justify-end gap-2">
      {#if libraries.length > 0}
        <HeaderButton action={ScanAll} />
      {/if}
      <HeaderButton action={Create} />
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
              {@const { View, Delete } = getLibraryActions($t, library)}
              <tr
                class="grid grid-cols-6 h-20 w-full place-items-center text-center dark:text-immich-dark-fg even:bg-subtle/20 odd:bg-subtle/80"
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

                <td class="flex gap-2 text-ellipsis px-4 text-sm">
                  <TableButton action={View} />
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
                    <TableButton action={Delete} />
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
        <EmptyPlaceholder text={$t('no_libraries_message')} onClick={handleLibraryCreate} />
      {/if}
    </div>
  </section>
</AdminPageLayout>
