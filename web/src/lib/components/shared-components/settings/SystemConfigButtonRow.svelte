<script lang="ts">
  import { createPreloadedQuery, queryClient } from '#lib/queries/client.ts';
  import {
    getAdminConfigDefaultsQuery,
    getAdminConfigFieldsQuery,
    getAdminConfigQuery,
    updateAdminConfigMutation,
  } from '#lib/queries/config-admin.query.ts';
  import type { AdminConfigDto } from '@immich/sdk';
  import { Button, toastManager } from '@immich/ui';
  import { createMutation, createQuery } from '@tanstack/svelte-query';
  import { cloneDeep, get, has, isEqual, pick, set } from 'lodash-es';
  import { t } from 'svelte-i18n';

  type Props = {
    keys: Array<keyof AdminConfigDto>;
    configToEdit: AdminConfigDto;
    onBeforeSave?: () => Promise<boolean>;
  };

  let { keys, configToEdit = $bindable(), onBeforeSave }: Props = $props();

  const queries = {
    config: createPreloadedQuery(getAdminConfigQuery),
    defaults: createPreloadedQuery(getAdminConfigDefaultsQuery),
  };

  const fields = createQuery(getAdminConfigFieldsQuery, () => queryClient);

  const config = $derived(queries.config.data);
  const editableDefaults = $derived.by(() => {
    const result = cloneDeep(pick(queries.defaults.data, keys));
    for (const { key, isEditable } of fields.data ?? []) {
      if (!isEditable && has(result, key)) {
        set(result, key, cloneDeep(get(config, key)));
      }
    }

    return result;
  });
  const save = createMutation(updateAdminConfigMutation);

  const showResetToDefault = $derived(!isEqual(pick(config, keys), editableDefaults));

  const handleReset = () => {
    configToEdit = cloneDeep(config);
    toastManager.info($t('admin.reset_settings_to_recent_saved'));
  };

  const handleResetToDefault = () => {
    configToEdit = { ...configToEdit, ...cloneDeep(editableDefaults) };
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
    <Button shape="round" size="small" color="secondary" onclick={handleReset}>{$t('reset')}</Button>
    <Button shape="round" type="submit" disabled={save.isPending} size="small" onclick={handleSave}>
      {$t('save')}
    </Button>
  </div>
</div>
