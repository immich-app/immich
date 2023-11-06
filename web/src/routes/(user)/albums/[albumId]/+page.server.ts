import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { PeopleForAlbumResponseDto } from '../../../../api';

export const load = (async ({ params, locals: { api, user } }) => {
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  try {
    const { data: album } = await api.albumApi.getAlbumInfo({ id: params.albumId });
    const { data: peoples } = await api.albumApi.getAlbumPeople({ id: params.albumId });

    let namedPeoples: PeopleForAlbumResponseDto[] = [],
      unNamedPeoples: PeopleForAlbumResponseDto[] = [];

    for (const p of peoples) {
      p.personName.length ? namedPeoples.push(p) : unNamedPeoples.push(p);
    }

    namedPeoples.sort((a, b) => b.albumCount - a.albumCount || a.personName.localeCompare(b.personName));
    unNamedPeoples.sort((a, b) => b.albumCount - a.albumCount);

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
