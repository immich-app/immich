<script lang="ts">
  import { BackupFileStatus } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import { Card, CardBody, HStack, Icon, Stack, Text } from '@immich/ui';
  import { mdiAlertCircle, mdiCheckCircle, mdiDatabaseRefreshOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    filename: string;
    filesize: number;
    expectedVersion: string;
    timezone?: string;
    showFullDate?: boolean;
    class?: string;
    actions?: Snippet;
  };

  const {
    filename,
    filesize,
    expectedVersion,
    timezone,
    showFullDate = false,
    class: className,
    actions,
  }: Props = $props();

  const filesizeText = $derived(getBytesWithUnit(filesize, 1));

  const backupDateTime = $derived.by(() => {
    const dateMatch = filename.match(/\d+T\d+/);
    if (dateMatch) {
      return DateTime.fromFormat(dateMatch[0], "yyyyMMdd'T'HHmmss", { zone: timezone }).toLocal();
    }
    return null;
  });

  const dateDisplay = $derived(
    backupDateTime?.toLocaleString(showFullDate ? DateTime.DATETIME_MED : DateTime.TIME_SIMPLE),
  );
  const relativeTime = $derived(backupDateTime?.toRelative({ locale: $locale }));

  const version = $derived(filename.match(/-v(.*)-/)?.[1]);

  const status = $derived.by(() => {
    if (!version) {
      return BackupFileStatus.UnknownVersion;
    }
    if (version !== expectedVersion) {
      return BackupFileStatus.DifferentVersion;
    }
    return BackupFileStatus.OK;
  });
</script>

<Card class={`dark:bg-dark-900 ${className ?? ''}`}>
  <CardBody class="px-6 pt-3 pb-4">
    <Stack gap={3} class="min-w-0 grow">
      <div class={actions ? 'flex items-center justify-between gap-3' : ''}>
        <HStack gap={2} class="min-w-0">
          {#if status === BackupFileStatus.OK}
            <Icon icon={mdiCheckCircle} size="18" class="text-success" />
          {:else if status === BackupFileStatus.DifferentVersion}
            <Icon icon={mdiAlertCircle} size="18" class="text-warning" />
          {:else}
            <Icon icon={mdiAlertCircle} size="18" class="text-danger" />
          {/if}

          {#if dateDisplay}
            <Text class="font-medium" size="small">{dateDisplay}</Text>
          {:else}
            <Text class="font-medium" size="small">{$t('unknown_date')}</Text>
          {/if}
          {#if relativeTime}
            <div class="flex items-center gap-2">
              <div class="size-1 bg-light-500"></div>
              <Text size="tiny" color="muted">{relativeTime}</Text>
            </div>
          {/if}
        </HStack>

        {#if actions}
          <HStack gap={1}>
            {@render actions()}
          </HStack>
        {/if}
      </div>

      <HStack>
        <Icon icon={mdiDatabaseRefreshOutline} size="16" color="gray" />
        <Text size="small" class="font-mono break-all">{filename}</Text>
      </HStack>

      {#if status === BackupFileStatus.UnknownVersion}
        <Text size="small" color="danger">
          {$t('admin.maintenance_restore_backup_unknown_version')}
        </Text>
      {:else if status === BackupFileStatus.DifferentVersion}
        <Text size="small" color="warning">
          {$t('admin.maintenance_restore_backup_different_version')}
        </Text>
      {/if}

      <HStack gap={8}>
        <div class="flex gap-1">
          <Text size="tiny" color="muted">{$t('version')}:</Text>
          <Text size="tiny" fontWeight="medium">{version ? `v${version}` : $t('unknown')}</Text>
        </div>
        <div class="flex gap-1">
          <Text size="tiny" color="muted">{$t('size')}:</Text>
          <Text size="tiny" fontWeight="medium">{filesizeText[0]} {filesizeText[1]}</Text>
        </div>
      </HStack>
    </Stack>
  </CardBody>
</Card>
