<script lang="ts">
  import { systemConfigManager, type ConfigKey } from '$lib/managers/system-config-manager.svelte';
  import { ConfigSource } from '@immich/sdk';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    key?: ConfigKey;
  };

  const { key }: Props = $props();

  const field = $derived(key ? systemConfigManager.getField(key) : undefined);
  const source = $derived(field?.sources.at(-1)?.source);
</script>

{#if field && source === ConfigSource.File}
  <Text color="muted">{$t('admin.config_set_by_config_file')}</Text>
{:else if field && source === ConfigSource.Env}
  <Text color="muted">
    {$t('admin.config_set_by_env', { values: { variable: field.envVariable } })}
  </Text>
{/if}
