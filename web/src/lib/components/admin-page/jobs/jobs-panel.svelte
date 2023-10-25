<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { AllJobStatusResponseDto, api, JobCommand, JobCommandDto, JobName } from '@api';
  import type { ComponentType } from 'svelte';
  import {
    mdiFaceRecognition,
    mdiFileJpgBox,
    mdiFileXmlBox,
    mdiFolderMove,
    mdiLibraryShelves,
    mdiTable,
    mdiTagMultiple,
    mdiVectorCircle,
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

  let faceConfirm = false;

  const handleFaceCommand = async (jobId: JobName, dto: JobCommandDto) => {
    if (dto.force) {
      faceConfirm = true;
      return;
    }

    await handleCommand(jobId, dto);
  };

  const onFaceConfirm = () => {
    faceConfirm = false;
    handleCommand(JobName.RecognizeFaces, { command: JobCommand.Start, force: true });
  };

  $: jobDetails = <Partial<Record<JobName, JobDetails>>>{
    [JobName.ThumbnailGeneration]: {
      icon: mdiFileJpgBox,
      title: api.getJobName(JobName.ThumbnailGeneration),
      subtitle: 'Regenerate JPEG and WebP thumbnails',
    },
    [JobName.MetadataExtraction]: {
      icon: mdiTable,
      title: api.getJobName(JobName.MetadataExtraction),
      subtitle: 'Extract metadata information i.e. GPS, resolution...etc',
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
    [JobName.ObjectTagging]: {
      icon: mdiTagMultiple,
      title: api.getJobName(JobName.ObjectTagging),
      subtitle: 'Run machine learning to tag objects\nNote that some assets may not have any objects detected',
      disabled: !$featureFlags.tagImage,
    },
    [JobName.ClipEncoding]: {
      icon: mdiVectorCircle,
      title: api.getJobName(JobName.ClipEncoding),
      subtitle: 'Run machine learning to generate clip embeddings',
      disabled: !$featureFlags.clipEncode,
    },
    [JobName.RecognizeFaces]: {
      icon: mdiFaceRecognition,
      title: api.getJobName(JobName.RecognizeFaces),
      subtitle: 'Run machine learning to recognize faces',
      handleCommand: handleFaceCommand,
      disabled: !$featureFlags.facialRecognition,
    },
    [JobName.VideoConversion]: {
      icon: mdiVideo,
      title: api.getJobName(JobName.VideoConversion),
      subtitle: 'Transcode videos not in the desired format',
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
        case JobCommand.Empty:
          notificationController.show({
            message: `Cleared jobs for: ${title}`,
            type: NotificationType.Info,
          });
          break;
      }
    } catch (error) {
      handleError(error, `Command '${jobCommand.command}' failed for job: ${title}`);
    }
  }
</script>

{#if faceConfirm}
  <ConfirmDialogue
    prompt="Are you sure you want to reprocess all faces? This will also clear named people."
    on:confirm={onFaceConfirm}
    on:cancel={() => (faceConfirm = false)}
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
