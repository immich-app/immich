import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals: { api, user } }) => {
	if (!user) {
		throw redirect(302, AppRoute.AUTH_LOGIN);
	}

	const albumId = params['albumId'];

	try {
		const { data: album } = await api.albumApi.getAlbumInfo({ id: albumId });
		return {
			album,
			meta: {
				title: album.albumName
			}
		};
	} catch (e) {
		throw redirect(302, AppRoute.ALBUMS);
	}
}) satisfies PageServerLoad;
