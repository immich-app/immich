import { init } from '$lib/utils/server';
import { commandPaletteManager } from '@immich/ui';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch }) => {
  let error;
  try {
    await init(fetch);
  } catch (initError) {
    error = initError;
  }

  commandPaletteManager.enable();

  return {
    error,
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
