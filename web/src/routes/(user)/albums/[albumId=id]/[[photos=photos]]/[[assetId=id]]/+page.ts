import { authenticate } from '$lib/utils/auth';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAlbumInfo, getGroupsForAlbum } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);
  const [album, groups, asset] = await Promise.all([
    getAlbumInfo({ id: params.albumId, withoutAssets: true }),
    getGroupsForAlbum({ id: params.albumId }),
    getAssetInfoFromParam(params),
  ]);

  return {
    album,
    groups,
    asset,
    meta: {
      title: album.albumName,
    },
  };
}) satisfies PageLoad;
