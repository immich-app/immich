<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { uploadRequest } from '$lib/utils';
  import { openFilePicker } from '$lib/utils/file-uploader';
  import { handleError } from '$lib/utils/handle-error';
  import {
    deleteDatabaseBackup,
    getBaseUrl,
    listDatabaseBackups,
    MaintenanceAction,
    setMaintenanceMode,
    type DatabaseBackupUploadDto,
  } from '@immich/sdk';
  import {
    Button,
    Card,
    CardBody,
    HStack,
    IconButton,
    menuManager,
    modalManager,
    ProgressBar,
    Stack,
    Text,
    type ContextMenuBaseProps,
  } from '@immich/ui';
  import { mdiDotsVertical, mdiDownload, mdiTrashCanOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';

  type Props = {
    backups?: string[];
  };

  let props: Props = $props();

  const mapBackups = (filenames: string[]) => {
    return filenames.map((filename) => {
      const date = /\d{4}\d{2}\d{2}T\d{2}\d{2}\d{2}/.exec(filename);

      return {
        filename,
        timeText: date ? DateTime.fromFormat(date[0], "yyyyMMdd'T'HHmmss").toRelative({ locale: $locale }) : null,
      };
    });
  };

  let deleting = new SvelteSet();
  let backups = $state(mapBackups(props.backups ?? []));

  async function reloadBackups() {
    const result = await listDatabaseBackups();
    backups = mapBackups(result.backups);
  }

  onMount(() => {
    if (!props.backups) {
      void reloadBackups();
    }
  });

  async function restore(filename: string) {
    const confirm = await modalManager.showDialog({
      confirmText: $t('restore'),
      title: $t('admin.maintenance_restore_backup'),
      prompt: $t('admin.maintenance_restore_backup_description'),
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
      confirmText: $t('delete'),
      title: $t('admin.maintenance_delete_backup'),
      prompt: $t('admin.maintenance_delete_backup_description'),
    });

    if (confirm) {
      try {
        deleting.add(filename);

        await deleteDatabaseBackup({
          databaseBackupDeleteDto: {
            backups: [filename],
          },
        });

        backups = backups.filter((backup) => backup.filename !== filename);
      } catch (error) {
        handleError(error, $t('admin.maintenance_delete_error'));
      } finally {
        deleting.delete(filename);
      }
    }
  }

  function download(filename: string) {
    location.href = getBaseUrl() + '/admin/database-backups/' + filename;
  }

  const handleOpen = async (event: Event, props: Partial<ContextMenuBaseProps>, filename: string) => {
    await menuManager.show({
      ...props,
      target: event.currentTarget as HTMLElement,
      items: [
        {
          title: $t('download'),
          icon: mdiDownload,
          onAction() {
            void download(filename);
          },
        },
        {
          title: $t('delete'),
          icon: mdiTrashCanOutline,
          color: 'danger',
          onAction() {
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

      await uploadRequest<DatabaseBackupUploadDto>({
        url: getBaseUrl() + '/admin/database-backups/upload',
        data: formData,
        onUploadProgress(event) {
          uploadProgress = event.loaded / event.total;
        },
      });

      uploadProgress = 1;

      void reloadBackups();
    } catch (error) {
      handleError(error, $t('admin.maintenance_upload_backup_error'));
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
          <Text class="grow">{$t('admin.maintenance_upload_backup')}</Text>
          <Button size="tiny" onclick={upload}>{$t('select_from_computer')}</Button>
        </HStack>
      {:else}
        <HStack gap={8}>
          <Text class="grow">{$t('asset_uploading')}</Text>
          <ProgressBar progress={uploadProgress} size="tiny" />
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
            {#if typeof backup.timeText}
              <Text color="info" size="small">{backup.timeText}</Text>
            {/if}
          </Stack>

          <Button size="small" disabled={deleting.has(backup.filename)} onclick={() => restore(backup.filename)}
            >{$t('restore')}</Button
          >

          <IconButton
            shape="round"
            variant="ghost"
            color="secondary"
            icon={mdiDotsVertical}
            class="shrink-0"
            disabled={deleting.has(backup.filename)}
            onclick={(event: Event) => handleOpen(event, { position: 'top-right' }, backup.filename)}
            aria-label={$t('open')}
          />
        </HStack>
      </CardBody>
    </Card>
  {/each}
</Stack>
