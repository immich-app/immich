<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';
  import ConfirmDisableLogin from '../confirm-disable-login.svelte';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const dispatch = createEventDispatcher<SettingsEventType>();

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

  async function handleSave() {
    if (!savedConfig.oauth.enabled && savedConfig.passwordLogin.enabled && !config.passwordLogin.enabled) {
      const confirmed = await openConfirmModal();
      if (!confirmed) {
        return;
      }
    }

    dispatch('save', { passwordLogin: config.passwordLogin });
  }
</script>

{#if isConfirmOpen}
  <ConfirmDisableLogin on:cancel={() => handleConfirm(false)} on:confirm={() => handleConfirm(true)} />
{/if}

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col">
        <SettingSwitch
          title="ENABLED"
          {disabled}
          subtitle="Login with email and password"
          bind:checked={config.passwordLogin.enabled}
        />

        <SettingButtonsRow
          on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['passwordLogin'] })}
          on:save={() => handleSave()}
          showResetToDefault={!isEqual(savedConfig.passwordLogin, defaultConfig.passwordLogin)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
