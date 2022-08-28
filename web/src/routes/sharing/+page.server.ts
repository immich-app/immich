import { redirect } from '@sveltejs/kit';
export const prerender = false;

import { serverApi } from '@api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	try {
		const { user } = await parent();
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const { data: sharedAlbums } = await serverApi.albumApi.getAllAlbums(true);

		return {
			user: user,
			sharedAlbums: sharedAlbums
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
};
