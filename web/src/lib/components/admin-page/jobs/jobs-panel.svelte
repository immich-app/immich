<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { getJobName } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { JobCommand, JobName, sendJobCommand, type AllJobStatusResponseDto, type JobCommandDto } from '@immich/sdk';
  import {
    mdiContentDuplicate,
    mdiFaceRecognition,
    mdiFileJpgBox,
    mdiFileXmlBox,
    mdiFolderMove,
    mdiImageSearch,
    mdiLibraryShelves,
    mdiTable,
    mdiTagFaces,
    mdiVideo,
  } from '@mdi/js';
  import type { ComponentType } from 'svelte';
  import JobTile from './job-tile.svelte';
  import StorageMigrationDescription from './storage-migration-description.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import { t } from 'svelte-i18n';

  export let jobs: AllJobStatusResponseDto;

  interface JobDetails {
    title: string;
    subtitle?: string;
    description?: ComponentType;
    allText?: string;
    missingText?: string;
    disabled?: boolean;
    icon: string;
    allowForceCommand?: boolean;
    handleCommand?: (jobId: JobName, jobCommand: JobCommandDto) => Promise<void>;
  }

  const handleConfirmCommand = async (jobId: JobName, dto: JobCommandDto) => {
    if (dto.force) {
      const isConfirmed = await dialogController.show({
        prompt: $t('admin.confirm_reprocess_all_faces'),
      });

      if (isConfirmed) {
        await handleCommand(jobId, { command: JobCommand.Start, force: true });
        return;
      }

      return;
    }

    await handleCommand(jobId, dto);
  };

  $: jobDetails = <Partial<Record<JobName, JobDetails>>>{
    [JobName.ThumbnailGeneration]: {
      icon: mdiFileJpgBox,
      title: $getJobName(JobName.ThumbnailGeneration),
      subtitle: $t('admin.thumbnail_generation_job_description'),
    },
    [JobName.MetadataExtraction]: {
      icon: mdiTable,
      title: $getJobName(JobName.MetadataExtraction),
      subtitle: $t('admin.metadata_extraction_job_description'),
    },
    [JobName.Library]: {
      icon: mdiLibraryShelves,
      title: $getJobName(JobName.Library),
      subtitle: $t('admin.library_tasks_description'),
      allText: $t('all').toUpperCase(),
      missingText: $t('refresh').toUpperCase(),
    },
    [JobName.Sidecar]: {
      title: $getJobName(JobName.Sidecar),
      icon: mdiFileXmlBox,
      subtitle: $t('admin.sidecar_job_description'),
      allText: $t('sync').toUpperCase(),
      missingText: $t('discover').toUpperCase(),
      disabled: !$featureFlags.sidecar,
    },
    [JobName.SmartSearch]: {
      icon: mdiImageSearch,
      title: $getJobName(JobName.SmartSearch),
      subtitle: $t('admin.smart_search_job_description'),
      disabled: !$featureFlags.smartSearch,
    },
    [JobName.DuplicateDetection]: {
      icon: mdiContentDuplicate,
      title: $getJobName(JobName.DuplicateDetection),
      subtitle: $t('admin.duplicate_detection_job_description'),
      disabled: !$featureFlags.duplicateDetection,
    },
    [JobName.FaceDetection]: {
      icon: mdiFaceRecognition,
      title: $getJobName(JobName.FaceDetection),
      subtitle: $t('admin.face_detection_description'),
      handleCommand: handleConfirmCommand,
      disabled: !$featureFlags.facialRecognition,
    },
    [JobName.FacialRecognition]: {
      icon: mdiTagFaces,
      title: $getJobName(JobName.FacialRecognition),
      subtitle: $t('admin.facial_recognition_job_description'),
      handleCommand: handleConfirmCommand,
      disabled: !$featureFlags.facialRecognition,
    },
    [JobName.VideoConversion]: {
      icon: mdiVideo,
      title: $getJobName(JobName.VideoConversion),
      subtitle: $t('admin.video_conversion_job_description'),
    },
    [JobName.StorageTemplateMigration]: {
      icon: mdiFolderMove,
      title: $getJobName(JobName.StorageTemplateMigration),
      allowForceCommand: false,
      description: StorageMigrationDescription,
    },
    [JobName.Migration]: {
      icon: mdiFolderMove,
      title: $getJobName(JobName.Migration),
      subtitle: $t('admin.migration_job_description'),
      allowForceCommand: false,
    },
  };
  $: jobList = Object.entries(jobDetails) as [JobName, JobDetails][];

  async function handleCommand(jobId: JobName, jobCommand: JobCommandDto) {
    const title = jobDetails[jobId]?.title;

    try {
      jobs[jobId] = await sendJobCommand({ id: jobId, jobCommandDto: jobCommand });

      switch (jobCommand.command) {
        case JobCommand.Empty: {
          notificationController.show({
            message: $t('admin.cleared_jobs', { values: { job: title } }),
            type: NotificationType.Info,
          });
          break;
        }
      }
    } catch (error) {
      handleError(error, $t('admin.failed_job_command', { values: { command: jobCommand.command, job: title } }));
    }
  }
</script>

<div class="flex flex-col gap-7">
  {#each jobList as [jobName, { title, subtitle, description, disabled, allText, missingText, allowForceCommand, icon, handleCommand: handleCommandOverride }]}
    {@const { jobCounts, queueStatus } = jobs[jobName]}
    <JobTile
      {icon}
      {title}
      {disabled}
      {subtitle}
      {description}
      allText={allText || $t('all').toUpperCase()}
      missingText={missingText || $t('missing').toUpperCase()}
      {allowForceCommand}
      {jobCounts}
      {queueStatus}
      on:command={({ detail }) => (handleCommandOverride || handleCommand)(jobName, detail)}
    />
  {/each}
</div>
