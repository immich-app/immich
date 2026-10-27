<script lang="ts">
  import QueueCard from './QueueCard.svelte';
  import QueueStorageMigrationDescription from './QueueStorageMigrationDescription.svelte';
  import { queueManager } from '#lib/managers/queue-manager.svelte.ts';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
  import { asQueueItem } from '#lib/services/queue.service.ts';
  import { handleError } from '#lib/utils/handle-error.ts';
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
  const query = createPreloadedQuery(getUserConfigQuery);
  const { machineLearning } = $derived(query.data);

  type QueueDetails = {
    description?: Component;
    allText?: string;
    refreshText?: string;
    missingText: string;
    disabled?: boolean;
    handleCommand?: (jobId: QueueName, jobCommand: QueueCommandDto) => Promise<void>;
  };

  const queueDetails: Partial<Record<QueueName, QueueDetails>> = $derived({
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
    },
    [QueueName.SmartSearch]: {
      allText: $t('all'),
      missingText: $t('missing'),
      disabled: !machineLearning.clip.enabled,
    },
    [QueueName.DuplicateDetection]: {
      allText: $t('all'),
      missingText: $t('missing'),
      disabled: !machineLearning.duplicateDetection.enabled,
    },
    [QueueName.FaceDetection]: {
      allText: $t('reset'),
      refreshText: $t('refresh'),
      missingText: $t('missing'),
      disabled: !machineLearning.facialRecognition.enabled,
    },
    [QueueName.FacialRecognition]: {
      allText: $t('reset'),
      missingText: $t('missing'),
      disabled: !machineLearning.facialRecognition.enabled,
    },
    [QueueName.Ocr]: {
      allText: $t('all'),
      missingText: $t('missing'),
      disabled: !machineLearning.ocr.enabled,
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
  });

  const queueList = $derived(Object.entries(queueDetails) as [QueueName, QueueDetails][]);

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
      // no default
    }

    try {
      await runQueueCommandLegacy({ name, queueCommandDto: dto });
      await queueManager.refresh();

      switch (dto.command) {
        case QueueCommand.Empty: {
          toastManager.primary($t('admin.cleared_jobs', { values: { job: item.title } }));
          break;
        }
        // no default
      }
    } catch (error) {
      handleError(error, $t('admin.failed_job_command', { values: { command: dto.command, job: item.title } }));
    }
  };
</script>

<div class="mt-10 flex flex-col gap-7">
  {#each queueList as [queueName, props] (queueName)}
    {const queue = $derived(queues.find(({ name }) => name === queueName))}
    {#if queue}
      <QueueCard {queue} onCommand={(command) => handleCommand(queueName, command)} {...props} />
    {/if}
  {/each}
</div>
