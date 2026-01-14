<script lang="ts">
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import MaintenanceBackupEntry from '$lib/components/maintenance/MaintenanceBackupEntry.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { handleUploadDatabaseBackup } from '$lib/services/database-backups.service';
  import { listDatabaseBackups } from '@immich/sdk';
  import { Card, CardBody, HStack, ProgressBar, Stack, Text } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    backups?: string[];
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
    backups = backups.filter((filename) => filename !== event.filename);
  }

  function onBackupUpload(event: { progress: number; isComplete: boolean }) {
    uploadProgress = event.progress;

    if (event.isComplete) {
      void reloadBackups();
    }
  }
</script>

<OnEvents {onBackupDeleted} {onBackupUpload} />

<Stack gap={2} class="mt-4 text-left">
  <Card color="primary">
    <CardBody>
      {#if uploadProgress === -1}
        <HStack>
          <Text class="grow">{$t('admin.maintenance_upload_backup')}</Text>
          <HeaderActionButton
            action={{
              color: 'primary',
              title: $t('select_from_computer'),
              onAction: handleUploadDatabaseBackup,
            }}
          />
        </HStack>
      {:else}
        <HStack gap={8}>
          <Text class="grow">{$t('asset_uploading')}</Text>
          <ProgressBar progress={uploadProgress} size="tiny" />
        </HStack>
      {/if}
    </CardBody>
  </Card>

  {#each backups as filename (filename)}
    <MaintenanceBackupEntry {filename} expectedVersion={props.expectedVersion} />
  {/each}
</Stack>
