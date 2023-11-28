import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const user = await authenticate();
  const { data: album } = await api.albumApi.getAlbumInfo({ id: params.albumId, withoutAssets: true });

  return {
    album,
    user,
    meta: {
      title: album.albumName,
    },
  };
}) satisfies PageLoad;
