import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { AlbumResponseDto } from '@api';

export const load: PageLoad = async ({ fetch, parent }) => {
	try {
		const { user } = await parent();

		if (!user) {
			throw Error('User is not logged in');
		}

		const albums = await fetch('/data/album/get-all-albums').then(
			(r) => r.json() as Promise<AlbumResponseDto[]>
		);

		return {
			user: user,
			albums: albums
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
};
