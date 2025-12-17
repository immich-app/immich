<script lang="ts">
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { getQueueName } from '$lib/utils';
  import { QueueName, type SystemConfigDto, type SystemConfigJobDto } from '@immich/sdk';
  import { Field, HelperText, NumberInput } from '@immich/ui';
  import { t } from 'svelte-i18n';

  const queueNames = [
    QueueName.ThumbnailGeneration,
    QueueName.MetadataExtraction,
    QueueName.Library,
    QueueName.Sidecar,
    QueueName.SmartSearch,
    QueueName.FaceDetection,
    QueueName.FacialRecognition,
    QueueName.VideoConversion,
    QueueName.StorageTemplateMigration,
    QueueName.Migration,
    QueueName.Ocr,
  ];

  const isSystemConfigJobDto = (
    configToEdit: SystemConfigDto,
    jobName: string,
  ): jobName is keyof SystemConfigJobDto => {
    return jobName in configToEdit.job;
  };
</script>

<SystemSettingsModal keys={['user']}>
  {#snippet child({ disabled, configToEdit })}
    {#each queueNames as queueName (queueName)}
      {#if isSystemConfigJobDto(configToEdit, queueName)}
        <Field
          required
          {disabled}
          label={$t('admin.job_concurrency', { values: { job: $getQueueName(queueName) } })}
          description=""
        >
          <NumberInput bind:value={configToEdit.job[queueName].concurrency} />
        </Field>
      {:else}
        <Field label={$t('admin.job_concurrency', { values: { job: $getQueueName(queueName) } })}>
          <NumberInput value={1} disabled={true} />
          <HelperText>{$t('admin.job_not_concurrency_safe')}</HelperText>
        </Field>
      {/if}
    {/each}
  {/snippet}
</SystemSettingsModal>
