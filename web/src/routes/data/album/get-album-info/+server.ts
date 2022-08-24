import { error, json } from '@sveltejs/kit';
import { serverApi } from '@api';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ url }) => {
	try {
		const albumId = url.searchParams.get('albumId') || '';
		const { data } = await serverApi.albumApi.getAlbumInfo(albumId);
		return json(data);
	} catch (e: any) {
		throw error(400, e.response.data);
	}
};
