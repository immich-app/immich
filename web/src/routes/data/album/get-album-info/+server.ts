import { json } from '@sveltejs/kit';
import { AlbumResponseDto, serverApi } from '@api';
import type { RequestEvent } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ url }) => {
	try {
		const albumId = url.searchParams.get('albumId') || '';
		const { data } = await serverApi.albumApi.getAlbumInfo(albumId);
		// throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
		// Suggestion (check for correctness before using):
		// return json(data);
		// return {
		// 	body: data
		// };

		return new Response(JSON.stringify(data));
	} catch {
		return new Response(undefined, { status: 500 });
	}
};
