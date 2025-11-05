<script lang="ts">
  import { retrieveServerConfig } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { getConfig, getConfigDefaults, updateConfig, type SystemConfigDto } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { cloneDeep, isEqual } from 'lodash-es';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { SettingsResetOptions } from './admin-settings';

  interface Props {
    config: SystemConfigDto;
    children: import('svelte').Snippet<[{ savedConfig: SystemConfigDto; defaultConfig: SystemConfigDto }]>;
  }

  let { config = $bindable(), children }: Props = $props();

  let savedConfig: SystemConfigDto | undefined = $state();
  let defaultConfig: SystemConfigDto | undefined = $state();

  export const handleReset = async (options: SettingsResetOptions) => {
    await (options.default ? resetToDefault(options.configKeys) : reset(options.configKeys));
  };

  export const handleSave = async (update: Partial<SystemConfigDto>) => {
    let systemConfigDto = {
      ...savedConfig,
      ...update,
    } as SystemConfigDto;

    if (isEqual(systemConfigDto, savedConfig)) {
      return;
    }
    try {
      const newConfig = await updateConfig({
        systemConfigDto,
      });

      config = cloneDeep(newConfig);
      savedConfig = cloneDeep(newConfig);
      toastManager.success($t('settings_saved'));

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

    toastManager.info($t('admin.reset_settings_to_recent_saved'));
  };

  const resetToDefault = (configKeys: Array<keyof SystemConfigDto>) => {
    if (!defaultConfig) {
      return;
    }

    for (const key of configKeys) {
      config = { ...config, [key]: defaultConfig[key] };
    }

    toastManager.info($t('admin.reset_settings_to_default'));
  };

  onMount(async () => {
    [savedConfig, defaultConfig] = await Promise.all([getConfig(), getConfigDefaults()]);
  });
</script>

{#if savedConfig && defaultConfig}
  {@render children({ savedConfig, defaultConfig })}
{/if}
