import { asMutation } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import {
  detectPriorInstall,
  getMaintenanceStatus,
  isHttpError,
  isMalformedResponseError,
  maintenanceLogin,
  setMaintenanceMode,
} from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getMaintenanceStatusQuery = () =>
  queryOptions({
    queryKey: QueryKeys.maintenanceStatus(),
    queryFn: ({ signal }) => getMaintenanceStatus({ signal }),
    retry: (_, error) => (isHttpError(error) || isMalformedResponseError(error)) && error.status >= 500,
    retryDelay: 1000,
    networkMode: 'always',
  });

export const detectPriorInstallQuery = () =>
  queryOptions({
    queryKey: QueryKeys.maintenancePriorInstall(),
    queryFn: ({ signal }) => detectPriorInstall({ signal }),
    staleTime: 0,
  });

export const maintenanceLoginMutation = () => asMutation(maintenanceLogin, { meta: { error: { toast: false } } });

export const setMaintenanceModeMutation = () =>
  asMutation(setMaintenanceMode, { meta: { error: { toast: 'admin.maintenance_start_error' } } });
