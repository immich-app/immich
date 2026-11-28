import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { executeMutation } from '#lib/queries/client.ts';
import { deleteDatabaseBackupMutation } from '#lib/queries/database-backup.query.ts';
import { setMaintenanceModeMutation } from '#lib/queries/maintenance.query.ts';
import { uploadRequest } from '#lib/utils.ts';
import { openFilePicker } from '#lib/utils/file-uploader.ts';
import { handleError } from '#lib/utils/handle-error.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { MaintenanceAction, getBaseUrl, type DatabaseBackupDto, type DatabaseBackupUploadDto } from '@immich/sdk';
import type { ActionItem } from '@immich/ui';
import { mdiDownload, mdiTrashCanOutline } from '@mdi/js';
import { DateTime } from 'luxon';
import type { MessageFormatter } from 'svelte-i18n';

export const getDatabaseBackupDateTime = (filename: string, zone?: string): DateTime | undefined => {
  const dateMatch = /\d+T\d+/.exec(filename);
  if (!dateMatch) {
    return;
  }

  return DateTime.fromFormat(dateMatch[0], "yyyyMMdd'T'HHmmss", { zone });
};

const getBackupTimestamp = (backup: DatabaseBackupDto): number =>
  getDatabaseBackupDateTime(backup.filename, backup.timezone)?.toMillis() ?? 0;

export const getLatestBackup = (backups: DatabaseBackupDto[]): DatabaseBackupDto | undefined => {
  if (backups.length === 0) {
    return undefined;
  }
  return [...backups].sort((a, b) => getBackupTimestamp(b) - getBackupTimestamp(a))[0];
};

export const getDatabaseBackupActions = ($t: MessageFormatter, filename: string) => {
  const Download: ActionItem = {
    title: $t('download'),
    icon: mdiDownload,
    onAction: () => handleDownloadDatabaseBackup(filename),
  };

  const Delete: ActionItem = {
    title: $t('delete'),
    icon: mdiTrashCanOutline,
    color: 'danger',
    onAction: () => handleDeleteDatabaseBackup(filename),
  };

  return { Download, Delete };
};

export const handleRestoreDatabaseBackup = async (filename: string) => {
  const $t = await getFormatter();

  await executeMutation(
    setMaintenanceModeMutation,
    [{ setMaintenanceModeDto: { action: MaintenanceAction.RestoreDatabase, restoreBackupFilename: filename } }],
    {
      confirm: {
        confirmText: $t('restore'),
        title: $t('admin.maintenance_restore_backup'),
        prompt: $t('admin.maintenance_restore_backup_description'),
      },
    },
  );
};

const handleDeleteDatabaseBackup = async (filename: string) => {
  const $t = await getFormatter();

  await executeMutation(deleteDatabaseBackupMutation, [{ databaseBackupDeleteDto: { backups: [filename] } }], {
    confirm: {
      confirmText: $t('delete'),
      title: $t('admin.maintenance_delete_backup'),
      prompt: $t('admin.maintenance_delete_backup_description'),
    },
  });
};

const handleDownloadDatabaseBackup = (filename: string) => {
  location.assign(getBaseUrl() + '/admin/database-backups/' + filename);
};

export const handleUploadDatabaseBackup = async () => {
  const $t = await getFormatter();

  try {
    const [file] = await openFilePicker({ multiple: false });
    const formData = new FormData();
    formData.append('file', file);

    await uploadRequest<DatabaseBackupUploadDto>({
      url: getBaseUrl() + '/admin/database-backups/upload',
      data: formData,
      onUploadProgress(event) {
        eventManager.emit('BackupUpload', { progress: event.loaded / event.total, isComplete: false });
      },
    });

    eventManager.emit('BackupUpload', { progress: 1, isComplete: true });
  } catch (error) {
    handleError(error, $t('admin.maintenance_upload_backup_error'));
  } finally {
    eventManager.emit('BackupUpload', { progress: -1, isComplete: false });
  }
};
