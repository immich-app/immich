import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, params, locals: { api } }) => {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const albumId = params['albumId'];

	try {
		const { data: album } = await api.albumApi.getAlbumInfo(albumId);
		return {
			album,
			meta: {
				title: album.albumName
			}
		};
	} catch (e) {
		throw redirect(302, '/albums');
	}
}) satisfies PageServerLoad;
