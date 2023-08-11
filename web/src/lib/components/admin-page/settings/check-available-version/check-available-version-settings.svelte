<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, SystemConfigCheckAvailableVersionDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import ConfirmDisableLogin from '../confirm-disable-login.svelte';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';

  export let checkAvailableVersionConfig: SystemConfigCheckAvailableVersionDto; // this is the config that is being edited

  let savedConfig: SystemConfigCheckAvailableVersionDto;
  let defaultConfig: SystemConfigCheckAvailableVersionDto;

  let isConfirmOpen = false;
  let handleConfirm: (value: boolean) => void;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.checkAvailableVersion),
      api.systemConfigApi.getDefaults().then((res) => res.data.checkAvailableVersion),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: configs } = await api.systemConfigApi.getConfig();

      const result = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...configs,
          checkAvailableVersion: checkAvailableVersionConfig,
        },
      });

      checkAvailableVersionConfig = { ...result.data.checkAvailableVersion };
      savedConfig = { ...result.data.checkAvailableVersion };

      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    checkAvailableVersionConfig = { ...resetConfig.checkAvailableVersion };
    savedConfig = { ...resetConfig.checkAvailableVersion };

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getDefaults();

    checkAvailableVersionConfig = { ...configs.checkAvailableVersion };
    defaultConfig = { ...configs.checkAvailableVersion };

    notificationController.show({
      message: 'Reset settings to default',
      type: NotificationType.Info,
    });
  }
</script>

{#if isConfirmOpen}
  <ConfirmDisableLogin on:cancel={() => handleConfirm(false)} on:confirm={() => handleConfirm(true)} />
{/if}

<div>
  {#await getConfigs() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault>
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <div class="ml-4">
            <SettingSwitch
              title="ENABLED"
              subtitle="Login with email and password"
              bind:checked={checkAvailableVersionConfig.enabled}
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
