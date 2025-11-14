<script lang="ts">
  import HeaderButton from '$lib/components/HeaderButton.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import ServerStatisticsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import TableButton from '$lib/components/TableButton.svelte';
  import {
    getLibraryActions,
    getLibraryExclusionPatternActions,
    getLibraryImportPathActions,
  } from '$lib/services/library.service';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import { Card, CardBody, CardHeader, CardTitle, Code, Container, Heading, Icon } from '@immich/ui';
  import { mdiCameraIris, mdiChartPie, mdiFilterMinusOutline, mdiFolderOutline, mdiPlayCircle } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const statistics = data.statistics;
  const [storageUsage, unit] = getBytesWithUnit(statistics.usage);

  let library = $state(data.library);

  const { Edit, Delete, AddImportPath, AddExclusionPattern } = $derived(getLibraryActions($t, library));
</script>

<OnEvents onLibraryUpdate={(newLibrary) => (library = newLibrary)} />

<AdminPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <div class="flex justify-end gap-2">
      <HeaderButton action={Edit} />
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
            <HeaderButton action={AddImportPath} />
          </div>
        </CardHeader>
        <CardBody>
          <div class="px-4 pb-7">
            <table class="w-full">
              <tbody>
                {#each library.importPaths as importPath (importPath)}
                  {@const { Edit, Delete } = getLibraryImportPathActions($t, library, importPath)}
                  <tr class="h-12">
                    <td>
                      <Code>{importPath}</Code>
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
