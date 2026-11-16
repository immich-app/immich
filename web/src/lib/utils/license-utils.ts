import type { ImmichProduct } from '#lib/constants.ts';
import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { executeMutation, readPreloadedQuery } from '#lib/queries/client.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { setServerLicenseMutation } from '#lib/queries/server-license.query.ts';
import { setUserLicenseMutation } from '#lib/queries/user.query.ts';
import { PUBLIC_IMMICH_BUY_HOST, PUBLIC_IMMICH_PAY_HOST } from '$app/env/public';

export const activateProduct = (licenseKey: string, activationKey: string, options?: { onSuccess?: () => void }) => {
  const isServerActivation = authManager.user.isAdmin && licenseKey.includes('IMSV');
  return executeMutation(
    isServerActivation ? setServerLicenseMutation : setUserLicenseMutation,
    [{ licenseKeyDto: { licenseKey, activationKey } }],
    options,
  );
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
