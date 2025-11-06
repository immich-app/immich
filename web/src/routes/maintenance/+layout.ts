import { init } from '$lib/utils/server';
import type { LayoutLoad } from '../$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch }) => {
  try {
    const { maintenanceMode } = await init(fetch);
    if (!maintenanceMode) {
      location.href = '/';
    }
  } catch (initError) {
    void initError;
  }

  return {
    error: false,
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
