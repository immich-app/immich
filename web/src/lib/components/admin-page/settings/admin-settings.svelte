<svelte:options accessors />

<script lang="ts">
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { getConfig, getConfigDefaults, updateConfig, type SystemConfigDto } from '@immich/sdk';
  import { retrieveServerConfig } from '$lib/stores/server-config.store';
  import { cloneDeep, isEqual } from 'lodash-es';
  import { onMount } from 'svelte';
  import type { SettingsResetOptions } from './admin-settings';
  import { t } from 'svelte-i18n';

  export let config: SystemConfigDto;

  let savedConfig: SystemConfigDto;
  let defaultConfig: SystemConfigDto;

  const handleReset = async (options: SettingsResetOptions) => {
    await (options.default ? resetToDefault(options.configKeys) : reset(options.configKeys));
  };

  export const handleSave = async (update: Partial<SystemConfigDto>) => {
    let systemConfigDto = {
      ...savedConfig,
      ...update,
    };
    if (isEqual(systemConfigDto, savedConfig)) {
      return;
    }
    try {
      const newConfig = await updateConfig({
        systemConfigDto,
      });

      config = cloneDeep(newConfig);
      savedConfig = cloneDeep(newConfig);
      notificationController.show({ message: $t('settings_saved'), type: NotificationType.Info });

      await retrieveServerConfig();
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_settings'));
    }
  };

  const reset = async (configKeys: Array<keyof SystemConfigDto>) => {
    const resetConfig = await getConfig();

    for (const key of configKeys) {
      config = { ...config, [key]: resetConfig[key] };
    }

    notificationController.show({
      message: $t('admin.reset_settings_to_recent_saved'),
      type: NotificationType.Info,
    });
  };

  const resetToDefault = (configKeys: Array<keyof SystemConfigDto>) => {
    for (const key of configKeys) {
      config = { ...config, [key]: defaultConfig[key] };
    }

    notificationController.show({
      message: $t('admin.reset_settings_to_default'),
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
