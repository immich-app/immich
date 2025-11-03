import { AppRoute } from '$lib/constants';
import { init } from '$lib/utils/server';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch, url }) => {
  let error;
  try {
    const { maintenanceMode } = await init(fetch);
    if (maintenanceMode !== url.pathname.startsWith(AppRoute.MAINTENANCE)) {
      location.href = maintenanceMode ? AppRoute.MAINTENANCE : '/';
    }
  } catch (initError) {
    error = initError;
  }

  return {
    error,
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
