<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, SystemConfigDto, SystemConfigPasswordLoginDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import ConfirmDisableLogin from '../confirm-disable-login.svelte';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';

  export let config: SystemConfigDto;
  export let passwordLoginConfig: SystemConfigPasswordLoginDto; // this is the config that is being edited
  export let passwordLoginDefault: SystemConfigPasswordLoginDto;
  export let savedConfig: SystemConfigPasswordLoginDto;

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
      if (!config.oauth.enabled && config.passwordLogin.enabled && !passwordLoginConfig.enabled) {
        const confirmed = await openConfirmModal();
        if (!confirmed) {
          return;
        }
      }

      const { data } = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...config,
          passwordLogin: passwordLoginConfig,
        },
      });

      passwordLoginConfig = { ...data.passwordLogin };
      savedConfig = { ...data.passwordLogin };
      config = { ...data };

      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    passwordLoginConfig = { ...savedConfig };

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    passwordLoginConfig = { ...passwordLoginDefault };

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
  <div in:fade={{ duration: 300 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <div class="ml-4">
          <SettingSwitch
            title="ENABLED"
            subtitle="Login with email and password"
            isEdited={!(passwordLoginConfig.enabled == savedConfig.enabled)}
            bind:checked={passwordLoginConfig.enabled}
          />

          <SettingButtonsRow
            on:reset={reset}
            on:save={saveSetting}
            on:reset-to-default={resetToDefault}
            showResetToDefault={!isEqual(passwordLoginConfig, passwordLoginDefault)}
          />
        </div>
      </div>
    </form>
  </div>
</div>
