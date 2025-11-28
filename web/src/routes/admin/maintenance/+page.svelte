<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import ServerStatisticsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import { AppRoute } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { MaintenanceAction, setMaintenanceMode } from '@immich/sdk';
  import { Button, HStack, Text } from '@immich/ui';
  import { mdiProgressWrench } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  async function switchToMaintenance() {
    try {
      await setMaintenanceMode({
        setMaintenanceModeDto: {
          action: MaintenanceAction.Start,
        },
      });
    } catch (error) {
      handleError(error, $t('admin.maintenance_start_error'));
    }
  }
</script>

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]}>
  {#snippet buttons()}
    <HStack gap={1}>
      <Button
        leadingIcon={mdiProgressWrench}
        size="small"
        variant="ghost"
        color="secondary"
        onclick={switchToMaintenance}
      >
        <Text class="hidden md:block">{$t('admin.maintenance_start')}</Text>
      </Button>
    </HStack>
  {/snippet}

  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      <p class="text-sm dark:text-immich-dark-fg uppercase">{$t('admin.maintenance_integrity_report')}</p>

      <div class="mt-5 hidden justify-between lg:flex gap-4">
        {#each ['orphan_file', 'missing_file', 'checksum_mismatch'] as const as reportType (reportType)}
          <ServerStatisticsCard
            title={$t(`admin.maintenance_integrity_${reportType}`)}
            value={data.integrityReport[reportType]}
          >
            {#snippet footer()}
              <Button
                href={`${AppRoute.ADMIN_MAINTENANCE_INTEGRITY_REPORT + reportType}`}
                size="tiny"
                class="self-end mt-1">View Report</Button
              >
            {/snippet}
          </ServerStatisticsCard>
        {/each}
      </div>

      <!-- <SettingAccordionState queryParam={QueryParameter.IS_OPEN}>
        <SettingAccordion
          title="Integrity Report"
          subtitle={`There are ${data.integrityReport.items.length} unresolved issues!`}
          icon={mdiRefresh}
          key="integrity-report"
        >
          <table class="mt-5 w-full text-start">
            <thead
              class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray"
            >
              <tr class="flex w-full place-items-center">
                <th class="w-2/8 text-center text-sm font-medium">Reason</th>
                <th class="w-6/8 text-center text-sm font-medium">File</th>
                <th class="w-1/8"></th>
              </tr>
            </thead>
            <tbody
              class="block max-h-80 w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg"
            >
              {#each data.integrityReport.items as { id, type, path } (id)}
                <tr class="flex py-1 w-full place-items-center even:bg-subtle/20 odd:bg-subtle/80">
                  <td class="w-2/8 text-ellipsis text-center px-2 text-sm">
                    {#if type === 'orphan_file'}
                      Orphaned File
                    {:else if type === 'missing_file'}
                      Missing File
                    {:else if type === 'checksum_mismatch'}
                      Checksum Mismatch
                    {/if}
                  </td>
                  <td class="w-6/8 text-ellipsis text-left px-2 text-sm select-all">{path}</td>
                  <td class="w-1/8 text-ellipsis text-right flex justify-end px-2">
                    <IconButton aria-label="Open" color="secondary" icon={mdiDotsVertical} variant="ghost" /></td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </SettingAccordion>
      </SettingAccordionState> -->
    </section>
  </section>
</AdminPageLayout>
