import { eventManager } from '$lib/managers/event-manager.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { createJob, deleteIntegrityReport, getBaseUrl, IntegrityReportType, ManualJobName } from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiDownload, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getIntegrityReportActions = ($t: MessageFormatter, reportType: IntegrityReportType) => {
  const Download: ActionItem = {
    type: $t('command'),
    title: $t('admin.download_csv'),
    icon: mdiDownload,
    onAction: () => {
      handleDownloadIntegrityReportCsv(reportType);
    },
  };

  const Delete: ActionItem = {
    type: $t('command'),
    title: $t('trash_page_delete_all'),
    icon: mdiTrashCanOutline,
    color: 'danger',
    onAction: () => {
      void handleRemoveAllIntegrityReportItems(reportType);
    },
  };

  return { Download, Delete };
};

export const getIntegrityReportItemActions = (
  $t: MessageFormatter,
  reportId: string,
  reportType: IntegrityReportType,
) => {
  const Download = {
    title: $t('download'),
    icon: mdiDownload,
    onAction: () => {
      void handleDownloadIntegrityReportFile(reportId);
    },
    $if: reportType === IntegrityReportType.UntrackedFile || reportType === IntegrityReportType.ChecksumMismatch,
  };

  const Delete = {
    title: $t('delete'),
    icon: mdiTrashCanOutline,
    color: 'danger',
    onAction: () => {
      void handleRemoveIntegrityReportItem(reportId);
    },
  };

  return { Download, Delete };
};

export const handleDownloadIntegrityReportFile = (reportId: string) => {
  location.href = `${getBaseUrl()}/admin/integrity/report/${reportId}/file`;
};

export const handleDownloadIntegrityReportCsv = (reportType: IntegrityReportType) => {
  location.href = `${getBaseUrl()}/admin/integrity/report/${reportType}/csv`;
};

export const handleRemoveAllIntegrityReportItems = async (reportType: IntegrityReportType) => {
  const $t = await getFormatter();
  const confirm = await modalManager.showDialog({
    confirmText: $t('delete'),
  });

  if (!confirm) {
    return;
  }

  let name: ManualJobName;
  switch (reportType) {
    case IntegrityReportType.UntrackedFile: {
      name = ManualJobName.IntegrityUntrackedFilesDeleteAll;
      break;
    }
    case IntegrityReportType.MissingFile: {
      name = ManualJobName.IntegrityMissingFilesDeleteAll;
      break;
    }
    case IntegrityReportType.ChecksumMismatch: {
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
