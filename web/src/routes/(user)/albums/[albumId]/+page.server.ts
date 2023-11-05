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
    let namedPeoples: any[] = [],
      unNamedPeoples: any[] = [];

    for (const p of albumPeoples) {
      p.name.length ? namedPeoples.push(p) : unNamedPeoples.push(p);
    }

    namedPeoples.sort((a, b) => b.appears - a.appears || a.name.localeCompare(b.name));
    unNamedPeoples.sort((a, b) => b.appears - a.appears);

    return {
      album,
      user,
      namedPeoples,
      unNamedPeoples,
      meta: {
        title: album.albumName,
      },
    };
  } catch (e) {
    throw redirect(302, AppRoute.ALBUMS);
  }
}) satisfies PageServerLoad;
