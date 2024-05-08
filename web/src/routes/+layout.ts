import { defaults } from '@immich/sdk';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (({ fetch }) => {
  // set event.fetch on the fetch-client used by @immich/sdk
  // https://kit.svelte.dev/docs/load#making-fetch-requests
  // https://github.com/oazapfts/oazapfts/blob/main/README.md#fetch-options
  defaults.fetch = fetch;

  return {
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
