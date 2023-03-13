export const prerender = false;

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, locals: { api } }) => {
	try {
		const { user } = await parent();
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const { data: sharedAlbums } = await api.albumApi.getAllAlbums(true);

		return {
			user: user,
			sharedAlbums,
			meta: {
				title: 'Albums'
			}
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
}) satisfies PageServerLoad;
