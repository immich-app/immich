<script lang="ts">
  import { uploadRequest } from '$lib/utils';
  import { openFilePicker } from '$lib/utils/file-uploader';
  import { handleError } from '$lib/utils/handle-error';
  import {
    deleteBackup,
    getBaseUrl,
    listBackups,
    MaintenanceAction,
    setMaintenanceMode,
    type MaintenanceUploadBackupDto,
  } from '@immich/sdk';
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

  let uploadProgress = $state(-1);

  async function upload() {
    const [file] = await openFilePicker({ multiple: false });
    const formData = new FormData();
    formData.append('file', file);

    await uploadRequest<MaintenanceUploadBackupDto>({
      url: getBaseUrl() + '/admin/maintenance/backups/upload',
      data: formData,
      onUploadProgress(event) {
        uploadProgress = event.loaded / event.total;
      },
    });

    uploadProgress = 1;

    const { backups: newList } = await listBackups();
    backups = mapBackups(newList);

    uploadProgress = -1;
  }
</script>

<Stack gap={2} class="mt-4 text-left">
  <Card>
    <CardBody>
      {#if uploadProgress === -1}
        <HStack>
          <Text class="flex-grow">Upload database backup file</Text>
          <Button size="small" onclick={upload}>Select file</Button>
        </HStack>
      {:else}
        <HStack>
          <Text class="flex-grow">Uploading...</Text>
          <div class="flex-grow h-[10px] bg-gray-300 rounded-full overflow-hidden">
            <div class="h-full bg-blue-600 transition-all duration-700" style="width: {uploadProgress * 100}%"></div>
          </div>
        </HStack>
      {/if}
    </CardBody>
  </Card>

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
