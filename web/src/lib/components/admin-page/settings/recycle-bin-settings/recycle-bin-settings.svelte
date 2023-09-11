<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, SystemConfigRecycleBinDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';

  export let recycleBinConfig: SystemConfigRecycleBinDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigRecycleBinDto;
  let defaultConfig: SystemConfigRecycleBinDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.recycleBin),
      api.systemConfigApi.getDefaults().then((res) => res.data.recycleBin),
    ]);
  }

  async function saveSetting() {
    try {
      console.log(`Updated Recycle Bin Config: ${JSON.stringify(recycleBinConfig)}`);
      const { data: current } = await api.systemConfigApi.getConfig();
      const { data: updated } = await api.systemConfigApi.updateConfig({
        systemConfigDto: { ...current, recycleBin: recycleBinConfig },
      });

      recycleBinConfig = { ...updated.recycleBin };
      savedConfig = { ...updated.recycleBin };

      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    recycleBinConfig = { ...resetConfig.recycleBin };
    savedConfig = { ...resetConfig.recycleBin };

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getDefaults();

    recycleBinConfig = { ...configs.recycleBin };
    defaultConfig = { ...configs.recycleBin };

    notificationController.show({
      message: 'Reset recycle bin settings to default',
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
            subtitle="Enable Recycle Bin features"
            bind:checked={recycleBinConfig.enabled}
          />

          <hr />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label="Number of days"
            desc="Number of days to keep the assets in recycle bin before permanently removing them"
            bind:value={recycleBinConfig.days}
            required={true}
            disabled={disabled || !recycleBinConfig.enabled}
            isEdited={recycleBinConfig.days !== savedConfig.days}
          />

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
