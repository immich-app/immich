import { authenticate } from '$lib/utils/auth';
import { getAlbumInfo, getAllPeople } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();
  const album = await getAlbumInfo({ id: params.albumId, withoutAssets: true });
  const people = await getAllPeople({ withHidden: true });

  return {
    album,
    people,
    meta: {
      title: album.albumName,
    },
  };
}) satisfies PageLoad;
