import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { PersonResponseDto } from '../../../../api';

export const load = (async ({ params, locals: { api, user } }) => {
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  try {
    const { data: album } = await api.albumApi.getAlbumInfo({ id: params.albumId });

    let albumPersons: any[] = [];
    if (album.assets.length) {
      for await (const asset of album.assets) {
        const { data } = await api.assetApi.getAssetById({ id: asset.id, key: api.getKey() });
        if (data.people?.length) {
          for (const people of data.people) {
            if (!albumPersons.map((p) => p.id).includes(people.id)) {
              albumPersons.push(people);
            }
          }
        }
      }
    }

    return {
      album,
      user,
      albumPersons,
      meta: {
        title: album.albumName,
      },
    };
  } catch (e) {
    throw redirect(302, AppRoute.ALBUMS);
  }
}) satisfies PageServerLoad;
