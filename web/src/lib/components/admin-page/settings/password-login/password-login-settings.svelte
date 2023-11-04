<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, SystemConfigPasswordLoginDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import ConfirmDisableLogin from '../confirm-disable-login.svelte';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';

  export let passwordLoginConfig: SystemConfigPasswordLoginDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigPasswordLoginDto;
  let defaultConfig: SystemConfigPasswordLoginDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.passwordLogin),
      api.systemConfigApi.getConfigDefaults().then((res) => res.data.passwordLogin),
    ]);
  }

  let isConfirmOpen = false;
  let handleConfirm: (value: boolean) => void;

  const openConfirmModal = () => {
    return new Promise((resolve) => {
      handleConfirm = (value: boolean) => {
        isConfirmOpen = false;
        resolve(value);
      };
      isConfirmOpen = true;
    });
  };

  async function saveSetting() {
    try {
      const { data: current } = await api.systemConfigApi.getConfig();

      if (!current.oauth.enabled && current.passwordLogin.enabled && !passwordLoginConfig.enabled) {
        const confirmed = await openConfirmModal();
        if (!confirmed) {
          return;
        }
      }

      const { data: updated } = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...current,
          passwordLogin: passwordLoginConfig,
        },
      });

      passwordLoginConfig = { ...updated.passwordLogin };
      savedConfig = { ...updated.passwordLogin };

      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    passwordLoginConfig = { ...resetConfig.passwordLogin };
    savedConfig = { ...resetConfig.passwordLogin };

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getConfigDefaults();

    passwordLoginConfig = { ...configs.passwordLogin };
    defaultConfig = { ...configs.passwordLogin };

    notificationController.show({
      message: 'Reset password settings to default',
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
              {disabled}
              subtitle="Login with email and password"
              bind:checked={passwordLoginConfig.enabled}
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
