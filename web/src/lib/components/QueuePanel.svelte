<script lang="ts">
  import QueueCard from '$lib/components/QueueCard.svelte';
  import QueueStorageMigrationDescription from '$lib/components/QueueStorageMigrationDescription.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { queueManager } from '$lib/managers/queue-manager.svelte';
  import { asQueueItem } from '$lib/services/queue.service';
  import { handleError } from '$lib/utils/handle-error';
  import {
    QueueCommand,
    type QueueCommandDto,
    QueueName,
    type QueueResponseDto,
    runQueueCommandLegacy,
  } from '@immich/sdk';
  import { modalManager, toastManager } from '@immich/ui';
  import type { Component } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    queues: QueueResponseDto[];
  };

  let { queues }: Props = $props();
  const featureFlags = featureFlagsManager.value;

  type QueueDetails = {
    description?: Component;
    allText?: string;
    refreshText?: string;
    missingText: string;
    disabled?: boolean;
    handleCommand?: (jobId: QueueName, jobCommand: QueueCommandDto) => Promise<void>;
  };

  const queueDetails: Partial<Record<QueueName, QueueDetails>> = {
    [QueueName.ThumbnailGeneration]: {
      allText: $t('all'),
      missingText: $t('missing'),
    },
    [QueueName.MetadataExtraction]: {
      allText: $t('all'),
      missingText: $t('missing'),
    },
    [QueueName.Library]: {
      missingText: $t('rescan'),
    },
    [QueueName.Sidecar]: {
      allText: $t('sync'),
      missingText: $t('discover'),
      disabled: !featureFlags.sidecar,
    },
    [QueueName.SmartSearch]: {
      allText: $t('all'),
      missingText: $t('missing'),
      disabled: !featureFlags.smartSearch,
    },
    [QueueName.DuplicateDetection]: {
      allText: $t('all'),
      missingText: $t('missing'),
      disabled: !featureFlags.duplicateDetection,
    },
    [QueueName.FaceDetection]: {
      allText: $t('reset'),
      refreshText: $t('refresh'),
      missingText: $t('missing'),
      disabled: !featureFlags.facialRecognition,
    },
    [QueueName.FacialRecognition]: {
      allText: $t('reset'),
      missingText: $t('missing'),
      disabled: !featureFlags.facialRecognition,
    },
    [QueueName.Ocr]: {
      allText: $t('all'),
      missingText: $t('missing'),
      disabled: !featureFlags.ocr,
    },
    [QueueName.VideoConversion]: {
      allText: $t('all'),
      missingText: $t('missing'),
    },
    [QueueName.StorageTemplateMigration]: {
      missingText: $t('start'),
      description: QueueStorageMigrationDescription,
    },
    [QueueName.Migration]: {
      missingText: $t('start'),
    },
  };

  let queueList = Object.entries(queueDetails) as [QueueName, QueueDetails][];

  const handleCommand = async (name: QueueName, dto: QueueCommandDto) => {
    const item = asQueueItem($t, { name });

    switch (name) {
      case QueueName.FaceDetection:
      case QueueName.FacialRecognition: {
        if (dto.force) {
          const confirmed = await modalManager.showDialog({ prompt: $t('admin.confirm_reprocess_all_faces') });
          if (!confirmed) {
            return;
          }
          break;
        }
      }
    }

    try {
      await runQueueCommandLegacy({ name, queueCommandDto: dto });
      await queueManager.refresh();

      switch (dto.command) {
        case QueueCommand.Empty: {
          toastManager.success($t('admin.cleared_jobs', { values: { job: item.title } }));
          break;
        }
      }
    } catch (error) {
      handleError(error, $t('admin.failed_job_command', { values: { command: dto.command, job: item.title } }));
    }
  };
</script>

<div class="flex flex-col gap-7 mt-10">
  {#each queueList as [queueName, props] (queueName)}
    {@const queue = queues.find(({ name }) => name === queueName)}
    {#if queue}
      <QueueCard {queue} onCommand={(command) => handleCommand(queueName, command)} {...props} />
    {/if}
  {/each}
</div>
