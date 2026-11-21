import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { asMutation, queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import { createStack, deleteStacks, getStack, removeAssetFromStack, updateStack } from '@immich/sdk';
import { queryOptions, type MutationMeta } from '@tanstack/svelte-query';

export const getStackQuery = (id: string) =>
  queryOptions({
    queryKey: QueryKeys.stack({ id }),
    queryFn: ({ signal }) => getStack({ id }, { signal }),
  });

export const createStackMutation = () =>
  asMutation(createStack, {
    onSuccess: (stack) => {
      queryClient.setQueryData(getStackQuery(stack.id).queryKey, stack);
      eventManager.emit('StackCreate', stack);
    },
    meta: { error: { toast: 'errors.failed_to_stack_assets' } },
  });

export const updateStackMutation = () =>
  asMutation(updateStack, {
    onSuccess: (stack) => {
      queryClient.setQueryData(getStackQuery(stack.id).queryKey, stack);
      eventManager.emit('StackUpdate', stack);
    },
    meta: { error: { toast: 'errors.something_went_wrong' } },
  });

export const removeAssetFromStackMutation = () =>
  asMutation(removeAssetFromStack, {
    onSuccess: (_, [{ id }]) => queryClient.invalidateQueries({ queryKey: QueryKeys.stack({ id }) }),
    meta: { success: { toast: 'removed_from_stack' }, error: { toast: 'errors.failed_to_unstack_assets' } },
  });

export const deleteStacksMutation = (meta?: MutationMeta) =>
  asMutation(deleteStacks, {
    onSuccess: (_, [{ bulkIdsDto }]) => {
      for (const id of bulkIdsDto.ids) {
        queryClient.removeQueries({ queryKey: QueryKeys.stack({ id }) });
      }
    },
    meta: meta ?? { error: { toast: 'errors.failed_to_unstack_assets' } },
  });
