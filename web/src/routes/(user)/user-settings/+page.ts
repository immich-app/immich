import { authenticate } from '$lib/utils/auth';
import { getApiKeys, getAuthDevices } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();

  const keys = await getApiKeys();
  const devices = await getAuthDevices();

  return {
    keys,
    devices,
    meta: {
      title: 'Settings',
    },
  };
}) satisfies PageLoad;
