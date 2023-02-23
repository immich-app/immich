import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { api } from '@api';

export const load: PageServerLoad = async ({ parent }) => {
	try {
		const { user } = await parent();

		if (!user) {
			throw Error('User is not logged in');
		}

		const { data: albums } = await api.albumApi.getAllAlbums();

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
