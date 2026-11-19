import type { ImmichProduct } from '#lib/constants.ts';
import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { executeMutation, readPreloadedQuery } from '#lib/queries/client.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { setServerLicenseMutation } from '#lib/queries/server-license.query.ts';
import { setUserLicenseMutation } from '#lib/queries/user.query.ts';
import type { MutationMeta } from '@tanstack/svelte-query';
import { PUBLIC_IMMICH_BUY_HOST, PUBLIC_IMMICH_PAY_HOST } from '$app/env/public';

type ActivateProductOptions = { meta?: MutationMeta; onSuccess?: () => void };

export const activateProduct = (
  licenseKey: string,
  activationKey: string,
  { meta, onSuccess }: ActivateProductOptions = {},
) => {
  const isServerActivation = authManager.user.isAdmin && licenseKey.includes('IMSV');
  const setLicenseMutation = isServerActivation ? setServerLicenseMutation : setUserLicenseMutation;
  return executeMutation(() => setLicenseMutation(meta), [{ licenseKeyDto: { licenseKey, activationKey } }], {
    onSuccess,
  });
};

export const getActivationKey = async (licenseKey: string): Promise<string> => {
  const response = await fetch(new URL(`/api/v1/activate/${licenseKey}`, PUBLIC_IMMICH_PAY_HOST).href);
  if (!response.ok) {
    throw new Error('Failed to fetch activation key');
  }
  return response.text();
};

export const getLicenseLink = (license: ImmichProduct) => {
  const url = new URL('/', PUBLIC_IMMICH_BUY_HOST);
  url.searchParams.append('productId', license);
  url.searchParams.append(
    'instanceUrl',
    readPreloadedQuery(getUserConfigQuery()).server.externalDomain || globalThis.origin,
  );
  return url.href;
};
