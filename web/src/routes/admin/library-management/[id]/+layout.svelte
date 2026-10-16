<script lang="ts">
  import emptyFoldersUrl from '$lib/assets/empty-folders.svg';
  import AdminCard from '$lib/components/AdminCard.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import ServerStatisticsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import TableButton from '$lib/components/TableButton.svelte';
  import LibraryFolderAddModal from '$lib/modals/LibraryFolderAddModal.svelte';
  import { createPreloadedQuery } from '$lib/queries/client';
  import { getLibraryQuery, getLibraryStatisticsQuery } from '$lib/queries/library.query';
  import { Route } from '$lib/route';
  import {
    getLibraryActions,
    getLibraryExclusionPatternActions,
    getLibraryFolderActions,
  } from '$lib/services/library.service';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import { Code, CommandPaletteDefaultProvider, Container, Heading, modalManager } from '@immich/ui';
  import { createQuery } from '@tanstack/svelte-query';
  import { mdiCameraIris, mdiChartPie, mdiFilterMinusOutline, mdiFolderOutline, mdiPlayCircle } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { LayoutProps } from './$types';

  const { children, params }: LayoutProps = $props();

  const queries = {
    library: createPreloadedQuery(() => getLibraryQuery(params.id)),
    statistics: createQuery(() => getLibraryStatisticsQuery(params.id)),
  };

  const library = $derived(queries.library.data);
  const stats = $derived(queries.statistics.data);

  const [usage, usageUnit] = $derived(stats ? getBytesWithUnit(stats.usage) : [undefined, undefined]);

  const { Edit, Delete, AddFolder, AddExclusionPattern, Scan } = $derived(getLibraryActions($t, library));
</script>

<CommandPaletteDefaultProvider name={$t('library')} actions={[Edit, Delete, AddFolder, AddExclusionPattern, Scan]} />

<AdminPageLayout
  breadcrumbs={[{ title: $t('external_libraries'), href: Route.libraries() }, { title: library.name }]}
  actions={[Scan, Edit, Delete]}
>
  <Container size="large" center>
    <div class="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
      <Heading tag="h1" size="large" class="col-span-full my-4">{library.name}</Heading>
      <div class="col-span-full flex flex-col gap-4 lg:flex-row">
        <ServerStatisticsCard icon={mdiCameraIris} title={$t('photos')} value={stats?.photos} />
        <ServerStatisticsCard icon={mdiPlayCircle} title={$t('videos')} value={stats?.videos} />
        <ServerStatisticsCard icon={mdiChartPie} title={$t('usage')} value={usage} unit={usageUnit} />
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
                  <td class="flex justify-end gap-2">
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
                <td class="flex justify-end gap-2">
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
