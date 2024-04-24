<svelte:options accessors />

<script lang="ts">
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { getConfig, getConfigDefaults, updateConfig, type SystemConfigDto } from '@immich/sdk';
  import { loadConfig } from '$lib/stores/server-config.store';
  import { cloneDeep } from 'lodash-es';
  import { createEventDispatcher, onMount } from 'svelte';
  import type { SettingsEventType } from './admin-settings';

  export let config: SystemConfigDto;

  let savedConfig: SystemConfigDto;
  let defaultConfig: SystemConfigDto;

  const dispatch = createEventDispatcher<{ save: void }>();

  const handleReset = async (detail: SettingsEventType['reset']) => {
    await (detail.default ? resetToDefault(detail.configKeys) : reset(detail.configKeys));
  };

  export const handleSave = async (update: Partial<SystemConfigDto>) => {
    try {
      const newConfig = await updateConfig({
        systemConfigDto: {
          ...savedConfig,
          ...update,
        },
      });

      config = cloneDeep(newConfig);
      savedConfig = cloneDeep(newConfig);
      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });

      await loadConfig();

      dispatch('save');
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  };

  const reset = async (configKeys: Array<keyof SystemConfigDto>) => {
    const resetConfig = await getConfig();

    for (const key of configKeys) {
      config = { ...config, [key]: resetConfig[key] };
    }

    notificationController.show({
      message: 'Reset settings to the recent saved settings',
      type: NotificationType.Info,
    });
  };

  const resetToDefault = (configKeys: Array<keyof SystemConfigDto>) => {
    for (const key of configKeys) {
      config = { ...config, [key]: defaultConfig[key] };
    }

    notificationController.show({
      message: 'Reset settings to default',
      type: NotificationType.Info,
    });
  };

  onMount(async () => {
    [savedConfig, defaultConfig] = await Promise.all([getConfig(), getConfigDefaults()]);
  });
</script>

{#if savedConfig && defaultConfig}
  <slot {handleReset} {handleSave} {savedConfig} {defaultConfig} />
{/if}
