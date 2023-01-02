export const prerender = false;
import { error } from '@sveltejs/kit';

import { AssetResponseDto, serverApi } from '@api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const assets: AssetResponseDto[] = [];
	const { sharedLinkId } = params;

	try {
		const { data: sharedLink } = await serverApi.shareApi.getSharedLink(sharedLinkId);

		for (const assetId of sharedLink.assets) {
			const { data: asset } = await serverApi.assetApi.getAssetById(assetId);
			assets.push(asset);
		}

		return { sharedLink, assets };
	} catch (e) {
		console.log(e);
		throw error(404, {
			message: 'Invalid shared link'
		});
	}
};
