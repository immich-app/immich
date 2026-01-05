<script lang="ts">
  import { goto } from '$app/navigation';
  import emptyFoldersUrl from '$lib/assets/empty-folders.svg';
  import AdminCard from '$lib/components/AdminCard.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import ServerStatisticsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import TableButton from '$lib/components/TableButton.svelte';
  import { AppRoute } from '$lib/constants';
  import LibraryFolderAddModal from '$lib/modals/LibraryFolderAddModal.svelte';
  import {
    getLibraryActions,
    getLibraryExclusionPatternActions,
    getLibraryFolderActions,
  } from '$lib/services/library.service';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Code, CommandPaletteDefaultProvider, Container, Heading, modalManager } from '@immich/ui';
  import { mdiCameraIris, mdiChartPie, mdiFilterMinusOutline, mdiFolderOutline, mdiPlayCircle } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { LayoutData } from './$types';

  type Props = {
    children?: Snippet;
    data: LayoutData;
  };

  const { children, data }: Props = $props();

  const statistics = data.statistics;
  const [storageUsage, unit] = getBytesWithUnit(statistics.usage);

  let library = $state(data.library);

  const onLibraryUpdate = (newLibrary: LibraryResponseDto) => {
    if (newLibrary.id === library.id) {
      library = newLibrary;
    }
  };

  const onLibraryDelete = async ({ id }: { id: string }) => {
    if (id === library.id) {
      await goto(AppRoute.ADMIN_LIBRARIES);
    }
  };

  const { Edit, Delete, AddFolder, AddExclusionPattern, Scan } = $derived(getLibraryActions($t, library));
</script>

<OnEvents {onLibraryUpdate} {onLibraryDelete} />

<CommandPaletteDefaultProvider name={$t('library')} actions={[Edit, Delete, AddFolder, AddExclusionPattern, Scan]} />

<AdminPageLayout
  breadcrumbs={[{ title: $t('external_libraries'), href: AppRoute.ADMIN_LIBRARIES }, { title: library.name }]}
  actions={[Scan, Edit, Delete]}
>
  <Container size="large" center>
    <div class="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
      <Heading tag="h1" size="large" class="col-span-full my-4">{library.name}</Heading>
      <div class="flex flex-col lg:flex-row gap-4 col-span-full">
        <ServerStatisticsCard icon={mdiCameraIris} title={$t('photos')} value={statistics.photos} />
        <ServerStatisticsCard icon={mdiPlayCircle} title={$t('videos')} value={statistics.videos} />
        <ServerStatisticsCard icon={mdiChartPie} title={$t('usage')} value={storageUsage} {unit} />
      </div>

      <AdminCard icon={mdiFolderOutline} title={$t('folders')} headerAction={AddFolder}>
        {#if library.importPaths.length === 0}
          <EmptyPlaceholder
            src={emptyFoldersUrl}
            text={$t('admin.library_folder_description')}
            fullWidth
            onClick={() => modalManager.show(LibraryFolderAddModal, { library })}
          />
        {:else}
          <table class="w-full">
            <tbody>
              {#each library.importPaths as folder (folder)}
                {@const { Edit, Delete } = getLibraryFolderActions($t, library, folder)}
                <tr class="h-12">
                  <td>
                    <Code>{folder}</Code>
                  </td>
                  <td class="flex gap-2 justify-end">
                    <TableButton action={Edit} />
                    <TableButton action={Delete} />
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </AdminCard>

      <AdminCard icon={mdiFilterMinusOutline} title={$t('exclusion_pattern')} headerAction={AddExclusionPattern}>
        <table class="w-full">
          <tbody>
            {#each library.exclusionPatterns as exclusionPattern (exclusionPattern)}
              {@const { Edit, Delete } = getLibraryExclusionPatternActions($t, library, exclusionPattern)}
              <tr class="h-12">
                <td>
                  <Code>{exclusionPattern}</Code>
                </td>
                <td class="flex gap-2 justify-end">
                  <TableButton action={Edit} />
                  <TableButton action={Delete} />
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </AdminCard>
    </div>
    {@render children?.()}
  </Container>
</AdminPageLayout>
