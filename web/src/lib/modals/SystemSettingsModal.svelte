<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { AppRoute } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { getSystemConfigActions, handleSystemConfigSave } from '$lib/services/system-config.service';
  import type { SystemConfigContext } from '$lib/types';
  import type { SystemConfigDto } from '@immich/sdk';
  import { Button, FormModal, type ModalSize } from '@immich/ui';
  import { isEqual, pick } from 'lodash-es';
  import { type Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    keys: Array<keyof SystemConfigDto>;
    size?: ModalSize;
    onBeforeSave?: (context: SystemConfigContext) => Promise<boolean>;
    child: Snippet<[SystemConfigContext]>;
  };

  let { keys, size = 'medium', onBeforeSave, child }: Props = $props();

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
  const { settings } = $derived(getSystemConfigActions($t, featureFlagsManager.value, systemConfigManager.value));
  const setting = $derived(settings.find((setting) => setting.href === page.url.pathname));
  const showResetToDefault = $derived(!isEqual(pick(configToEdit, keys), pick(systemConfigManager.defaultValue, keys)));

  const handleResetToDefault = () => {
    const defaultConfig = systemConfigManager.cloneDefaultValue();
    configToEdit = { ...configToEdit, ...pick(defaultConfig, keys) };
  };

  const onSubmit = async () => {
    const shouldSave = await onBeforeSave?.({ disabled, config, configToEdit });
    if (shouldSave ?? true) {
      await handleSystemConfigSave(pick(configToEdit, keys));
      await onClose();
    }
  };

  const onClose = async () => {
    await goto(AppRoute.ADMIN_SETTINGS);
  };
</script>

{#if setting}
  <FormModal
    size={size as 'small' | 'medium'}
    title={setting.title}
    icon={setting.icon}
    preventDefault
    {onClose}
    {onSubmit}
  >
    <div class="flex flex-col gap-5">
      {@render child({ disabled, config, configToEdit })}
      {#if showResetToDefault}
        <div class="flex justify-end mt-4">
          <Button size="small" color="secondary" variant="ghost" onclick={handleResetToDefault}>
            {$t('reset_to_default')}
          </Button>
        </div>
      {/if}
    </div>
  </FormModal>
{/if}
