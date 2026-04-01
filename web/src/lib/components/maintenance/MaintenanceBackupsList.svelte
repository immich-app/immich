<script lang="ts">
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import MaintenanceBackupEntry from '$lib/components/maintenance/MaintenanceBackupEntry.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { handleUploadDatabaseBackup } from '$lib/services/database-backups.service';
  import type { DatabaseBackupDto } from '@immich/sdk';
  import { listDatabaseBackups } from '@immich/sdk';
  import { Card, CardBody, HStack, Icon, ProgressBar, Stack, Text } from '@immich/ui';
  import { mdiCalendar, mdiTrayArrowUp } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    backups?: DatabaseBackupDto[];
    expectedVersion: string;
  };

  let props: Props = $props();

  let backups = $state(props.backups ?? []);

  async function reloadBackups() {
    const result = await listDatabaseBackups();
    backups = result.backups;
  }

  onMount(() => {
    if (!props.backups) {
      void reloadBackups();
    }
  });

  let uploadProgress = $state(-1);

  function onBackupDeleted(event: { filename: string }) {
    backups = backups.filter((backup) => backup.filename !== event.filename);
  }

  function onBackupUpload(event: { progress: number; isComplete: boolean }) {
    uploadProgress = event.progress;

    if (event.isComplete) {
      void reloadBackups();
    }
  }

  const groupedBackups = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const groups = new Map<string, { date: DateTime; backups: DatabaseBackupDto[] }>();
    const unknownDateKey = $t('unknown_date');

    for (const backup of backups) {
      const dateMatch = backup.filename.match(/\d+T\d+/);
      let dateKey: string;
      let dt: DateTime;

      if (dateMatch) {
        dt = DateTime.fromFormat(dateMatch[0], "yyyyMMdd'T'HHmmss", { zone: 'utc' });
        dateKey = dt.toFormat('LLLL d, yyyy');
      } else {
        dt = DateTime.fromMillis(0);
        dateKey = unknownDateKey;
      }

      if (!groups.has(dateKey)) {
        groups.set(dateKey, { date: dt.startOf('day'), backups: [] });
      }
      groups.get(dateKey)!.backups.push(backup);
    }

    // Sort by date descending (newest first), but put unknown date at the top
    const sortedEntries = [...groups.entries()].sort((a, b) => {
      if (a[0] === unknownDateKey) {
        return -1;
      }
      if (b[0] === unknownDateKey) {
        return 1;
      }
      return b[1].date.toMillis() - a[1].date.toMillis();
    });

    return new Map(sortedEntries.map(([key, value]) => [key, value.backups]));
  });
</script>

<OnEvents {onBackupDeleted} {onBackupUpload} />

<Stack gap={4} class="mt-4 text-left">
  <Card color="info">
    <CardBody>
      {#if uploadProgress === -1}
        <div class="flex justify-between items-center">
          <div class="flex gap-2 items-end w-max">
            <Icon icon={mdiTrayArrowUp} size="20" class="text-muted"></Icon>
            <Text class="grow">{$t('admin.maintenance_upload_backup')}</Text>
          </div>
          <HeaderActionButton
            action={{
              color: 'primary',
              title: $t('select_from_computer'),
              onAction: handleUploadDatabaseBackup,
            }}
          />
        </div>
      {:else}
        <HStack gap={8}>
          <Text class="grow">{$t('asset_uploading')}</Text>
          <ProgressBar progress={uploadProgress} size="tiny" />
        </HStack>
      {/if}
    </CardBody>
  </Card>

  <hr />

  {#each [...groupedBackups.entries()] as [dateGroup, groupBackups] (dateGroup)}
    <Stack gap={2}>
      <div class="mt-5 mb-1">
        <div class="bg-primary-50 flex gap-2 px-4 py-2 rounded-xl w-max place-items-center">
          <Icon icon={mdiCalendar} size="18" />
          <Text size="small" fontWeight="medium" color="muted">{dateGroup}</Text>
        </div>
      </div>

      {#each groupBackups as backup (backup.filename)}
        <MaintenanceBackupEntry
          filename={backup.filename}
          filesize={backup.filesize}
          expectedVersion={props.expectedVersion}
        />
      {/each}
    </Stack>
  {/each}
</Stack>
