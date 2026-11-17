import { asMutation, queryClient } from '#lib/queries/client.ts';
import {
  IntegrityReport,
  ManualJobName,
  deleteIntegrityReport,
  getIntegrityReport,
  getIntegrityReportSummary,
  type IntegrityReportResponseDto,
} from '@immich/sdk';
import { infiniteQueryOptions, queryOptions, type InfiniteData, type MutationFilters } from '@tanstack/svelte-query';

const integrityReportsQueryKey = ['integrity-reports'];

export const integrityReportDeleteAllJobs: Record<IntegrityReport, ManualJobName> = {
  [IntegrityReport.UntrackedFile]: ManualJobName.IntegrityUntrackedFilesDeleteAll,
  [IntegrityReport.MissingFile]: ManualJobName.IntegrityMissingFilesDeleteAll,
  [IntegrityReport.ChecksumMismatch]: ManualJobName.IntegrityChecksumMismatchDeleteAll,
};

export const getIntegrityReportSummaryQuery = () =>
  queryOptions({
    queryKey: ['integrity-report-summary'],
    queryFn: ({ signal }) => getIntegrityReportSummary({ signal }),
    staleTime: 0,
  });

export const getIntegrityReportQuery = (type: IntegrityReport) =>
  infiniteQueryOptions({
    queryKey: [...integrityReportsQueryKey, type],
    queryFn: ({ pageParam, signal }) => getIntegrityReport({ $type: type, cursor: pageParam }, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: ({ nextCursor }) => nextCursor,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

export const clearIntegrityReport = (type: IntegrityReport) =>
  queryClient.setQueryData(getIntegrityReportQuery(type).queryKey, { pages: [{ items: [] }], pageParams: [undefined] });

const deleteIntegrityReportMutationKey = [...integrityReportsQueryKey, 'delete'];

export const isDeletingIntegrityReport = (id: string): MutationFilters => ({
  mutationKey: deleteIntegrityReportMutationKey,
  predicate: ({ state }) => {
    const [{ id: deletingId }] = state.variables as Parameters<typeof deleteIntegrityReport>;
    return deletingId === id;
  },
});

export const deleteIntegrityReportMutation = () =>
  asMutation(deleteIntegrityReport, {
    mutationKey: deleteIntegrityReportMutationKey,
    onSuccess: (_, [{ id }]) =>
      queryClient.setQueriesData<InfiniteData<IntegrityReportResponseDto>>(
        { queryKey: integrityReportsQueryKey },
        (report) =>
          report && {
            ...report,
            pages: report.pages.map((page) => ({ ...page, items: page.items.filter((item) => item.id !== id) })),
          },
      ),
    meta: { error: { toast: 'failed_to_delete_file' } },
  });
