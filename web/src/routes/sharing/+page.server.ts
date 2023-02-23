import { redirect } from '@sveltejs/kit';
export const prerender = false;

import { api } from '@api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
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
};
