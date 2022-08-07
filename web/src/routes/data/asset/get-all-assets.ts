import { AssetResponseDto, serverApi } from '@api';
import type { RequestHandlerOutput } from '@sveltejs/kit';

export const GET = async (): Promise<RequestHandlerOutput<AssetResponseDto[]>> => {
	try {
		const { data } = await serverApi.assetApi.getAllAssets();
		return {
			body: data
		};
	} catch {
		return {
			status: 500
		};
	}
};
