import { redirect } from '@sveltejs/kit';
export const prerender = false;

import { AlbumResponseDto, api, UserResponseDto } from '@api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	try {
		const { user } = await parent();
		if (!user) {
			throw redirect(302, '/auth/login');
		}
		const sharedAlbums = await fetch('/data/album/get-all-albums?isShared=true').then(
			(r) => r.json() as Promise<AlbumResponseDto[]>
		);

		return {
			user: user,
			sharedAlbums: sharedAlbums
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
};
