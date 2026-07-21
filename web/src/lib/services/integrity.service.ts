import { createJob, deleteIntegrityReport, IntegrityReport, ManualJobName } from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiDownload, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { goto } from '$app/navigation';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { Route } from '$lib/route';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';

export const getIntegrityReportActions = ($t: MessageFormatter, reportType: IntegrityReport) => {
  const Download: ActionItem = {
    title: $t('admin.download_csv'),
    icon: mdiDownload,
    onAction: () => goto(Route.integrityReportCsv(reportType)),
  };

  const Delete: ActionItem = {
    title: $t('trash_page_delete_all'),
    icon: mdiTrashCanOutline,
    color: 'danger',
    onAction: () => handleRemoveAllIntegrityReportItems(reportType),
  };

  return { Download, Delete };
};

export const getIntegrityReportItemActions = ($t: MessageFormatter, reportId: string, reportType: IntegrityReport) => {
  const Download: ActionItem = {
    title: $t('download'),
    icon: mdiDownload,
    onAction: () => goto(Route.integrityReportFile(reportId)),
    $if: () => reportType === IntegrityReport.UntrackedFile || reportType === IntegrityReport.ChecksumMismatch,
  };

  const Delete: ActionItem = {
    title: $t('delete'),
    icon: mdiTrashCanOutline,
    color: 'danger',
    onAction: () => handleRemoveIntegrityReportItem(reportId),
  };

  return { Download, Delete };
};

export const handleRemoveAllIntegrityReportItems = async (reportType: IntegrityReport) => {
  const $t = await getFormatter();
  const confirm = await modalManager.showDialog({
    confirmText: $t('delete'),
  });

  if (!confirm) {
    return;
  }

  let name: ManualJobName;
  switch (reportType) {
    case IntegrityReport.UntrackedFile: {
      name = ManualJobName.IntegrityUntrackedFilesDeleteAll;
      break;
    }
    case IntegrityReport.MissingFile: {
      name = ManualJobName.IntegrityMissingFilesDeleteAll;
      break;
    }
    case IntegrityReport.ChecksumMismatch: {
      name = ManualJobName.IntegrityChecksumMismatchDeleteAll;
      break;
    }
  }

  try {
    eventManager.emit('IntegrityReportDeleteStatus', {
      type: reportType,
      isDeleting: true,
    });

    await createJob({ jobCreateDto: { name } });
    toastManager.success($t('admin.job_created'));

    eventManager.emit('IntegrityReportDeleted', {
      type: reportType,
    });
  } catch (error) {
    handleError(error, $t('failed_to_delete_file'));

    eventManager.emit('IntegrityReportDeleteStatus', {
      type: reportType,
      isDeleting: false,
    });
  }
};

export const handleRemoveIntegrityReportItem = async (reportId: string) => {
  const $t = await getFormatter();
  const confirm = await modalManager.showDialog({
    confirmText: $t('delete'),
  });

  if (!confirm) {
    return;
  }

  try {
    eventManager.emit('IntegrityReportDeleteStatus', {
      id: reportId,
      isDeleting: true,
    });

    await deleteIntegrityReport({
      id: reportId,
    });

    eventManager.emit('IntegrityReportDeleted', {
      id: reportId,
    });
  } catch (error) {
    handleError(error, $t('failed_to_delete_file'));

    eventManager.emit('IntegrityReportDeleteStatus', {
      id: reportId,
      isDeleting: false,
    });
  }
};
