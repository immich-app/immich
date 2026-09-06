<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/SettingAccordion.svelte';
  import { Button, FormatBytes } from '@immich/ui';
  import type { ServerStorageResponseDto } from '@immich/sdk';
  import { mdiFolderMove, mdiHarddisk } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    storage: ServerStorageResponseDto;
    onRunStorageTemplateMigration: () => void;
    isRunning?: boolean;
  }

  let { storage, onRunStorageTemplateMigration, isRunning = false }: Props = $props();

  const usagePercent = $derived(storage.diskUsagePercentage);
  const clampedPercent = $derived(Math.min(100, Math.max(0, usagePercent)));
</script>

<SettingAccordion
  key="infrastructure-storage-locations"
  title={$t('admin.infrastructure_storage_locations')}
  subtitle={$t('admin.infrastructure_storage_locations_description')}
  icon={mdiHarddisk}
>
  <div class="ms-4 mt-4 flex flex-col gap-4">
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div class="flex flex-col items-center gap-1">
        <span class="text-lg font-medium"><FormatBytes bytes={storage.diskUseRaw} /></span>
        <span class="text-sm text-immich-fg/60">{$t('used')}</span>
      </div>
      <div class="flex flex-col items-center gap-1">
        <span class="text-lg font-medium"><FormatBytes bytes={storage.diskSizeRaw} /></span>
        <span class="text-sm text-immich-fg/60">{$t('total')}</span>
      </div>
      <div class="flex flex-col items-center gap-1">
        <span class="text-lg font-medium"><FormatBytes bytes={storage.diskAvailableRaw} /></span>
        <span class="text-sm text-immich-fg/60">{$t('available')}</span>
      </div>
    </div>

    <div class="h-3 w-full rounded-full bg-light-100 dark:bg-immich-dark-fg/20">
      <div class="h-full rounded-full bg-primary transition-all" style={`width: ${clampedPercent}%`}></div>
    </div>
    <p class="text-sm text-immich-fg/60">
      {$t('admin.storage_usage_percent', { values: { percent: usagePercent.toFixed(2) } })}
    </p>

    <p class="text-sm text-immich-fg/60">
      {$t('admin.current_storage_location_description', {
        values: { path: '$UPLOAD_LOCATION' },
      })}
    </p>

    <Button
      leadingIcon={mdiFolderMove}
      size="small"
      shape="round"
      loading={isRunning}
      onclick={onRunStorageTemplateMigration}>{$t('admin.run_storage_template_migration')}</Button
    >
  </div>
</SettingAccordion>
