<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { api, JobName, SystemConfigJobDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../../../utils/handle-error';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import type { ResetOptions } from '$lib/utils/dipatch';

  export let jobConfig: SystemConfigJobDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigJobDto;
  let defaultConfig: SystemConfigJobDto;

  const jobNames = [
    JobName.ThumbnailGeneration,
    JobName.MetadataExtraction,
    JobName.Library,
    JobName.Sidecar,
    JobName.SmartSearch,
    JobName.RecognizeFaces,
    JobName.VideoConversion,
    JobName.Migration,
  ];

  const handleReset = (detail: ResetOptions) => {
    if (detail.default) {
      resetToDefault();
    } else {
      reset();
    }
  };

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.job),
      api.systemConfigApi.getConfigDefaults().then((res) => res.data.job),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: configs } = await api.systemConfigApi.getConfig();

      const result = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...configs,
          job: jobConfig,
        },
      });

      jobConfig = { ...result.data.job };
      savedConfig = { ...result.data.job };

      notificationController.show({ message: 'Job settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    jobConfig = { ...resetConfig.job };
    savedConfig = { ...resetConfig.job };

    notificationController.show({
      message: 'Reset Job settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getConfigDefaults();

    jobConfig = { ...configs.job };
    defaultConfig = { ...configs.job };

    notificationController.show({
      message: 'Reset Job settings to default',
      type: NotificationType.Info,
    });
  }
</script>

<div>
  {#await getConfigs() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault>
        {#each jobNames as jobName}
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              {disabled}
              label="{api.getJobName(jobName)} Concurrency"
              desc=""
              bind:value={jobConfig[jobName].concurrency}
              required={true}
              isEdited={!(jobConfig[jobName].concurrency == savedConfig[jobName].concurrency)}
            />
          </div>
        {/each}

        <div class="ml-4">
          <SettingButtonsRow
            on:reset={({ detail }) => handleReset(detail)}
            on:save={saveSetting}
            showResetToDefault={!isEqual(savedConfig, defaultConfig)}
            {disabled}
          />
        </div>
      </form>
    </div>
  {/await}
</div>
