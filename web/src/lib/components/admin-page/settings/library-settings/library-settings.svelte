<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { api, SystemConfigLibraryDto } from '@api';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../../../utils/handle-error';

  export let libraryConfig: SystemConfigLibraryDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigLibraryDto;
  let defaultConfig: SystemConfigLibraryDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.library),
      api.systemConfigApi.getDefaults().then((res) => res.data.library),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: configs } = await api.systemConfigApi.getConfig();

      const result = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...configs,
          library: libraryConfig,
        },
      });

      libraryConfig = { ...result.data.library };
      savedConfig = { ...result.data.library };

      notificationController.show({
        message: 'Library settings saved',
        type: NotificationType.Info,
      });
    } catch (e) {
      handleError(e, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    libraryConfig = { ...resetConfig.library };
    savedConfig = { ...resetConfig.library };

    notificationController.show({
      message: 'Reset library settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getDefaults();

    libraryConfig = { ...configs.library };
    defaultConfig = { ...configs.library };

    notificationController.show({
      message: 'Reset library settings to default',
      type: NotificationType.Info,
    });
  }
</script>

<div>
  {#await getConfigs() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault>
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title="ENABLED"
            {disabled}
            subtitle="Enable automatic library scanning"
            bind:checked={libraryConfig.scan.enabled}
          />

          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            required={true}
            disabled={disabled || !libraryConfig.scan.enabled}
            label="Cron Expression"
            bind:value={libraryConfig.scan.cronExpression}
            isEdited={libraryConfig.scan.cronExpression !== savedConfig.scan.cronExpression}
          >
            <svelte:fragment slot="desc">
              <p class="text-sm dark:text-immich-dark-fg">
                Set the scanning interval using the cron format. For more information please refer to e.g. <a
                  href="https://crontab.guru"
                  class="underline"
                  target="_blank"
                  rel="noreferrer">Crontab Guru</a
                >
              </p>
            </svelte:fragment>
          </SettingInputField>
        </div>

        <div class="ml-4">
          <SettingButtonsRow
            on:reset={reset}
            on:save={saveSetting}
            on:reset-to-default={resetToDefault}
            showResetToDefault={!isEqual(savedConfig, defaultConfig)}
            {disabled}
          />
        </div>
      </form>
    </div>
  {/await}
</div>
