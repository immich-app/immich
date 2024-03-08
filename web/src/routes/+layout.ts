import type { LayoutLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (() => {
  return {
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
