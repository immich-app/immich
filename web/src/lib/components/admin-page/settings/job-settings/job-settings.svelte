<script lang="ts">
  import { getJobName } from '$lib/utils';
  import { JobName, type SystemConfigDto, type SystemConfigJobDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { t } from 'svelte-i18n';
  import { SettingInputFieldType } from '$lib/constants';

  interface Props {
    savedConfig: SystemConfigDto;
    defaultConfig: SystemConfigDto;
    config: SystemConfigDto;
    disabled?: boolean;
    onReset: SettingsResetEvent;
    onSave: SettingsSaveEvent;
  }

  let { savedConfig, defaultConfig, config = $bindable(), disabled = false, onReset, onSave }: Props = $props();

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
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function isSystemConfigJobDto(jobName: any): jobName is keyof SystemConfigJobDto {
    return jobName in config.job;
  }

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      {#each jobNames as jobName (jobName)}
        <div class="ms-4 mt-4 flex flex-col gap-4">
          {#if isSystemConfigJobDto(jobName)}
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              {disabled}
              label={$t('admin.job_concurrency', { values: { job: $getJobName(jobName) } })}
              description=""
              bind:value={config.job[jobName].concurrency}
              required={true}
              isEdited={!(config.job[jobName].concurrency == savedConfig.job[jobName].concurrency)}
            />
          {:else}
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.job_concurrency', { values: { job: $getJobName(jobName) } })}
              description=""
              value="1"
              disabled={true}
              title={$t('admin.job_not_concurrency_safe')}
            />
          {/if}
        </div>
      {/each}

      <div class="ms-4">
        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['job'] })}
          onSave={() => onSave({ job: config.job })}
          showResetToDefault={!isEqual(savedConfig.job, defaultConfig.job)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
