<script lang="ts">
  import { getIntegrityReportItemActions } from '#lib/services/integrity.service.ts';
  import type { IntegrityReport } from '@immich/sdk';
  import { ContextMenuButton, TableCell, TableRow } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    id: string;
    path: string;
    reportType: IntegrityReport;
  };

  let { id, path, reportType }: Props = $props();

  const { Download, Delete } = $derived(getIntegrityReportItemActions($t, id, reportType));
</script>

<TableRow>
  <TableCell class="w-7/8 px-4 text-left">{path}</TableCell>
  <TableCell class="flex w-1/8 justify-end">
    <ContextMenuButton position="top-right" aria-label={$t('open')} items={[Download, Delete]} />
  </TableCell>
</TableRow>
