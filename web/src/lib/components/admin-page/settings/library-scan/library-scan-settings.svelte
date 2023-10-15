<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { api, SystemConfigLibraryScanDto } from '@api';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';

  export let libraryScanConfig: SystemConfigLibraryScanDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigLibraryScanDto;
  let defaultConfig: SystemConfigLibraryScanDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.libraryScan),
      api.systemConfigApi.getDefaults().then((res) => res.data.libraryScan),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: configs } = await api.systemConfigApi.getConfig();

      const result = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...configs,
          libraryScan: libraryScanConfig,
        },
      });

      libraryScanConfig = { ...result.data.libraryScan };
      savedConfig = { ...result.data.libraryScan };

      notificationController.show({
        message: 'Library scan settings saved',
        type: NotificationType.Info,
      });
    } catch (e) {
      console.error('Error [library-scan-settings] [saveSetting]', e);
      notificationController.show({
        message: 'Unable to save settings',
        type: NotificationType.Error,
      });
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    libraryScanConfig = { ...resetConfig.libraryScan };
    savedConfig = { ...resetConfig.libraryScan };

    notificationController.show({
      message: 'Reset library scan settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getDefaults();

    libraryScanConfig = { ...configs.libraryScan };
    defaultConfig = { ...configs.libraryScan };

    notificationController.show({
      message: 'Reset library scan settings to default',
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
            bind:checked={libraryScanConfig.enabled}
          />

          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            required={true}
            disabled={disabled || !libraryScanConfig.enabled}
            label="Cron Expression"
            bind:value={libraryScanConfig.cronExpression}
            isEdited={libraryScanConfig.cronExpression !== savedConfig.cronExpression}
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
