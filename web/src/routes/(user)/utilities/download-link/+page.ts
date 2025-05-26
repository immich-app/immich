import { getAboutInfo } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  const { version } = await getAboutInfo();
  return {
    version,
  };
}) satisfies PageLoad;
