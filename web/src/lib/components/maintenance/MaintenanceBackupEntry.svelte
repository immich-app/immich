<script lang="ts">
  import MaintenanceBackupCard from '#lib/components/maintenance/MaintenanceBackupCard.svelte';
  import { isDeletingDatabaseBackup } from '#lib/queries/database-backup.query.ts';
  import { getDatabaseBackupActions, handleRestoreDatabaseBackup } from '#lib/services/database-backups.service.ts';
  import { Button, ContextMenuButton } from '@immich/ui';
  import { useIsMutating } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  type Props = {
    filename: string;
    filesize: number;
    expectedVersion: string;
    timezone?: string;
  };

  const { filename, filesize, expectedVersion, timezone }: Props = $props();

  const { Download, Delete } = $derived(getDatabaseBackupActions($t, filename));
  const deleting = useIsMutating(isDeletingDatabaseBackup(filename));
</script>

<MaintenanceBackupCard {filename} {filesize} {expectedVersion} {timezone}>
  {#snippet actions()}
    <Button size="small" onclick={() => handleRestoreDatabaseBackup(filename)} disabled={deleting.current > 0}>
      {$t('restore')}
    </Button>
    <ContextMenuButton
      disabled={deleting.current > 0}
      position="top-right"
      aria-label={$t('open')}
      items={[Download, Delete]}
    />
  {/snippet}
</MaintenanceBackupCard>
