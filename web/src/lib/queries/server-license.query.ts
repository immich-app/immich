import { asMutation, queryClient } from '#lib/queries/client.ts';
import { getAboutInfoQuery } from '#lib/queries/server-info.query.ts';
import { deleteServerLicense, getServerLicense, isHttpError, setServerLicense } from '@immich/sdk';
import { queryOptions, type MutationMeta } from '@tanstack/svelte-query';

export const getServerLicenseQuery = () =>
  queryOptions({
    queryKey: ['server', 'license'],
    queryFn: ({ signal }) =>
      getServerLicense({ signal }).catch((error: unknown) => {
        if (isHttpError(error) && error.status === 404) {
          return null;
        }
        throw error;
      }),
  });

export const setServerLicenseMutation = (meta?: MutationMeta) =>
  asMutation(setServerLicense, {
    onSuccess: (license) => {
      queryClient.setQueryData(getServerLicenseQuery().queryKey, license);
      updateLicensedCache(true);
    },
    meta: meta ?? { error: { toast: 'purchase_failed_activation' } },
  });

export const deleteServerLicenseMutation = () =>
  asMutation(deleteServerLicense, {
    onSuccess: () => {
      queryClient.setQueryData(getServerLicenseQuery().queryKey, null);
      updateLicensedCache(false);
    },
    meta: { error: { toast: 'errors.failed_to_remove_product_key' } },
  });

const updateLicensedCache = (licensed: boolean) =>
  queryClient.setQueryData(getAboutInfoQuery().queryKey, (about) => about && { ...about, licensed });
