<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { api, JobName, SystemConfigDto, SystemConfigJobDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../../../utils/handle-error';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';

  export let config: SystemConfigDto;
  export let jobConfig: SystemConfigJobDto; // this is the config that is being edited
  export let jobDefault: SystemConfigJobDto;
  export let savedConfig: SystemConfigJobDto;

  const ignoredJobs = [JobName.BackgroundTask, JobName.Search] as JobName[];
  const jobNames = Object.values(JobName).filter((jobName) => !ignoredJobs.includes(jobName as JobName));

  async function saveSetting() {
    try {
      const { data } = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...config,
          job: jobConfig,
        },
      });

      jobConfig = { ...data.job };
      savedConfig = { ...data.job };
      config = { ...data };

      notificationController.show({ message: 'Job settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    jobConfig = { ...savedConfig };

    notificationController.show({
      message: 'Reset Job settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    jobConfig = jobDefault;

    notificationController.show({
      message: 'Reset Job settings to default',
      type: NotificationType.Info,
    });
  }
</script>

<div>
  <div in:fade={{ duration: 300 }}>
    <form autocomplete="off" on:submit|preventDefault>
      {#each jobNames as jobName}
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
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
          on:reset={reset}
          on:save={saveSetting}
          on:reset-to-default={resetToDefault}
          showResetToDefault={!isEqual(jobConfig, jobDefault)}
        />
      </div>
    </form>
  </div>
</div>
