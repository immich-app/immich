import { json } from '@sveltejs/kit';
import { AlbumResponseDto, serverApi } from '@api';
import type { RequestEvent, RequestHandler, RequestHandlerOutput } from '@sveltejs/kit';

export const GET = async ({
	url
}: RequestEvent): Promise<RequestHandlerOutput<AlbumResponseDto[]>> => {
	try {
		const isShared = url.searchParams.get('isShared') === 'true' || undefined;
		const { data } = await serverApi.albumApi.getAllAlbums(isShared);
		throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
		// Suggestion (check for correctness before using):
		// return json(data);
		return {
			body: data
		};
	} catch {
		return new Response(undefined, { status: 500 });
	}
};
