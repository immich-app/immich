<script lang="ts">
  import { ConfigSource, type AdminConfigFieldDto } from '@immich/sdk';
  import { Alert, Code, Text } from '@immich/ui';
  import { mdiLockOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    field?: AdminConfigFieldDto;
  };

  const { field }: Props = $props();
</script>

{#if field && !field.isEditable}
  <Alert size="tiny" color="info" icon={mdiLockOutline} shape="rectangle" class="mt-2 mb-4">
    <Text size="tiny">
      {#if field.sources.at(-1)?.source === ConfigSource.Env}
        {$t('admin.config_set_by_env')} <Code>{field.envName}</Code>
      {:else}
        {$t('admin.config_set_by_config_file')}
      {/if}
    </Text>
  </Alert>
{/if}
