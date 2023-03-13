import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, locals: { api } }) => {
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
}) satisfies PageServerLoad;
