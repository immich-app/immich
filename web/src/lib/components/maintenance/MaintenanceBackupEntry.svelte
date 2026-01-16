<script lang="ts">
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { getDatabaseBackupActions, handleRestoreDatabaseBackup } from '$lib/services/database-backups.service';
  import { locale } from '$lib/stores/preferences.store';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import { Card, CardBody, ContextMenuButton, HStack, Stack, Text } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    filename: string;
    filesize: number;
    expectedVersion: string;
  };

  const { filename, filesize, expectedVersion }: Props = $props();

  const filesizeText = $derived(getBytesWithUnit(filesize));

  const timeText = $derived.by(() => {
    const date = filename.match(/\d+T\d+/);
    if (date) {
      return DateTime.fromFormat(date[0], "yyyyMMdd'T'HHmmss", { zone: 'utc' }).toRelative({ locale: $locale });
    }
  });

  const timeFormat = $derived.by(() => {
    const date = filename.match(/\d+T\d+/);
    if (date) {
      return DateTime.fromFormat(date[0], "yyyyMMdd'T'HHmmss", { zone: 'utc' })
        .toLocal()
        .toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
    }
  });

  const version = $derived(filename.match(/-v(.*)-/)?.[1]);

  const { Download, Delete } = $derived(getDatabaseBackupActions($t, filename));

  let isDeleting = $state(false);

  function onBackupDeleteStatus(event: { filename: string; isDeleting: boolean }) {
    if (event.filename === filename) {
      isDeleting = event.isDeleting;
    }
  }
</script>

<OnEvents {onBackupDeleteStatus} />

<Card>
  <CardBody>
    <HStack>
      <Stack class="grow">
        {#if timeText}
          <Text size="tiny" color="muted">{$t('created_at')}: {timeFormat} ({timeText})</Text>
        {/if}
        <Text>{filename}</Text>
        <Text size="small" color="muted">{filesizeText}</Text>

        {#if version !== expectedVersion}
          {#if !version}
            <Text color="danger" size="small" class="inline"
              >{$t('admin.maintenance_restore_backup_unknown_version')}</Text
            >
          {/if}
          {#if version && version !== expectedVersion}
            <Text color="warning" size="small" class="inline"
              >{$t('admin.maintenance_restore_backup_different_version')}</Text
            >
          {/if}
        {/if}
      </Stack>

      <HeaderActionButton
        action={{
          color: 'primary',
          title: $t('restore'),
          onAction: () => handleRestoreDatabaseBackup(filename),
          $if: () => !isDeleting,
        }}
      />

      <ContextMenuButton
        disabled={isDeleting}
        position="top-right"
        aria-label={$t('open')}
        items={[Download, Delete]}
        class="shrink-0"
      />
    </HStack>
  </CardBody>
</Card>
