import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  const user = await authenticate();
  const { data: albums } = await api.albumApi.getAllAlbums();

  return {
    user,
    albums,
    meta: {
      title: 'Albums',
    },
  };
}) satisfies PageLoad;
