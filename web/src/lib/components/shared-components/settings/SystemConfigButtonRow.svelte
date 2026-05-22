<script lang="ts">
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { handleSystemConfigSave } from '$lib/services/system-config.service';
  import type { SystemConfigDto } from '@immich/sdk';
  import { Button, toastManager } from '@immich/ui';
  import { isEqual, pick } from 'lodash-es';
  import { t } from 'svelte-i18n';

  type Props = {
    disabled?: boolean;
    keys: Array<keyof SystemConfigDto>;
    configToEdit: SystemConfigDto;
    onBeforeSave?: () => Promise<boolean>;
  };

  let { disabled, keys, configToEdit = $bindable(), onBeforeSave }: Props = $props();

  const showResetToDefault = $derived(
    !isEqual(pick(systemConfigManager.value, keys), pick(systemConfigManager.defaultValue, keys)),
  );

  const handleReset = () => {
    configToEdit = systemConfigManager.cloneValue();
    toastManager.info($t('admin.reset_settings_to_recent_saved'));
  };

  const handleResetToDefault = () => {
    const defaultConfig = systemConfigManager.cloneDefaultValue();

    configToEdit = { ...configToEdit, ...pick(defaultConfig, keys) };

    toastManager.info($t('admin.reset_settings_to_default'));
  };

  const handleSave = async () => {
    const shouldSave = await onBeforeSave?.();

    if (shouldSave ?? true) {
      await handleSystemConfigSave(pick(configToEdit, keys));
    }
  };
</script>

<div class="mt-8 flex justify-between gap-2">
  <div class="left">
    {#if showResetToDefault}
      <Button variant="ghost" shape="round" size="small" onclick={handleResetToDefault}>
        {$t('reset_to_default')}
      </Button>
    {/if}
  </div>

  <div class="flex gap-1">
    <Button shape="round" {disabled} size="small" color="secondary" onclick={handleReset}>{$t('reset')}</Button>
    <Button shape="round" type="submit" {disabled} size="small" onclick={handleSave}>{$t('save')}</Button>
  </div>
</div>
