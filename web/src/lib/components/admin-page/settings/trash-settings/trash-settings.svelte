<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, SystemConfigTrashDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';

  export let trashConfig: SystemConfigTrashDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigTrashDto;
  let defaultConfig: SystemConfigTrashDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.trash),
      api.systemConfigApi.getConfigDefaults().then((res) => res.data.trash),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: current } = await api.systemConfigApi.getConfig();
      const { data: updated } = await api.systemConfigApi.updateConfig({
        systemConfigDto: { ...current, trash: trashConfig },
      });

      trashConfig = { ...updated.trash };
      savedConfig = { ...updated.trash };

      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    trashConfig = { ...resetConfig.trash };
    savedConfig = { ...resetConfig.trash };

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getConfigDefaults();

    trashConfig = { ...configs.trash };
    defaultConfig = { ...configs.trash };

    notificationController.show({
      message: 'Reset trash settings to default',
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
            subtitle="Enable Trash features"
            bind:checked={trashConfig.enabled}
          />

          <hr />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label="Number of days"
            desc="Number of days to keep the assets in trash before permanently removing them"
            bind:value={trashConfig.days}
            required={true}
            disabled={disabled || !trashConfig.enabled}
            isEdited={trashConfig.days !== savedConfig.days}
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
