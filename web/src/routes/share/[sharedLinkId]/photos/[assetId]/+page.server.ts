export const prerender = false;
import { error } from '@sveltejs/kit';

import { serverApi } from '@api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const { sharedLinkId, assetId } = params;
		const { data: sharedLink } = await serverApi.shareApi.getSharedLink(sharedLinkId);
		const { data: asset } = await serverApi.assetApi.getAssetById(assetId, {
			params: {
				key: sharedLink.key
			}
		});

		if (!asset) {
			return error(404, 'Asset not found');
		}
		return {
			asset,
			sharedLink
		};
	} catch (e) {
		console.log('Error', e);
	}
};
