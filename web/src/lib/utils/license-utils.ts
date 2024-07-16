import { PUBLIC_IMMICH_BUY_HOST, PUBLIC_IMMICH_PAY_HOST } from '$env/static/public';
import type { ImmichLicense } from '$lib/constants';
import { serverConfig } from '$lib/stores/server-config.store';
import { setServerLicense, setUserLicense, type LicenseResponseDto } from '@immich/sdk';
import { get } from 'svelte/store';

export const activateLicense = async (licenseKey: string, activationKey: string): Promise<LicenseResponseDto> => {
  const isServerKey = licenseKey.search('IMSV') !== -1;
  const licenseKeyDto = { licenseKey, activationKey };
  return isServerKey ? setServerLicense({ licenseKeyDto }) : setUserLicense({ licenseKeyDto });
};

export const getActivationKey = async (licenseKey: string): Promise<string> => {
  const response = await fetch(new URL(`/api/v1/activate/${licenseKey}`, PUBLIC_IMMICH_PAY_HOST).href);
  if (!response.ok) {
    throw new Error('Failed to fetch activation key');
  }
  return response.text();
};

export const getLicenseLink = (license: ImmichLicense) => {
  const url = new URL('/', PUBLIC_IMMICH_BUY_HOST);
  url.searchParams.append('productId', license);
  url.searchParams.append('instanceUrl', get(serverConfig).externalDomain || window.origin);
  return url.href;
};
