<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { type AllJobStatusResponseDto, api, JobCommand, type JobCommandDto, JobName } from '@api';
  import type { ComponentType } from 'svelte';
  import {
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
  import ConfirmDialogue from '../../shared-components/confirm-dialogue.svelte';
  import JobTile from './job-tile.svelte';
  import StorageMigrationDescription from './storage-migration-description.svelte';

  export let jobs: AllJobStatusResponseDto;

  interface JobDetails {
    title: string;
    subtitle?: string;
    allText?: string;
    missingText?: string;
    disabled?: boolean;
    icon: string;
    allowForceCommand?: boolean;
    component?: ComponentType;
    handleCommand?: (jobId: JobName, jobCommand: JobCommandDto) => Promise<void>;
  }

  let confirmJob: JobName | null = null;

  const handleConfirmCommand = async (jobId: JobName, dto: JobCommandDto) => {
    if (dto.force) {
      confirmJob = jobId;
      return;
    }

    await handleCommand(jobId, dto);
  };

  const onConfirm = () => {
    if (!confirmJob) {
      return;
    }
    handleCommand(confirmJob, { command: JobCommand.Start, force: true });
    confirmJob = null;
  };

  $: jobDetails = <Partial<Record<JobName, JobDetails>>>{
    [JobName.ThumbnailGeneration]: {
      icon: mdiFileJpgBox,
      title: api.getJobName(JobName.ThumbnailGeneration),
      subtitle: 'Generate large, small and blurred thumbnails for each asset, as well as thumbnails for each person',
    },
    [JobName.MetadataExtraction]: {
      icon: mdiTable,
      title: api.getJobName(JobName.MetadataExtraction),
      subtitle: 'Extract metadata information from each asset, such as GPS and resolution',
    },
    [JobName.Library]: {
      icon: mdiLibraryShelves,
      title: api.getJobName(JobName.Library),
      subtitle: 'Perform library tasks',
      allText: 'ALL',
      missingText: 'REFRESH',
    },
    [JobName.Sidecar]: {
      title: api.getJobName(JobName.Sidecar),
      icon: mdiFileXmlBox,
      subtitle: 'Discover or synchronize sidecar metadata from the filesystem',
      allText: 'SYNC',
      missingText: 'DISCOVER',
      disabled: !$featureFlags.sidecar,
    },
    [JobName.SmartSearch]: {
      icon: mdiImageSearch,
      title: api.getJobName(JobName.SmartSearch),
      subtitle: 'Run machine learning on assets to support smart search',
      disabled: !$featureFlags.smartSearch,
    },
    [JobName.FaceDetection]: {
      icon: mdiFaceRecognition,
      title: api.getJobName(JobName.FaceDetection),
      subtitle:
        'Detect the faces in assets using machine learning. For videos, only the thumbnail is considered. "All" (re-)processes all assets. "Missing" queues assets that haven\'t been processed yet. Detected faces will be queued for Facial Recognition after Face Detection is complete, grouping them into existing or new people.',
      handleCommand: handleConfirmCommand,
      disabled: !$featureFlags.facialRecognition,
    },
    [JobName.FacialRecognition]: {
      icon: mdiTagFaces,
      title: api.getJobName(JobName.FacialRecognition),
      subtitle:
        'Group detected faces into people. This step runs after Face Detection is complete. "All" (re-)clusters all faces. "Missing" queues faces that don\'t have a person assigned.',
      handleCommand: handleConfirmCommand,
      disabled: !$featureFlags.facialRecognition,
    },
    [JobName.VideoConversion]: {
      icon: mdiVideo,
      title: api.getJobName(JobName.VideoConversion),
      subtitle: 'Transcode videos for wider compatibility with browsers and devices',
    },
    [JobName.StorageTemplateMigration]: {
      icon: mdiFolderMove,
      title: api.getJobName(JobName.StorageTemplateMigration),
      allowForceCommand: false,
      component: StorageMigrationDescription,
    },
    [JobName.Migration]: {
      icon: mdiFolderMove,
      title: api.getJobName(JobName.Migration),
      subtitle: 'Migrate thumbnails for assets and faces to the latest folder structure',
      allowForceCommand: false,
    },
  };
  $: jobList = Object.entries(jobDetails) as [JobName, JobDetails][];

  async function handleCommand(jobId: JobName, jobCommand: JobCommandDto) {
    const title = jobDetails[jobId]?.title;

    try {
      const { data } = await api.jobApi.sendJobCommand({ id: jobId, jobCommandDto: jobCommand });
      jobs[jobId] = data;

      switch (jobCommand.command) {
        case JobCommand.Empty: {
          notificationController.show({
            message: `Cleared jobs for: ${title}`,
            type: NotificationType.Info,
          });
          break;
        }
      }
    } catch (error) {
      handleError(error, `Command '${jobCommand.command}' failed for job: ${title}`);
    }
  }
</script>

{#if confirmJob}
  <ConfirmDialogue
    prompt="Are you sure you want to reprocess all faces? This will also clear named people."
    on:confirm={onConfirm}
    on:cancel={() => (confirmJob = null)}
  />
{/if}

<div class="flex flex-col gap-7">
  {#each jobList as [jobName, { title, subtitle, disabled, allText, missingText, allowForceCommand, icon, component, handleCommand: handleCommandOverride }]}
    {@const { jobCounts, queueStatus } = jobs[jobName]}
    <JobTile
      {icon}
      {title}
      {disabled}
      {subtitle}
      allText={allText || 'ALL'}
      missingText={missingText || 'MISSING'}
      {allowForceCommand}
      {jobCounts}
      {queueStatus}
      on:command={({ detail }) => (handleCommandOverride || handleCommand)(jobName, detail)}
    >
      {#if component}
        <svelte:component this={component} slot="description" />
      {/if}
    </JobTile>
  {/each}
</div>
