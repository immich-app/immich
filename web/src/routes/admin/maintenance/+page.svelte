<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import ServerStatisticsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import { AppRoute } from '$lib/constants';
  import { getMaintenanceAdminActions } from '$lib/services/maintenance.service';
  import { asyncTimeout } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    createJob,
    getIntegrityReportSummary,
    getQueuesLegacy,
    IntegrityReportType,
    ManualJobName,
    type IntegrityReportSummaryResponseDto,
    type QueuesResponseLegacyDto,
  } from '@immich/sdk';
  import { Button, HStack, toastManager } from '@immich/ui';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  const { data }: Props = $props();
  const { StartMaintenance } = $derived(getMaintenanceAdminActions($t));

  let integrityReport: IntegrityReportSummaryResponseDto = $state(data.integrityReport);

  const TYPES: IntegrityReportType[] = [
    IntegrityReportType.UntrackedFile,
    IntegrityReportType.MissingFile,
    IntegrityReportType.ChecksumMismatch,
  ];

  let jobs: QueuesResponseLegacyDto | undefined = $state();
  let expectingUpdate: boolean = $state(false);

  async function runJob(reportType: IntegrityReportType, refreshOnly?: boolean) {
    let name: ManualJobName;
    switch (reportType) {
      case IntegrityReportType.UntrackedFile: {
        name = refreshOnly ? ManualJobName.IntegrityUntrackedFilesRefresh : ManualJobName.IntegrityUntrackedFiles;
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
        jobs.integrityCheck.queueStatus.isActive = true;
      }
      toastManager.success($t('admin.job_created'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_submit_job'));
    }
  }

  async function runAllJobs(refreshOnly?: boolean) {
    for (const reportType of Object.values(IntegrityReportType)) {
      await runJob(reportType, refreshOnly);
    }
  }

  let running = true;

  onMount(async () => {
    while (running) {
      jobs = await getQueuesLegacy();
      if (jobs.integrityCheck.queueStatus.isActive) {
        expectingUpdate = true;
      } else if (expectingUpdate) {
        integrityReport = await getIntegrityReportSummary();
        expectingUpdate = false;
      }

      await asyncTimeout(2000);
    }
  });

  onDestroy(() => {
    running = false;
  });
</script>

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[StartMaintenance]}>
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      <HStack>
        <p class="text-sm dark:text-immich-dark-fg uppercase">{$t('admin.maintenance_integrity_report')}</p>
        <Button
          size="tiny"
          variant="ghost"
          onclick={() => runAllJobs()}
          class="self-end mt-1"
          disabled={jobs?.integrityCheck.queueStatus.isActive}>{$t('admin.maintenance_integrity_check_all')}</Button
        >
        <Button
          size="tiny"
          variant="ghost"
          onclick={() => runAllJobs(true)}
          class="self-end mt-1"
          disabled={jobs?.integrityCheck.queueStatus.isActive}>{$t('refresh')}</Button
        ></HStack
      >

      <div class="mt-5 flex justify-between max-lg:flex-wrap gap-4">
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
                  disabled={jobs?.integrityCheck.queueStatus.isActive}
                  >{$t('admin.maintenance_integrity_check_all')}</Button
                >
                <Button
                  onclick={() => runJob(reportType, true)}
                  size="tiny"
                  variant="ghost"
                  class="self-end mt-1"
                  disabled={jobs?.integrityCheck.queueStatus.isActive}>{$t('refresh')}</Button
                >
                <Button
                  href={`${AppRoute.ADMIN_MAINTENANCE_INTEGRITY_REPORT + reportType}`}
                  size="tiny"
                  class="self-end mt-1">{$t('view')}</Button
                >
              </HStack>
            {/snippet}
          </ServerStatisticsCard>
        {/each}
      </div>
    </section>
  </section>
</AdminPageLayout>
