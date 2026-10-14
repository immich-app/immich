<script lang="ts">
  import MaintenanceBackupCard from '$lib/components/maintenance/MaintenanceBackupCard.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { getDatabaseBackupActions, handleRestoreDatabaseBackup } from '$lib/services/database-backups.service';
  import { Button, ContextMenuButton } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    filename: string;
    filesize: number;
    expectedVersion: string;
    timezone?: string;
  };

  const { filename, filesize, expectedVersion, timezone }: Props = $props();

  const { Download, Delete } = $derived(getDatabaseBackupActions($t, filename));

  let isDeleting = $state(false);

  function onBackupDeleteStatus(event: { filename: string; isDeleting: boolean }) {
    if (event.filename === filename) {
      isDeleting = event.isDeleting;
    }
  }
</script>

<OnEvents {onBackupDeleteStatus} />

<MaintenanceBackupCard {filename} {filesize} {expectedVersion} {timezone}>
  {#snippet actions()}
    <Button size="small" onclick={() => handleRestoreDatabaseBackup(filename)} disabled={isDeleting}>
      {$t('restore')}
    </Button>
    <ContextMenuButton disabled={isDeleting} position="top-right" aria-label={$t('open')} items={[Download, Delete]} />
  {/snippet}
</MaintenanceBackupCard>
