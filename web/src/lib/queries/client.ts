import { toastManager } from '@immich/ui';
import {
  createQuery,
  MutationCache,
  mutationOptions,
  MutationObserver,
  QueryClient,
  type CreateMutationOptions,
  type DataTag,
  type DefaultError,
  type DefinedCreateQueryResult,
  type MutateOptions,
  type NonUndefinedGuard,
  type QueryKey,
  type UndefinedInitialDataOptions,
} from '@tanstack/svelte-query';
import { noop } from 'lodash-es';
import type { Translations } from 'svelte-i18n';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';

type ToastMeta =
  true | Translations | { color: 'primary' | 'success' | 'info' | 'warning' | 'danger'; description: Translations };

declare module '@tanstack/svelte-query' {
  interface Register {
    mutationMeta: {
      success?: { toast?: ToastMeta };
      error?: { toast?: Translations };
    };
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
        const $t = await getFormatter();
        handleError(error, $t(meta?.error?.toast ?? 'errors.something_went_wrong'));
      },
    }),
  });

  eventManager.on({ AuthLogout: () => client.clear() });

  return client;
};

export const queryClient = createQueryClient();

export const asMutation = <TArgs extends unknown[], TData, TError = DefaultError, TOnMutateResult = unknown>(
  fn: (...args: TArgs) => Promise<TData>,
  options?: Omit<CreateMutationOptions<TData, TError, TArgs, TOnMutateResult>, 'mutationFn' | 'mutationKey'>,
) => mutationOptions({ ...options, mutationFn: (args: TArgs) => fn(...args) });

export const createPreloadedQuery = <
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  optionsFn: () => UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
    queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
  },
): DefinedCreateQueryResult<TData, TError> =>
  createQuery(() => {
    const options = optionsFn();
    const initialData = queryClient.getQueryData<TQueryFnData, TQueryKey, NonUndefinedGuard<TQueryFnData>>(
      options.queryKey,
    );
    if (initialData === undefined) {
      throw new Error(`${options.queryKey.join('/')} must be loaded first`);
    }

    return { ...options, initialData };
  });

type MutationArgs<TData, TError, TVariables, TContext> = TVariables extends void
  ? [variables?: TVariables, mutateOptions?: MutateOptions<TData, TError, TVariables, TContext>]
  : [variables: TVariables, mutateOptions?: MutateOptions<TData, TError, TVariables, TContext>];

export const executeMutation = <TData, TError, TVariables, TContext>(
  options: () => CreateMutationOptions<TData, TError, TVariables, TContext>,
  ...[variables, mutateOptions]: MutationArgs<TData, TError, TVariables, TContext>
) => {
  const observer = new MutationObserver(queryClient, options());
  const unsubscribe = observer.subscribe(noop);
  return observer
    .mutate(variables as TVariables, mutateOptions)
    .catch(noop)
    .finally(unsubscribe);
};
