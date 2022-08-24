import { redirect } from '@sveltejs/kit';
export const prerender = false;

import type { PageLoad } from './$types';
import { AlbumResponseDto } from '@api';

export const load: PageLoad = async ({ fetch, params, parent }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const albumId = params['albumId'];

	const albumInfo = await fetch(`/data/album/get-album-info?albumId=${albumId}`).then(
		(r) =>
			r.json().catch(() => {
				throw redirect(302, '/albums');
			}) as Promise<AlbumResponseDto>
	);

	return {
		album: albumInfo
	};
};
