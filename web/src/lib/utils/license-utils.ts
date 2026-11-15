import type { ImmichProduct } from '#lib/constants.ts';
import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { queryClient, readPreloadedQuery } from '#lib/queries/client.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { getAboutInfoQuery } from '#lib/queries/server-info.query.ts';
import { setServerLicense, setUserLicense, type LicenseResponseDto } from '@immich/sdk';
import { PUBLIC_IMMICH_BUY_HOST, PUBLIC_IMMICH_PAY_HOST } from '$app/env/public';

export const activateProduct = async (licenseKey: string, activationKey: string): Promise<LicenseResponseDto> => {
  // TODO is this needed?
  await authManager.load();

  const isServerActivation = authManager.user.isAdmin && licenseKey.search('IMSV') !== -1;
  const licenseKeyDto = { licenseKey, activationKey };
  // Send server key to user activation if user is not admin
  if (!isServerActivation) {
    return setUserLicense({ licenseKeyDto });
  }

  const license = await setServerLicense({ licenseKeyDto });
  // contains license status
  await queryClient.invalidateQueries({ queryKey: getAboutInfoQuery().queryKey });
  return license;
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
