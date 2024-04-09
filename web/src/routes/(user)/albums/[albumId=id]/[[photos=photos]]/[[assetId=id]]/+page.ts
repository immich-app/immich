import { authenticate } from '$lib/utils/auth';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAlbumInfo } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();
  const [album, asset] = await Promise.all([
    getAlbumInfo({ id: params.albumId, withoutAssets: true }),
    getAssetInfoFromParam(params),
  ]);

  return {
    album,
    asset,
    meta: {
      title: album.albumName,
    },
  };
}) satisfies PageLoad;
