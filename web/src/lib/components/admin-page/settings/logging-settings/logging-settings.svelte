<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, LogLevel, SystemConfigLoggingDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import SettingSelect from '../setting-select.svelte';

  export let loggingConfig: SystemConfigLoggingDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigLoggingDto;
  let defaultConfig: SystemConfigLoggingDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.logging),
      api.systemConfigApi.getConfigDefaults().then((res) => res.data.logging),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: current } = await api.systemConfigApi.getConfig();
      const { data: updated } = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...current,
          logging: loggingConfig,
        },
      });

      loggingConfig = { ...updated.logging };
      savedConfig = { ...updated.logging };

      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    loggingConfig = { ...resetConfig.logging };
    savedConfig = { ...resetConfig.logging };

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getConfigDefaults();

    loggingConfig = { ...configs.logging };
    defaultConfig = { ...configs.logging };

    notificationController.show({
      message: 'Reset password settings to default',
      type: NotificationType.Info,
    });
  }
</script>

<div>
  {#await getConfigs() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault>
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <div class="ml-4">
            <SettingSwitch title="ENABLED" {disabled} subtitle="Logging" bind:checked={loggingConfig.enabled} />
          </div>

          <div class="ml-4">
            <SettingSelect
              label="LEVEL"
              desc="When enabled, what log level to use."
              bind:value={loggingConfig.level}
              options={[
                { value: LogLevel.Fatal, text: 'Fatal' },
                { value: LogLevel.Error, text: 'Error' },
                { value: LogLevel.Warn, text: 'Warn' },
                { value: LogLevel.Log, text: 'Log' },
                { value: LogLevel.Debug, text: 'Debug' },
                { value: LogLevel.Verbose, text: 'Verbose' },
              ]}
              name="level"
              isEdited={loggingConfig.level !== savedConfig.level}
              disabled={disabled || !loggingConfig.enabled}
            />

            <SettingButtonsRow
              on:reset={reset}
              on:save={saveSetting}
              on:reset-to-default={resetToDefault}
              showResetToDefault={!isEqual(savedConfig, defaultConfig)}
              {disabled}
            />
          </div>
        </div>
      </form>
    </div>
  {/await}
</div>
