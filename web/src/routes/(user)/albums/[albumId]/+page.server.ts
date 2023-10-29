import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals: { api, user } }) => {
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  try {
    const { data: album } = await api.albumApi.getAlbumInfo({ id: params.albumId });

    let albumPeoples: any[] = [];
    if (album.assets.length) {
      for await (const asset of album.assets) {
        const { data } = await api.assetApi.getAssetById({ id: asset.id, key: api.getKey() });
        if (data.people?.length) {
          for (const people of data.people) {
            if (!albumPeoples.map((p) => p.id).includes(people.id)) {
              albumPeoples.push({ ...people, appears: 1 });
            } else {
              let existPeopleInd = albumPeoples.findIndex((p) => p.id === people.id);
              albumPeoples[existPeopleInd].appears = albumPeoples[existPeopleInd].appears + 1;
            }
          }
        }
      }
    }

    albumPeoples.sort((a, b) => {
      if (b.appears !== a.appears) {
        return b.appears - a.appears;
      }
      if (a.name === '') {
        return 1;
      } else if (b.name === '') {
        return -1;
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    return {
      album,
      user,
      albumPeoples,
      meta: {
        title: album.albumName,
      },
    };
  } catch (e) {
    throw redirect(302, AppRoute.ALBUMS);
  }
}) satisfies PageServerLoad;
