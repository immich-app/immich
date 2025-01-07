import { PUBLIC_IMMICH_BUY_HOST, PUBLIC_IMMICH_PAY_HOST } from '$env/static/public';
import type { ImmichProduct } from '$lib/constants';
import { serverConfig } from '$lib/stores/server-config.store';
import { setServerLicense, setUserLicense, type LicenseResponseDto } from '@immich/sdk';
import { get } from 'svelte/store';
import { loadUser } from './auth';

export const activateProduct = async (licenseKey: string, activationKey: string): Promise<LicenseResponseDto> => {
  // Send server key to user activation if user is not admin
  const user = await loadUser();
  const isServerActivation = user?.isAdmin && licenseKey.search('IMSV') !== -1;
  const licenseKeyDto = { licenseKey, activationKey };
  return isServerActivation ? setServerLicense({ licenseKeyDto }) : setUserLicense({ licenseKeyDto });
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
  url.searchParams.append('instanceUrl', get(serverConfig).externalDomain || globalThis.origin);
  return url.href;
};
