<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, SystemConfigMetricsDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingAccordion from '../setting-accordion.svelte';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import type { ResetOptions } from '$lib/utils/dipatch';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';

  export let config: SystemConfigMetricsDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigMetricsDto;
  let defaultConfig: SystemConfigMetricsDto;

  $: sharedMetrics = getSharedMetrics(config);

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
            serverInfo: config.serverInfo,
            assetCount: config.assetCount,
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

  function getSharedMetrics(systemConfigMetricsDto: SystemConfigMetricsDto) {
    return api.metricsApi.getMetrics({ systemConfigMetricsDto }).then((response) => response.data);
  }
</script>

<div class="mt-2">
  {#await refreshConfig() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault>
        <div class="flex flex-col gap-4">
          <SettingSwitch title="ENABLED" {disabled} subtitle="Enable sharing metrics" bind:checked={config.enabled} />

          <SettingAccordion title="Server Info Metrics" subtitle="Manage which server infos the instance should share">
            <div class="ml-4 mt-4 flex flex-col gap-4">
              <SettingSwitch
                title="CPU Count"
                disabled={disabled || !config.enabled}
                bind:checked={config.serverInfo.cpuCount}
              />

              <SettingSwitch
                title="CPU Model"
                disabled={disabled || !config.enabled}
                bind:checked={config.serverInfo.cpuModel}
              />

              <SettingSwitch
                title="Memory"
                disabled={disabled || !config.enabled}
                bind:checked={config.serverInfo.memory}
              />

              <SettingSwitch
                title="Version"
                disabled={disabled || !config.enabled}
                bind:checked={config.serverInfo.version}
              />
            </div></SettingAccordion
          >

          <SettingAccordion title="Asset Count Metrics" subtitle="Manage which asset counts the instance should share">
            <div class="ml-4 mt-4 flex flex-col gap-4">
              <SettingSwitch
                title="Image Count"
                disabled={disabled || !config.enabled}
                bind:checked={config.assetCount.image}
              />

              <SettingSwitch
                title="Video Count"
                disabled={disabled || !config.enabled}
                bind:checked={config.assetCount.video}
              />

              <SettingSwitch
                title="Total Assets Count"
                disabled={disabled || !config.enabled}
                bind:checked={config.assetCount.total}
              />
            </div></SettingAccordion
          >

          {#if config.enabled}
            {#await sharedMetrics}
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
