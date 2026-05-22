import { eventManager } from '$lib/managers/event-manager.svelte';
import { uploadRequest } from '$lib/utils';
import { openFilePicker } from '$lib/utils/file-uploader';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  deleteDatabaseBackup,
  getBaseUrl,
  MaintenanceAction,
  setMaintenanceMode,
  type DatabaseBackupUploadDto,
} from '@immich/sdk';
import { modalManager, type ActionItem } from '@immich/ui';
import { mdiDownload, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getDatabaseBackupActions = ($t: MessageFormatter, filename: string) => {
  const Download: ActionItem = {
    type: $t('command'),
    title: $t('download'),
    icon: mdiDownload,
    onAction: () => handleDownloadDatabaseBackup(filename),
  };

  const Delete: ActionItem = {
    type: $t('command'),
    title: $t('delete'),
    icon: mdiTrashCanOutline,
    color: 'danger',
    onAction: () => handleDeleteDatabaseBackup(filename),
  };

  return { Download, Delete };
};

export const handleRestoreDatabaseBackup = async (filename: string) => {
  const $t = await getFormatter();
  const confirm = await modalManager.showDialog({
    confirmText: $t('restore'),
    title: $t('admin.maintenance_restore_backup'),
    prompt: $t('admin.maintenance_restore_backup_description'),
  });

  if (!confirm) {
    return;
  }

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
};

export const handleDeleteDatabaseBackup = async (...filenames: string[]) => {
  const $t = await getFormatter();
  const confirm = await modalManager.showDialog({
    confirmText: $t('delete'),
    title: $t('admin.maintenance_delete_backup'),
    prompt: $t('admin.maintenance_delete_backup_description'),
  });

  if (!confirm) {
    return;
  }

  try {
    for (const filename of filenames) {
      eventManager.emit('BackupDeleteStatus', { filename, isDeleting: true });
    }

    await deleteDatabaseBackup({
      databaseBackupDeleteDto: {
        backups: filenames,
      },
    });

    for (const filename of filenames) {
      eventManager.emit('BackupDeleted', { filename });
    }
  } catch (error) {
    handleError(error, $t('admin.maintenance_delete_error'));

    for (const filename of filenames) {
      eventManager.emit('BackupDeleteStatus', { filename, isDeleting: false });
    }
  }
};

export const handleDownloadDatabaseBackup = (filename: string) => {
  location.href = getBaseUrl() + '/admin/database-backups/' + filename;
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
