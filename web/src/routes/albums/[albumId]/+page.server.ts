import { redirect } from '@sveltejs/kit';
export const prerender = false;

import type { PageServerLoad } from './$types';
import { serverApi } from '@api';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const albumId = params['albumId'];

	// const albumInfo = await fetch(`/data/album/get-album-info?albumId=${albumId}`).then(
	// 	(r) =>
	// 		r.json().catch(() => {
	// 			throw redirect(302, '/albums');
	// 		}) as Promise<AlbumResponseDto>
	// );

	const { data: album } = await serverApi.albumApi.getAlbumInfo(albumId);
	return {
		album
	};
};
