export const prerender = false;

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals: { api } }) => {
	try {
		const { key, assetId } = params;
		const { data: asset } = await api.assetApi.getAssetById({ assetId, key });

		if (!asset) {
			return error(404, 'Asset not found');
		}
		return { asset, key };
	} catch (e) {
		console.log('Error', e);
	}
}) satisfies PageServerLoad;
