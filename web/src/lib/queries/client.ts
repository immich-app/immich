import {
  createQuery,
  QueryClient,
  type CreateMutationOptions,
  type DataTag,
  type DefaultError,
  type DefinedCreateQueryResult,
  type NonUndefinedGuard,
  type QueryKey,
  type UndefinedInitialDataOptions,
} from '@tanstack/svelte-query';
import { noop } from 'lodash-es';
import { eventManager } from '$lib/managers/event-manager.svelte';

const createQueryClient = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  eventManager.on({ AuthLogout: () => client.clear() });

  return client;
};

export const queryClient = createQueryClient();

export const createDefinedQuery = <TQueryFnData, TError = DefaultError, TQueryKey extends QueryKey = QueryKey>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TQueryFnData, TQueryKey> & {
    queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
  },
): DefinedCreateQueryResult<TQueryFnData, TError> => {
  const initialData = queryClient.getQueryData<TQueryFnData, TQueryKey, NonUndefinedGuard<TQueryFnData>>(
    options.queryKey,
  );
  if (initialData === undefined) {
    throw new Error(`${options.queryKey.join('/')} must be loaded first`);
  }

  return createQuery(() => ({ ...options, initialData }));
};

export const executeMutation = <TData, TError, TVariables, TContext>(
  options: CreateMutationOptions<TData, TError, TVariables, TContext>,
  variables: TVariables,
) => queryClient.getMutationCache().build(queryClient, options).execute(variables).catch(noop);
