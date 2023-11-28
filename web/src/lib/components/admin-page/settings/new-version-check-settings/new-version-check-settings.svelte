<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, SystemConfigNewVersionCheckDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';

  export let newVersionCheckConfig: SystemConfigNewVersionCheckDto; // this is the config that is being edited

  let savedConfig: SystemConfigNewVersionCheckDto;
  let defaultConfig: SystemConfigNewVersionCheckDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.newVersionCheck),
      api.systemConfigApi.getConfigDefaults().then((res) => res.data.newVersionCheck),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: configs } = await api.systemConfigApi.getConfig();

      const result = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...configs,
          newVersionCheck: newVersionCheckConfig,
        },
      });

      newVersionCheckConfig = { ...result.data.newVersionCheck };
      savedConfig = { ...result.data.newVersionCheck };

      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    newVersionCheckConfig = { ...resetConfig.newVersionCheck };
    savedConfig = { ...resetConfig.newVersionCheck };

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getConfigDefaults();

    newVersionCheckConfig = { ...configs.newVersionCheck };
    defaultConfig = { ...configs.newVersionCheck };

    notificationController.show({
      message: 'Reset settings to default',
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
            <SettingSwitch
              title="ENABLED"
              subtitle="Enable period requests to GitHub to check for new releases"
              bind:checked={newVersionCheckConfig.enabled}
            />
            <SettingButtonsRow
              on:reset={reset}
              on:save={saveSetting}
              on:reset-to-default={resetToDefault}
              showResetToDefault={!isEqual(savedConfig, defaultConfig)}
            />
          </div>
        </div>
      </form>
    </div>
  {/await}
</div>
