import { json } from '@sveltejs/kit';
import { AssetResponseDto, serverApi } from '@api';
import type { RequestHandlerOutput } from '@sveltejs/kit';

export const GET = async (): Promise<RequestHandlerOutput<AssetResponseDto[]>> => {
	try {
		const { data } = await serverApi.assetApi.getAllAssets();
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
