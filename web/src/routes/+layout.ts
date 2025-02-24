import { init } from '$lib/utils/server';
import type { LayoutLoad } from './$types';


export const load = (async ({ fetch }) => {
  let error;
  try {
    await init(fetch);
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
