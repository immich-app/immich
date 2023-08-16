<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import type { SystemConfigDto, SystemConfigPasswordLoginDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import ConfirmDisableLogin from '../confirm-disable-login.svelte';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    save: SystemConfigPasswordLoginDto;
  }>();

  export let config: SystemConfigDto;
  export let passwordLoginConfig: SystemConfigPasswordLoginDto; // this is the config that is being edited
  export let passwordLoginDefault: SystemConfigPasswordLoginDto;
  export let savedConfig: SystemConfigPasswordLoginDto;
  console.log(config);
  console.log(passwordLoginConfig);
  console.log(savedConfig);
  let isConfirmOpen = false;
  let handleConfirm: (value: boolean) => void;

  const openConfirmModal = () => {
    return new Promise((resolve) => {
      handleConfirm = (value: boolean) => {
        if (!value) {
          passwordLoginConfig.enabled = !passwordLoginConfig.enabled;
        }
        isConfirmOpen = false;
        resolve(value);
      };
      isConfirmOpen = true;
    });
  };

  async function saveSetting() {
    if (!config.oauth.enabled && savedConfig.enabled && !passwordLoginConfig.enabled) {
      const confirmed = await openConfirmModal();
      if (!confirmed) {
        return;
      }
    }

    dispatch('save', passwordLoginConfig);
  }

  async function reset() {
    passwordLoginConfig = { ...savedConfig };

    notificationController.show({
      message: 'Reset password authentication settings to the last saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    passwordLoginConfig = { ...passwordLoginDefault };

    notificationController.show({
      message: 'Reset password authentication settings to default',
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
