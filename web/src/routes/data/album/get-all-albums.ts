import { AlbumResponseDto, serverApi } from '@api';
import type { RequestEvent, RequestHandler, RequestHandlerOutput } from '@sveltejs/kit';

export const GET = async ({
	url
}: RequestEvent): Promise<RequestHandlerOutput<AlbumResponseDto[]>> => {
	try {
		const isShared = url.searchParams.get('isShared') === 'true' || undefined;
		const { data } = await serverApi.albumApi.getAllAlbums(isShared);
		return {
			body: data
		};
	} catch {
		return {
			status: 500
		};
	}
};
