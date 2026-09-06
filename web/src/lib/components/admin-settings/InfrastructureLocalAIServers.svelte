<script lang="ts">
  import { Button, IconButton, Link, Switch, Text } from '@immich/ui';
  import type { AdminConfigMachineLearningAvailabilityChecksDto } from '@immich/sdk';
  import { mdiClose, mdiPlus, mdiServer } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    enabled: boolean;
    urls: string[];
    availabilityChecks: AdminConfigMachineLearningAvailabilityChecksDto;
    disabled?: boolean;
    onToggleEnabled: (enabled: boolean) => void;
    onUpdateUrls: (urls: string[]) => void;
    onConfigure: () => void;
  }

  let {
    enabled = $bindable(false),
    urls = $bindable<string[]>([]),
    availabilityChecks,
    disabled = false,
    onToggleEnabled,
    onUpdateUrls,
    onConfigure,
  }: Props = $props();

  let newUrl = $state('');

  const addUrl = () => {
    if (newUrl.trim() === '') {
      return;
    }
    onUpdateUrls([...urls, newUrl.trim()]);
    newUrl = '';
  };

  const removeUrl = (index: number) => {
    onUpdateUrls(urls.filter((_, i) => i !== index));
  };
</script>

<div class="flex flex-col gap-4">
  <div class="flex place-items-center justify-between">
    <div>
      <Text fontWeight="medium">{$t('admin.infrastructure_local_ai_servers')}</Text>
      <Text size="small" class="text-immich-fg/60">
        {$t('admin.infrastructure_local_ai_servers_description')}
      </Text>
    </div>
    <Switch checked={enabled} onCheckedChange={(value: boolean) => onToggleEnabled(value)} {disabled} />
  </div>

  <div class="flex flex-col gap-2">
    <Text size="small" class="text-immich-fg/60">
      {$t('admin.infrastructure_local_ai_servers_availability_checks_description')}
    </Text>
    <Text size="small" class="text-immich-fg/60">
      {$t('admin.infrastructure_local_ai_servers_availability_checks_summary', {
        values: {
          enabled: availabilityChecks.enabled ? $t('enabled') : $t('disabled'),
          interval: availabilityChecks.interval,
          timeout: availabilityChecks.timeout,
        },
      })}
    </Text>
  </div>

  <div class="flex flex-col gap-2">
    {#if urls.length === 0}
      <Text size="small" class="text-immich-fg/60">{$t('admin.infrastructure_local_ai_servers_no_urls')}</Text>
    {/if}

    {#each urls as url, i (i)}
      <div class="flex items-center gap-2">
        <span class="w-full truncate font-mono text-sm">{url}</span>
        <IconButton
          aria-label={$t('admin.infrastructure_local_ai_servers_remove')}
          icon={mdiClose}
          color="danger"
          onclick={() => removeUrl(i)}
          {disabled}
        />
      </div>
    {/each}
  </div>

  <div class="flex items-end gap-2">
    <div class="flex-1">
      <Text size="small" class="text-immich-fg/60">{$t('admin.infrastructure_local_ai_servers_add_url')}</Text>
      <input
        class="mt-1 w-full rounded-lg border bg-subtle text-sm"
        placeholder="http://localhost:3003"
        bind:value={newUrl}
        {disabled}
      />
    </div>
    <IconButton aria-label={$t('add')} icon={mdiPlus} onclick={addUrl} disabled={disabled || newUrl.trim() === ''} />
  </div>

  <div class="flex gap-2">
    <Button size="small" shape="round" variant="ghost" onclick={onConfigure} leadingIcon={mdiServer}>
      {$t('admin.infrastructure_local_ai_servers_configure')}
    </Button>
    <Link href="https://docs.immich.app/administration/ml-server" target="_blank">
      {$t('admin.infrastructure_local_ai_servers_docs')}
    </Link>
  </div>
</div>
