import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals: { api, user } }) => {
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  try {
    const { data: album } = await api.albumApi.getAlbumInfo({ id: params.albumId, withoutAssets: true });

    return {
      album,
      user,
      meta: {
        title: album.albumName,
      },
    };
  } catch (e) {
    throw redirect(302, AppRoute.ALBUMS);
  }
}) satisfies PageServerLoad;
