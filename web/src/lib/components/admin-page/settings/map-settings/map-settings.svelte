<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, SystemConfigMapDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';

  export let mapConfig: SystemConfigMapDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigMapDto;
  let defaultConfig: SystemConfigMapDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.map),
      api.systemConfigApi.getDefaults().then((res) => res.data.map),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: current } = await api.systemConfigApi.getConfig();
      const { data: updated } = await api.systemConfigApi.updateConfig({
        systemConfigDto: { ...current, map: mapConfig },
      });

      mapConfig = { ...updated.map };
      savedConfig = { ...updated.map };

      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    mapConfig = { ...resetConfig.map };
    savedConfig = { ...resetConfig.map };

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getDefaults();

    mapConfig = { ...configs.map };
    defaultConfig = { ...configs.map };

    notificationController.show({
      message: 'Reset map settings to default',
      type: NotificationType.Info,
    });
  }
</script>

<div>
  {#await getConfigs() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault>
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch title="ENABLED" {disabled} subtitle="Enable map features" bind:checked={mapConfig.enabled} />

          <hr />

          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label="Tile URL"
            desc="URL to a leaflet compatible tile server"
            bind:value={mapConfig.tileUrl}
            required={true}
            disabled={disabled || !mapConfig.enabled}
            isEdited={mapConfig.tileUrl !== savedConfig.tileUrl}
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
