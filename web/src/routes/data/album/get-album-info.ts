import { AlbumResponseDto, serverApi } from '@api';
import type { RequestEvent, RequestHandlerOutput } from '@sveltejs/kit';

export const GET = async ({
	url
}: RequestEvent): Promise<RequestHandlerOutput<AlbumResponseDto>> => {
	try {
		const albumId = url.searchParams.get('albumId') || '';
		const { data } = await serverApi.albumApi.getAlbumInfo(albumId);
		return {
			body: data
		};
	} catch {
		return {
			status: 500
		};
	}
};
