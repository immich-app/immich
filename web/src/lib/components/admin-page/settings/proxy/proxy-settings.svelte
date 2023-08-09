<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, ProxyProtocol, SystemConfigProxyDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import ConfirmDisableLogin from '../confirm-disable-login.svelte';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import SettingSelect from '../setting-select.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';

  export let proxyConfig: SystemConfigProxyDto; // this is the config that is being edited

  let savedConfig: SystemConfigProxyDto;
  let defaultConfig: SystemConfigProxyDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.proxy),
      api.systemConfigApi.getDefaults().then((res) => res.data.proxy),
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

      if (!current.oauth.enabled && current.proxy.enabled && !proxyConfig.enabled) {
        const confirmed = await openConfirmModal();
        if (!confirmed) {
          return;
        }
      }

      const { data: updated } = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...current,
          passwordLogin: proxyConfig,
        },
      });

      proxyConfig = { ...updated.proxy };
      savedConfig = { ...updated.proxy };

      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    proxyConfig = { ...resetConfig.proxy };
    savedConfig = { ...resetConfig.proxy };

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getDefaults();

    proxyConfig = { ...configs.proxy };
    defaultConfig = { ...configs.proxy };

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
          <SettingSwitch title="ENABLE" bind:checked={proxyConfig.enabled} />

          <SettingSelect
            label="PROTOCOL"
            bind:value={proxyConfig.protocol}
            options={[
              { value: ProxyProtocol.Http, text: 'http' },
              { value: ProxyProtocol.Https, text: 'https' },
            ]}
            name="protocol"
            disabled={!proxyConfig.enabled}
            isEdited={!(proxyConfig.protocol == savedConfig.protocol)}
          />

          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label="HOSTNAME"
            bind:value={proxyConfig.hostname}
            required={true}
            disabled={!proxyConfig.enabled}
            isEdited={!(proxyConfig.hostname == proxyConfig.hostname)}
          />
          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label="PORT"
            bind:value={proxyConfig.port}
            required={true}
            disabled={!proxyConfig.enabled}
            isEdited={!(proxyConfig.port == savedConfig.port)}
          />

          <SettingButtonsRow
            on:reset={reset}
            on:save={saveSetting}
            on:reset-to-default={resetToDefault}
            showResetToDefault={!isEqual(savedConfig, defaultConfig)}
          />
        </div>
      </form>
    </div>
  {/await}
</div>
