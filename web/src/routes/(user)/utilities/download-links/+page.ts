import { getAboutInfo } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  // we do this before the page loads because the page is useless otherwise
  const { version } = await getAboutInfo();
  return {
    version,
  };
}) satisfies PageLoad;
