import { redirect } from '@sveltejs/kit';
export const prerender = false;

import { AlbumResponseDto, api, UserResponseDto } from '@api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	// !TODO refactor session
	// if (!browser && !session.user) {
	// 	throw redirect(302, '/auth/login');
	// }

	try {
		const [user, sharedAlbums] = await Promise.all([
			fetch('/data/user/get-my-user-info').then((r) => r.json() as Promise<UserResponseDto>),
			fetch('/data/album/get-all-albums?isShared=true').then(
				(r) => r.json() as Promise<AlbumResponseDto[]>
			)
		]);

		return {
			user: user,
			sharedAlbums: sharedAlbums
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
};
