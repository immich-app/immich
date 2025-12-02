<script lang="ts">
  import { goto } from '$app/navigation';
  import emptyFoldersUrl from '$lib/assets/empty-folders.svg';
  import HeaderButton from '$lib/components/HeaderButton.svelte';
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
  import {
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Code,
    CommandPaletteContext,
    Container,
    Heading,
    Icon,
    modalManager,
  } from '@immich/ui';
  import { mdiCameraIris, mdiChartPie, mdiFilterMinusOutline, mdiFolderOutline, mdiPlayCircle } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const statistics = data.statistics;
  const [storageUsage, unit] = getBytesWithUnit(statistics.usage);

  let library = $derived(data.library);

  const { Rename, Delete, AddFolder, AddExclusionPattern, Scan } = $derived(getLibraryActions($t, library));
</script>

<OnEvents
  onLibraryUpdate={(newLibrary) => (library = newLibrary)}
  onLibraryDelete={({ id }) => id === library.id && goto(AppRoute.ADMIN_LIBRARY_MANAGEMENT)}
/>

<CommandPaletteContext commands={[Rename, Delete, AddFolder, AddExclusionPattern, Scan]} />

<AdminPageLayout
  breadcrumbs={[
    { title: $t('admin.external_library_management'), href: AppRoute.ADMIN_LIBRARY_MANAGEMENT },
    { title: library.name },
  ]}
>
  {#snippet buttons()}
    <div class="flex justify-end gap-2">
      <HeaderButton action={Scan} />
      <HeaderButton action={Rename} />
      <HeaderButton action={Delete} />
    </div>
  {/snippet}
  <Container size="large" center>
    <div class="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
      <Heading tag="h1" size="large" class="col-span-full my-4">{library.name}</Heading>
      <div class="flex flex-col lg:flex-row gap-4 col-span-full">
        <ServerStatisticsCard icon={mdiCameraIris} title={$t('photos')} value={statistics.photos} />
        <ServerStatisticsCard icon={mdiPlayCircle} title={$t('videos')} value={statistics.videos} />
        <ServerStatisticsCard icon={mdiChartPie} title={$t('usage')} value={storageUsage} {unit} />
      </div>
      <Card color="secondary">
        <CardHeader>
          <div class="flex w-full justify-between items-center px-4 py-2">
            <div class="flex gap-2 text-primary">
              <Icon icon={mdiFolderOutline} size="1.5rem" />
              <CardTitle>{$t('folders')}</CardTitle>
            </div>
            <HeaderButton action={AddFolder} />
          </div>
        </CardHeader>
        <CardBody>
          <div class="px-4 pb-7">
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
          </div>
        </CardBody>
      </Card>
      <Card color="secondary">
        <CardHeader>
          <div class="flex w-full justify-between items-center px-4 py-2">
            <div class="flex gap-2 text-primary">
              <Icon icon={mdiFilterMinusOutline} size="1.5rem" />
              <CardTitle>{$t('exclusion_pattern')}</CardTitle>
            </div>
            <HeaderButton action={AddExclusionPattern} />
          </div>
        </CardHeader>
        <CardBody>
          <div class="px-4 pb-7">
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
          </div>
        </CardBody>
      </Card>
    </div>
  </Container>
</AdminPageLayout>
