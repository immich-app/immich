<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { getQueueName } from '$lib/utils';
  import { QueueName, type SystemConfigDto, type SystemConfigJobDto } from '@immich/sdk';
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
  {#snippet child({ disabled, config, configToEdit })}
    {#each queueNames as queueName (queueName)}
      <div class="ms-4 mt-4 flex flex-col gap-4">
        {#if isSystemConfigJobDto(configToEdit, queueName)}
          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            {disabled}
            label={$t('admin.job_concurrency', { values: { job: $getQueueName(queueName) } })}
            description=""
            bind:value={configToEdit.job[queueName].concurrency}
            required={true}
            isEdited={!(configToEdit.job[queueName].concurrency == config.job[queueName].concurrency)}
          />
        {:else}
          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.job_concurrency', { values: { job: $getQueueName(queueName) } })}
            description=""
            value={1}
            disabled={true}
            title={$t('admin.job_not_concurrency_safe')}
          />
        {/if}
      </div>
    {/each}
  {/snippet}
</SystemSettingsModal>
