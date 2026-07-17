<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import MaintenanceBackupsList from '$lib/components/maintenance/MaintenanceBackupsList.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import ServerStatisticsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/SettingAccordion.svelte';
  import { Route } from '$lib/route';
  import { handleCreateJob } from '$lib/services/job.service';
  import { getMaintenanceAdminActions } from '$lib/services/maintenance.service';
  import {
    getIntegrityReportSummary,
    getQueuesLegacy,
    IntegrityReport,
    ManualJobName,
    type IntegrityReportSummaryResponseDto,
    type JobCreateDto,
    type QueuesResponseLegacyDto,
  } from '@immich/sdk';
  import { Button, Container, HStack, Text } from '@immich/ui';
  import { mdiRefresh } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t, type Translations } from 'svelte-i18n';
  import type { PageData } from './$types';
  import { SvelteSet } from 'svelte/reactivity';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();
  const { StartMaintenance } = $derived(getMaintenanceAdminActions($t));

  let integrityReport: IntegrityReportSummaryResponseDto = $state(data.integrityReport);

  const reportTypes: IntegrityReport[] = [
    IntegrityReport.UntrackedFile,
    IntegrityReport.MissingFile,
    IntegrityReport.ChecksumMismatch,
  ];

  const jobNames: Record<IntegrityReport, ManualJobName> = {
    [IntegrityReport.UntrackedFile]: ManualJobName.IntegrityUntrackedFiles,
    [IntegrityReport.MissingFile]: ManualJobName.IntegrityMissingFiles,
    [IntegrityReport.ChecksumMismatch]: ManualJobName.IntegrityChecksumMismatch,
  };

  const refreshJobNames: Record<IntegrityReport, ManualJobName> = {
    [IntegrityReport.UntrackedFile]: ManualJobName.IntegrityUntrackedFilesRefresh,
    [IntegrityReport.MissingFile]: ManualJobName.IntegrityMissingFilesRefresh,
    [IntegrityReport.ChecksumMismatch]: ManualJobName.IntegrityChecksumMismatchRefresh,
  };

  let jobs: QueuesResponseLegacyDto | undefined = $state();
  const activeJobs = new SvelteSet<ManualJobName>();

  const getReportTypeTranslation = (report: IntegrityReport): Translations => {
    switch (report) {
      case IntegrityReport.UntrackedFile: {
        return 'admin.maintenance_integrity_untracked_file';
      }
      case IntegrityReport.MissingFile: {
        return 'admin.maintenance_integrity_missing_file';
      }
      case IntegrityReport.ChecksumMismatch: {
        return 'admin.maintenance_integrity_checksum_mismatch';
      }
    }
  };

  const getReportTypeDescriptionKey = (report: IntegrityReport): Translations => {
    switch (report) {
      case IntegrityReport.UntrackedFile: {
        return 'admin.maintenance_integrity_untracked_file_description';
      }
      case IntegrityReport.MissingFile: {
        return 'admin.maintenance_integrity_missing_file_description';
      }
      case IntegrityReport.ChecksumMismatch: {
        return 'admin.maintenance_integrity_checksum_mismatch_description';
      }
    }
  };

  const updateReports = async () => {
    jobs = await getQueuesLegacy();
    if (jobs.integrityCheck.queueStatus.isActive) {
      activeJobs.add(ManualJobName.IntegrityUntrackedFilesRefresh);
    } else if (activeJobs.size > 0) {
      activeJobs.clear();
      integrityReport = await getIntegrityReportSummary();
    }
  };

  onMount(() => {
    const interval = setInterval(() => void updateReports(), 2000);

    return () => clearInterval(interval);
  });

  const onJobCreate = ({ dto }: { dto: JobCreateDto }) => {
    if ((Object.values(jobNames).includes(dto.name) || Object.values(refreshJobNames).includes(dto.name)) && jobs) {
      activeJobs.add(dto.name);
      jobs.integrityCheck.queueStatus.isActive = true;
    }
  };
</script>

<OnEvents {onJobCreate} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[StartMaintenance]}>
  <Container size="large" center class="my-4 flex flex-col gap-6">
    <section class="w-full pb-4">
      <HStack>
        <Text size="small">{$t('admin.maintenance_integrity_report')}</Text>
        <Button
          size="tiny"
          variant="ghost"
          onclick={() => {
            for (const name of Object.values(jobNames)) {
              void handleCreateJob({ name });
            }
          }}
          class="mt-1 self-end"
          disabled={activeJobs.size > 0}>{$t('admin.maintenance_integrity_check_all')}</Button
        >
        <Button
          size="tiny"
          variant="ghost"
          onclick={() => {
            for (const name of Object.values(refreshJobNames)) {
              void handleCreateJob({ name });
            }
          }}
          class="mt-1 self-end"
          disabled={activeJobs.size > 0}>{$t('refresh')}</Button
        ></HStack
      >

      <div class="mt-5 flex justify-between gap-4 max-lg:flex-wrap">
        {#each reportTypes as reportType (reportType)}
          <ServerStatisticsCard
            title={$t(getReportTypeTranslation(reportType))}
            tooltip={$t(getReportTypeDescriptionKey(reportType))}
            valuePromise={{ value: integrityReport[reportType] }}
          >
            {#snippet footer()}
              <HStack gap={1} class="justify-between">
                <HStack gap={0}>
                  <Button
                    onclick={() =>
                      handleCreateJob({
                        name: jobNames[reportType],
                      })}
                    size="tiny"
                    variant="ghost"
                    disabled={activeJobs.has(jobNames[reportType])}>{$t('admin.maintenance_integrity_check')}</Button
                  >
                  <Button
                    onclick={() =>
                      handleCreateJob({
                        name: refreshJobNames[reportType],
                      })}
                    size="tiny"
                    variant="ghost"
                    disabled={activeJobs.has(refreshJobNames[reportType])}>{$t('refresh')}</Button
                  >
                </HStack>
                <Button
                  href={`${Route.systemMaintenanceIntegrityReport({
                    reportType,
                  })}`}
                  size="tiny">{$t('view')}</Button
                >
              </HStack>
            {/snippet}
          </ServerStatisticsCard>
        {/each}
      </div>
    </section>

    <section class="w-full pb-28">
      <Text size="small">{$t('admin.maintenance_backup_management')}</Text>

      <SettingAccordion
        title={$t('admin.maintenance_restore_database_backup')}
        subtitle={$t('admin.maintenance_restore_database_backup_description')}
        icon={mdiRefresh}
        key="backups"
      >
        <MaintenanceBackupsList backups={data.backups} expectedVersion={data.expectedVersion} />
      </SettingAccordion>
    </section>
  </Container>
</AdminPageLayout>
