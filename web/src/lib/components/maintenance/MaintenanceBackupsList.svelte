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
  import {
    Button,
    Card,
    CardBody,
    HStack,
    IconButton,
    menuManager,
    modalManager,
    Stack,
    Text,
    type ContextMenuBaseProps,
  } from '@immich/ui';
  import { mdiDotsVertical, mdiDownload, mdiTrashCanOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';

  interface Props {
    backups?: string[];
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

  function download(filename: string) {
    location.href = getBaseUrl() + '/admin/maintenance/backups/' + filename;
  }

  const handleOpen = async (event: Event, props: Partial<ContextMenuBaseProps>, filename: string) => {
    await menuManager.show({
      ...props,
      target: event.currentTarget as HTMLElement,
      items: [
        {
          title: 'Download',
          icon: mdiDownload,
          onSelect() {
            void download(filename);
          },
        },
        {
          title: 'Delete',
          icon: mdiTrashCanOutline,
          color: 'danger',
          onSelect() {
            void remove(filename);
          },
        },
      ],
    });
  };

  let uploadProgress = $state(-1);

  async function upload() {
    try {
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
    } catch (error) {
      handleError(error, 'Could not upload backup, is it an .sql/.sql.gz file?');
    } finally {
      uploadProgress = -1;
    }
  }
</script>

<Stack gap={2} class="mt-4 text-left">
  <Card>
    <CardBody>
      {#if uploadProgress === -1}
        <HStack>
          <Text class="grow">Upload database backup file</Text>
          <Button size="small" onclick={upload}>Select file</Button>
        </HStack>
      {:else}
        <HStack>
          <Text class="grow">Uploading...</Text>
          <div class="grow h-2.5 bg-gray-300 rounded-full overflow-hidden">
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
          <Stack class="grow">
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
          <IconButton
            shape="round"
            variant="ghost"
            color="secondary"
            icon={mdiDotsVertical}
            class="shrink-0"
            disabled={deleting.has(backup.filename)}
            onclick={(event: Event) => handleOpen(event, { position: 'top-right' }, backup.filename)}
            aria-label="Open menu"
          />
        </HStack>
      </CardBody>
    </Card>
  {/each}
</Stack>
