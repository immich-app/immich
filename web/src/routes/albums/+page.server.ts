import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serverApi } from '@api';

export const load: PageServerLoad = async ({ parent }) => {
	try {
		const { user } = await parent();

		if (!user) {
			throw Error('User is not logged in');
		}

		const { data: albums } = await serverApi.albumApi.getAllAlbums();

		return {
			user: user,
			albums: albums,
			meta: {
				title: 'Albums'
			}
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
};
