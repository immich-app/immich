<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { deleteBackup, listBackups, MaintenanceAction, setMaintenanceMode } from '@immich/sdk';
  import { Button, Card, CardBody, HStack, modalManager, Stack, Text } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';

  interface Props {
    backups?: string[];
    showDelete?: boolean;
  }

  let props: Props = $props();

  function mapBackups(filenames: string[]) {
    return filenames.map((filename) => {
      const date = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(filename);
      const hoursAgo = date
        ? Math.floor(
            (+Date.now() - +new Date(`${date[1]}-${date[2]}-${date[3]}T${date[4]}:${date[5]}:${date[6]}`)) / 36e5,
          )
        : null;

      return {
        filename,
        hoursAgo,
      };
    });
  }

  let deleting = new SvelteSet();
  let backups = $state(mapBackups(props.backups ?? []));

  onMount(async () => {
    if (!props.backups) {
      const result = await listBackups();
      backups = mapBackups(result.backups);
    }
  });

  async function restore(filename: string) {
    const confirm = await modalManager.showDialog({
      confirmText: 'Restore',
      title: 'Restore Backup',
      prompt: 'Immich will be wiped and restored from the chosen backup. A backup will be created before continuing.',
    });

    if (confirm) {
      try {
        await setMaintenanceMode({
          setMaintenanceModeDto: {
            action: MaintenanceAction.RestoreDatabase,
            restoreBackupFilename: filename,
          },
        });
      } catch (error) {
        handleError(error, $t('admin.maintenance_start_error'));
      }
    }
  }

  async function remove(filename: string) {
    const confirm = await modalManager.showDialog({
      confirmText: 'Delete',
      title: 'Delete Backup',
      prompt: 'This file will be irrevocably deleted.',
    });

    if (confirm) {
      try {
        deleting.add(filename);

        await deleteBackup({
          filename,
        });

        backups = backups.filter((backup) => backup.filename !== filename);
      } catch (error) {
        handleError(error, 'failed to delete backup i18n');
      } finally {
        deleting.delete(filename);
      }
    }
  }
</script>

<Stack gap={2} class="mt-4 text-left">
  {#each backups as backup (backup.filename)}
    <Card>
      <CardBody>
        <HStack>
          <Stack class="flex-grow">
            <Text>{backup.filename}</Text>
            {#if typeof backup.hoursAgo === 'number'}
              {#if backup.hoursAgo <= 24}
                <Text color="info" size="small">Created {backup.hoursAgo} hours ago</Text>
              {:else if backup.hoursAgo <= 48}
                <Text color="info" size="small">Created 1 day ago</Text>
              {:else}
                <Text color="info" size="small">Created {Math.floor(backup.hoursAgo / 24)} days ago</Text>
              {/if}
            {/if}
          </Stack>
          <Button size="small" disabled={deleting.has(backup.filename)} onclick={() => restore(backup.filename)}
            >Restore</Button
          >
          {#if props.showDelete}
            <Button
              size="small"
              color="danger"
              disabled={deleting.has(backup.filename)}
              onclick={() => remove(backup.filename)}>Delete</Button
            >
          {/if}
        </HStack>
      </CardBody>
    </Card>
  {/each}
</Stack>
