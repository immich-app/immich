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

export const getDatabaseBackupActions = ($t: MessageFormatter, filename: string, remove: () => void) => {
  const Download: ActionItem = {
    title: $t('download'),
    icon: mdiDownload,
    onAction() {
      void handleDownloadDatabaseBackup(filename);
    },
  };

  const Delete: ActionItem = {
    title: $t('delete'),
    icon: mdiTrashCanOutline,
    color: 'danger',
    onAction: remove,
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
    await deleteDatabaseBackup({
      databaseBackupDeleteDto: {
        backups: filenames,
      },
    });

    return true;
  } catch (error) {
    handleError(error, $t('admin.maintenance_delete_error'));
  }
};

export const handleDownloadDatabaseBackup = (filename: string) => {
  location.href = getBaseUrl() + '/admin/database-backups/' + filename;
};

export const handleUploadDatabaseBackup = async (progressFn?: (progress: number) => void) => {
  const $t = await getFormatter();

  try {
    const [file] = await openFilePicker({ multiple: false });
    const formData = new FormData();
    formData.append('file', file);

    await uploadRequest<DatabaseBackupUploadDto>({
      url: getBaseUrl() + '/admin/database-backups/upload',
      data: formData,
      onUploadProgress(event) {
        progressFn?.(event.loaded / event.total);
      },
    });

    progressFn?.(1);

    return true;
  } catch (error) {
    handleError(error, $t('admin.maintenance_upload_backup_error'));
  } finally {
    progressFn?.(-1);
  }
};
