import { executeMutation } from '#lib/queries/client.ts';
import {
  clearIntegrityReport,
  deleteIntegrityReportMutation,
  integrityReportDeleteAllJobs,
} from '#lib/queries/integrity-admin.query.ts';
import { createJobMutation } from '#lib/queries/queue.query.ts';
import { ApiRoute } from '#lib/route.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { IntegrityReport } from '@immich/sdk';
import type { ActionItem } from '@immich/ui';
import { mdiDownload, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getIntegrityReportActions = ($t: MessageFormatter, reportType: IntegrityReport) => {
  const Download: ActionItem = {
    title: $t('admin.download_csv'),
    icon: mdiDownload,
    onAction: () => location.assign(ApiRoute.integrityReportCsv(reportType)),
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
    onAction: () => location.assign(ApiRoute.integrityReportFile(reportId)),
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

const handleRemoveAllIntegrityReportItems = async (reportType: IntegrityReport) => {
  const $t = await getFormatter();

  await executeMutation(
    () =>
      createJobMutation({
        success: { toast: { color: 'success', description: 'admin.job_created' } },
        error: { toast: 'failed_to_delete_file' },
      }),
    [{ jobCreateDto: { name: integrityReportDeleteAllJobs[reportType] } }],
    { confirm: { confirmText: $t('delete') }, onSuccess: () => clearIntegrityReport(reportType) },
  );
};

const handleRemoveIntegrityReportItem = async (reportId: string) => {
  const $t = await getFormatter();

  await executeMutation(deleteIntegrityReportMutation, [{ id: reportId }], { confirm: { confirmText: $t('delete') } });
};
