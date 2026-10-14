<script lang="ts">
  import { systemConfigManager, type ConfigKey } from '$lib/managers/system-config-manager.svelte';
  import { ConfigSource } from '@immich/sdk';
  import { Alert, Text } from '@immich/ui';
  import { mdiLockOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    key?: ConfigKey;
  };

  const { key }: Props = $props();

  const field = $derived(key ? systemConfigManager.getField(key) : undefined);
  const source = $derived(field?.sources.at(-1)?.source);
  const isReadOnly = $derived(source && [ConfigSource.File, ConfigSource.Env].includes(source));
</script>

{#if field && isReadOnly}
  <Alert size="tiny" color="info" icon={mdiLockOutline} shape="rectangle" class="mt-2 mb-4">
    <Text size="tiny">
      {#if field && source === ConfigSource.File}
        {$t('admin.config_set_by_config_file')}
      {:else if field && source === ConfigSource.Env}
        {$t('admin.config_set_by_env', { values: { variable: field.envName } })}
      {/if}
    </Text>
  </Alert>
{/if}
