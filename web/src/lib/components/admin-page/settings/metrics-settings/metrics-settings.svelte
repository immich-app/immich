<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, SystemConfigMetricsDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import type { ResetOptions } from '$lib/utils/dipatch';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';

  export let config: SystemConfigMetricsDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigMetricsDto;
  let defaultConfig: SystemConfigMetricsDto;

  const handleReset = (detail: ResetOptions) => {
    if (detail.default) {
      resetToDefault();
    } else {
      reset();
    }
  };

  async function refreshConfig() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.metrics),
      api.systemConfigApi.getConfigDefaults().then((res) => res.data.metrics),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: current } = await api.systemConfigApi.getConfig();
      const { data: updated } = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...current,
          metrics: {
            enabled: config.enabled,
          },
        },
      });

      config = { ...updated.metrics };
      savedConfig = { ...updated.metrics };

      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    config = { ...resetConfig.metrics };
    savedConfig = { ...resetConfig.metrics };

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getConfigDefaults();

    config = { ...configs.metrics };
    defaultConfig = { ...configs.metrics };

    notificationController.show({
      message: 'Reset map settings to default',
      type: NotificationType.Info,
    });
  }

  function getSharedMetrics() {
    return api.metricsApi.getMetrics().then((response) => response.data);
  }
</script>

<div class="mt-2">
  {#await refreshConfig() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault>
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title="ENABLED"
            {disabled}
            subtitle="Enable sharing of anonymous usage data"
            bind:checked={config.enabled}
          />

          {#if config.enabled}
            {#await getSharedMetrics()}
              <LoadingSpinner />
            {:then metrics}
              <div class="mt-2 rounded-lg bg-gray-200 p-4 text-xs dark:bg-gray-700 dark:text-immich-dark-fg">
                <pre><code>{JSON.stringify(metrics, null, 2)}</code></pre>
              </div>
            {/await}
          {/if}

          <SettingButtonsRow
            on:reset={({ detail }) => handleReset(detail)}
            on:save={saveSetting}
            showResetToDefault={!isEqual(savedConfig, defaultConfig)}
            {disabled}
          />
        </div>
      </form>
    </div>
  {/await}
</div>
