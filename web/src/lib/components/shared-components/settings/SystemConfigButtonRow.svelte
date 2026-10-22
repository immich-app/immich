<script lang="ts">
  import { createPreloadedQuery } from '$lib/queries/client';
  import {
    getAdminConfigDefaultsQuery,
    getAdminConfigQuery,
    updateAdminConfigMutation,
  } from '$lib/queries/config-admin.query';
  import type { AdminConfigDto } from '@immich/sdk';
  import { Button, toastManager } from '@immich/ui';
  import { createMutation } from '@tanstack/svelte-query';
  import { cloneDeep, isEqual, pick } from 'lodash-es';
  import { t } from 'svelte-i18n';

  type Props = {
    disabled?: boolean;
    keys: Array<keyof AdminConfigDto>;
    configToEdit: AdminConfigDto;
    onBeforeSave?: () => Promise<boolean>;
  };

  let { disabled, keys, configToEdit = $bindable(), onBeforeSave }: Props = $props();

  const queries = {
    config: createPreloadedQuery(getAdminConfigQuery),
    defaults: createPreloadedQuery(getAdminConfigDefaultsQuery),
  };

  const config = $derived(queries.config.data);
  const defaults = $derived(queries.defaults.data);
  const save = createMutation(updateAdminConfigMutation);

  const showResetToDefault = $derived(!isEqual(pick(config, keys), pick(defaults, keys)));

  const handleReset = () => {
    configToEdit = cloneDeep(config);
    toastManager.info($t('admin.reset_settings_to_recent_saved'));
  };

  const handleResetToDefault = () => {
    configToEdit = { ...configToEdit, ...cloneDeep(pick(defaults, keys)) };
    toastManager.info($t('admin.reset_settings_to_default'));
  };

  const handleSave = async () => {
    const shouldSave = await onBeforeSave?.();

    if (shouldSave ?? true) {
      save.mutate(pick(configToEdit, keys));
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
    <Button shape="round" type="submit" disabled={disabled || save.isPending} size="small" onclick={handleSave}>
      {$t('save')}
    </Button>
  </div>
</div>
