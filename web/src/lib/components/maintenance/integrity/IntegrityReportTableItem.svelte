<script lang="ts">
  import { integrityReportDeleteAllJobs, isDeletingIntegrityReport } from '#lib/queries/integrity-admin.query.ts';
  import { isCreatingJob } from '#lib/queries/queue.query.ts';
  import { getIntegrityReportItemActions } from '#lib/services/integrity.service.ts';
  import type { IntegrityReport } from '@immich/sdk';
  import { ContextMenuButton, TableCell, TableRow } from '@immich/ui';
  import { useIsMutating } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  type Props = {
    id: string;
    path: string;
    reportType: IntegrityReport;
  };

  let { id, path, reportType }: Props = $props();

  const { Download, Delete } = $derived(getIntegrityReportItemActions($t, id, reportType));
  const deleting = useIsMutating(isDeletingIntegrityReport(id));
  const deletingAll = useIsMutating(isCreatingJob(integrityReportDeleteAllJobs[reportType]));
</script>

<TableRow>
  <TableCell class="w-7/8 px-4 text-left">{path}</TableCell>
  <TableCell class="flex w-1/8 justify-end">
    <ContextMenuButton
      disabled={deleting.current + deletingAll.current > 0}
      position="top-right"
      aria-label={$t('open')}
      items={[Download, Delete]}
    />
  </TableCell>
</TableRow>
