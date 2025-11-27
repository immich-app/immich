<script lang="ts">
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { getQueueName } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    QueueCommand,
    type QueueCommandDto,
    QueueName,
    type QueuesResponseLegacyDto,
    runQueueCommandLegacy,
  } from '@immich/sdk';
  import { modalManager, toastManager } from '@immich/ui';
  import {
    mdiContentDuplicate,
    mdiFaceRecognition,
    mdiFileJpgBox,
    mdiFileXmlBox,
    mdiFolderMove,
    mdiImageSearch,
    mdiLibraryShelves,
    mdiOcr,
    mdiTable,
    mdiTagFaces,
    mdiVideo,
  } from '@mdi/js';
  import type { Component } from 'svelte';
  import { t } from 'svelte-i18n';
  import JobTile from './JobTile.svelte';
  import StorageMigrationDescription from './StorageMigrationDescription.svelte';

  interface Props {
    jobs: QueuesResponseLegacyDto;
  }

  let { jobs = $bindable() }: Props = $props();
  const featureFlags = featureFlagsManager.value;

  type JobDetails = {
    title: string;
    subtitle?: string;
    description?: Component;
    allText?: string;
    refreshText?: string;
    missingText: string;
    disabled?: boolean;
    icon: string;
    handleCommand?: (jobId: QueueName, jobCommand: QueueCommandDto) => Promise<void>;
  };

  const handleConfirmCommand = async (jobId: QueueName, dto: QueueCommandDto) => {
    if (dto.force) {
      const isConfirmed = await modalManager.showDialog({
        prompt: $t('admin.confirm_reprocess_all_faces'),
      });

      if (isConfirmed) {
        await handleCommand(jobId, { command: QueueCommand.Start, force: true });
        return;
      }

      return;
    }

    await handleCommand(jobId, dto);
  };

  let jobDetails: Partial<Record<QueueName, JobDetails>> = {
    [QueueName.ThumbnailGeneration]: {
      icon: mdiFileJpgBox,
      title: $getQueueName(QueueName.ThumbnailGeneration),
      subtitle: $t('admin.thumbnail_generation_job_description'),
      allText: $t('all'),
      missingText: $t('missing'),
    },
    [QueueName.MetadataExtraction]: {
      icon: mdiTable,
      title: $getQueueName(QueueName.MetadataExtraction),
      subtitle: $t('admin.metadata_extraction_job_description'),
      allText: $t('all'),
      missingText: $t('missing'),
    },
    [QueueName.Library]: {
      icon: mdiLibraryShelves,
      title: $getQueueName(QueueName.Library),
      subtitle: $t('admin.library_tasks_description'),
      missingText: $t('rescan'),
    },
    [QueueName.Sidecar]: {
      title: $getQueueName(QueueName.Sidecar),
      icon: mdiFileXmlBox,
      subtitle: $t('admin.sidecar_job_description'),
      allText: $t('sync'),
      missingText: $t('discover'),
      disabled: !featureFlags.sidecar,
    },
    [QueueName.SmartSearch]: {
      icon: mdiImageSearch,
      title: $getQueueName(QueueName.SmartSearch),
      subtitle: $t('admin.smart_search_job_description'),
      allText: $t('all'),
      missingText: $t('missing'),
      disabled: !featureFlags.smartSearch,
    },
    [QueueName.DuplicateDetection]: {
      icon: mdiContentDuplicate,
      title: $getQueueName(QueueName.DuplicateDetection),
      subtitle: $t('admin.duplicate_detection_job_description'),
      allText: $t('all'),
      missingText: $t('missing'),
      disabled: !featureFlags.duplicateDetection,
    },
    [QueueName.FaceDetection]: {
      icon: mdiFaceRecognition,
      title: $getQueueName(QueueName.FaceDetection),
      subtitle: $t('admin.face_detection_description'),
      allText: $t('reset'),
      refreshText: $t('refresh'),
      missingText: $t('missing'),
      handleCommand: handleConfirmCommand,
      disabled: !featureFlags.facialRecognition,
    },
    [QueueName.FacialRecognition]: {
      icon: mdiTagFaces,
      title: $getQueueName(QueueName.FacialRecognition),
      subtitle: $t('admin.facial_recognition_job_description'),
      allText: $t('reset'),
      missingText: $t('missing'),
      handleCommand: handleConfirmCommand,
      disabled: !featureFlags.facialRecognition,
    },
    [QueueName.Ocr]: {
      icon: mdiOcr,
      title: $getQueueName(QueueName.Ocr),
      subtitle: $t('admin.ocr_job_description'),
      allText: $t('all'),
      missingText: $t('missing'),
      disabled: !featureFlags.ocr,
    },
    [QueueName.VideoConversion]: {
      icon: mdiVideo,
      title: $getQueueName(QueueName.VideoConversion),
      subtitle: $t('admin.video_conversion_job_description'),
      allText: $t('all'),
      missingText: $t('missing'),
    },
    [QueueName.StorageTemplateMigration]: {
      icon: mdiFolderMove,
      title: $getQueueName(QueueName.StorageTemplateMigration),
      missingText: $t('start'),
      description: StorageMigrationDescription,
    },
    [QueueName.Migration]: {
      icon: mdiFolderMove,
      title: $getQueueName(QueueName.Migration),
      subtitle: $t('admin.migration_job_description'),
      missingText: $t('start'),
    },
  };

  let jobList = Object.entries(jobDetails) as [QueueName, JobDetails][];

  async function handleCommand(name: QueueName, dto: QueueCommandDto) {
    const title = jobDetails[name]?.title;

    try {
      jobs[name] = await runQueueCommandLegacy({ name, queueCommandDto: dto });

      switch (dto.command) {
        case QueueCommand.Empty: {
          toastManager.success($t('admin.cleared_jobs', { values: { job: title } }));
          break;
        }
      }
    } catch (error) {
      handleError(error, $t('admin.failed_job_command', { values: { command: dto.command, job: title } }));
    }
  }
</script>

<div class="flex flex-col gap-7">
  {#each jobList as [jobName, { title, subtitle, description, disabled, allText, refreshText, missingText, icon, handleCommand: handleCommandOverride }] (jobName)}
    {@const { jobCounts: statistics, queueStatus } = jobs[jobName]}
    <JobTile
      {icon}
      {title}
      {disabled}
      {subtitle}
      {description}
      {allText}
      {refreshText}
      {missingText}
      {statistics}
      {queueStatus}
      onCommand={(command) => (handleCommandOverride || handleCommand)(jobName, command)}
    />
  {/each}
</div>
