import { getAboutInfo } from '@immich/sdk';
import type { PageServerLoad } from './$types';
export const ssr = true;
export const csr = false;
export const load = (async () => {
  // we do this before the page loads because the page is useless otherwise
  const { version } = await getAboutInfo();
  return {
    version,
  };
}) satisfies PageServerLoad;
