<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, SystemConfigDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import SettingSwitch from '../setting-switch.svelte';

  let config: SystemConfigDto;
  let defaultConfig: SystemConfigDto;

  async function refreshConfig() {
    [config, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data),
      api.systemConfigApi.getDefaults().then((res) => res.data),
    ]);
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();
    config = resetConfig;
    notificationController.show({ message: 'Reset to the last saved settings', type: NotificationType.Info });
  }

  async function saveSetting() {
    try {
      const { data: current } = await api.systemConfigApi.getConfig();
      await api.systemConfigApi.updateConfig({
        systemConfigDto: { ...current, machineLearning: config.machineLearning },
      });
      await refreshConfig();
      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function resetToDefault() {
    await refreshConfig();
    const { data: defaults } = await api.systemConfigApi.getDefaults();
    config = defaults;

    notificationController.show({ message: 'Reset settings to defaults', type: NotificationType.Info });
  }
</script>

<div class="mt-2">
  {#await refreshConfig() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault class="mx-4 flex flex-col gap-4 py-4">
        <SettingSwitch
          title="Enabled"
          subtitle="Use machine learning features"
          bind:checked={config.machineLearning.enabled}
        />

        <hr />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="URL"
          desc="URL of machine learning server"
          bind:value={config.machineLearning.url}
          required={true}
          disabled={!config.machineLearning.enabled}
          isEdited={!(config.machineLearning.url === config.machineLearning.url)}
        />

        <SettingSwitch
          title="SMART SEARCH"
          subtitle="Extract CLIP embeddings for smart search"
          bind:checked={config.machineLearning.clipEncodeEnabled}
          disabled={!config.machineLearning.enabled}
        />

        <SettingSwitch
          title="FACIAL RECOGNITION"
          subtitle="Recognize and group faces in photos"
          disabled={!config.machineLearning.enabled}
          bind:checked={config.machineLearning.facialRecognitionEnabled}
        />

        <SettingSwitch
          title="IMAGE TAGGING"
          subtitle="Tag and classify images"
          disabled={!config.machineLearning.enabled}
          bind:checked={config.machineLearning.tagImageEnabled}
        />

        <SettingButtonsRow
          on:reset={reset}
          on:save={saveSetting}
          on:reset-to-default={resetToDefault}
          showResetToDefault={!isEqual(config, defaultConfig)}
        />
      </form>
    </div>
  {/await}
</div>
