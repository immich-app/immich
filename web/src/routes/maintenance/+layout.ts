import { init } from '$lib/utils/server';
import type { LayoutLoad } from '../$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch }) => {
  let error;
  try {
    const { maintenanceMode } = await init(fetch);
    if (!maintenanceMode) {
      location.href = '/';
    }
  } catch (initError) {
    error = initError;
  }

  return {
    error: false,
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
