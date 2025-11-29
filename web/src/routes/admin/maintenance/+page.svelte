<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import ServerStatisticsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import { AppRoute } from '$lib/constants';
  import { asyncTimeout } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    createJob,
    getIntegrityReportSummary,
    getQueuesLegacy,
    IntegrityReportType,
    MaintenanceAction,
    ManualJobName,
    setMaintenanceMode,
    type MaintenanceIntegrityReportSummaryResponseDto,
    type QueuesResponseLegacyDto,
  } from '@immich/sdk';
  import { Button, HStack, Text, toastManager } from '@immich/ui';
  import { mdiProgressWrench } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let integrityReport: MaintenanceIntegrityReportSummaryResponseDto | undefined = $state(data.integrityReport);

  const TYPES: IntegrityReportType[] = [
    IntegrityReportType.OrphanFile,
    IntegrityReportType.MissingFile,
    IntegrityReportType.ChecksumMismatch,
  ];

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

  let jobs: QueuesResponseLegacyDto | undefined = $state();
  let expectingUpdate: boolean = $state(false);

  async function runJob(reportType: IntegrityReportType, refreshOnly?: boolean) {
    let name: ManualJobName;
    switch (reportType) {
      case IntegrityReportType.OrphanFile: {
        name = refreshOnly ? ManualJobName.IntegrityOrphanFilesRefresh : ManualJobName.IntegrityOrphanFiles;
        break;
      }
      case IntegrityReportType.MissingFile: {
        name = refreshOnly ? ManualJobName.IntegrityMissingFilesRefresh : ManualJobName.IntegrityMissingFiles;
        break;
      }
      case IntegrityReportType.ChecksumMismatch: {
        name = refreshOnly ? ManualJobName.IntegrityChecksumMismatchRefresh : ManualJobName.IntegrityChecksumMismatch;
        break;
      }
    }

    try {
      await createJob({ jobCreateDto: { name } });
      if (jobs) {
        expectingUpdate = true;
        jobs.backgroundTask.queueStatus.isActive = true;
      }
      toastManager.success($t('admin.job_created'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_submit_job'));
    }
  }

  let running = true;

  onMount(async () => {
    while (running) {
      jobs = await getQueuesLegacy();
      if (jobs.backgroundTask.queueStatus.isActive) {
        expectingUpdate = true;
      } else if (expectingUpdate) {
        integrityReport = await getIntegrityReportSummary();
      }
      await asyncTimeout(5000);
    }
  });

  onDestroy(() => {
    running = false;
  });
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
        {#each TYPES as reportType (reportType)}
          <ServerStatisticsCard
            title={$t(`admin.maintenance_integrity_${reportType}`)}
            value={integrityReport[reportType]}
          >
            {#snippet footer()}
              <HStack gap={1} class="justify-end">
                <Button
                  onclick={() => runJob(reportType)}
                  size="tiny"
                  variant="ghost"
                  class="self-end mt-1"
                  disabled={jobs?.backgroundTask.queueStatus.isActive}>Check All</Button
                >
                <Button
                  onclick={() => runJob(reportType, true)}
                  size="tiny"
                  variant="ghost"
                  class="self-end mt-1"
                  disabled={jobs?.backgroundTask.queueStatus.isActive}>Refresh</Button
                >
                <Button
                  href={`${AppRoute.ADMIN_MAINTENANCE_INTEGRITY_REPORT + reportType}`}
                  size="tiny"
                  class="self-end mt-1">View</Button
                >
              </HStack>
            {/snippet}
          </ServerStatisticsCard>
        {/each}
      </div>
    </section>
  </section>
</AdminPageLayout>
