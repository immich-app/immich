<script lang="ts">
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { BackupFileStatus } from '$lib/constants';
  import { getDatabaseBackupActions, handleRestoreDatabaseBackup } from '$lib/services/database-backups.service';
  import { locale } from '$lib/stores/preferences.store';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import { Button, Card, CardBody, ContextMenuButton, HStack, Icon, Stack, Text } from '@immich/ui';
  import { mdiAlertCircle, mdiCheckCircle, mdiDatabaseRefreshOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    filename: string;
    filesize: number;
    expectedVersion: string;
  };

  const { filename, filesize, expectedVersion }: Props = $props();

  const filesizeText = $derived(getBytesWithUnit(filesize, 1));

  const backupDateTime = $derived.by(() => {
    const dateMatch = filename.match(/\d+T\d+/);
    if (dateMatch) {
      return DateTime.fromFormat(dateMatch[0], "yyyyMMdd'T'HHmmss", { zone: 'utc' }).toLocal();
    }
    return null;
  });

  const timeDisplay = $derived(backupDateTime?.toLocaleString(DateTime.TIME_SIMPLE));
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

  const { Download, Delete } = $derived(getDatabaseBackupActions($t, filename));

  let isDeleting = $state(false);

  function onBackupDeleteStatus(event: { filename: string; isDeleting: boolean }) {
    if (event.filename === filename) {
      isDeleting = event.isDeleting;
    }
  }
</script>

<OnEvents {onBackupDeleteStatus} />

<Card class="dark:bg-dark-900">
  <CardBody class="pt-3 pb-4 px-6">
    <Stack gap={3} class="grow min-w-0">
      <div class="flex justify-between items-center gap-3">
        <HStack gap={2} class="min-w-0">
          {#if status === BackupFileStatus.OK}
            <Icon icon={mdiCheckCircle} size="18" class="text-success" />
          {:else if status === BackupFileStatus.DifferentVersion}
            <Icon icon={mdiAlertCircle} size="18" class="text-warning" />
          {:else}
            <Icon icon={mdiAlertCircle} size="18" class="text-danger" />
          {/if}

          {#if timeDisplay}
            <Text class="font-medium" size="small">{timeDisplay}</Text>
          {:else}
            <Text class="font-medium" size="small">{$t('unknown_date')}</Text>
          {/if}
          {#if relativeTime}
            <div class="flex items-center gap-2">
              <div class="w-1 h-1 bg-light-500"></div>
              <Text size="tiny" color="muted">{relativeTime}</Text>
            </div>
          {/if}
        </HStack>

        <HStack gap={1}>
          <Button size="small" onclick={() => handleRestoreDatabaseBackup(filename)} disabled={isDeleting}
            >{$t('restore')}</Button
          >
          <ContextMenuButton
            disabled={isDeleting}
            position="top-right"
            aria-label={$t('open')}
            items={[Download, Delete]}
          />
        </HStack>
      </div>

      <HStack>
        <Icon icon={mdiDatabaseRefreshOutline} size="16" color="gray" />
        <Text size="small" class="break-all font-mono">{filename}</Text>
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
