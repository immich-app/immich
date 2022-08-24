import { redirect } from '@sveltejs/kit';
export const prerender = false;

import type { PageLoad } from './$types';
import { AlbumResponseDto } from '@api';

export const load: PageLoad = async ({ fetch, params }) => {
	// !TODO refactor session
	// if (!browser && !session.user) {
	// 	throw redirect(302, '/auth/login');
	// }

	try {
		const albumId = params['albumId'];

		const albumInfo = await fetch(`/data/album/get-album-info?albumId=${albumId}`).then(
			(r) => r.json() as Promise<AlbumResponseDto>
		);

		return {
			album: albumInfo
		};
	} catch (e: any) {
		if (e.response?.status === 404) {
			throw redirect(302, '/albums');
		}

		throw redirect(302, '/auth/login');
	}
};
