import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();

  const { data: keys } = await api.keyApi.getApiKeys();
  const { data: devices } = await api.authenticationApi.getAuthDevices();

  return {
    keys,
    devices,
    meta: {
      title: 'Settings',
    },
  };
}) satisfies PageLoad;
