import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const { data: sharedAlbums } = await api.albumApi.getAllAlbums({ shared: true });
  const { data: partners } = await api.partnerApi.getPartners({ direction: 'shared-with' });

  return {
    sharedAlbums,
    partners,
    meta: {
      title: 'Sharing',
    },
  };
}) satisfies PageLoad;
