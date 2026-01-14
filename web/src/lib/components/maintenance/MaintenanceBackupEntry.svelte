<script lang="ts">
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { getDatabaseBackupActions, handleRestoreDatabaseBackup } from '$lib/services/database-backups.service';
  import { locale } from '$lib/stores/preferences.store';
  import { Card, CardBody, ContextMenuButton, HStack, Stack, Text } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    filename: string;
    expectedVersion: string;
  };

  const { filename, expectedVersion }: Props = $props();

  const timeText = $derived.by(() => {
    const date = filename.match(/\d+T\d+/);
    if (date) {
      return DateTime.fromFormat(date[0], "yyyyMMdd'T'HHmmss").toRelative({ locale: $locale });
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
        <Text>{filename}</Text>
        {#if timeText || version !== expectedVersion}
          <HStack class="grow">
            {#if timeText}
              <Text color="primary" size="small">{timeText}</Text>
            {/if}
            {#if timeText && version !== expectedVersion}
              &middot;
            {/if}
            {#if !version}
              <Text color="danger" size="small">{$t('admin.maintenance_restore_backup_unknown_version')}</Text>
            {/if}
            {#if version && version !== expectedVersion}
              <Text color="warning" size="small">{$t('admin.maintenance_restore_backup_different_version')}</Text>
            {/if}
          </HStack>
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
      />
    </HStack>
  </CardBody>
</Card>
