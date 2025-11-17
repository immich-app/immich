<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { getQueueName } from '$lib/utils';
  import { QueueName, type SystemConfigJobDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());

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

  function isSystemConfigJobDto(jobName: string): jobName is keyof SystemConfigJobDto {
    return jobName in configToEdit.job;
  }
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      {#each queueNames as queueName (queueName)}
        <div class="ms-4 mt-4 flex flex-col gap-4">
          {#if isSystemConfigJobDto(queueName)}
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

      <div class="ms-4">
        <SettingButtonsRow bind:configToEdit keys={['job']} {disabled} />
      </div>
    </form>
  </div>
</div>
