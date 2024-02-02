<svelte:options accessors />

<script lang="ts">
  import { type SystemConfigDto, api } from '@api';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import type { SettingsEventType } from './admin-settings';
  import { createEventDispatcher, onMount } from 'svelte';
  import { cloneDeep } from 'lodash-es';

  export let config: SystemConfigDto;

  let savedConfig: SystemConfigDto;
  let defaultConfig: SystemConfigDto;

  const dispatch = createEventDispatcher<{ save: void }>();

  const handleReset = async (detail: SettingsEventType['reset']) => {
    await (detail.default ? resetToDefault(detail.configKeys) : reset(detail.configKeys));
  };

  const handleSave = async (update: Partial<SystemConfigDto>) => {
    try {
      const { data: newConfig } = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...savedConfig,
          ...update,
        },
      });

      config = cloneDeep(newConfig);
      savedConfig = cloneDeep(newConfig);
      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });

      dispatch('save');
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  };

  const reset = async (configKeys: Array<keyof SystemConfigDto>) => {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    for (const key of configKeys) {
      config = { ...config, [key]: resetConfig[key] };
    }

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  };

  const resetToDefault = async (configKeys: Array<keyof SystemConfigDto>) => {
    for (const key of configKeys) {
      config = { ...config, [key]: defaultConfig[key] };
    }

    notificationController.show({
      message: 'Reset settings to default',
      type: NotificationType.Info,
    });
  };

  onMount(async () => {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data),
      api.systemConfigApi.getConfigDefaults().then((res) => res.data),
    ]);
  });
</script>

{#if savedConfig && defaultConfig}
  <slot {handleReset} {handleSave} {savedConfig} {defaultConfig} />
{/if}
