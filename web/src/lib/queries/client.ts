import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { getPublicConfigQuery } from '#lib/queries/config-public.query.ts';
import { getServerConfigQuery } from '#lib/queries/server-info.query.ts';
import { handleError } from '#lib/utils/handle-error.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { toastManager } from '@immich/ui';
import {
  createQuery,
  hashKey,
  MutationCache,
  mutationOptions,
  MutationObserver,
  QueryClient,
  type CreateMutationOptions,
  type DefaultError,
  type DefinedCreateQueryResult,
  type MutateOptions,
  type NonUndefinedGuard,
  type QueryKey,
  type UndefinedInitialDataOptions,
} from '@tanstack/svelte-query';
import { noop } from 'lodash-es';
import type { Translations } from 'svelte-i18n';

type ToastMeta =
  true | Translations | { color: 'primary' | 'success' | 'info' | 'warning' | 'danger'; description: Translations };

declare module '@tanstack/svelte-query' {
  interface Register {
    mutationMeta: {
      success?: { toast?: ToastMeta };
      error?: { toast?: Translations | false };
    };
  }
}

export class MutationCancelledError extends Error {
  constructor() {
    super('Mutation cancelled');
    this.name = 'MutationCancelledError';
  }
}

const createQueryClient = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
    mutationCache: new MutationCache({
      onSuccess: async (_data, _variables, _onMutateResult, { meta }) => {
        const toast = meta?.success?.toast;
        if (!toast) {
          return;
        }

        if (toast === true) {
          toastManager.primary();
          return;
        }

        const $t = await getFormatter();
        if (typeof toast === 'string') {
          toastManager.primary($t(toast));
          return;
        }

        toastManager[toast.color]($t(toast.description));
      },
      onError: async (error, _variables, _onMutateResult, { meta }) => {
        const toast = meta?.error?.toast;
        if (toast === false || error instanceof MutationCancelledError) {
          return;
        }

        const $t = await getFormatter();
        handleError(error, $t(toast ?? 'errors.something_went_wrong'));
      },
    }),
  });

  const publicQueryHashes = new Set(
    [getServerConfigQuery(), getPublicConfigQuery()].map(({ queryKey }) => hashKey(queryKey)),
  );
  eventManager.on({
    AuthLogout: () => {
      client.removeQueries({ predicate: ({ queryHash }) => !publicQueryHashes.has(queryHash) });
      client.getMutationCache().clear();
    },
  });

  return client;
};

export const queryClient = createQueryClient();

export const asMutation = <TArgs extends unknown[], TData, TError = DefaultError, TOnMutateResult = unknown>(
  fn: (...args: TArgs) => Promise<TData>,
  options?: Omit<CreateMutationOptions<TData, TError, TArgs, TOnMutateResult>, 'mutationFn' | 'mutationKey'>,
) => mutationOptions({ ...options, mutationFn: (args: TArgs) => fn(...args) });

const getPreloadedData = <TQueryFnData>(queryKey: QueryKey) => {
  const data = queryClient.getQueryData<TQueryFnData, QueryKey, NonUndefinedGuard<TQueryFnData>>(queryKey);
  if (data === undefined) {
    const error = new Error(`${queryKey.join('/')} must be loaded first`);
    console.error(error);
    throw error;
  }

  return data;
};

export const readPreloadedQuery = <TQueryFnData, TError, TData, TQueryKey extends QueryKey>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): TData => {
  const data = getPreloadedData<TQueryFnData>(options.queryKey);
  return options.select ? options.select(data) : (data as unknown as TData);
};

export const createPreloadedQuery = <TQueryFnData, TError, TData, TQueryKey extends QueryKey>(
  optionsFn: () => UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedCreateQueryResult<TData, TError> =>
  createQuery(
    () => {
      const options = optionsFn();
      return { ...options, initialData: getPreloadedData<TQueryFnData>(options.queryKey) };
    },
    () => queryClient,
  );

type MutationArgs<TData, TError, TVariables, TOnMutateResult> = TVariables extends void
  ? [variables?: TVariables, mutateOptions?: MutateOptions<TData, TError, TVariables, TOnMutateResult>]
  : [variables: TVariables, mutateOptions?: MutateOptions<TData, TError, TVariables, TOnMutateResult>];

export const executeMutation = <TData, TError, TVariables, TOnMutateResult>(
  options: () => CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  ...[variables, mutateOptions]: MutationArgs<TData, TError, TVariables, TOnMutateResult>
) => {
  const observer = new MutationObserver(queryClient, options());
  const unsubscribe = observer.subscribe(noop);
  return observer
    .mutate(variables as TVariables, mutateOptions)
    .catch(noop)
    .finally(unsubscribe);
};
