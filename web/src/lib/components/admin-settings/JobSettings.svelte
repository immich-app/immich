<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlags, systemConfigManager } from '$lib/stores/system-config-manager.svelte';
  import { getJobName } from '$lib/utils';
  import { JobName, type SystemConfigJobDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $featureFlags.configFile;
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());

  const jobNames = [
    JobName.ThumbnailGeneration,
    JobName.MetadataExtraction,
    JobName.Library,
    JobName.Sidecar,
    JobName.SmartSearch,
    JobName.FaceDetection,
    JobName.FacialRecognition,
    JobName.VideoConversion,
    JobName.StorageTemplateMigration,
    JobName.Migration,
    JobName.Ocr,
  ];

  function isSystemConfigJobDto(jobName: string): jobName is keyof SystemConfigJobDto {
    return jobName in configToEdit.job;
  }
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      {#each jobNames as jobName (jobName)}
        <div class="ms-4 mt-4 flex flex-col gap-4">
          {#if isSystemConfigJobDto(jobName)}
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              {disabled}
              label={$t('admin.job_concurrency', { values: { job: $getJobName(jobName) } })}
              description=""
              bind:value={configToEdit.job[jobName].concurrency}
              required={true}
              isEdited={!(configToEdit.job[jobName].concurrency == config.job[jobName].concurrency)}
            />
          {:else}
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.job_concurrency', { values: { job: $getJobName(jobName) } })}
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
