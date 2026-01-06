import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { deleteDatabaseBackup, MaintenanceAction, setMaintenanceMode } from '@immich/sdk';
import { modalManager } from '@immich/ui';

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
