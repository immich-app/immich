import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { serverApi } from '@api';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const albumId = params['albumId'];

	try {
		const { data: album } = await serverApi.albumApi.getAlbumInfo(albumId);
		return {
			album,
			meta: {
				title: album.albumName
			}
		};
	} catch (e) {
		throw redirect(302, '/albums');
	}
};
