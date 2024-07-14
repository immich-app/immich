import { page } from '$app/stores';
import { getServerConfig, setServerLicense, setUserLicense, type LicenseResponseDto } from '@immich/sdk';
import { get } from 'svelte/store';

const PAYMENT_URL =
  process.env.NODE_ENV == 'development'
    ? 'https://futopay-test.azurewebsites.net/api/v1/activate/'
    : 'https://pay.futo.org/api/v1/activate/';

export async function activateLicense(licenseKey: string): Promise<LicenseResponseDto> {
  const isServerKey = licenseKey.search('IMSV') !== -1;
  const activationKey = await _getActivationKey(licenseKey);

  if (isServerKey) {
    return await setServerLicense({ licenseKeyDto: { licenseKey, activationKey } });
  } else {
    return await setUserLicense({ licenseKeyDto: { licenseKey, activationKey } });
  }
}

async function _getActivationKey(licenseKey: string): Promise<string> {
  // const testUrl = 'https://futopay-test.azurewebsites.net/api/v1/activate/IMCL-TQKF-B2PP-YM9B-D5XD-MNT2-9V2X-YF1N-NNTF';
  const response = await fetch(PAYMENT_URL + licenseKey);

  if (!response.ok) {
    throw new Error('Failed to fetch activation key');
  }

  const data = await response.text();

  return data;
}

export async function getProductLink(origin: string, type: 'immich-server' | 'immich-client'): Promise<string> {
  let baseUrl = origin;
  const buyWebsiteUrl = new URL('http://10.1.15.216:5173');

  if (buyWebsiteUrl.hostname !== 'https://buy.immich.app') {
    console.warn('CHANGE buyWebsiteUrl THIS IN PRODUCTION');
  }

  const { externalDomain } = await getServerConfig();
  if (externalDomain !== '') {
    baseUrl = externalDomain;
  }

  buyWebsiteUrl.searchParams.append('productId', type);
  buyWebsiteUrl.searchParams.append('instanceUrl', baseUrl);

  return buyWebsiteUrl.href;
}
