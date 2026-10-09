<script lang="ts">
  import MaintenanceBackupCard from '$lib/components/maintenance/MaintenanceBackupCard.svelte';
  import {
    getLatestBackup,
    handleRestoreDatabaseBackup,
    loadDatabaseBackups,
  } from '$lib/services/database-backups.service';
  import type { DatabaseBackupDto } from '@immich/sdk';
  import { Alert, Button, Heading, HStack, Icon, Text } from '@immich/ui';
  import { mdiArrowRight, mdiRefresh } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    selectAnother: () => void;
    end: () => void;
    expectedVersion: string;
  };

  const { selectAnother, end, expectedVersion }: Props = $props();

  let backups: DatabaseBackupDto[] | undefined = $state();

  onMount(async () => {
    backups = await loadDatabaseBackups();
  });

  const latest = $derived(backups ? getLatestBackup(backups) : undefined);
</script>

<Heading size="large" color="primary" tag="h1">{$t('maintenance_restore_from_backup')}</Heading>

{#if backups === undefined}
  <HStack>
    <Icon icon={mdiRefresh} color="rgb(var(--immich-ui-primary))" />
    <Text>{$t('maintenance_restore_loading_backups')}</Text>
  </HStack>
{:else if latest === undefined}
  <Alert color="warning" title={$t('maintenance_restore_no_backups')} />
  <HStack>
    <Button onclick={end} variant="ghost">{$t('cancel')}</Button>
    <Button onclick={selectAnother}>{$t('maintenance_restore_upload_backup')}</Button>
  </HStack>
{:else}
  <Text>{$t('maintenance_restore_latest_backup_description')}</Text>
  <MaintenanceBackupCard
    filename={latest.filename}
    filesize={latest.filesize}
    timezone={latest.timezone}
    {expectedVersion}
    showFullDate
    class="text-left"
  />

  <HStack>
    <Button onclick={end} variant="ghost">{$t('cancel')}</Button>
    <Button onclick={selectAnother} variant="ghost">{$t('maintenance_restore_select_another')}</Button>
    <Button onclick={() => handleRestoreDatabaseBackup(latest.filename)} trailingIcon={mdiArrowRight}>
      {$t('continue')}
    </Button>
  </HStack>
{/if}
