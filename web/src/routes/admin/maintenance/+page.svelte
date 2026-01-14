<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import ServerStatisticsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import { AppRoute } from '$lib/constants';
  import { handleCreateJob } from '$lib/services/job.service';
  import { getMaintenanceAdminActions } from '$lib/services/maintenance.service';
  import { asyncTimeout } from '$lib/utils';
  import {
    getIntegrityReportSummary,
    getQueuesLegacy,
    IntegrityReportType,
    ManualJobName,
    type IntegrityReportSummaryResponseDto,
    type JobCreateDto,
    type QueuesResponseLegacyDto,
  } from '@immich/sdk';
  import { Button, HStack } from '@immich/ui';
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

  const INTEGRITY_JOB_NAMES: Record<IntegrityReportType, ManualJobName> = {
    [IntegrityReportType.UntrackedFile]: ManualJobName.IntegrityUntrackedFiles,
    [IntegrityReportType.MissingFile]: ManualJobName.IntegrityMissingFiles,
    [IntegrityReportType.ChecksumMismatch]: ManualJobName.IntegrityChecksumMismatch,
  };

  const INTEGRITY_REFRESH_JOB_NAMES: Record<IntegrityReportType, ManualJobName> = {
    [IntegrityReportType.UntrackedFile]: ManualJobName.IntegrityUntrackedFilesRefresh,
    [IntegrityReportType.MissingFile]: ManualJobName.IntegrityMissingFilesRefresh,
    [IntegrityReportType.ChecksumMismatch]: ManualJobName.IntegrityChecksumMismatchRefresh,
  };

  let jobs: QueuesResponseLegacyDto | undefined = $state();
  let expectingUpdate: boolean = $state(false);

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

  function onJobCreate({ dto }: { dto: JobCreateDto }) {
    if (
      Object.values(INTEGRITY_JOB_NAMES).some((name) => name === dto.name) ||
      Object.values(INTEGRITY_REFRESH_JOB_NAMES).some((name) => name === dto.name)
    ) {
      if (jobs) {
        expectingUpdate = true;
        jobs.integrityCheck.queueStatus.isActive = true;
      }
    }
  }
</script>

<OnEvents {onJobCreate} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[StartMaintenance]}>
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      <HStack>
        <p class="text-sm dark:text-immich-dark-fg uppercase">{$t('admin.maintenance_integrity_report')}</p>
        <Button
          size="tiny"
          variant="ghost"
          onclick={() => Object.values(INTEGRITY_JOB_NAMES).forEach((name) => handleCreateJob({ name }))}
          class="self-end mt-1"
          disabled={jobs?.integrityCheck.queueStatus.isActive}>{$t('admin.maintenance_integrity_check_all')}</Button
        >
        <Button
          size="tiny"
          variant="ghost"
          onclick={() => Object.values(INTEGRITY_REFRESH_JOB_NAMES).forEach((name) => handleCreateJob({ name }))}
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
                  onclick={() =>
                    handleCreateJob({
                      name: INTEGRITY_JOB_NAMES[reportType],
                    })}
                  size="tiny"
                  variant="ghost"
                  class="self-end mt-1"
                  disabled={jobs?.integrityCheck.queueStatus.isActive}
                  >{$t('admin.maintenance_integrity_check_all')}</Button
                >
                <Button
                  onclick={() =>
                    handleCreateJob({
                      name: INTEGRITY_REFRESH_JOB_NAMES[reportType],
                    })}
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
