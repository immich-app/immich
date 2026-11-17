import { asMutation, queryClient } from '#lib/queries/client.ts';
import { deleteDuplicates, getAssetDuplicates, resolveDuplicates } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getAssetDuplicatesQuery = () =>
  queryOptions({
    queryKey: ['duplicates'],
    queryFn: ({ signal }) => getAssetDuplicates({ signal }),
  });

export const removeDuplicateGroups = (ids: string[]) => {
  const removed = new Set(ids);
  queryClient.setQueryData(getAssetDuplicatesQuery().queryKey, (duplicates) =>
    duplicates?.filter(({ duplicateId }) => !removed.has(duplicateId)),
  );
};

export const resolveDuplicatesMutation = () =>
  asMutation(resolveDuplicates, {
    onSuccess: (results) => removeDuplicateGroups(results.filter(({ success }) => success).map(({ id }) => id)),
    meta: { error: { toast: 'errors.unable_to_resolve_duplicate' } },
  });

export const deleteDuplicatesMutation = () =>
  asMutation(deleteDuplicates, {
    onSuccess: (_, [{ bulkIdsDto }]) => removeDuplicateGroups(bulkIdsDto.ids),
    meta: { success: { toast: 'resolved_all_duplicates' }, error: { toast: 'errors.unable_to_resolve_duplicate' } },
  });
