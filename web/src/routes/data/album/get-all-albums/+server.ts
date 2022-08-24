import { json, RequestHandler } from '@sveltejs/kit';
import { serverApi } from '@api';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const isShared = url.searchParams.get('isShared') === 'true' || undefined;
		const { data } = await serverApi.albumApi.getAllAlbums(isShared);
		return json(data);
	} catch {
		return new Response(undefined, { status: 500 });
	}
};
